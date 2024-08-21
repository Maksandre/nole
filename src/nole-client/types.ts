import { LocalECDSAKeySigner, Hex } from "@nilfoundation/niljs";
import { Abi } from "abitype";

export type NoleWalletOptions = {
  address: Hex;
  rpc: string;
  signerPrivateKey: Hex;
  shardId: number;
};

export type Currency = {
  id: bigint;
  amount: bigint;
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
