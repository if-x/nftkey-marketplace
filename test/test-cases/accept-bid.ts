import {
  NFTKEYMarketPlaceV1Instance,
  TestERC20Instance,
  TestERC721Instance,
} from "../../types/truffle-contracts";
import { TokenBidAccepted } from "../../types/truffle-contracts/INFTKEYMarketPlaceV1";

const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1");

export const testAcceptBid = async (accounts: Truffle.Accounts) => {
  let paymentToken: TestERC20Instance;
  let erc721: TestERC721Instance;
  let marketplaceInstance: NFTKEYMarketPlaceV1Instance;

  before(async () => {
    paymentToken = await TestERC20.deployed();
    erc721 = await TestERC721.deployed();
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should accept bid", async () => {
    const highestBid = await marketplaceInstance.getTokenHighestBid(0);

    await erc721.setApprovalForAll(marketplaceInstance.address, true, {
      from: accounts[1],
    });

    const balanceBefore = await paymentToken.balanceOf(accounts[1]);

    const receipt = await marketplaceInstance.acceptBidForToken(
      0,
      highestBid.bidder,
      {
        from: accounts[1],
      }
    );

    console.log("Accept bid gas", receipt.receipt.gasUsed);

    const acceptBidLog = receipt.logs.find(
      (log) => log.event === "TokenBidAccepted"
    ) as Truffle.TransactionLog<TokenBidAccepted>;

    assert.equal(
      web3.utils.fromWei(acceptBidLog.args.total),
      web3.utils.fromWei(highestBid.bidPrice)
    );

    const balanceAfter = await paymentToken.balanceOf(accounts[1]);

    console.log("balanceBefore", web3.utils.fromWei(balanceBefore));
    console.log("balanceAfter", web3.utils.fromWei(balanceAfter));
  });
};
