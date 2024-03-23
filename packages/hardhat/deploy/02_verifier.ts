import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { VerifierContractName } from "../constants";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy(VerifierContractName, {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const verifier = await hre.ethers.getContract(VerifierContractName, deployer);
  console.log(`The verifier is deployed at ${await verifier.getAddress()}`);
};

export default deployContracts;

deployContracts.tags = ["Verifier"];
