import { artifacts } from "hardhat";
import { deployRandomXWallet } from "../src/scripts/deploy-xwallet";
import { decodeFunctionResult, encodeFunctionData } from "viem";
import { hexToBigInt } from "@nilfoundation/niljs";
import { expect } from "chai";

it("Marketplace e2e scenario", async () => {
  const marketArtifacts = await artifacts.readArtifact("Market");
  const collectionArtifacts = await artifacts.readArtifact("XCollection");
  const SHARD_ID = 1;
  const NFT_ID = 5n;
  const PRICE = 100n;

  const seller = await deployRandomXWallet();
  const buyer = await deployRandomXWallet();

  const nftCollection = await seller.deployContract({
    bytecode: collectionArtifacts.bytecode,
    abi: collectionArtifacts.abi,
    args: ["Collection Name", "SMBL"],
    feeCredit: 3_000_000n,
    salt: BigInt(Date.now()),
    shardId: SHARD_ID,
  });

  const nft = await seller.sendMessage({
    to: nftCollection.address,
    feeCredit: 10_000_000n,
    data: encodeFunctionData({
      abi: collectionArtifacts.abi,
      functionName: "mint",
      args: [seller.address, NFT_ID],
    }),
  });

  const nftAddress = await seller.client
    .call(
      {
        to: nftCollection.address,
        data: encodeFunctionData({
          abi: collectionArtifacts.abi,
          functionName: "getTokenAddress",
          args: [NFT_ID],
        }),
      },
      "latest",
    )
    .then((r) =>
      decodeFunctionResult({
        abi: collectionArtifacts.abi,
        functionName: "getTokenAddress",
        data: r.data,
      }),
    );

  const nftId = hexToBigInt(nftAddress);

  const buyerCurrency = await buyer.createCurrency(1000n);

  const market = await seller.deployContract({
    abi: marketArtifacts.abi,
    args: [],
    bytecode: marketArtifacts.bytecode,
    feeCredit: 5_000_000n,
    shardId: SHARD_ID,
    salt: BigInt(Date.now()),
  });

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
      args: [nftId, buyerCurrency.currencyId, PRICE],
    }),
  });

  const buyerApprove = await buyer.approve(market.address, [
    { id: buyerCurrency.currencyId, amount: PRICE },
  ]);

  const buy = await buyer.sendMessage({
    to: market.address,
    feeCredit: 300_000_000n,
    data: encodeFunctionData({
      abi: marketArtifacts.abi,
      functionName: "initBuy",
      args: [nftId],
    }),
  });

  //////// ASSERT ////////

  const sellerCurrencies = await seller.getCurrencies();
  const buyerCurrencies = await buyer.getCurrencies();

  expect(sellerCurrencies).has.property(buyer.address).eq(PRICE);
  expect(buyerCurrencies).has.property(nftAddress).eq(1);
});
