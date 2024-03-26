import { useScaffoldContractRead } from "./scaffold-eth";

export const useFetchPoll = (id: string) =>
  useScaffoldContractRead({
    contractName: "PollManager",
    functionName: "fetchPoll",
    args: [BigInt(id)],
  });
