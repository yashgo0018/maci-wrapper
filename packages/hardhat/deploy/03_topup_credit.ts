import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TopupCreditContractName } from "../constants";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy(TopupCreditContractName, {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const topupCredit = await hre.ethers.getContract(TopupCreditContractName, deployer);
  console.log(`The topupCredit is deployed at ${await topupCredit.getAddress()}`);
};

export default deployContracts;

deployContracts.tags = ["TopupCredit"];
