import { genMACIState } from "./genMaciState";
import { mergeMessages } from "./mergeMessages";
import { mergeSignups } from "./mergeSignups";
import { Keypair, PrivKey } from "@se-2/hardhat/maci-ts/domainobjs";
import { Address, PublicClient, createPublicClient, getContract, http } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

class Coordinator {
  closing: Record<number, boolean> = {};
  targetNetwork = scaffoldConfig.targetNetworks[0];
  publicClient: PublicClient;

  constructor() {
    this.publicClient = createPublicClient({ chain: this.targetNetwork, transport: http() });
  }

  async closePoll(pollId: number) {
    if (this.closing[pollId]) {
      return;
    }

    const { address: pollManagerAddress, abi: pollManagerAbi } = deployedContracts[this.targetNetwork.id].PollManager;

    const pollManager = getContract({
      abi: pollManagerAbi,
      address: pollManagerAddress,
      publicClient: this.publicClient,
    });

    if (Number(await pollManager.read.totalPolls()) < pollId) {
      return null;
    }

    const poll = await pollManager.read.fetchPoll([BigInt(pollId)]);

    if (new Date(Number(poll.endTime) * 1000) > new Date()) {
      return null;
    }

    // console.log(poll);

    // TODO: check if the poll is already closed

    // const provider = this.publicClient.provider();
    const coordinatorPrivateKey = new PrivKey(process.env.COORDINATOR_PRIVATE_KEY as string);

    console.log(process.env.COORDINATOR_PRIVATE_KEY);

    const coordinatorKeypair = new Keypair(coordinatorPrivateKey);

    await mergeSignups({ pollContractAddress: poll.pollContracts.poll as Address });
    await mergeMessages({ pollContractAddress: poll.pollContracts.poll as Address });

    await genMACIState({ pollContractAddress: poll.pollContracts.poll as Address, coordinatorKeypair });

    // console.log(poll);

    this.closing[pollId] = true;

    // Close the poll
    console.log(`Closing poll ${pollId}`);
  }
}

export const coordinator = new Coordinator();
