import {
  HttpTransport,
  Hex,
  LocalECDSAKeySigner,
  PublicClient,
  WalletV1,
} from "@nilfoundation/niljs";

export type NoleConfig = {
  shardId: number;
  rpc: string;
  signerPrivateKey: Hex;
  walletAddress: Hex;
};

export default class NoleClient {
  private constructor(readonly wallet: WalletV1) {}

  static async init(config: NoleConfig): Promise<NoleClient> {
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

    return new NoleClient(wallet);
  }

  // connect(signer: LocalECDSAKeySigner): NoleClient;
  connect(wallet: WalletV1): NoleClient;
  connect(walletOrSigner: WalletV1): NoleClient {
    return new NoleClient(walletOrSigner);
  }

  sendMessage() {
    // this.wallet.sendMessage();
  }
}
