import { Faucet, getPublicKey, Hex } from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import XWallet from "../client/XWallet";
import config from "../client/utils/config";

export const deployXWallet = async (
  privateKey: Hex,
  topUp: boolean = true,
  salt?: bigint,
) => {
  const wallet = await XWallet.init({
    address: config.xWalletAddress,
    ...config,
  });

  const xwalletArtifacts = await artifacts.readArtifact("XWallet");

  const pubkey = getPublicKey(privateKey);

  const newWallet = await wallet.deployContract({
    abi: xwalletArtifacts.abi,
    args: [pubkey],
    bytecode: xwalletArtifacts.bytecode,
    feeCredit: 3_000_000n,
    salt: salt ?? BigInt(Date.now()),
    shardId: config.shardId,
  });

  if (topUp) {
    const faucet = new Faucet(wallet.client);
    await faucet.withdrawToWithRetry(newWallet.address, 10n ** 16n);
  }

  console.log("XWallet:", newWallet.address);

  return XWallet.init({
    address: newWallet.address,
    signerPrivateKey: privateKey,
    rpc: config.rpc,
    shardId: config.shardId,
  });
};
