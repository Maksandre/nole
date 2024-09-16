import XW from "../../artifacts/contracts/XWallet.sol/XWallet.json";
import { artifacts } from "hardhat";
import { XWallet$Type } from "../../artifacts/contracts/XWallet.sol/XWallet";
import {
  addHexPrefix,
  BlockTag,
  bytesToHex,
  Faucet,
  generateRandomPrivateKey,
  getPublicKey,
  Hex,
  hexToBytes,
  LocalECDSAKeySigner,
  ProcessedReceipt,
  refineAddress,
  SendMessageParams,
  waitTillCompleted,
} from "@nilfoundation/niljs";
import { Abi, encodeFunctionData, hexToBigInt } from "viem";
import { XWalletOptions, Currency, DeployParams } from "./types";
import { prepareDeployPart } from "./utils/deployPart";
import { XClient } from "./XClient";

export default class XWallet {
  private constructor(
    readonly address: Hex,
    readonly client: XClient,
    readonly signer: LocalECDSAKeySigner,
    readonly shardId: number,
    private artifacts: XWallet$Type,
  ) {}

  static abi = XW.abi as Abi;
  static code = hexToBytes(addHexPrefix(XW.bytecode));

  static async init(options: XWalletOptions) {
    const artifact = await artifacts.readArtifact("XWallet");

    const client = new XClient({
      shardId: options.shardId,
      rpc: options.rpc,
      signerPrivateKey: options.signerPrivateKey,
    });

    const signer = new LocalECDSAKeySigner({
      privateKey: options.signerPrivateKey,
    });

    return new XWallet(
      options.address,
      client,
      signer,
      options.shardId,
      artifact,
    );
  }

  static async deploy(options: { client: XClient; shardId: number }) {
    const privateKey = generateRandomPrivateKey();
    const pubkey = getPublicKey(privateKey);

    const { data, address } = prepareDeployPart({
      salt: BigInt(Date.now()),
      bytecode: XWallet.code,
      abi: XWallet.abi,
      shard: options.shardId,
      args: [pubkey],
    });

    const addressHex = bytesToHex(address);

    const faucet = new Faucet(options.client.client);
    await faucet.withdrawToWithRetry(bytesToHex(address), 10n ** 15n);

    const messageHash = await options.client.callExternal(
      bytesToHex(address),
      bytesToHex(data),
      true,
    );

    await waitTillCompleted(
      options.client.client,
      options.shardId,
      messageHash,
    );

    return XWallet.init({
      address: addressHex,
      rpc: options.client.rpc,
      shardId: options.shardId,
      signerPrivateKey: privateKey,
    });
  }

  async approve(spender: Hex, currencies: Currency[]) {
    const approveCalldata = encodeFunctionData({
      abi: this.artifacts.abi,
      functionName: "approve",
      args: [spender, currencies],
    });

    return this.callWaitResult(approveCalldata);
  }

  async createCurrency(amount: bigint) {
    const createCurrencyCalldata = encodeFunctionData({
      abi: this.artifacts.abi,
      functionName: "mintCurrency",
      args: [amount],
    });

    const receipts = await this.callWaitResult(createCurrencyCalldata);
    const currencyId = hexToBigInt(this.address);

    return { receipts, currencyId };
  }

  async getCurrencies(blockTagOrHash: Hex | BlockTag = "latest") {
    return this.client.getCurrencies(this.address, blockTagOrHash);
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

    const { seqno, chainId } = await this.client.getCallParams(this.address);

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

  private async callExternal(calldata: Hex, isDeploy = false) {
    return this.client.callExternal(this.address, calldata, isDeploy);
  }

  private async callWaitResult(
    calldata: Hex,
    isDeploy = false,
  ): Promise<ProcessedReceipt[]> {
    const messageHash = await this.callExternal(calldata, isDeploy);

    return waitTillCompleted(this.client.client, this.shardId, messageHash);
  }
}
