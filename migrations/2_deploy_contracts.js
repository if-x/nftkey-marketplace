"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1_1 = artifacts.require("NFTKEYMarketPlaceV1_1");
module.exports = async (deployer, network
// accounts: string[]
) => {
    console.log(network);
    if (network === "development") {
        await deployer.deploy(TestERC721);
        const erc721 = await TestERC721.deployed();
        console.log(`TestERC721 deployed at ${erc721.address} in network: ${network}.`);
        await deployer.deploy(TestERC20);
        const erc20 = await TestERC20.deployed();
        console.log(`TestERC20 deployed at ${erc20.address} in network: ${network}.`);
        await deployer.deploy(NFTKEYMarketPlaceV1_1, "Test ERC721", erc721.address, erc20.address);
        const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
        console.log(`NFTKEYMarketPlaceV1_1 deployed at ${marketplaceV1.address} in network: ${network}.`);
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
        await deployer.deploy(NFTKEYMarketPlaceV1_1, "Waifusion", "0x2216d47494E516d8206B70FCa8585820eD3C4946", // Waifusion
        "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // WBNB
        );
        const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
        console.log(`NFTKEYMarketPlaceV1_1 for Waifusion deployed at ${marketplaceV1.address} in network: ${network}.`);
    }
    if (network === "ropsten") {
        // await deployer.deploy(
        //   NFTKEYMarketPlaceV1_1,
        //   "Life",
        //   "0x32d8021324af928F864C23b7912C8c3F11cC4Cdc", // Life Ropsten
        //   "0xc778417E063141139Fce010982780140Aa0cD5Ab" // WETH Ropsten
        // );
        // const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
        // console.log(
        //   `NFTKEYMarketPlaceV1_1 for Life deployed at ${marketplaceV1.address} in network: ${network}.`
        // );
    }
    if (network === "main") {
        // await deployer.deploy(
        //   NFTKEYMarketPlaceV1_1,
        //   "Pixls",
        //   "0x082903f4e94c5e10A2B116a4284940a36AFAEd63", // Pixls
        //   "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" // WETH
        // );
        // const marketplaceV1 = await NFTKEYMarketPlaceV1_1.deployed();
        // console.log(
        //   `NFTKEYMarketPlaceV1_1 for Pixls deployed at ${marketplaceV1.address} in network: ${network}.`
        // );
    }
};
