import { artifacts } from "hardhat";
import { hexToBigInt } from "@nilfoundation/niljs";
import { expect } from "chai";
import { XWallet, XClient, XContract } from "simple-nil";
import config from "../config";

it("Marketplace e2e scenario", async () => {
  const marketArtifacts = await artifacts.readArtifact("Market");
  const collectionArtifacts = await artifacts.readArtifact("XCollection");
  const SHARD_ID = 1;
  const NFT_ID = 5n;
  const PRICE = 100n;

  const client = new XClient(config);
  const seller = await XWallet.deploy({ client, shardId: config.shardId });
  const buyer = await XWallet.deploy({ client, shardId: config.shardId });

  const nftCollection = await XContract.deploy(
    seller,
    collectionArtifacts,
    ["Collection Name", "SYMBOL"],
    1,
  );

  await nftCollection.sendMessage(
    {
      functionName: "mint",
      args: [seller.address, NFT_ID],
    },
    { feeCredit: 10_000_000n },
  );

  const nftId = await nftCollection
    .call({
      functionName: "getTokenAddress",
      args: [NFT_ID],
    })
    .then(hexToBigInt);

  const buyerCurrency = await buyer.createCurrency(1000n);

  const market = await XContract.deploy(seller, marketArtifacts, [], SHARD_ID);

  await seller.approve(market.address, [
    {
      id: nftId,
      amount: 1n,
    },
  ]);

  const put = await market.sendMessage(
    {
      functionName: "put",
      args: [nftId, buyerCurrency.currencyId, PRICE],
    },
    { feeCredit: 3_000_000n },
  );

  const buy = await market.connect(buyer).sendMessage(
    {
      functionName: "buy",
      args: [nftId],
    },
    {
      feeCredit: 300_000_000n,
      tokens: [{ id: buyerCurrency.currencyId, amount: PRICE }],
    },
  );

  //////// ASSERT ////////

  const sellerNftBalance = await market.call({
    functionName: "getBalance",
    args: [seller.address, nftId],
  });

  const sellerFungibleBalance = await market.call({
    functionName: "getBalance",
    args: [seller.address, buyerCurrency.currencyId],
  });

  const buyerNftBalance = await market.call({
    functionName: "getBalance",
    args: [buyer.address, nftId],
  });

  const buyerFungibleBalance = await market.call({
    functionName: "getBalance",
    args: [buyer.address, buyerCurrency.currencyId],
  });

  // Tokens are sent to recipients
  // All virtual balances eq 0
  expect(sellerNftBalance).to.eq(0n);
  expect(buyerNftBalance).to.eq(0n);
  expect(sellerFungibleBalance).to.eq(0n);
  expect(buyerFungibleBalance).to.eq(0n);

  const sellerCurrencies = await seller.getCurrencies();
  const buyerCurrencies = await buyer.getCurrencies();

  // TODO expect currencies
});
