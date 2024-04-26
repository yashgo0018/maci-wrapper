import express from "express";
import {
  PORT,
  blocksPerBatch,
  configure,
  coordinatorKeypair,
  deploymentBlockNumber,
  maciContract,
  maciContractDetails,
  pollManagerContract,
  processVk,
  processWasmPath,
  processZkeyPath,
  provider,
  tallyVk,
  tallyWasmPath,
  tallyZkeyPath,
  useQuadraticVoting,
} from "./config";
import cors from "cors";
import { getAccQueueContract, getPollContract } from "./utils";
import { CircuitInputs, MaciState } from "@se-2/hardhat/maci-ts/core";
import fs from "fs";
import { groth16 } from "snarkjs";
// import { Proof } from "@se-2/hardhat/maci-ts/domainobjs";
import {
  genTreeCommitment,
  hash3,
  hashLeftRight,
} from "@se-2/hardhat/maci-ts/crypto";
import { BigNumberish } from "@se-2/hardhat/maci-ts/domainobjs/types";
import { verifyProof } from "@se-2/hardhat/maci-ts/circuits";
import { genMaciStateFromContract } from "./contract";

const app = express();

app.use(express.json());
app.use(cors());

export const asHex = (val: BigNumberish): string =>
  `0x${BigInt(val).toString(16)}`;

export const genProof = async ({ inputs, zkeyPath, wasmPath }: any) => {
  // if we want to use a wasm witness we use snarkjs
  if (!wasmPath) {
    throw new Error("wasmPath must be specified");
  }

  if (!fs.existsSync(wasmPath)) {
    throw new Error(`wasmPath ${wasmPath} does not exist`);
  }

  const { proof, publicSignals } = await groth16.fullProve(
    inputs,
    wasmPath,
    zkeyPath
  );
  return { proof, publicSignals };
};

