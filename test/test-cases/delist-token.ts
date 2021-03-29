import { NFTKEYMarketPlaceV1Instance } from "../../types/truffle-contracts";
import { TokenDelisted } from "../../types/truffle-contracts/INFTKEYMarketPlaceV1";
import { assertRevert } from "../test-utils/assertions";

const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1");

export const testDelistToken = async (accounts: Truffle.Accounts) => {
  let marketplaceInstance: NFTKEYMarketPlaceV1Instance;

  before(async () => {
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should delist token", async () => {
    const receipt = await marketplaceInstance.delistToken(4);

    console.log("Delist gas", receipt.receipt.gasUsed);

    const delistLog = receipt.logs.find(
      (log) => log.event === "TokenDelisted"
    ) as Truffle.TransactionLog<TokenDelisted>;

    assert.equal(delistLog.args.fromAddress, accounts[0]);
    assert.equal(Number(delistLog.args.tokenId), 4);

    const startTime = Date.now();
    const listings = await marketplaceInstance.getTokenListings();
    const endTime = Date.now();

    console.log("Query time", endTime - startTime);

    assert.equal(listings.length, 4);
  });

  it("Should revert if not token owner", async () => {
    await assertRevert(
      marketplaceInstance.delistToken(3, { from: accounts[1] }),
      "Only token seller can delist token",
      "Only token seller can delist token"
    );
  });
};
