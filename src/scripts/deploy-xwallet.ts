import {
  Faucet,
  generateRandomPrivateKey,
  getPublicKey,
  Hex,
  waitTillCompleted,
} from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import XWallet from "../client/XWallet";
import config from "../client/utils/config";
import WrappedWallet from "../client/WrappedWallet";
import { expectAllReceiptsSuccess } from "../client/utils/receipt";

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

  const receipts = await waitTillCompleted(
    wallet.wallet.client,
    config.shardId,
    newWallet.hash,
  );
  expectAllReceiptsSuccess(receipts);

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

export const deployRandomXWallet = async (topUp: boolean = true) => {
  const randomPrivateKey = generateRandomPrivateKey();
  const salt = BigInt(Date.now());

  return deployXWallet(randomPrivateKey, topUp, salt);
};
