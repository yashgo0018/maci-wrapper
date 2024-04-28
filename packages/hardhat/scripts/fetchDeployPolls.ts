import { ethers, getNamedAccounts } from "hardhat";
import { MACI } from "../typechain-types";

async function main() {
  const { deployer } = await getNamedAccounts();
  const pollManager = await ethers.getContract<MACI>("MACI", deployer);

  const events = await pollManager.queryFilter(pollManager.filters.DeployPoll(), 0, 43);
  console.log(events);
}

main();
