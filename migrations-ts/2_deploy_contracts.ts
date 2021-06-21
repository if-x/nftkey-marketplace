const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1_1 = artifacts.require("NFTKEYMarketPlaceV1_1");
const MarketPlaceReader = artifacts.require("MarketPlaceReader");

type Network = "development" | "ropsten" | "main" | "bsctestnet" | "bsc";

module.exports = async (
  deployer: Truffle.Deployer,
  network: Network
  // accounts: string[]
) => {
  console.log(network);

  // await deployer.deploy(MarketPlaceReader);
  // const marketPlaceReader = await MarketPlaceReader.deployed();

  // console.log(
  //   `MarketPlaceReader deployed at ${marketPlaceReader.address} in network: ${network}.`
  // );

  if (network === "development") {
    await deployer.deploy(TestERC721);
    const erc721 = await TestERC721.deployed();

    console.log(
      `TestERC721 deployed at ${erc721.address} in network: ${network}.`
    );

    await deployer.deploy(TestERC20);
    const erc20 = await TestERC20.deployed();

    console.log(
      `TestERC20 deployed at ${erc20.address} in network: ${network}.`
    );

    await deployer.deploy(
      NFTKEYMarketPlaceV1_1,
      "Test ERC721",
      erc721.address,
      erc20.address
    );
    const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();

    console.log(
      `NFTKEYMarketPlaceV1_1 deployed at ${marketplaceV1.address} in network: ${network}.`
    );
  }

  if (network === "bsctestnet") {
    // await deployer.deploy(
    //   NFTKEYMarketPlaceV1_1,
    //   "Life",
    //   "0x58BC78f17059Bd09561dB4D6b18eEBBfE1De555a", // Life
    //   "0xae13d989dac2f0debff460ac112a837c89baa7cd" // WBNB Testnet
    // );
    // const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
    // console.log(
    //   `NFTKEYMarketPlaceV1_1 for Life deployed at ${marketplaceV1.address} in network: ${network}.`
    // );
  }

  if (network === "bsc") {
    // await deployer.deploy(
    //   NFTKEYMarketPlaceV1_1,
    //   "ApeStrong Covid Relief",
    //   "0x77A88d5Ae4239e0b1A2A748F630d4b37ad35d038", // ApeStrong
    //   "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // WBNB
    // );
    // const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
    // console.log(
    //   `NFTKEYMarketPlaceV1_1 for ApeStrong Covid Relief deployed at ${marketplaceV1.address} in network: ${network}.`
    // );
  }

  if (network === "ropsten") {
    await deployer.deploy(
      NFTKEYMarketPlaceV1_1,
      "Spunks",
      "0xca7707c8478A1C0dF8De48F38217Acd6D1Ea5202", // Spunks Ropsten
      "0xc778417E063141139Fce010982780140Aa0cD5Ab" // WETH Ropsten
    );
    const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
    console.log(
      `NFTKEYMarketPlaceV1_1 for Spunks deployed at ${marketplaceV1.address} in network: ${network}.`
    );
  }

  if (network === "main") {
    await deployer.deploy(
      NFTKEYMarketPlaceV1_1,
      "Spunks",
      "0x9a604220d37b69c09eFfCcd2E8475740773E3DaF", // Spunks
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" // WETH
    );
    const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
    console.log(
      `NFTKEYMarketPlaceV1_1 for Spunks deployed at ${marketplaceV1.address} in network: ${network}.`
    );
  }
};

export {};
