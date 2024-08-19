import {
  PublicClient,
  HttpTransport,
  LocalECDSAKeySigner,
  WalletV1,
} from "@nilfoundation/niljs";
import config from "./config";

const getTools = async () => {
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
};

export default getTools();
