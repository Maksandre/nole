import { artifacts } from "hardhat";
import config from "../../../src/client/utils/config";
import XWallet from "../../../src/client/XWallet";
import { encodeFunctionData } from "viem";

it("Who is msg sender", async () => {
  const nil = await XWallet.init({ address: config.xWalletAddress, ...config });

  const receiverA = await artifacts.readArtifact("Test_Receiver");
  const senderA = await artifacts.readArtifact("Test_Sender");

  const receiver = await nil.deployContract({
    abi: receiverA.abi,
    bytecode: receiverA.bytecode,
    feeCredit: 2_000_000n,
    args: [],
    salt: 1n,
    shardId: config.shardId,
  });

  const sender = await nil.deployContract({
    abi: senderA.abi,
    bytecode: senderA.bytecode,
    feeCredit: 2_000_000n,
    args: [],
    salt: 1n,
    shardId: config.shardId,
  });

  const result = await nil.sendMessage({
    to: sender.address,
    feeCredit: 3_000_000n,
    data: encodeFunctionData({
      abi: senderA.abi,
      functionName: "callReceiver",
      args: [receiver.address],
    }),
  });

  console.log(result);
});
