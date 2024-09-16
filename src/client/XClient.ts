import {
  BlockTag,
  externalMessageEncode,
  Hex,
  hexToBytes,
  HttpTransport,
  LocalECDSAKeySigner,
  PublicClient,
} from "@nilfoundation/niljs";

export class XClient {
  client: PublicClient;
  shardId: number;
  rpc: string;
  signer?: LocalECDSAKeySigner;

  constructor(config: {
    shardId: number;
    rpc: string;
    signerPrivateKey?: Hex;
  }) {
    const { shardId, rpc, signerPrivateKey } = config;
    this.client = new PublicClient({
      shardId: shardId,
      transport: new HttpTransport({ endpoint: rpc }),
    });

    this.shardId = shardId;
    this.rpc = rpc;
    if (signerPrivateKey) {
      this.signer = new LocalECDSAKeySigner({ privateKey: signerPrivateKey });
    }
  }

  connect(signerPrivateKey: Hex) {
    return new XClient({
      shardId: this.shardId,
      rpc: this.rpc,
      signerPrivateKey,
    });
  }

  async callExternal(
    address: Hex,
    calldata: Hex,
    isDeploy: boolean,
  ): Promise<Hex> {
    if (!this.signer) throw Error("Client has no signer");

    const { seqno, chainId } = await this.getCallParams(address);

    const { raw } = await externalMessageEncode(
      {
        seqno,
        chainId,
        isDeploy,
        to: hexToBytes(address),
        data: hexToBytes(calldata),
      },
      this.signer,
    );

    return this.client.sendRawMessage(raw);
  }

  async getCurrencies(address: Hex, blockTagOrHash: Hex | BlockTag = "latest") {
    return this.client.getCurrencies(address, blockTagOrHash);
  }

  async getCallParams(address: Hex) {
    const [seqno, chainId] = await Promise.all([
      this.client.getMessageCount(address, "latest"),
      this.client.chainId(),
    ]);

    return { seqno, chainId };
  }
}
