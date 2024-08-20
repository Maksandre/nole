import config from "./utils/config";
import NoleClient from "./nole-client/NoleClient";
import { encodeFunctionData, hexToBigInt, hexToBytes } from "viem";
import {
  bytesToHex,
  externalMessageEncode,
  Faucet,
  Hex,
  waitTillCompleted,
} from "@nilfoundation/niljs";
import { artifacts } from "hardhat";

const main = async () => {
  const nil = await NoleClient.init(config);
  const nil2 = await NoleClient.init({
    rpc: config.rpc,
    shardId: config.shardId,
    signerPrivateKey:
      "0x1782b8c2942b66466dcc570689d43761e57bc1572bd2f5f6fe0adeb500862690",
    walletAddress: "0x000191Ce33a93aAD9E9baf4B4D6f050a409055bF",
  });

  const signerPublicKey = bytesToHex(await nil.signer.getPublicKey());

  ///////// 1. Deploy wallet /////////
  const noleWalletArtifacts = await artifacts.readArtifact("NoleWallet");

  const deploymentTx = await nil.wallet.deployContract({
    shardId: config.shardId,
    bytecode: noleWalletArtifacts.bytecode,
    salt: 2n,
    feeCredit: 5_000_000n,
    value: 0n,
    abi: noleWalletArtifacts.abi,
    args: [signerPublicKey],
  });

  const deploymentTxReceipts = await waitTillCompleted(
    nil.wallet.client,
    config.shardId,
    deploymentTx.hash,
  );

  const walletAddress = deploymentTx.address;
  // for (const receipt of deploymentTxReceipts) {
  //   if (!receipt.success) {
  //     throw Error("Deployment transaction failed");
  //   }
  // }
  console.log(walletAddress);

  let [seqno, chainId] = await Promise.all([
    nil.wallet.client.getMessageCount(walletAddress, "latest"),
    nil.wallet.client.chainId(),
  ]);

  ///////// 2. Top Up wallet /////////
  const faucet = new Faucet(nil.wallet.client);
  await faucet.withdrawToWithRetry(walletAddress, 10n ** 18n);

  ///////// 3. Mint currency /////////
  const createCurrencyCalldata = encodeFunctionData({
    abi: noleWalletArtifacts.abi,
    functionName: "createToken",
    args: [1_000_000n, "My Currency", true],
  });

  const createCurrencyRaw = await externalMessageEncode(
    {
      isDeploy: false,
      chainId,
      seqno,
      to: hexToBytes(walletAddress),
      data: hexToBytes(createCurrencyCalldata),
    },
    nil.wallet.signer,
  );

  const createCurrencyCall = await nil.wallet.client.sendRawMessage(
    createCurrencyRaw.raw,
  );

  const createCurrencyReceipts = await waitTillCompleted(
    nil.wallet.client,
    nil.wallet.shardId,
    createCurrencyCall,
  );

  ///////// 4. query currencies /////////
  const currencies = await nil.wallet.client.getCurrencies(
    walletAddress,
    "latest",
  );
  console.log(currencies);

  ///////// 5. approve /////////
  const APPROVE_VALUE = 500n;

  const approveCalldata = encodeFunctionData({
    abi: noleWalletArtifacts.abi,
    functionName: "approve",
    args: [
      nil2.wallet.getAddressHex(),
      hexToBigInt(walletAddress),
      APPROVE_VALUE,
    ],
  });

  [seqno, chainId] = await Promise.all([
    nil.wallet.client.getMessageCount(walletAddress, "latest"),
    nil.wallet.client.chainId(),
  ]);

  const approveRaw = await externalMessageEncode(
    {
      chainId,
      seqno,
      isDeploy: false,
      to: hexToBytes(walletAddress),
      data: hexToBytes(approveCalldata),
    },
    nil.signer,
  );

  const approveCall = await nil.wallet.client.sendRawMessage(approveRaw.raw);

  const approveReceipts = await waitTillCompleted(
    nil.wallet.client,
    nil.wallet.shardId,
    approveCall,
  );

  ///////// 5. transfer /////////
  const transferCall = await nil2.wallet.sendMessage({
    to: walletAddress,
    feeCredit: 5_000_000n,
    data: encodeFunctionData({
      abi: noleWalletArtifacts.abi,
      functionName: "transfer",
      args: [
        hexToBigInt(walletAddress),
        nil2.wallet.getAddressHex(),
        APPROVE_VALUE,
      ],
    }),
  });

  const transferReceipts = await waitTillCompleted(
    nil2.wallet.client,
    nil2.wallet.shardId,
    transferCall,
  );

  ///////// 6. query currencies /////////
  const currenciesRecipient = await nil.wallet.client.getCurrencies(
    nil2.wallet.getAddressHex(),
    "latest",
  );

  console.log(currenciesRecipient);
};

main().catch(console.log);
