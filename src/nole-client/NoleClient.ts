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
  readonly wallet: WalletV1;
  readonly signer: LocalECDSAKeySigner;

  private constructor(wallet: WalletV1, signer: LocalECDSAKeySigner) {
    this.wallet = wallet;
    this.signer = signer;
  }

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

    return new NoleClient(wallet, signer);
  }

  connect(wallet: WalletV1, signer: LocalECDSAKeySigner): NoleClient {
    return new NoleClient(wallet, signer);
  }

  sendMessage() {
    // this.wallet.sendMessage();
  }
}
