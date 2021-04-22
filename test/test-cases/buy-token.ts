import { NFTKEYMarketPlaceV11Instance } from "../../types/truffle-contracts";
import { TokenBought } from "../../types/truffle-contracts/INFTKEYMarketPlaceV1";

const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1_1");

export const testBuyToken = async (accounts: Truffle.Accounts) => {
  let marketplaceInstance: NFTKEYMarketPlaceV11Instance;

  before(async () => {
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should pay coin to buy token", async () => {
    const allListings = await marketplaceInstance.getAllTokenListings();
    const tokenToBuy = allListings[0];
    const allTokenBids = await marketplaceInstance.getTokenBids(
      tokenToBuy.tokenId
    );

    const serviceFee = await marketplaceInstance.serviceFee();

    // @ts-ignore
    const price = web3.utils.toBN(tokenToBuy.listingPrice);
    const fees = price.mul(serviceFee[0]).div(serviceFee[1]);
    const total = price.add(fees);

    const receipt = await marketplaceInstance.buyToken(tokenToBuy.tokenId, {
      from: accounts[1],
      value: total,
    });

    console.log("Buy token gas", receipt.receipt.gasUsed);

    const buyLog = receipt.logs.find(
      (log) => log.event === "TokenBought"
    ) as Truffle.TransactionLog<TokenBought>;

    assert.equal(buyLog.args.tokenId, tokenToBuy.tokenId);
    assert.equal(
      web3.utils.fromWei(buyLog.args.total),
      web3.utils.fromWei(total)
    );
    assert.equal(
      web3.utils.fromWei(buyLog.args.value),
      web3.utils.fromWei(tokenToBuy.listingPrice)
    );
    assert.equal(
      web3.utils.fromWei(buyLog.args.fees),
      web3.utils.fromWei(fees)
    );
    assert.equal(buyLog.args.fromAddress, tokenToBuy.seller);
    assert.equal(buyLog.args.toAddress, accounts[1]);

    const allListingsAfter = await marketplaceInstance.getAllTokenListings();
    assert.equal(allListingsAfter.length, allListings.length - 1);

    const allTokenBidsAfter = await marketplaceInstance.getTokenBids(
      tokenToBuy.tokenId
    );

    assert.equal(allTokenBidsAfter.length, allTokenBids.length - 1);
  });
};
