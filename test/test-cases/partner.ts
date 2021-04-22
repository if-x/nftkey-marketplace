import {
  NFTKEYMarketPlaceV11Instance,
  TestERC20Instance,
  TestERC721Instance,
} from "../../types/truffle-contracts";

const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1_1");

export const testPartner = async (accounts: Truffle.Accounts) => {
  let paymentToken: TestERC20Instance;
  let erc721: TestERC721Instance;
  let marketplaceInstance: NFTKEYMarketPlaceV11Instance;

  before(async () => {
    paymentToken = await TestERC20.deployed();
    erc721 = await TestERC721.deployed();
    marketplaceInstance = await NFTKEYMarketPlaceV1.deployed();
  });

  it("Should setup percentage and partner", async () => {
    await marketplaceInstance.setPartnerAddressAndProfitShare(accounts[1], 40);
    await marketplaceInstance.changeSeriveFee(2, 100);

    const partnerPercentage = await marketplaceInstance.partnerSharePercentage();
    assert.equal(partnerPercentage.toNumber(), 40);

    const partnerAddress = await marketplaceInstance.partnerAddress();
    assert.equal(partnerAddress, accounts[1]);

    const serviceFee = await marketplaceInstance.serviceFee();
    assert.equal(serviceFee[0].toNumber(), 2);
    assert.equal(serviceFee[1].toNumber(), 100);
  });

  it("Should propose partner change", async () => {
    await marketplaceInstance.proposePartnerShareChange(50, {
      from: accounts[1],
    });

    const proposedPercentage = await marketplaceInstance.partnerSharePercentageProposal();
    assert.equal(proposedPercentage.toNumber(), 50);

    const hasProposal = await marketplaceInstance.hasSharePercentageProposal();
    assert.equal(hasProposal, true);

    await marketplaceInstance.acceptPartnerShareChange();

    const partnerPercentage = await marketplaceInstance.partnerSharePercentage();
    assert.equal(partnerPercentage.toNumber(), 50);
  });
};
