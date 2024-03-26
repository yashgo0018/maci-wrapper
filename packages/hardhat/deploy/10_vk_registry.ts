import { extractVk } from "../maci-ts/circuits";
import { VerifyingKey } from "../maci-ts/domainobjs";

import type { IVerifyingKeyStruct } from "../maci-ts/ts/types";
import type { VkRegistry } from "../typechain-types";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  intStateTreeDepth,
  messageBatchDepth,
  messageTreeDepth,
  processMessagesZkeyPath,
  stateTreeDepth,
  subsidyZkeyPath,
  tallyVotesZkeyPath,
  voteOptionTreeDepth,
} from "../constants";

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

  const [processVk, tallyVk, subsidyVk] = await Promise.all([
    extractVk(processMessagesZkeyPath),
    extractVk(tallyVotesZkeyPath),
    subsidyZkeyPath ? extractVk(subsidyZkeyPath) : null,
  ]).then(vks => vks.map(vk => (vk ? VerifyingKey.fromObj(vk as any) : null)));

  const messageBatchSize = 5 ** messageBatchDepth;
  const processVkParam = processVk!.asContractParam() as IVerifyingKeyStruct;
  const tallyVkParam = tallyVk!.asContractParam() as IVerifyingKeyStruct;

  const hasProcessVk = await vkRegistry.hasProcessVk(
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
  );
  if (!hasProcessVk) {
    await vkRegistry.setVerifyingKeys(
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      processVkParam,
      tallyVkParam,
    );
  }

  if (subsidyVk) {
    const hasSubsidyVk = await vkRegistry.hasSubsidyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);
    if (!hasSubsidyVk) {
      await vkRegistry.setSubsidyKeys(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
        subsidyVk.asContractParam() as IVerifyingKeyStruct,
      );
    }
  }
};

export default deployContracts;

deployContracts.tags = ["VkRegistry"];
