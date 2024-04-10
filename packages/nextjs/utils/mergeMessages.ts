import { DEFAULT_SR_QUEUE_OPS } from "./mergeSignups";
import { createPublicClient, createWalletClient, getContract, http } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import AccQueueAbi from "~~/abi/AccQueue";
import PollAbi from "~~/abi/Poll";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

export const mergeMessages = async ({
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

  const extContracts = await pollContract.read.extContracts();
  const messageAqContractAddr = extContracts[1];

  const accQueueContract = getContract({
    abi: AccQueueAbi,
    address: messageAqContractAddr,
    publicClient,
    walletClient,
  });

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
      console.log("All message subtrees have been merged.");
    } else {
      // eslint-disable-next-line no-await-in-loop
      await accQueueContract.read
        .getSrIndices()
        .then(data => data.map(x => Number(x)))
        .then(indices => {
          console.log(`Merging message subroots ${indices[0] + 1} / ${indices[1] + 1}`);
        });

      // eslint-disable-next-line no-await-in-loop
      const tx = await pollContract.write.mergeMessageAqSubRoots([BigInt(numQueueOps || DEFAULT_SR_QUEUE_OPS)]);
      // eslint-disable-next-line no-await-in-loop

      console.log(`Transaction hash: ${tx}`);
    }
  }

  // check if the message AQ has been fully merged
  const messageTreeDepth = Number((await pollContract.read.treeDepths())[2]);

  // check if the main root was not already computed
  const mainRoot = (await accQueueContract.read.getMainRoot([BigInt(messageTreeDepth)])).toString();
  if (mainRoot === "0") {
    // go and merge the message tree

    console.log("Merging subroots to a main message root...");
    const tx = await pollContract.write.mergeMessageAq();

    console.log(`Executed mergeMessageAq(); Transaction hash: ${tx}`);
    console.log("The message tree has been merged.");
  } else {
    console.log("The message tree has already been merged.");
  }
};
