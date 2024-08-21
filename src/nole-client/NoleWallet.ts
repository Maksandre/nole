import { artifacts } from "hardhat";
import { NoleWallet$Type } from "../../artifacts/contracts/NoleWallet.sol/NoleWallet";
import {
  BlockTag,
  bytesToHex,
  externalMessageEncode,
  Hex,
  hexToBytes,
  HttpTransport,
  LocalECDSAKeySigner,
  ProcessedReceipt,
  PublicClient,
  refineAddress,
  SendMessageParams,
  waitTillCompleted,
} from "@nilfoundation/niljs";
import { encodeFunctionData } from "viem";
import { NoleWalletOptions, Currency, DeployParams } from "./types";
import { prepareDeployPart } from "../utils/deployPart";

export default class NoleWallet {
  private constructor(
    readonly address: Hex,
    readonly client: PublicClient,
    readonly signer: LocalECDSAKeySigner,
    readonly shardId: number,
    private artifacts: NoleWallet$Type,
  ) {}

  static async init(options: NoleWalletOptions) {
    const artifact = await artifacts.readArtifact("NoleWallet");
    const client = new PublicClient({
      shardId: options.shardId,
      transport: new HttpTransport({ endpoint: options.rpc }),
    });

    const signer = new LocalECDSAKeySigner({
      privateKey: options.signerPrivateKey,
    });

    return new NoleWallet(
      options.address,
      client,
      signer,
      options.shardId,
      artifact,
    );
  }

  async approve(spender: Hex, currencies: Currency[]) {
    const approveCalldata = encodeFunctionData({
      abi: this.artifacts.abi,
      functionName: "approve",
      args: [spender, currencies],
    });

    return this.callWaitResult(approveCalldata);
  }

  async createCurrency(name: string, amount: bigint, withdraw = true) {
    const createCurrencyCalldata = encodeFunctionData({
      abi: this.artifacts.abi,
      functionName: "createToken",
      args: [amount, name, withdraw],
    });

    return this.callWaitResult(createCurrencyCalldata);
  }

  async getCurrencies(address: Hex, blockTagOrHash: Hex | BlockTag = "latest") {
    return this.client.getCurrencies(address, blockTagOrHash);
  }

  async deployContract(params: DeployParams) {
    const deployData = {
      shard: params.shardId,
      bytecode: params.bytecode,
      abi: params.abi,
      args: params.args,
      salt: params.salt,
    };
    const { data, address } = prepareDeployPart(deployData);

    const { seqno, chainId } = await this.getCallParams();

    const receipts = await this.sendMessage({
      to: address,
      refundTo: this.address,
      data,
      value: params.value ?? 0n,
      deploy: true,
      feeCredit: params.feeCredit,
      seqno,
      chainId,
    });

    return {
      receipts,
      address: bytesToHex(address),
    };
  }

  async sendMessage(messageParams: SendMessageParams) {
    const hexTo = bytesToHex(refineAddress(messageParams.to));
    const hexRefundTo = bytesToHex(
      refineAddress(messageParams.refundTo ?? this.address),
    );
    const hexBounceTo = bytesToHex(
      refineAddress(messageParams.bounceTo ?? this.address),
    );
    const hexData = messageParams.data
      ? messageParams.data instanceof Uint8Array
        ? bytesToHex(messageParams.data)
        : messageParams.data
      : "0x";

    const callData = encodeFunctionData({
      abi: this.artifacts.abi,
      functionName: "asyncCall",
      args: [
        hexTo,
        hexRefundTo,
        hexBounceTo,
        messageParams.feeCredit,
        !!messageParams.deploy,
        messageParams.tokens ?? [],
        messageParams.value ?? 0n,
        hexData,
      ],
    });

    return this.callWaitResult(callData);
  }

  async getCallParams() {
    const [seqno, chainId] = await Promise.all([
      this.client.getMessageCount(this.address, "latest"),
      this.client.chainId(),
    ]);

    return { seqno, chainId };
  }

  private async callWaitResult(
    calldata: Hex,
    isDeploy = false,
  ): Promise<ProcessedReceipt[]> {
    const { seqno, chainId } = await this.getCallParams();

    const { raw } = await externalMessageEncode(
      {
        isDeploy,
        chainId,
        seqno,
        to: hexToBytes(this.address),
        data: hexToBytes(calldata),
      },
      this.signer,
    );

    const messageHash = await this.client.sendRawMessage(raw);

    return waitTillCompleted(this.client, this.shardId, messageHash);
  }
}
