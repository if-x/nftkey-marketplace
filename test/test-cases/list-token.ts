import {
  NFTKEYMarketPlaceV11Instance,
  TestERC20Instance,
  TestERC721Instance,
} from "../../types/truffle-contracts";
import { TokenListed } from "../../types/truffle-contracts/INFTKEYMarketPlaceV1";
import { assertRevert } from "../test-utils/assertions";
import { getUnixTimeAfterDays } from "../test-utils/timestamp";

const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1_1");

const TOKEN_SUPPLY = 5;

export const testListToken = async (accounts: Truffle.Accounts) => {
  let paymentToken: TestERC20Instance;
  let erc721: TestERC721Instance;
  let marketplaceInstance: NFTKEYMarketPlaceV11Instance;

  before(async () => {
    paymentToken = await TestERC20.deployed();
    erc721 = await TestERC721.deployed();
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();

    // Mint payment tokens
    for (let i = 0; i < 6; i++) {
      await paymentToken.mint(web3.utils.toWei("10"), { from: accounts[i] });
    }

    // Mint ERC721 tokens
    const promises = [];
    for (let i = 0; i < TOKEN_SUPPLY; i++) {
      promises.push(erc721.mint({ from: accounts[0] }));
    }
    await Promise.all(promises);
  });

  it("Should not be able to list if not approved", async () => {
    await assertRevert(
      marketplaceInstance.listToken(
        0,
        web3.utils.toWei("1"),
        getUnixTimeAfterDays(2)
      ),
      "This token is not allowed to transfer by this contract",
      "This token is not allowed to transfer by this contract"
    );
  });

  it("Should list token for sale", async () => {
    const approveReceipt = await erc721.approve(marketplaceInstance.address, 0);
    console.log("approve gas", approveReceipt.receipt.gasUsed);

    const approveAllReceipt = await erc721.setApprovalForAll(
      marketplaceInstance.address,
      true
    );
    console.log("approveAll gas", approveAllReceipt.receipt.gasUsed);

    const receipt = await marketplaceInstance.listToken(
      0,
      web3.utils.toWei("1"),
      getUnixTimeAfterDays(2)
    );

    console.log("Listing gas", receipt.receipt.gasUsed);

    const tokenListedLog = receipt.logs.find(
      (log) => log.event === "TokenListed"
    ) as Truffle.TransactionLog<TokenListed>;

    assert.equal(tokenListedLog.args.fromAddress, accounts[0]);
    assert.equal(web3.utils.fromWei(tokenListedLog.args.minValue), "1");
    assert.equal(tokenListedLog.args.tokenId.toNumber(), 0);
  });

  it("Should have one listing", async () => {
    const listing = await marketplaceInstance.getTokenListing(0);

    assert.equal(listing.seller, accounts[0]);
    assert.equal(web3.utils.fromWei(listing.listingPrice), "1");
    assert.equal(Number(listing.tokenId), 0);

    const listings = await marketplaceInstance.getAllTokenListings();
    assert.equal(listings.length, 1);
    assert.equal(listings[0].seller, listing.seller);
  });

  it("Should update listing token", async () => {
    const receipt = await marketplaceInstance.listToken(
      0,
      web3.utils.toWei("2"),
      getUnixTimeAfterDays(2)
    );

    const tokenListedLog = receipt.logs.find(
      (log) => log.event === "TokenListed"
    ) as Truffle.TransactionLog<TokenListed>;

    assert.equal(tokenListedLog.args.fromAddress, accounts[0]);
    assert.equal(web3.utils.fromWei(tokenListedLog.args.minValue), "2");
    assert.equal(tokenListedLog.args.tokenId.toNumber(), 0);
  });

  it("Should list other tokens", async () => {
    const promises = [];
    for (let i = 0; i < TOKEN_SUPPLY; i++) {
      promises.push(
        marketplaceInstance.listToken(
          i,
          web3.utils.toWei("1"),
          getUnixTimeAfterDays(2)
        )
      );
    }

    const receipts = await Promise.all(promises);
    console.log("Listing gas 1", receipts[1].receipt.gasUsed);
    console.log("Listing gas 2", receipts[2].receipt.gasUsed);

    const startTime = Date.now();
    const listings = await marketplaceInstance.getAllTokenListings();
    const endTime = Date.now();

    console.log("Query time", endTime - startTime);

    assert.equal(listings.length, TOKEN_SUPPLY);
  });
};
