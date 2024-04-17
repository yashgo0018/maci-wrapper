import { useState } from "react";
import { getContract } from "viem";
import { useContractRead, useContractWrite, usePublicClient } from "wagmi";
import AccQueueAbi from "~~/abi/AccQueue";
import PollAbi from "~~/abi/Poll";
import { useScaffoldContract, useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const DEFAULT_SR_QUEUE_OPS = 4;

export function useMergeSignups({
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
  const { data: pollId, isFetched: pollIdFetched } = useScaffoldContractRead({
    contractName: "MACI",
    functionName: "getPollId",
    args: [pollContractAddress],
  });
  const { data: accQueueContractAddress, isFetched: accQueueContractAddressFetched } = useScaffoldContractRead({
    contractName: "MACI",
    functionName: "stateAq",
  });
  const publicClient = usePublicClient();
  const { data: maci } = useScaffoldContract({ contractName: "MACI" });
  const { writeAsync: mergeMaciStateAqSubRoots, isLoading: mergeMaciStateAqSubRootsLoading } = useContractWrite({
    abi: PollAbi,
    address: pollContractAddress,
    functionName: "mergeMaciStateAqSubRoots",
    args: pollId !== undefined ? [BigInt(numQueueOps || DEFAULT_SR_QUEUE_OPS), pollId] : undefined,
  });
  const { writeAsync: mergeMaciStateAq, isLoading: mergeMaciStateAqLoading } = useContractWrite({
    abi: PollAbi,
    address: pollContractAddress,
    functionName: "mergeMaciStateAq",
    args: pollId !== undefined ? [pollId] : undefined,
  });

  const [mergeLoading, setMergeLoading] = useState(false);

  async function merge() {
    if (!pollContractAddress || pollId === undefined || !dd || !accQueueContractAddress || !maci) {
      return;
    }

    const deadline = Number(dd[0]) + Number(dd[1]);
    const { timestamp: now } = await publicClient.getBlock();

    if (now < deadline) {
      console.error("Voting period is not over");
      return;
    }

    setMergeLoading(true);

    const accQueueContract = getContract({
      abi: AccQueueAbi,
      address: accQueueContractAddress,
      publicClient,
    });

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
        const { hash: tx } = await mergeMaciStateAqSubRoots();

        console.log(`Transaction hash: ${tx}`);
      }
    }

    const stateTreeDepth = await maci.read.stateTreeDepth();

    const mainRoot = await accQueueContract.read.getMainRoot([BigInt(stateTreeDepth)]);

    if (mainRoot !== 0n && !pollId) {
      console.log("The state tree has already been merged.");
      return;
    }

    // go and merge the state tree
    console.log("Merging subroots to a main state root...");
    try {
      const { hash: tx } = await mergeMaciStateAq();

      console.log(`Transaction hash: ${tx}`);
    } catch (err) {
      console.log("error here");
    }

    setMergeLoading(false);

    refresh();
  }

  const loadingData = {
    deployTimeFetched,
    pollIdFetched,
    accQueueContractAddressFetched,
    mergeMaciStateAqSubRootsLoading,
    mergeMaciStateAqLoading,
    mergeLoading,
  };

  return { merge, loadingData };
}
