import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import fs from "fs";
import { Keypair } from "maci-domainobjs";

import { MACIWrapper, PollManager, Verifier, VkRegistry } from "../typechain-types";

function fetchOrCreateKeyPair(filePath: string) {
  let keypair: Keypair | null = null;
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    const jsonPair = JSON.parse(data.toString("utf-8"));
    keypair = Keypair.fromJSON(jsonPair);
  }
  if (!keypair) {
    keypair = new Keypair();
    fs.writeFileSync(filePath, JSON.stringify(keypair.toJSON()));
  }

  return keypair as Keypair;
}

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const maci = await hre.ethers.getContract<MACIWrapper>("MACIWrapper", deployer);

  await hre.deployments.deploy("PollManager", {
    from: deployer,
    args: [await maci.getAddress()],
    log: true,
    autoMine: true,
  });

  const pollManager = await hre.ethers.getContract<PollManager>("PollManager", deployer);

  console.log(`The poll manager is deployed at ${await pollManager.getAddress()}`);

  // update the config on the poll manager
  const verifier = await hre.ethers.getContract<Verifier>("Verifier", deployer);
  const vkRegistry = await hre.ethers.getContract<VkRegistry>("VkRegistry", deployer);

  // generate and save the coordinator key pair
  const filePath = "./coordinatorKeyPair.json";
  const coordinatorKeypair = fetchOrCreateKeyPair(filePath);

  await pollManager.setConfig(
    {
      intStateTreeDepth: 1,
      messageTreeSubDepth: 1,
      messageTreeDepth: 2,
      voteOptionTreeDepth: 2,
    },
    coordinatorKeypair.pubKey.asContractParam(),
    await verifier.getAddress(),
    await vkRegistry.getAddress(),
  );
};

export default deployContracts;

deployContracts.tags = ["SubsidyFactory"];
