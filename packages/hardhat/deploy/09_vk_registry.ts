import { extractVk } from "maci-circuits";
import { VerifyingKey } from "maci-domainobjs";

import type { IVerifyingKeyStruct } from "maci-contracts";
import type { VkRegistry } from "../typechain-types";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  intStateTreeDepth,
  messageBatchDepth,
  messageTreeDepth,
  processMessagesZkeyPath,
  stateTreeDepth,
  tallyVotesZkeyPath,
  useQuadraticVoting,
  voteOptionTreeDepth,
} from "../constants";

export enum EMode {
  QV,
  NON_QV,
}

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy("VkRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const vkRegistry = await hre.ethers.getContract<VkRegistry>("VkRegistry", deployer);
  console.log(`The Vk Registry is deployed at ${await vkRegistry.getAddress()}`);

  const [processVk, tallyVk] = await Promise.all([
    extractVk(processMessagesZkeyPath),
    extractVk(tallyVotesZkeyPath),
  ]).then(vks => vks.map(vk => (vk ? VerifyingKey.fromObj(vk as any) : null)));

  const messageBatchSize = 5 ** messageBatchDepth;
  const processVkParam = processVk!.asContractParam() as IVerifyingKeyStruct;
  const tallyVkParam = tallyVk!.asContractParam() as IVerifyingKeyStruct;

  const hasProcessVk = await vkRegistry.hasProcessVk(
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    useQuadraticVoting ? EMode.QV : EMode.NON_QV,
  );
  if (!hasProcessVk) {
    await vkRegistry.setVerifyingKeys(
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      useQuadraticVoting ? EMode.QV : EMode.NON_QV,
      processVkParam,
      tallyVkParam,
    );
  }
};

export default deployContracts;

deployContracts.tags = ["VkRegistry"];
