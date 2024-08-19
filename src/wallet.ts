import config from "./utils/config";
import NoleClient from "./nole-client/NoleClient";
import {
  Hex,
  LocalECDSAKeySigner,
  refineAddress,
  waitTillCompleted,
} from "@nilfoundation/niljs";
import { artifacts } from "hardhat";
import { bytesToHex, encodeFunctionData } from "viem";

const main = async () => {
  const walletArtifact = await artifacts.readArtifact(
    "contracts/nilcore/Wallet.sol:Wallet",
  );

  const nil = await NoleClient.init(config);

  const someRandomSigner = new LocalECDSAKeySigner({
    privateKey:
      "0x1c21c5387b62c6da4fecd929cb7b0a675b9f72a1bd739006c716bb7741d1957e",
  });

  const SOME_RANDOM_WALLET =
    "0x000150E85243a3AE693620BB5ff5C5c40f4C5507".toLowerCase() as Hex;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  nil.wallet.signer = someRandomSigner;

  // const from = toHex(await someRandomSigner.getAddress(config.shardId));
  const from = bytesToHex(nil.wallet.address);
  const to = bytesToHex(refineAddress(nil.wallet.address));
  const refundAndBounce = to;
  const data = encodeFunctionData({
    abi: walletArtifact.abi,
    functionName: "asyncCall",
    args: [
      SOME_RANDOM_WALLET,
      refundAndBounce,
      refundAndBounce,
      5_000_000n,
      false,
      [],
      1000n,
      "0x",
    ],
  });

  const illegalCall = await nil.wallet.client.call(
    {
      from,
      to,
      data,
      gasLimit: 6_000_000n,
    },
    "latest",
  );

  const receipts = await waitTillCompleted(
    nil.wallet.client,
    nil.wallet.shardId,
    illegalCall,
  );

  console.log("Finish");
};

main().catch(console.log);
