import { useScaffoldContractRead } from "./scaffold-eth";

export const useFetchPolls = (currentPage = 1, limit = 10, reversed = true) => {
  const { data: totalPolls } = useScaffoldContractRead({
    contractName: "PollManager",
    functionName: "totalPolls",
  });

  const { data: polls } = useScaffoldContractRead({
    contractName: "PollManager",
    functionName: "fetchPolls",
    args: [BigInt(currentPage), BigInt(limit), reversed],
  });

  return { totalPolls: Number(totalPolls || 0n), polls };
};
