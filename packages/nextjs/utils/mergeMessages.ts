import { DEFAULT_SR_QUEUE_OPS } from "./mergeSignups";
import { getContract } from "viem";
import AccQueueAbi from "~~/abi/AccQueue";
import PollAbi from "~~/abi/Poll";
import { publicClient, serverWalletClient } from "~~/constants";

export const mergeMessages = async ({
  pollContractAddress,
  numQueueOps,
}: {
  pollContractAddress: string;
  numQueueOps?: number;
}): Promise<void> => {
  const pollContract = getContract({
    abi: PollAbi,
    address: pollContractAddress,
    publicClient,
    walletClient: serverWalletClient,
  });

  const extContracts = await pollContract.read.extContracts();
  const messageAqContractAddr = extContracts[1];

  const accQueueContract = getContract({
    abi: AccQueueAbi,
    address: messageAqContractAddr,
    publicClient,
    walletClient: serverWalletClient,
  });

  // check if it's time to merge the message AQ
  const dd = await pollContract.read.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);
  const { timestamp: now } = await publicClient.getBlock();

  if (now < deadline) {
    console.error("Voting period is not over");
    return;
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
  const messageTreeDepth = (await pollContract.read.treeDepths())[2];

  // check if the main root was not already computed
  const mainRoot = await accQueueContract.read.getMainRoot([BigInt(messageTreeDepth)]);
  if (mainRoot === 0n) {
    // go and merge the message tree

    console.log("Merging subroots to a main message root...");
    const tx = await pollContract.write.mergeMessageAq();

    console.log(`Executed mergeMessageAq(); Transaction hash: ${tx}`);
    console.log("The message tree has been merged.");
  } else {
    console.log("The message tree has already been merged.");
  }
};
