import config from "./client/utils/config";
import WrappedWallet from "./client/WrappedWallet";
import { encodeFunctionData, hexToBigInt } from "viem";
import { bytesToHex, Faucet, waitTillCompleted } from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import XWallet from "./client/XWallet";

const main = async () => {
  const nil = await XWallet.init({
    address: config.xWalletAddress,
    ...config,
  });

  const someWallet = await WrappedWallet.init({
    rpc: config.rpc,
    shardId: config.shardId,
    signerPrivateKey:
      "0x1782b8c2942b66466dcc570689d43761e57bc1572bd2f5f6fe0adeb500862690",
    walletAddress: "0x000191Ce33a93aAD9E9baf4B4D6f050a409055bF",
  });

  const signerPublicKey = bytesToHex(await nil.signer.getPublicKey());

  ///////// 1. Deploy wallet /////////
  const xWalletArtifacts = await artifacts.readArtifact("XWallet");

  const deploymentCall = await nil.deployContract({
    shardId: config.shardId,
    bytecode: xWalletArtifacts.bytecode,
    salt: 2n,
    feeCredit: 5_000_000n,
    value: 0n,
    abi: xWalletArtifacts.abi,
    args: [signerPublicKey],
  });

  const walletAddress = deploymentCall.address;
  console.log("Wallet Address:", walletAddress);

  ///////// 2. Top Up wallet /////////
  const faucet = new Faucet(nil.client);
  await faucet.withdrawToWithRetry(walletAddress, 10n ** 18n);

  ///////// 3. Mint currency /////////
  const createCurrencyReceipts = await nil.createCurrency(
    "My Currency",
    1_000_000n,
    true,
  );

  ///////// 4. query currencies /////////
  const currencies = await nil.getCurrencies(walletAddress);
  console.log(currencies);

  ///////// 5. approve /////////
  const APPROVE_VALUE = 500n;
  const approveCall = await nil.approve(someWallet.wallet.getAddressHex(), [
    { id: hexToBigInt(walletAddress), amount: APPROVE_VALUE },
  ]);

  ///////// 6. transfer /////////
  const transferCall = await someWallet.wallet.sendMessage({
    to: walletAddress,
    feeCredit: 5_000_000n,
    data: encodeFunctionData({
      abi: xWalletArtifacts.abi,
      functionName: "transfer",
      args: [
        [{ id: hexToBigInt(walletAddress), amount: APPROVE_VALUE }],
        someWallet.wallet.getAddressHex(),
      ],
    }),
  });

  const transferReceipts = await waitTillCompleted(
    someWallet.wallet.client,
    someWallet.wallet.shardId,
    transferCall,
  );

  ///////// 7. query currencies /////////
  const currenciesRecipient = await nil.getCurrencies(
    someWallet.wallet.getAddressHex(),
  );

  console.log(currenciesRecipient);
};

main().catch(console.log);
