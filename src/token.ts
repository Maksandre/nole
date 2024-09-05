import { artifacts } from "hardhat";
import XWallet from "./client/XWallet";
import config from "./client/utils/config";
import { encodeFunctionData } from "viem";

export const main = async () => {
  const nil = await XWallet.init({
    address: config.xWalletAddress,
    ...config,
  });

  const collectionArtifacts = await artifacts.readArtifact("XCollection");

  const deploymentTx = await nil.deployContract({
    bytecode: collectionArtifacts.bytecode,
    abi: collectionArtifacts.abi,
    args: ["Collection Name", "SMBL"],
    feeCredit: 3_000_000n,
    salt: 3n,
    shardId: config.shardId,
  });
  const collectionAddress = deploymentTx.address;

  console.log(await nil.getCurrencies(nil.address));

  const mintingResult = await nil.sendMessage({
    to: collectionAddress,
    feeCredit: 10_000_000n,
    data: encodeFunctionData({
      abi: collectionArtifacts.abi,
      functionName: "mint",
      args: [nil.address, 5n],
    }),
  });

  const currencies = await nil.getCurrencies(nil.address);
  console.log(currencies);
};

main().catch(console.log);
