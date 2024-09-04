import { Faucet, getPublicKey, Hex } from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import XWallet from "../client/XWallet";
import config from "../client/utils/config";
import WrappedWallet from "../client/WrappedWallet";

export const deployXWallet = async (
  privateKey: Hex,
  topUp: boolean = true,
  salt?: bigint,
) => {
  const wallet = await WrappedWallet.init(config);

  const xwalletArtifacts = await artifacts.readArtifact("XWallet");

  const pubkey = getPublicKey(privateKey);

  const newWallet = await wallet.wallet.deployContract({
    abi: xwalletArtifacts.abi,
    args: [pubkey],
    bytecode: xwalletArtifacts.bytecode,
    feeCredit: 3_000_000n,
    salt: salt ?? BigInt(Date.now()),
    shardId: config.shardId,
  });

  if (topUp) {
    const faucet = new Faucet(wallet.wallet.client);
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
