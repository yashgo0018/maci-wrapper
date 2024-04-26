"use server";

import { zKey } from "snarkjs";

export const cleanThreads = async (): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!globalThis) {
    return;
  }

  const curves = ["curve_bn128", "curve_bls12381"];
  await Promise.all(
    curves.map(curve => (globalThis as any)[curve as "curve_bn128" | "curve_bls12381"]?.terminate()).filter(Boolean),
  );
};

export const extractVk = async (zkeyPath: string): Promise<any> => {
  const vk = await zKey.exportVerificationKey(zkeyPath);
  await cleanThreads();
  return vk;
};
