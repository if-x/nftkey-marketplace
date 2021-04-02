"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TestERC20 = artifacts.require("TestERC20");
const TestERC721 = artifacts.require("TestERC721");
const NFTKEYMarketPlaceV1 = artifacts.require("NFTKEYMarketPlaceV1");
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
        await deployer.deploy(NFTKEYMarketPlaceV1, "Test ERC721", erc721.address, erc20.address);
        const marketplaceV1 = await NFTKEYMarketPlaceV1.deployed();
        console.log(`NFTKEYMarketPlaceV1 deployed at ${marketplaceV1.address} in network: ${network}.`);
    }
    if (network === "bsc") {
        await deployer.deploy(NFTKEYMarketPlaceV1, "BMoonCats", "0x7CfAa5ca534afcd3a98509c9b8652ad0C1C2B3d8", // BMoonCats
        "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // WBNB
        );
        const marketplaceV1 = await NFTKEYMarketPlaceV1.deployed();
        console.log(`NFTKEYMarketPlaceV1 for BMoonCats deployed at ${marketplaceV1.address} in network: ${network}.`);
    }
};
