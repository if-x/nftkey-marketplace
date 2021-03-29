import {
  NFTKEYMarketPlaceV1Instance,
  TestERC20Instance,
  TestERC721Instance,
} from "../../types/truffle-contracts";

const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1");

export const testTransferToken = async (accounts: Truffle.Accounts) => {
  let paymentToken: TestERC20Instance;
  let erc721: TestERC721Instance;
  let marketplaceInstance: NFTKEYMarketPlaceV1Instance;

  before(async () => {
    paymentToken = await TestERC20.deployed();
    erc721 = await TestERC721.deployed();
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should transfer token and make listing invalid", async () => {
    const listingBefore = await marketplaceInstance.getTokenListing(1);

    // @ts-ignore
    await erc721.safeTransferFrom(listingBefore.seller, accounts[1], 1, {
      from: listingBefore.seller,
    });

    const listingAfter = await marketplaceInstance.getTokenListing(1);

    assert.equal(Number(listingAfter.tokenId), 0);
  });

  it("Should clean listings", async () => {
    const allListingBefore = await marketplaceInstance.getTokenListings();

    const invalidListingCount = await marketplaceInstance.getInvalidListingCount();
    assert.equal(Number(invalidListingCount), 1);

    await marketplaceInstance.cleanAllInvalidListings();

    const invalidListingCountAfter = await marketplaceInstance.getInvalidListingCount();
    assert.equal(Number(invalidListingCountAfter), 0);

    const allListingAfter = await marketplaceInstance.getTokenListings();
    assert.equal(allListingAfter.length, allListingBefore.length - 1);
  });

  it("Should clean bids", async () => {
    const invalidBidsCountBefore = await marketplaceInstance.getInvalidBidCount();

    await marketplaceInstance.cleanAllInvalidBids();

    const invalidBidsCountAfter = await marketplaceInstance.getInvalidBidCount();

    assert.equal(
      Number(invalidBidsCountAfter),
      Number(invalidBidsCountBefore) - 2
    );
  });
};
