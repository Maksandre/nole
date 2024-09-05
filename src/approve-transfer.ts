import config from "./client/utils/config";
import WrappedWallet from "./client/WrappedWallet";
import { encodeFunctionData, hexToBigInt } from "viem";
import { bytesToHex, Faucet, waitTillCompleted } from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import XWallet from "./client/XWallet";
import { deployXWallet } from "./scripts/deploy-xwallet";

const main = async () => {
  const xWallet = await XWallet.init({
    address: config.xWalletAddress,
    ...config,
  });

  const someWallet = await WrappedWallet.deploy(
    config.rpc,
    config.shardId,
    BigInt(Date.now()),
    config.signerPrivateKey,
  );

  const signerPublicKey = bytesToHex(await xWallet.signer.getPublicKey());
  const xWalletArtifacts = await artifacts.readArtifact("XWallet");

  ///////// 1. Mint currency /////////
  const createCurrencyReceipts = await xWallet.createCurrency(1_000_000n);

  ///////// 2. query currencies /////////
  const currencies = await xWallet.getCurrencies(xWallet.address);
  console.log(currencies);

  ///////// 3. approve /////////
  const APPROVE_VALUE = 500n;
  const approveCall = await xWallet.approve(someWallet.wallet.getAddressHex(), [
    { id: hexToBigInt(xWallet.address), amount: APPROVE_VALUE },
  ]);

  ///////// 4. transfer /////////
  const transferCall = await someWallet.wallet.sendMessage({
    to: xWallet.address,
    feeCredit: 5_000_000n,
    data: encodeFunctionData({
      abi: xWalletArtifacts.abi,
      functionName: "transfer",
      args: [
        [{ id: hexToBigInt(xWallet.address), amount: APPROVE_VALUE }],
        someWallet.wallet.getAddressHex(),
      ],
    }),
  });

  const transferReceipts = await waitTillCompleted(
    someWallet.wallet.client,
    someWallet.wallet.shardId,
    transferCall,
  );

  ///////// 5. query currencies /////////
  // someWallet received transferred from xWallet 500 tokens
  const currenciesRecipient = await xWallet.getCurrencies(
    someWallet.wallet.getAddressHex(),
  );

  console.log(currenciesRecipient);
};

main().catch(console.log);
