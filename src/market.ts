import { artifacts } from "hardhat";
import XWallet from "./client/XWallet";
import config from "./client/utils/config";
import { deployXWallet } from "./scripts/deploy-xwallet";
import { encodeFunctionData, hexToBigInt } from "viem";

export const main = async () => {
  const marketArtifacts = await artifacts.readArtifact("Market");

  const seller = await XWallet.init({
    address: config.xWalletAddress,
    ...config,
  });

  const buyer = await deployXWallet(
    "0x3932db88d789c612adb57671c2bf2130d36ce3d38508d4aaf9c114e4cd942bcc",
    true,
    42n,
  );

  const buyerCurrency = await buyer.createCurrency(1000n);

  const market = await seller.deployContract({
    abi: marketArtifacts.abi,
    args: [],
    bytecode: marketArtifacts.bytecode,
    feeCredit: 5_000_000n,
    shardId: config.shardId,
    salt: 42n,
  });

  const nftId = hexToBigInt("0x000106c90ed35bfbce91abf5ec2178db69236101");
  const approval = await seller.approve(market.address, [
    {
      id: nftId,
      amount: 1n,
    },
  ]);

  const put = await seller.sendMessage({
    to: market.address,
    feeCredit: 3_000_000n,
    data: encodeFunctionData({
      functionName: "put",
      abi: marketArtifacts.abi,
      args: [nftId, buyerCurrency.currencyId, 100n],
    }),
  });

  const buyerApprove = await buyer.approve(market.address, [
    { id: buyerCurrency.currencyId, amount: 100n },
  ]);

  const buy = await buyer.sendMessage({
    to: market.address,
    feeCredit: 10_000_000n,
    data: encodeFunctionData({
      abi: marketArtifacts.abi,
      functionName: "initBuy",
      args: [nftId],
    }),
  });

  console.log(buy);
};

main().catch(console.log);
