import { useEffect, useState } from "react";
import { useScaffoldContractRead } from "./scaffold-eth";
import { Poll, PollStatus, RawPoll } from "~~/types/poll";

export function getPollStatus(poll: RawPoll) {
  const now = Math.round(new Date().getTime() / 1000);

  if (poll.startTime > BigInt(now)) {
    return PollStatus.NOT_STARTED;
  }

  if (poll.endTime > BigInt(now)) {
    return PollStatus.OPEN;
  }

  if (!poll.tallyJsonCID) {
    return PollStatus.CLOSED;
  }

  return PollStatus.RESULT_COMPUTED;
}

export const useFetchPolls = (currentPage = 1, limit = 10, reversed = true) => {
  const [polls, setPolls] = useState<Poll[]>();
  const { data: totalPolls, refetch: refetchTotalPolls } = useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "nextPollId",
  });

  const { data: rawPolls, refetch: refetchPolls } = useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "fetchPolls",
    args: [BigInt(currentPage), BigInt(limit), reversed],
  });

  const [lastTimer, setLastTimer] = useState<NodeJS.Timer>();

  useEffect(() => {
    if (lastTimer) {
      clearInterval(lastTimer);
    }

    if (!rawPolls) {
      setPolls([]);
      return;
    }

    const interval = setInterval(() => {
      const _polls: Poll[] = [];

      for (const rawPoll of rawPolls) {
        _polls.push({
          ...rawPoll,
          status: getPollStatus(rawPoll),
        });
      }

      setPolls(_polls);
    }, 1000);

    setLastTimer(interval);

    () => {
      clearInterval(interval);
    };
  }, [rawPolls]);

  function refetch() {
    refetchTotalPolls();
    refetchPolls();
  }

  return { totalPolls: Number(totalPolls || 0n), polls, refetch };
};
