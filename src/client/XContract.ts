import { Hex } from "@nilfoundation/niljs";
import { Abi } from "abitype";
import {
  ContractConstructorArgs,
  ContractFunctionName,
  decodeFunctionResult,
  DecodeFunctionResultReturnType,
  encodeFunctionData,
  EncodeFunctionDataParameters,
} from "viem";
import XWallet from "./XWallet";
import { MessageTokens } from "./types";
import { expectAllReceiptsSuccess } from "./utils/receipt";

export class XContract<T extends Abi> {
  constructor(
    private wallet: XWallet,
    private abi: T,
    public address: Hex,
  ) {}

  static connect<T extends Abi>(
    wallet: XWallet,
    abi: T,
    address: Hex,
  ): XContract<T> {
    return new XContract(wallet, abi, address);
  }

  static async deploy<T extends Abi>(
    wallet: XWallet,
    artifact: { abi: T; bytecode: Hex },
    args: ContractConstructorArgs<T>,
    shardId: number,
    salt?: bigint,
  ): Promise<XContract<T>> {
    const { address, receipts } = await wallet.deployContract({
      abi: artifact.abi,
      args: args as unknown[],
      bytecode: artifact.bytecode,
      feeCredit: 5_000_000n,
      shardId,
      salt: salt ?? BigInt(Date.now()),
    });

    expectAllReceiptsSuccess(receipts);

    return new XContract(wallet, artifact.abi, address);
  }

  connect(wallet: XWallet) {
    return new XContract(wallet, this.abi, this.address);
  }

  async sendMessage<functionName extends ContractFunctionName<T>>(
    params: Omit<EncodeFunctionDataParameters<T, functionName>, "abi">,
    messageTokens: MessageTokens,
    expectSuccess = true,
  ) {
    const receipts = await this.wallet.sendMessage({
      to: this.address,
      feeCredit: messageTokens.feeCredit,
      value: messageTokens.value,
      tokens: messageTokens.tokens,
      data: encodeFunctionData({
        abi: this.abi as any,
        functionName: params.functionName,
        args: params.args as any,
      }),
    });

    if (expectSuccess) expectAllReceiptsSuccess(receipts);

    return receipts;
  }

  async call<functionName extends ContractFunctionName<T>>(
    params: Omit<EncodeFunctionDataParameters<T, functionName>, "abi">,
  ) {
    const { data } = await this.wallet.client.client.call(
      {
        to: this.address,
        data: encodeFunctionData({
          abi: this.abi as any,
          functionName: params.functionName,
          args: params.args as any,
        }),
      },
      "latest",
    );

    return decodeFunctionResult({
      abi: this.abi as any,
      functionName: params.functionName as any,
      data,
    }) as DecodeFunctionResultReturnType<T, functionName>;
  }
}
