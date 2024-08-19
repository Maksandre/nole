import {
  HttpTransport,
  LocalECDSAKeySigner,
  PublicClient,
  waitTillCompleted,
  WalletV1,
  Hex,
  toHex,
} from "@nilfoundation/niljs";
import config from "./utils/config";
import { artifacts, viem } from "hardhat";
import { decodeFunctionResult, encodeFunctionData } from "viem";

const main = async () => {
  const client = new PublicClient({
    transport: new HttpTransport({
      endpoint: config.rpc,
    }),
    shardId: config.shardId,
  });

  const signer = new LocalECDSAKeySigner({
    privateKey: config.signerPrivateKey,
  });

  const wallet = new WalletV1({
    pubkey: await signer.getPublicKey(),
    signer,
    client,
    address: config.walletAddress,
  });

  console.log(wallet.getAddressHex());

  const artifact = await artifacts.readArtifact("NoleToken");

  const deploymentTx = await wallet.deployContract({
    shardId: config.shardId,
    bytecode: artifact.bytecode,
    salt: 8n,
    feeCredit: 5_000_000n,
    value: 5_000_000n,
  });

  const [receipt] = await waitTillCompleted(
    client,
    config.shardId,
    deploymentTx.hash,
  );

  const deploymentReceipt = receipt.outputReceipts
    ? receipt.outputReceipts[0]
    : undefined;
  if (!deploymentReceipt) throw Error("Cannot find deployment receipt");

  console.log("Minter address:", deploymentReceipt.contractAddress);

  const resultCall = await wallet.client.call(
    {
      from: toHex(wallet.address),
      to: deploymentReceipt.contractAddress as Hex,
      data: encodeFunctionData({
        abi: artifact.abi,
        functionName: "doNothing",
        args: [],
      }),
    },
    "latest",
  );

  const decoded = decodeFunctionResult({
    abi: artifact.abi,
    functionName: "doNothing",
    data: resultCall,
  });

  console.log(decoded);

  // const hashMint = await wallet.sendMessage({
  //   to: deploymentTx.address,
  //   data: encodeFunctionData({
  //     abi: artifact.abi,
  //     functionName: "mint",
  //     args: [],
  //   }),
  //   feeCredit: 3_000_000n,
  // });

  // const [receipt2] = await waitTillCompleted(client, config.shardId, hashMint);
  // console.log(receipt2);
};

main().catch((e) => {
  console.log(e);
});
