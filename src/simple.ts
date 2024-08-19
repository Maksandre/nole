import config from "./utils/config";
import NoleClient from "./nole-client/NoleClient";
import { decodeFunctionResult, encodeFunctionData } from "viem";
import { Hex, toHex, waitTillCompleted } from "@nilfoundation/niljs";
import { artifacts } from "hardhat";

const main = async () => {
  const nil = await NoleClient.init(config);

  const simpleArtifact = await artifacts.readArtifact("Simple");

  const deploymentTx = await nil.wallet.deployContract({
    shardId: config.shardId,
    bytecode: simpleArtifact.bytecode,
    salt: 2n,
    feeCredit: 5_000_000n,
    value: 0n,
  });

  await waitTillCompleted(nil.wallet.client, config.shardId, deploymentTx.hash);

  const callValue = await nil.wallet.client.call(
    {
      from: null as unknown as Hex,
      to: deploymentTx.address,
      data: encodeFunctionData({
        abi: simpleArtifact.abi,
        functionName: "doNothing",
        args: [],
      }),
    },
    "latest",
  );

  const result = decodeFunctionResult({
    abi: simpleArtifact.abi,
    functionName: "doNothing",
    data: callValue,
  });

  console.log(result);
};

main().catch(console.log);
