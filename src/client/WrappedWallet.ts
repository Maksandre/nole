import {
  HttpTransport,
  Hex,
  LocalECDSAKeySigner,
  PublicClient,
  WalletV1,
  Faucet,
  generateRandomPrivateKey,
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
    const client = this._initClient(config);

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

  static async deploy(
    rpc: string,
    shardId: number,
    salt: bigint,
    privateKey?: Hex,
  ) {
    const client = this._initClient({ rpc, shardId });

    const faucet = new Faucet(client);

    const signer = new LocalECDSAKeySigner({
      privateKey: privateKey ?? generateRandomPrivateKey(),
    });

    const pubkey = await signer.getPublicKey();

    const wallet = new WalletV1({
      pubkey,
      signer,
      client,
      shardId: 1,
      salt,
    });

    const walletAddress = wallet.getAddressHex();

    await faucet.withdrawToWithRetry(walletAddress, 300_000_000n);

    await wallet.selfDeploy(true);

    return new WrappedWallet(wallet, signer);
  }

  connect(wallet: WalletV1, signer: LocalECDSAKeySigner): WrappedWallet {
    return new WrappedWallet(wallet, signer);
  }

  sendMessage() {
    // this.wallet.sendMessage();
  }

  private static _initClient(config: { rpc: string; shardId: number }) {
    const client = new PublicClient({
      transport: new HttpTransport({
        endpoint: config.rpc,
      }),
      shardId: config.shardId,
    });

    return client;
  }
}
