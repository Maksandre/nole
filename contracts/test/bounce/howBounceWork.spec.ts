import { artifacts } from "hardhat";
import config from "../../../src/client/utils/config";
import XWallet from "../../../src/client/XWallet";
import { encodeFunctionData } from "viem";
import WrappedWallet from "../../../src/client/WrappedWallet";
import { Faucet, waitTillCompleted } from "@nilfoundation/niljs";

it("Can query view function from solidity", async () => {
  const nil = await XWallet.init({ address: config.xWalletAddress, ...config });

  const sourceA = await artifacts.readArtifact("Test_ErrorSource");
  const callerA = await artifacts.readArtifact("Test_ErrorCaller");

  const source = await nil.deployContract({
    abi: sourceA.abi,
    bytecode: sourceA.bytecode,
    feeCredit: 2_000_000n,
    args: [],
    salt: BigInt(Date.now()),
    shardId: config.shardId,
  });

  const caller = await nil.deployContract({
    abi: callerA.abi,
    bytecode: callerA.bytecode,
    feeCredit: 2_000_000n,
    args: [],
    salt: BigInt(Date.now()),
    shardId: config.shardId,
  });

  ////// TOP UP CALLER ////////

  /////// CALL CALLER /////////
  const oldWallet = await WrappedWallet.init(config);

  // const faucet = new Faucet(nil.client);
  // await faucet.withdrawToWithRetry(
  //   oldWallet.wallet.getAddressHex(),
  //   10n ** 16n,
  //   10,
  // );

  const BOUNCE_TO = caller.address;
  const REFUND_TO = caller.address;

  // 108840 gas
  // 48656 gas - wallet
  // 60184 gas - everything else
  const result = await oldWallet.wallet.sendMessage({
    to: caller.address,
    feeCredit: 60184n * 10n - 1n,
    value: 1n,
    data: encodeFunctionData({
      abi: callerA.abi,
      functionName: "callCustomError",
      args: [source.address, 42n],
    }),
  });

  const receipts = await waitTillCompleted(
    oldWallet.wallet.client,
    oldWallet.wallet.shardId,
    result,
  );

  const totalFeePaid = receipts.reduce(
    (prev, curr) => prev + curr.gasUsed * curr.gasPrice!,
    0n,
  );

  console.log(result);
});
