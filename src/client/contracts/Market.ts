import { Hex, PublicClient } from "@nilfoundation/niljs";
import { XContract } from "./XContract";
import { artifacts } from "hardhat";
import { Market$Type } from "../../../artifacts/contracts/Market.sol/Market";

export class Market<T extends Market$Type["abi"]> extends XContract<T> {
  constructor(client: PublicClient, abi: T, address: Hex) {
    super(client, abi, address);
  }

  static async init(client: PublicClient, address: Hex) {
    const { abi } = await artifacts.readArtifact("Market");
    return new Market(client, abi, address);
  }
}
