import type { NilHardhatUserConfig } from "@nilfoundation/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nilfoundation/hardhat-plugin";

import appConfig from "./src/config";

const config: NilHardhatUserConfig = {
  solidity: "0.8.24",
  ignition: {
    requiredConfirmations: 1,
  },
  networks: {
    nil: {
      url: appConfig.rpc,
      accounts: [appConfig.privateKey],
    },
  },
  walletAddress: appConfig.wallet,
  debug: true,
};

export default config;
