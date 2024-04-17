import { DEFAULT_SR_QUEUE_OPS } from "./useMergeSignups";
import { getContract } from "viem";
import { useContractRead, useContractWrite, usePublicClient } from "wagmi";
import AccQueueAbi from "~~/abi/AccQueue";
import PollAbi from "~~/abi/Poll";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export function useMergeMessages({
  pollContractAddress,
  numQueueOps,
  refresh,
}: {
  pollContractAddress?: string;
  numQueueOps?: number;
  refresh: () => void;
}) {
  const { data: dd, isFetched: deployTimeFetched } = useContractRead({
    abi: PollAbi,
    address: pollContractAddress,
    functionName: "getDeployTimeAndDuration",
  });

  const { data: extContracts, isFetched: extContractsFetched } = useContractRead({
    abi: PollAbi,
    address: pollContractAddress,
    functionName: "extContracts",
  });

  const { data: pollId, isFetched: pollIdFetched } = useScaffoldContractRead({
    contractName: "MACI",
    functionName: "getPollId",
    args: [pollContractAddress],
  });

  const messageAqContractAddr = extContracts?.[1];

  const { writeAsync: mergeMessageAqSubRoots, isLoading: mergeMessageAqSubRootsLoading } = useContractWrite({
    abi: PollAbi,
    address: pollContractAddress,
    functionName: "mergeMessageAqSubRoots",
    args: [BigInt(numQueueOps || DEFAULT_SR_QUEUE_OPS)],
  });
  const { writeAsync: mergeMessageAq, isLoading: mergeMessageAqLoading } = useContractWrite({
    abi: PollAbi,
    address: pollContractAddress,
    functionName: "mergeMessageAq",
  });

  const publicClient = usePublicClient();

  async function merge() {
    if (!pollContractAddress || pollId === undefined || !dd || !messageAqContractAddr || !publicClient) {
      return;
    }

    // check if it's time to merge the message AQ
    const deadline = Number(dd[0]) + Number(dd[1]);
    const { timestamp: now } = await publicClient.getBlock();

    if (now < deadline) {
      console.error("Voting period is not over");
      return;
    }

    const pollContract = getContract({
      abi: PollAbi,
      address: pollContractAddress,
      publicClient,
    });

    const accQueueContract = getContract({
      abi: AccQueueAbi,
      address: messageAqContractAddr,
      publicClient,
    });

    let subTreesMerged = false;

    console.log("I am here");

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
        const { hash: tx } = await mergeMessageAqSubRoots();
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
      const { hash: tx } = await mergeMessageAq();

      console.log(`Executed mergeMessageAq(); Transaction hash: ${tx}`);
      console.log("The message tree has been merged.");
    } else {
      console.log("The message tree has already been merged.");
    }

    refresh();
  }

  const loadingData = {
    deployTimeFetched,
    extContractsFetched,
    pollIdFetched,
    mergeMessageAqLoading,
    mergeMessageAqSubRootsLoading,
  };

  return { merge, loadingData };
}
