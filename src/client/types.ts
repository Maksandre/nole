import { Hex } from "@nilfoundation/niljs";
import { Abi } from "abitype";

export type XWalletOptions = {
  address: Hex;
  rpc: string;
  signerPrivateKey: Hex;
  shardId: number;
};

export type Currency = {
  id: bigint;
  amount: bigint;
};

export type MessageTokens = {
  feeCredit: bigint;
  value?: bigint;
  tokens?: Currency[];
};

export type DeployParams = {
  bytecode: Uint8Array | Hex;
  abi: Abi;
  args: unknown[];
  salt: Uint8Array | bigint;
  shardId: number;
  feeCredit: bigint;
  value?: bigint;
};
