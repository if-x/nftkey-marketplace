import {
  NFTKEYMarketPlaceV11Instance,
  TestERC20Instance,
} from "../../types/truffle-contracts";

const TestERC20 = artifacts.require("TestERC20");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1_1");

export const testWithdrawBid = async (accounts: Truffle.Accounts) => {
  let paymentToken: TestERC20Instance;
  let marketplaceInstance: NFTKEYMarketPlaceV11Instance;

  before(async () => {
    paymentToken = await TestERC20.deployed();
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should withdraw bid", async () => {
    const highestBidsBefore = await marketplaceInstance.getTokenHighestBid(0);

    const receipt = await marketplaceInstance.withdrawBidForToken(0, {
      from: accounts[5],
    });
    console.log("Withdraw bid gas", receipt.receipt.gasUsed);

    const bids = await marketplaceInstance.getTokenBids(0);
    assert.equal(bids.length, 4);

    const highestBidsAfter = await marketplaceInstance.getTokenHighestBid(0);

    assert.notEqual(highestBidsBefore.bidder, highestBidsAfter.bidder);
    assert.isAbove(
      Number(web3.utils.fromWei(highestBidsBefore.bidPrice)),
      Number(web3.utils.fromWei(highestBidsAfter.bidPrice))
    );
  });

  it("Should remove allowance and make bid invalid", async () => {
    const account = accounts[2];

    const bidBefore = await marketplaceInstance.getBidderTokenBid(0, account);
    assert.equal(bidBefore.bidder, account);

    await paymentToken.approve(marketplaceInstance.address, 0, {
      from: account,
    });

    const bidAfter = await marketplaceInstance.getBidderTokenBid(0, account);
    assert.notEqual(bidAfter.bidder, account);
  });
};