app.post("/generate-proof", async (req, res) => {
  const { pollContractAddress } = req.body;
  const pollContract = getPollContract(pollContractAddress);

  const pollId = await maciContract.getPollId(pollContractAddress);

  const extContracts = await pollContract.extContracts();
  const messageAqContractAddr = extContracts.messageAq;
  const messageAqContract = getAccQueueContract(messageAqContractAddr);

  // Check that the state and message trees have been merged for at least the first poll
  if (!(await pollContract.stateAqMerged()) && pollId.toString() === "0") {
    res.status(400).json({
      error:
        "The state tree has not been merged yet. Please use the mergeSignups subcommmand to do so.",
    });
    return;
  }

  const messageTreeDepth = Number(
    (await pollContract.treeDepths()).messageTreeDepth
  );

  // check that the main root is set
  const mainRoot = (
    await messageAqContract.getMainRoot(messageTreeDepth.toString())
  ).toString();
  if (mainRoot === "0") {
    res.status(400).json({
      error:
        "The message tree has not been merged yet. Please use the mergeMessages subcommmand to do so.",
    });
    return;
  }

  let maciState: MaciState | undefined;

  // build an off-chain representation of the MACI contract using data in the contract storage
  const [stateRoot, numSignups, messageRoot] = await Promise.all([
    maciContract.getStateAqRoot(),
    maciContract.numSignUps(),
    messageAqContract.getMainRoot(messageTreeDepth),
  ]);
  let fromBlock = deploymentBlockNumber;
  console.log("Here");

  const defaultEndBlock = await Promise.all([
    pollContract
      .queryFilter(pollContract.filters.MergeMessageAq(messageRoot), fromBlock)
      .then((events) => events[events.length - 1]?.blockNumber),
    pollContract
      .queryFilter(
        pollContract.filters.MergeMaciStateAq(stateRoot, numSignups),
        fromBlock
      )
      .then((events) => events[events.length - 1]?.blockNumber),
  ]).then((blocks) => Math.max(...blocks));

  console.log(`starting to fetch logs from block ${fromBlock}`);
  maciState = await genMaciStateFromContract(
    provider as any,
    coordinatorKeypair,
    pollId,
    fromBlock,
    blocksPerBatch,
    defaultEndBlock
  );

  const poll = maciState!.polls.get(pollId)!;

  const processProofs: any[] = [];
  const tallyProofs: any[] = [];

  // time how long it takes
  const startTime = Date.now();

  console.log(`Generating proofs of message processing...`);
  const { messageBatchSize } = poll.batchSizes;
  const numMessages = poll.messages.length;
  let totalMessageBatches =
    numMessages <= messageBatchSize
      ? 1
      : Math.floor(numMessages / messageBatchSize);
  if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
    totalMessageBatches += 1;
  }

  // while we have unprocessed messages, process them
  while (poll.hasUnprocessedMessages()) {
    // process messages in batches
    const circuitInputs = poll.processMessages(
      pollId,
      useQuadraticVoting,
      true
    ) as unknown as CircuitInputs;

    try {
      // generate the proof for this batch
      // eslint-disable-next-line no-await-in-loop
      const r = await genProof({
        inputs: circuitInputs,
        zkeyPath: processZkeyPath,
        wasmPath: processWasmPath,
      });

      // verify it
      // eslint-disable-next-line no-await-in-loop
      const isValid = await verifyProof(r.publicSignals, r.proof, processVk);
      if (!isValid) {
        throw new Error("Generated an invalid proof");
      }

      const thisProof = {
        circuitInputs,
        proof: r.proof,
        publicInputs: r.publicSignals,
      };
      // save the proof
      processProofs.push(thisProof);

      console.log(
        `Progress: ${poll.numBatchesProcessed} / ${totalMessageBatches}`
      );
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
  }

  const endTime = Date.now();

  console.log(
    `gen processMessage proof took ${(endTime - startTime) / 1000} seconds\n`
  );

  // tallying proofs
  console.log(`Generating proofs of vote tallying...`);
  const tallyStartTime = Date.now();

  const { tallyBatchSize } = poll.batchSizes;
  const numStateLeaves = poll.stateLeaves.length;
  let totalTallyBatches =
    numStateLeaves <= tallyBatchSize
      ? 1
      : Math.floor(numStateLeaves / tallyBatchSize);
  if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
    totalTallyBatches += 1;
  }

  let tallyCircuitInputs: CircuitInputs;
  // tally all ballots for this poll
  while (poll.hasUntalliedBallots()) {
    // tally votes in batches
    tallyCircuitInputs = useQuadraticVoting
      ? (poll.tallyVotes() as unknown as CircuitInputs)
      : (poll.tallyVotesNonQv() as unknown as CircuitInputs);

    try {
      // generate the proof
      // eslint-disable-next-line no-await-in-loop
      const r = await genProof({
        inputs: tallyCircuitInputs,
        zkeyPath: tallyZkeyPath,
        wasmPath: tallyWasmPath,
      });

      // verify it
      // eslint-disable-next-line no-await-in-loop
      const isValid = await verifyProof(r.publicSignals, r.proof, tallyVk);

      if (!isValid) {
        res.status(400).json({ error: "Generated an invalid tally proof" });
        return;
      }

      const thisProof = {
        circuitInputs: tallyCircuitInputs,
        proof: r.proof,
        publicInputs: r.publicSignals,
      };

      // save it
      tallyProofs.push(thisProof);

      console.log(`Progress: ${poll.numBatchesTallied} / ${totalTallyBatches}`);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
  }

  // verify the results
  // Compute newResultsCommitment
  const newResultsCommitment = genTreeCommitment(
    poll.tallyResult,
    BigInt(asHex(tallyCircuitInputs!.newResultsRootSalt as BigNumberish)),
    poll.treeDepths.voteOptionTreeDepth
  );

  // compute newSpentVoiceCreditsCommitment
  const newSpentVoiceCreditsCommitment = hashLeftRight(
    poll.totalSpentVoiceCredits,
    BigInt(
      asHex(tallyCircuitInputs!.newSpentVoiceCreditSubtotalSalt as BigNumberish)
    )
  );

  const pollIdInManager = await pollManagerContract.pollIdByAddress(
    pollContractAddress
  );
  // get the tally contract address
  const {
    pollContracts: {
      tally: tallyContractAddress,
      messageProcessor: messageProcessorAddress,
    },
  } = await pollManagerContract.fetchPoll(pollIdInManager);

  let newPerVOSpentVoiceCreditsCommitment: bigint | undefined;
  let newTallyCommitment: bigint;

  const network = await provider.getNetwork();

  // create the tally file data to store for verification later
  const tallyFileData: any = {
    maci: maciContractDetails.address,
    pollId: pollId.toString(),
    network: network?.name,
    chainId: network?.chainId.toString(),
    isQuadratic: useQuadraticVoting,
    tallyAddress: tallyContractAddress,
    newTallyCommitment: asHex(
      tallyCircuitInputs!.newTallyCommitment as BigNumberish
    ),
    results: {
      tally: poll.tallyResult.map((x) => x.toString()),
      salt: asHex(tallyCircuitInputs!.newResultsRootSalt as BigNumberish),
      commitment: asHex(newResultsCommitment),
    },
    totalSpentVoiceCredits: {
      spent: poll.totalSpentVoiceCredits.toString(),
      salt: asHex(
        tallyCircuitInputs!.newSpentVoiceCreditSubtotalSalt as BigNumberish
      ),
      commitment: asHex(newSpentVoiceCreditsCommitment),
    },
  };

  if (useQuadraticVoting) {
    // Compute newPerVOSpentVoiceCreditsCommitment
    newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
      poll.perVOSpentVoiceCredits,
      BigInt(
        asHex(
          tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish
        )
      ),
      poll.treeDepths.voteOptionTreeDepth
    );

    // Compute newTallyCommitment
    newTallyCommitment = hash3([
      newResultsCommitment,
      newSpentVoiceCreditsCommitment,
      newPerVOSpentVoiceCreditsCommitment,
    ]);

    // update perVOSpentVoiceCredits in the tally file data
    tallyFileData.perVOSpentVoiceCredits = {
      tally: poll.perVOSpentVoiceCredits.map((x) => x.toString()),
      salt: asHex(
        tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish
      ),
      commitment: asHex(newPerVOSpentVoiceCreditsCommitment),
    };
  } else {
    newTallyCommitment = hashLeftRight(
      newResultsCommitment,
      newSpentVoiceCreditsCommitment
    );
  }

  // compare the commitments
  if (asHex(newTallyCommitment) === tallyFileData.newTallyCommitment) {
    console.log("The tally commitment is correct");
  } else {
    res
      .status(400)
      .json({ error: "Error: the newTallyCommitment is invalid." });
    return;
  }

  const tallyEndTime = Date.now();

  console.log(
    `gen tally proof took ${(tallyEndTime - tallyStartTime) / 1000} seconds\n`
  );

  console.log(tallyFileData);

  res.json(tallyFileData);
});

configure().then(() => {
  app.listen(PORT, () =>
    console.log(`The server is listening on port ${PORT}`)
  );
});
