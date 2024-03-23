import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { InitialVoiceCreditProxyContractName } from "../constants";

const DEFAULT_INITIAL_VOICE_CREDITS = 99;

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy(InitialVoiceCreditProxyContractName, {
    from: deployer,
    args: [DEFAULT_INITIAL_VOICE_CREDITS],
    log: true,
    autoMine: true,
  });

  const initialVoiceCreditProxy = await hre.ethers.getContract(InitialVoiceCreditProxyContractName, deployer);
  console.log(`The initial voice credit proxy is deployed at ${await initialVoiceCreditProxy.getAddress()}`);
};

export default deployContracts;

deployContracts.tags = ["InitialVoiceCreditProxy"];
