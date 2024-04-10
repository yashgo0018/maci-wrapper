import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { MACI } from "../typechain-types";
import { GatekeeperContractName, InitialVoiceCreditProxyContractName } from "../constants";
import fs from "fs";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const maci = await hre.ethers.getContract<MACI>("MACI", deployer);
  const initialVoiceCreditProxy = await hre.ethers.getContract(InitialVoiceCreditProxyContractName, deployer);
  const gatekeeper = await hre.ethers.getContract(GatekeeperContractName, deployer);
  const verifier = await hre.ethers.getContract("Verifier", deployer);
  const pollFactory = await hre.ethers.getContract("PollFactory", deployer);
  const topupCredit = await hre.ethers.getContract("TopupCredit", deployer);
  const poseidonT3 = await hre.ethers.getContract("PoseidonT3", deployer);
  const poseidonT4 = await hre.ethers.getContract("PoseidonT4", deployer);
  const poseidonT5 = await hre.ethers.getContract("PoseidonT5", deployer);
  const poseidonT6 = await hre.ethers.getContract("PoseidonT6", deployer);

  fs.writeFileSync(
    "./contractAddresses.json",
    JSON.stringify({
      [hre.network.name]: {
        MACI: await maci.getAddress(),
        StateAq: await maci.stateAq(),
        InitialVoiceCreditProxy: await initialVoiceCreditProxy.getAddress(),
        SignUpGatekeeper: await gatekeeper.getAddress(),
        Verifier: await verifier.getAddress(),
        PollFactory: await pollFactory.getAddress(),
        TopupCredit: await topupCredit.getAddress(),
        PoseidonT3: await poseidonT3.getAddress(),
        PoseidonT4: await poseidonT4.getAddress(),
        PoseidonT5: await poseidonT5.getAddress(),
        PoseidonT6: await poseidonT6.getAddress(),
      },
    }),
  );
};

export default deployContracts;

deployContracts.tags = ["SubsidyFactory"];
