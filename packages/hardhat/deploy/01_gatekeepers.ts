import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GatekeeperContractName } from "../constants";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy(GatekeeperContractName, {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const gatekeeper = await hre.ethers.getContract(GatekeeperContractName, deployer);
  console.log(`The gatekeeper is deployed at ${await gatekeeper.getAddress()}`);
};

export default deployContracts;

deployContracts.tags = ["Gatekeeper"];
