import { zKey } from "snarkjs";
import PollAbi from "./abi/Poll";
import AccQueueAbi from "./abi/AccQueue";
import { ethers } from "ethers";
import { signer } from "./config";

export const cleanThreads = async (): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!globalThis) {
    return;
  }

  const curves = ["curve_bn128", "curve_bls12381"];
  await Promise.all(
    curves
      .map((curve) =>
        globalThis[curve as "curve_bn128" | "curve_bls12381"]?.terminate()
      )
      .filter(Boolean)
  );
};

export const extractVk = async (zkeyPath: string): Promise<any> => {
  const vk = await zKey.exportVerificationKey(zkeyPath);
  await cleanThreads();
  return vk;
};

export function getPollContract(pollContractAddress: string) {
  const pollContract = new ethers.Contract(
    pollContractAddress,
    PollAbi,
    signer
  );
  return pollContract;
}

export function getAccQueueContract(accQueueContractAddress: string) {
  const accQueueContract = new ethers.Contract(
    accQueueContractAddress,
    AccQueueAbi,
    signer
  );
  return accQueueContract;
}
