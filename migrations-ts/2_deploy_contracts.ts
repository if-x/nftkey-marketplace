const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1");

type Network = "development" | "ropsten" | "main";

module.exports = async (
  deployer: Truffle.Deployer,
  network: Network
  // accounts: string[]
) => {
  console.log(network);
  await deployer.deploy(TestERC721);
  const erc721 = await TestERC721.deployed();

  await deployer.deploy(TestERC20);
  const erc20 = await TestERC20.deployed();

  await deployer.deploy(NFTKEYMarketPlaceV1, erc721.address, erc20.address);
  const marketplaceV1 = await NFTKEYMarketPlaceV1.deployed();

  console.log(
    `NFTKEYMarketPlaceV1 deployed at ${marketplaceV1.address} in network: ${network}.`
  );
};

export {};
