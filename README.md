# Nil client utils

![License](https://img.shields.io/badge/License-MIT-yellow.svg)

This package is intended to simplify interaction with the Nil Chain during its DevNet phase and will probably be deprecated with the evolution of Nil.js

## Table of Contents

- [Nil client utils](#nil-client-utils)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
    - [Peer Dependencies](#peer-dependencies)
  - [Getting Started](#getting-started)
    - [XClient](#xclient)
      - [Initialization](#initialization)
      - [Connecting with a Signer](#connecting-with-a-signer)
    - [XWallet](#xwallet)
      - [Initialization](#initialization-1)
      - [Self-deployment](#self-deployment)
    - [XContract](#xcontract)
      - [Connecting to an Existing Contract](#connecting-to-an-existing-contract)
      - [Deploying a New Contract](#deploying-a-new-contract)

---

## Features

- **Type-Safe Interactions:** Leverages TypeScript's strong typing to ensure reliable and predictable blockchain interactions.
- **Smart Contract Deployment:** Easily deploy new smart contracts with customizable parameters.
- **Message Handling:** Send and manage messages with comprehensive receipt processing.
- **Currency Management:** Create and approve currencies within your wallet.

---

## Installation

Ensure you have [Yarn](https://yarnpkg.com/) installed. Then, install the package using Yarn:

```bash
yarn add your-package-name
```

### Peer Dependencies

This package relies on the following peer dependencies. Ensure they are installed in your project:

@nilfoundation/niljs
viem
abitype
Install them using Yarn:

```sh
yarn add @nilfoundation/niljs viem abitype
```

## Getting Started

### XClient

The XClient class manages blockchain communications, handles external calls, and interacts with the underlying blockchain network. It serves as the bridge between your wallet and the blockchain, facilitating message sending and currency management.

#### Initialization

```ts
import { XClient } from "simple-nil";

const client = new XClient({
  shardId: 1,
  rpc: "https://rpc.endpoint.com",
  signerPrivateKey:
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
});
```

#### Connecting with a Signer

If you need to connect the client with a different signer (private key), you can use the connect method:

```ts
const newSignerPrivateKey =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const connectedClient = client.connect(newSignerPrivateKey);
```

### XWallet

The XWallet class provides functionalities to manage and interact with an XWallet instance on the blockchain. It allows for deploying contracts, approving spenders, creating currencies, and more.

#### Initialization

```ts
import { XWallet, XWalletOptions } from "simple-nil";

const options: XWalletOptions = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  rpc: "https://rpc.endpoint.com",
  signerPrivateKey:
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  shardId: 1,
};

const wallet = await XWallet.init(options);
console.log("Initialized XWallet:", wallet.address);
```

#### Self-deployment

```ts
import { XWallet, XClient } from "your-package-name";

const client = new XClient({
  shardId: 1,
  rpc: "https://rpc.endpoint.com",
  signerPrivateKey:
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
});

const deployedWallet = await XWallet.deploy({
  client,
  shardId: 1,
});
console.log("Deployed XWallet Address:", deployedWallet.address);
```

### XContract

The XContract class provides functionalities to interact with deployed smart contracts. It allows connecting to existing contracts, deploying new ones, and invoking contract methods.

#### Connecting to an Existing Contract

```ts
import { XContract } from "simple-nil";
import { XWallet } from "simple-nil";

// Assuming you have an initialized XWallet instance
const wallet = await XWallet.init(options);

// Define the ABI of your contract
const abi = [
  /* Your Contract ABI */
];

// Address of the deployed contract
const contractAddress = "0xabcdef1234567890abcdef1234567890abcdef12";

// Connect to the contract
const contract = XContract.connect(wallet, abi, contractAddress);
```

#### Deploying a New Contract

```ts
import { XContract } from "your-package-name";
import { XWallet } from "your-package-name";

// Assuming you have an initialized XWallet instance
const wallet = await XWallet.init(options);

// Define the ABI and bytecode of your contract
const artifact = {
  abi: [
    /* Your Contract ABI */
  ],
  bytecode: "0x6001600101", // Replace with your contract's bytecode
};

// Constructor arguments for your contract
const args = [
  /* Constructor Arguments */
];

const shardId = 1;
const salt = BigInt(Date.now());

const newContract = await XContract.deploy(
  wallet,
  artifact,
  args,
  shardId,
  salt,
);
console.log("Deployed Contract Address:", newContract.address);
```
