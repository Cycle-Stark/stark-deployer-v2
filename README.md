# Stark Deployer

A free, open-source tool for deploying, importing, and interacting with Starknet smart contracts. Built with Next.js, Mantine, and StarknetKit.

## Features

- **Deploy Contracts** — Deploy Cairo smart contracts to Mainnet, Sepolia, or Devnet with a guided step-by-step process
- **Import & Manage** — Import existing contracts by address and manage them in one organized dashboard
- **Interactive Testing** — Call and invoke contract functions with auto-generated forms from the ABI
- **Monitor & Track** — Track every interaction, monitor transaction statuses, and review historical call data
- **10+ Handy Tools** — Universal converter, large number creator, felt/string encoder, ERC-20 token approvals, block timestamp fetcher, Starknet ID resolver, transaction lookup, notes manager, and more
- **System Logs** — Real-time logs panel that captures every action, transaction, and error

## Supported Networks

| Network | Type | Description |
|---------|------|-------------|
| **Mainnet** | Production | Deploy production-ready contracts to Starknet Mainnet |
| **Sepolia** | Testnet | Test and iterate on Starknet's public testnet before going live |
| **Devnet** | Local | Rapid local development with instant feedback and zero gas costs |

## Supported Wallets

- [Argent X](https://www.argent.xyz/argent-x/)
- [Braavos](https://braavos.app/)
- [Keon](https://github.com/)

## Getting Started

### Prerequisites

- Node.js 20+
- A Starknet wallet browser extension (Argent X, Braavos, or Keon)

### Installation

```bash
git clone https://github.com/Cycle-Stark/stark-deployer.git
cd stark-deployer
yarn install
```

### Development

```bash
yarn dev
```

### Build

```bash
yarn build
yarn start
```

## Starknet Devnet Setup

Create the dump folder before starting devnet:

```bash
mkdir -p ~/starknet_devnet
```

Start devnet with a seed for reproducible accounts:

```bash
starknet-devnet --seed 1350075753 --dump-path ~/starknet_devnet/dump --dump-on exit
```

### Installing starknet-devnet

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.sh | sh

asdf plugin add starknet-devnet
asdf install starknet-devnet latest
asdf set starknet-devnet latest --home
```

If you run into installation issues:

```bash
sudo apt-get update
sudo apt-get install llvm-dev libclang-dev clang
```

## Tech Stack

- **Framework** — Next.js 15, React 19
- **UI** — Mantine 8, Tabler Icons
- **Blockchain** — starknet.js, StarknetKit
- **Storage** — Dexie (IndexedDB) for local persistence
- **Tables** — mantine-datatable

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for setup instructions, coding standards, and the PR process.

Quick links:

- [Report a Bug](https://github.com/Cycle-Stark/stark-deployer/issues/new?labels=bug)
- [Request a Feature](https://github.com/Cycle-Stark/stark-deployer/issues/new?labels=enhancement)
- [Submit a Pull Request](https://github.com/Cycle-Stark/stark-deployer/pulls)

## Notes

- Landing page screenshots are taken at `1257px` screen width
- All data is stored locally in the browser via IndexedDB — nothing is sent to external servers
- Seed for devnet: `1350075753`

## License

This project is source-available under the [Business Source License 1.1 (BSL 1.1)](https://mariadb.com/bsl11/).

- You are free to view, fork, and contribute to the source code.
- You may **not** copy, redistribute, or deploy this software as your own product or service.
- Commercial use and redistribution require explicit written permission from the author.

Copyright (c) 2025 Cycle Stark. All rights reserved.
