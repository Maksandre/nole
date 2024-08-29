import {
  HttpTransport,
  Hex,
  LocalECDSAKeySigner,
  PublicClient,
  WalletV1,
} from "@nilfoundation/niljs";

export type WalletConfig = {
  shardId: number;
  rpc: string;
  signerPrivateKey: Hex;
  walletAddress: Hex;
};

export default class WrappedWallet {
  readonly wallet: WalletV1;
  readonly signer: LocalECDSAKeySigner;

  private constructor(wallet: WalletV1, signer: LocalECDSAKeySigner) {
    this.wallet = wallet;
    this.signer = signer;
  }

  static async init(config: WalletConfig): Promise<WrappedWallet> {
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

    return new WrappedWallet(wallet, signer);
  }

  connect(wallet: WalletV1, signer: LocalECDSAKeySigner): WrappedWallet {
    return new WrappedWallet(wallet, signer);
  }

  sendMessage() {
    // this.wallet.sendMessage();
  }
}
