import type { NilHardhatUserConfig } from "@nilfoundation/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nilfoundation/hardhat-plugin";
import * as dotenv from "dotenv";

dotenv.config();


const config: NilHardhatUserConfig = {
  solidity: "0.8.24",
  ignition: {
    requiredConfirmations: 1,
  },
  networks: {
    nil: {
      url: process.env.NIL_RPC_ENDPOINT,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  walletAddress: process.env.WALLET_ADDR?.toLowerCase(),
  debug: true,
};

export default config;
