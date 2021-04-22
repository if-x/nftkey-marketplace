import {
  NFTKEYMarketPlaceV11Instance,
  TestERC20Instance,
  TestERC721Instance,
} from "../../types/truffle-contracts";
import { assertRevert } from "../test-utils/assertions";
import { getUnixTimeAfterDays } from "../test-utils/timestamp";

const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1_1");

export const testBidToken = async (accounts: Truffle.Accounts) => {
  let paymentToken: TestERC20Instance;
  let erc721: TestERC721Instance;
  let marketplaceInstance: NFTKEYMarketPlaceV11Instance;

  before(async () => {
    paymentToken = await TestERC20.deployed();
    erc721 = await TestERC721.deployed();
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should no able to bid on token if is owner", async () => {
    await assertRevert(
      marketplaceInstance.enterBidForToken(
        0,
        web3.utils.toWei("1"),
        getUnixTimeAfterDays(2)
      ),
      "This Token belongs to this address",
      "This Token belongs to this address"
    );
  });

  it("Should no able to bid on token before set allowance", async () => {
    await assertRevert(
      marketplaceInstance.enterBidForToken(
        0,
        web3.utils.toWei("1"),
        getUnixTimeAfterDays(2),
        { from: accounts[1] }
      ),
      "Need to have enough token holding to bid on this token",
      "Need to have enough token holding to bid on this token"
    );
  });

  it("Should place bid on token", async () => {
    const balance = await paymentToken.balanceOf(accounts[1]);
    await paymentToken.approve(marketplaceInstance.address, balance, {
      from: accounts[1],
    });

    const receipt = await marketplaceInstance.enterBidForToken(
      0,
      web3.utils.toWei("1"),
      getUnixTimeAfterDays(2),
      { from: accounts[1] }
    );

    console.log("Bidding gas", receipt.receipt.gasUsed);

    const bids = await marketplaceInstance.getTokenBids(0);
    assert.equal(bids[0].bidder, accounts[1]);
  });

  it("Should place mutiple bids", async () => {
    for (let i = 0; i < 5; i++) {
      const account = accounts[i + 1];
      const balance = await paymentToken.balanceOf(account);
      await paymentToken.approve(marketplaceInstance.address, balance, {
        from: account,
      });
      const receipt = await marketplaceInstance.enterBidForToken(
        0,
        web3.utils.toWei(`${i + 1}`),
        getUnixTimeAfterDays(2),
        { from: account }
      );
      console.log("Bidding gas", receipt.receipt.gasUsed);
    }
    for (let i = 0; i < 3; i++) {
      const receipt = await marketplaceInstance.enterBidForToken(
        i + 1,
        web3.utils.toWei("1"),
        getUnixTimeAfterDays(2),
        { from: accounts[1] }
      );
      console.log("Bidding gas", receipt.receipt.gasUsed);
    }

    const bids = await marketplaceInstance.getTokenBids(0);
    assert.equal(bids.length, 5);

    const startTime = Date.now();
    const allHighestBids = await marketplaceInstance.getAllTokenHighestBids();
    const endTime = Date.now();
    assert.equal(allHighestBids.length, 4);
    console.log("Query time getAllTokenHighestBids", endTime - startTime);
  });
};
