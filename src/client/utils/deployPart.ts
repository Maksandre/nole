// NOTE: this is copypaste from nil.js

import { encodeDeployData } from "viem";

import {
  addHexPrefix,
  bytesToHex,
  calculateAddress,
  hexToBytes,
  IDeployData,
} from "@nilfoundation/niljs";

const refineSalt = (salt: Uint8Array | bigint): Uint8Array => {
  if (typeof salt === "bigint") {
    return hexToBytes(addHexPrefix(salt.toString(16).padStart(64, "0"))).slice(
      0,
      32,
    );
  }

  if (salt.length !== 32) throw Error("Salt must be 32 bytes");

  return salt;
};

/**
 * Refines the provided salt and generates the full bytecode for deployment. Returns the bytecode and the deployment address.
 *
 * @param {IDeployData} data The deployment data.
 * @returns {{ data: Uint8Array; address: Uint8Array }} The object containing the final bytecode and the deployment address.
 */
export const prepareDeployPart = (
  data: IDeployData,
): { data: Uint8Array; address: Uint8Array } => {
  const byteSalt = refineSalt(data.salt);
  let constructorData: Uint8Array;
  if (data.abi) {
    constructorData = hexToBytes(
      encodeDeployData({
        abi: data.abi,
        bytecode:
          typeof data.bytecode === "string"
            ? data.bytecode
            : bytesToHex(data.bytecode),
        args: data.args || [],
      }),
    );
  } else {
    constructorData =
      typeof data.bytecode === "string"
        ? hexToBytes(data.bytecode)
        : data.bytecode;
  }
  const bytecode = new Uint8Array([...constructorData, ...byteSalt]);
  const address = calculateAddress(data.shard, constructorData, byteSalt);
  return { data: bytecode, address: address };
};
