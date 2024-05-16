import { useScaffoldContractRead } from "./scaffold-eth";

export const useFetchPoll = (id: bigint | undefined) =>
  useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "fetchPoll",
    args: [id],
  });
