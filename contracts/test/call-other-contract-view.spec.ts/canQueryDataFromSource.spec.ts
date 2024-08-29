import { artifacts } from "hardhat";
import config from "../../../src/client/utils/config";
import XWallet from "../../../src/client/XWallet";
import { encodeFunctionData } from "viem";
import WrappedWallet from "../../../src/client/WrappedWallet";
import { waitTillCompleted } from "@nilfoundation/niljs";

it("Can query view function from solidity", async () => {
  const nil = await XWallet.init({ address: config.xWalletAddress, ...config });

  const sourceA = await artifacts.readArtifact("Test_DataSource");
  const queryA = await artifacts.readArtifact("Test_DataQuery");

  const source = await nil.deployContract({
    abi: sourceA.abi,
    bytecode: sourceA.bytecode,
    feeCredit: 2_000_000n,
    args: [],
    salt: BigInt(Date.now()),
    shardId: config.shardId,
  });

  const query = await nil.deployContract({
    abi: queryA.abi,
    bytecode: queryA.bytecode,
    feeCredit: 2_000_000n,
    args: [],
    salt: BigInt(Date.now()),
    shardId: config.shardId,
  });

  const oldWallet = await WrappedWallet.init(config);

  const result = await oldWallet.wallet.sendMessage({
    to: query.address,
    feeCredit: 3_000_000n,
    data: encodeFunctionData({
      abi: queryA.abi,
      functionName: "queryDataFromSource",
      args: [source.address],
    }),
  });

  const receipt = await waitTillCompleted(
    oldWallet.wallet.client,
    oldWallet.wallet.shardId,
    result,
  );

  console.log(result);
});
