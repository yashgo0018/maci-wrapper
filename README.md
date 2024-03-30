# Scaffold ETH + MACI Voting Template

Welcome to the Scaffold ETH + MACI Voting Template! This template is a powerful starting point for developers aiming to build decentralized voting applications that prioritize privacy and resist collusion. Combining the rapid development environment of Scaffold ETH with the innovative Minimal Anti-Collusion Infrastructure (MACI), this template offers a robust foundation for creating secure and transparent voting systems on the Ethereum blockchain.

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
git clone https://github.com/scaffold-eth/scaffold-eth-2.git
cd scaffold-eth-2
yarn install
```

2. **Start a Local Ethereum Network**

In your first terminal window, run:

```bash
yarn chain
```

This initiates a local Ethereum network via Hardhat for development and testing purposes. Adjust the network settings in `hardhat.config.ts` as needed.

3. **Deploy Contracts**

In a second terminal, deploy your test contract with:

```bash
yarn deploy
```

Find the contract in `packages/hardhat/contracts`. This script deploys your contract to the local network, with customization available in `packages/hardhat/deploy`.

4. **Launch the NextJS Application**

In a third terminal, start the NextJS frontend:

```bash
yarn start
```

Navigate to `http://localhost:3000` to interact with your dApp. Modify your app configuration in `packages/nextjs/scaffold.config.ts` as necessary.

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
