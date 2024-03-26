"use client";

import { Keypair, PrivKey } from "@se-2/hardhat/maci-ts/domainobjs";
import { decodeAbiParameters } from "viem";

export function fetchOrCreateUserKeyPair(address?: string) {
  if (!address) return null;

  //  fetch the existing key
  const key = localStorage.getItem(`key-${address}`);

  let keypair: Keypair;
  if (!key) {
    keypair = new Keypair();
  } else {
    const privKey = PrivKey.deserialize(key);
    keypair = new Keypair(privKey);
  }

  // update the key
  localStorage.setItem(`key-${address}`, keypair.privKey.serialize());

  return keypair;
}

export function decodeOptions(encodedData: `0x${string}`) {
  return decodeAbiParameters([{ type: "string[]" }], encodedData)[0];
}
