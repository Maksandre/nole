import type { NilHardhatUserConfig } from "@nilfoundation/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nilfoundation/hardhat-plugin";

import appConfig from "./config";

const config: NilHardhatUserConfig = {
  solidity: "0.8.23",
  ignition: {
    requiredConfirmations: 1,
  },
  networks: {
    nil: {
      url: appConfig.rpc,
      accounts: [appConfig.signerPrivateKey],
    },
  },
  walletAddress: appConfig.walletAddress,
  debug: true,
  mocha: {
    timeout: 9999999,
  },
};

export default config;
