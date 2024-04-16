import { createPublicClient, createWalletClient, getContract, http } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import AccQueueAbi from "~~/abi/AccQueue";
import PollAbi from "~~/abi/Poll";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

export const DEFAULT_SR_QUEUE_OPS = 4;

export const mergeSignups = async ({
  pollContractAddress,
  numQueueOps,
}: {
  pollContractAddress: string;
  numQueueOps?: number;
}): Promise<void> => {
  const chain = scaffoldConfig.targetNetworks[0];
  const publicClient = createPublicClient({ chain, transport: http() });
  const ownerAddress = privateKeyToAddress(process.env.OWNER_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    chain,
    transport: http(),
    key: process.env.OWNER_PRIVATE_KEY,
    account: ownerAddress,
  });
  const { address: MaciAddress, abi: MaciAbi, deploymentBlockNumber } = deployedContracts[chain.id].MACI;

  const maciContract = getContract({ abi: MaciAbi, address: MaciAddress, publicClient, walletClient });
  const pollId = await maciContract.read.getPollId([pollContractAddress]);

  const pollContract = getContract({ abi: PollAbi, address: pollContractAddress, publicClient, walletClient });

  // if (pollId < 0) {
  //   logError("Invalid poll id");
  // }

  // const pollAddress = await maciContract.polls(pollId);

  const accQueueContract = getContract({
    abi: AccQueueAbi,
    address: await maciContract.read.stateAq(),
    publicClient,
    walletClient,
  });

  // const accQueueContract = AccQueueFactory.connect(await maciContract.stateAq(), signer);

  // check if it's time to merge the message AQ
  const dd = await pollContract.read.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);
  const { timestamp: now } = await publicClient.getBlock();

  if (now < deadline) {
    console.error("Voting period is not over");
  }

  let subTreesMerged = false;

  // infinite loop to merge the sub trees
  while (!subTreesMerged) {
    // eslint-disable-next-line no-await-in-loop
    subTreesMerged = await accQueueContract.read.subTreesMerged();

    if (subTreesMerged) {
      console.log("All state subtrees have been merged.");
    } else {
      // eslint-disable-next-line no-await-in-loop
      await accQueueContract.read
        .getSrIndices()
        .then(data => data.map(x => Number(x)))
        .then(indices => {
          console.log(`Merging state subroots ${indices[0] + 1} / ${indices[1] + 1}`);
        });

      // first merge the subroots
      // eslint-disable-next-line no-await-in-loop
      const tx = await pollContract.write.mergeMaciStateAqSubRoots([
        BigInt(numQueueOps || DEFAULT_SR_QUEUE_OPS),
        pollId,
      ]);
      // eslint-disable-next-line no-await-in-loop
      // const receipt = await tx.wait();

      // if (receipt?.status !== 1) {
      //   logError("Error merging state subroots");
      // }

      // logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
      // logGreen(quiet, success(`Executed mergeMaciStateAqSubRoots(); gas used: ${receipt!.gasUsed.toString()}`));
    }
  }

  // check if the state AQ has been fully merged
  const stateTreeDepth = await maciContract.read.stateTreeDepth();
  const mainRoot = (await accQueueContract.read.getMainRoot([BigInt(stateTreeDepth)])).toString();

  if (mainRoot === "0" || pollId > 0) {
    // go and merge the state tree
    console.log("Merging subroots to a main state root...");
    const tx = await pollContract.write.mergeMaciStateAq([pollId]);

    console.log(`Transaction hash: ${tx}`);
  } else {
    console.log("The state tree has already been merged.");
  }
};
