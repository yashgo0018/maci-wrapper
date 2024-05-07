import { useScaffoldContractRead } from "./scaffold-eth";

export const useFetchPoll = (id: string) =>
  useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "fetchPoll",
    args: [BigInt(id)],
  });
