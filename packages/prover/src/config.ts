import { extractVk } from "./utils";
import { Keypair, PrivKey } from "@se-2/hardhat/maci-ts/domainobjs";
import { ethers } from "ethers";
import "dotenv/config";
import deployedContracts from "./deployedContracts";

const coordinatorPrivKey = process.env.COORDINATOR_PRIV_KEY || "";
export const processZkeyPath = process.env.PROCESS_ZKEY_PATH || "";
export const processWasmPath = process.env.PROCESS_WASM_PATH || "";
export const tallyZkeyPath = process.env.TALLY_ZKEY_PATH || "";
export const tallyWasmPath = process.env.TALLY_WASM_PATH || "";
export const useQuadraticVoting = false;
const rpcUrl = process.env.RPC_URL || "";
const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || "";
const maciPrivKey = PrivKey.deserialize(coordinatorPrivKey);

// the coordinator's MACI private key
if (!PrivKey.isValidSerializedPrivKey(coordinatorPrivKey)) {
  throw "Invalid MACI private key";
}

const chainId = Number(process.env.CHAIN_ID || 31337);

export const { MACI: maciContractDetails } = (deployedContracts as any)[
  chainId
];
export const { PollManager: pollManagerContractDetails } = (
  deployedContracts as any
)[chainId];

export const blocksPerBatch = 50;
export const deploymentBlockNumber = maciContractDetails.deploymentBlockNumber;
export const provider = new ethers.JsonRpcProvider(rpcUrl);
export let processVk: any, tallyVk: any;
export let coordinatorKeypair = new Keypair(maciPrivKey);
export const signer = new ethers.Wallet(signerPrivateKey, provider);
export const maciContract = new ethers.Contract(
  maciContractDetails.address,
  maciContractDetails.abi,
  signer
);
export const pollManagerContract = new ethers.Contract(
  pollManagerContractDetails.address,
  pollManagerContractDetails.abi,
  signer
);
export const PORT = 8000;

export async function configure() {
  console.log("Configuring...");
  // extract the rest of the verifying keys
  processVk = await extractVk(processZkeyPath);
  tallyVk = await extractVk(tallyZkeyPath);
  console.log("Configured!!!");
}
