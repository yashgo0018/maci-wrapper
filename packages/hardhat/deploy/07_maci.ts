import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GatekeeperContractName, InitialVoiceCreditProxyContractName, stateTreeDepth } from "../constants";
import { MACIWrapper, SignUpGatekeeper } from "../typechain-types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const poseidonT3 = await hre.ethers.getContract("PoseidonT3", deployer);
  const poseidonT4 = await hre.ethers.getContract("PoseidonT4", deployer);
  const poseidonT5 = await hre.ethers.getContract("PoseidonT5", deployer);
  const poseidonT6 = await hre.ethers.getContract("PoseidonT6", deployer);
  const initialVoiceCreditProxy = await hre.ethers.getContract(InitialVoiceCreditProxyContractName, deployer);
  const gatekeeper = await hre.ethers.getContract<SignUpGatekeeper>(GatekeeperContractName, deployer);
  const pollFactory = await hre.ethers.getContract("PollFactory", deployer);
  const messageProcessorFactory = await hre.ethers.getContract("MessageProcessorFactory", deployer);
  const tallyFactory = await hre.ethers.getContract("TallyFactory", deployer);

  await hre.deployments.deploy("MACIWrapper", {
    from: deployer,
    args: [
      await pollFactory.getAddress(),
      await messageProcessorFactory.getAddress(),
      await tallyFactory.getAddress(),
      await gatekeeper.getAddress(),
      await initialVoiceCreditProxy.getAddress(),
      stateTreeDepth,
    ],
    log: true,
    libraries: {
      PoseidonT3: await poseidonT3.getAddress(),
      PoseidonT4: await poseidonT4.getAddress(),
      PoseidonT5: await poseidonT5.getAddress(),
      PoseidonT6: await poseidonT6.getAddress(),
    },
    autoMine: true,
  });

  const maci = await hre.ethers.getContract<MACIWrapper>("MACIWrapper", deployer);

  console.log(`The MACI contract is deployed at ${await maci.getAddress()}`);

  const tx = await gatekeeper.setMaciInstance(await maci.getAddress());
  await tx.wait(1);
};

export default deployContracts;

deployContracts.tags = ["MACI"];
