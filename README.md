# Scaffold ETH 2 + MACI Voting Template

Welcome to the Scaffold ETH 2 + MACI Voting Template! This template is a powerful starting point for developers aiming to build decentralized voting applications that prioritize privacy and resist collusion. Combining the rapid development environment of Scaffold ETH with the innovative Minimal Anti-Collusion Infrastructure (MACI), this template offers a robust foundation for creating secure and transparent voting systems on the Ethereum blockchain.

## Features

- **Voter Registration**: Secure registration process through the MACI contract, enabling eligible voting.
- **Poll Management**: Admins can easily create and manage polls, including question and options setup.
- **Secure Voting**: Leverage MACI's privacy-preserving technology to ensure votes are cast anonymously and securely.
- **Results Display**: Transparent display of poll results after the voting phase concludes.
- **Admin Dashboard**: Comprehensive admin interface for poll oversight, including current status and results analytics.

## Requirements

Ensure you have the following tools installed before you proceed:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

Jumpstart your development with these simple steps:

1. **Clone and Set Up the Project**

```bash
git clone https://github.com/yashgo0018/maci-wrapper.git
cd maci-wrapper
yarn install
```

2. **Download the zkeys for the maci circuits**

In your first terminal window, run:

```bash
yarn download-zkeys
```

3. **Update the environment variables**

Copy the env example files to env files

```bash
cp packages/hardhat/.env.example packages/hardhat/.env
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Update the values of the env variables in these new .env files

4. **Start a Local Ethereum Network**

In your first terminal window, run:

```bash
yarn chain
```

This initiates a local Ethereum network via Hardhat for development and testing purposes. Adjust the network settings in `hardhat.config.ts` as needed.

5. **Deploy Contracts**

In a second terminal, deploy your test contract with:

```bash
yarn deploy
```

Find the contract in `packages/hardhat/contracts`. This script deploys your contract to the local network, with customization available in `packages/hardhat/deploy`.

6. **Launch the NextJS Application**

In a third terminal, start the NextJS frontend:

```bash
yarn start
```

7. **Compute Results**

- In a fourth terminal, clone the maci repo - `git clone git@github.com:privacy-scaling-explorations/maci.git` 
- Copy the zkeys generated from the maci wrapper repo to the cli directory of the maci repo using `cp -r maci-wrapper/packages/hardhat/zkeys maci/cli`. 
- Install the dependencies using `pnpm i` and build the maci project using `pnpm run build`
- Copy the new contract addresses from the maci wrapper repo to the maci repo using `cp -r maci-wrapper/packages/contractAddresses.json maci/cli/build/contractAddresses.json`. 
- After this you should be able to run the commands written in the [maci documentation](https://maci.pse.dev/docs/v1.2/cli).
- First merge signups, then merge messages, and then generate proof, and upload the tally.json file which is generated in the process to the admin panel after the poll is over.

Navigate to `http://localhost:3000` to interact with your dApp. Modify your app configuration in `packages/nextjs/scaffold.config.ts` and `packages/hardhat/constants.ts` as necessary.

The deployed contracts will be saved to the file `packages/hardhat/contractAddresses.json`, this file is compatible with maci cli.

The coordinator keys will be stored in the file `packages/hardhat/coordinatorKeyPair.json`.

## Usage

After setting up the project, you can:

- **Register**: Use the app's interface to register with the MACI contract and gain voting rights.
- **Create Polls**: As an admin, you can create polls with custom questions and options.
- **Vote**: Registered voters can participate in polls, utilizing MACI's secure voting mechanism.
- **View Results**: Access poll outcomes after the voting phase ends.
- **Admin Dashboard**: Monitor and manage ongoing polls, including viewing detailed poll status.

## Contributing

Your contributions are welcome! Feel free to report issues, submit fixes, or suggest new features to enhance the project.

## License

This project is licensed under the [MIT License](LICENSE).
