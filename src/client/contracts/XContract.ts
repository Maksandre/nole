import { Hex, PublicClient } from "@nilfoundation/niljs";
import { Abi } from "abitype";
import {
  ContractFunctionName,
  decodeFunctionResult,
  DecodeFunctionResultReturnType,
  encodeFunctionData,
  EncodeFunctionDataParameters,
} from "viem";

export abstract class XContract<T extends Abi | readonly unknown[]> {
  constructor(
    private client: PublicClient,
    private abi: T,
    private address: Hex,
  ) {}

  async call<const functionName extends ContractFunctionName<T>>(
    params: Omit<EncodeFunctionDataParameters<T, functionName>, "abi">,
  ) {
    const { data } = await this.client.call(
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
