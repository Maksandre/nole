import {
  HttpTransport,
  LocalECDSAKeySigner,
  PublicClient,
  waitTillCompleted,
  WalletV1,
} from "@nilfoundation/niljs";
import config from "./config";
import { artifacts } from "hardhat";

const main = async () => {
  const client = new PublicClient({
    transport: new HttpTransport({
      endpoint: config.rpc,
    }),
    shardId: config.shardId,
  });

  const signer = new LocalECDSAKeySigner({ privateKey: config.privateKey });

  const wallet = new WalletV1({
    pubkey: await signer.getPublicKey(),
    signer,
    client,
    address: config.wallet,
  });

  const artifact = await artifacts.readArtifact("NIL20");

  const deploymentTx = await wallet.deployContract({
    shardId: config.shardId,
    bytecode: artifact.bytecode,
    salt: 1n,
    feeCredit: 0n,
  });

  const [receipt] = await waitTillCompleted(
    client,
    config.shardId,
    deploymentTx.hash,
  );

  console.log(receipt);
};

main().catch((e) => {
  console.log(e);
});
