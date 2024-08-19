import {
  DeployParams,
  Hex,
  waitTillCompleted,
  WalletV1,
} from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import { ArtifactsMap } from "hardhat/types";

export class NoleContract<T extends keyof ArtifactsMap> {
  readonly artifact: ArtifactsMap[T];
  readonly address: Hex;
  private wallet: WalletV1 | undefined;

  private constructor(
    artifact: ArtifactsMap[T],
    address: Hex,
    wallet?: WalletV1,
  ) {
    this.artifact = artifact;
    this.address = address;
    this.wallet = wallet;
  }

  static async connect(
    artifactName: keyof ArtifactsMap,
    address: Hex,
    wallet?: WalletV1,
  ) {
    const artifact = await artifacts.readArtifact(artifactName);
    return new NoleContract(artifact, address, wallet);
  }

  static async deploy(
    artifactName: keyof ArtifactsMap,
    wallet: WalletV1,
    options: Omit<DeployParams, "bytecode">,
  ) {
    const artifact = await artifacts.readArtifact(artifactName);
    const contract = await wallet.deployContract({
      bytecode: artifact.bytecode,
      ...options,
    });

    await waitTillCompleted(wallet.client, wallet.shardId, contract.hash);

    return new NoleContract(artifact, contract.address);
  }
}
