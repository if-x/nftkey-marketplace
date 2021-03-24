const Life = artifacts.require("Life");

type Network = "development" | "ropsten" | "main";

module.exports = async (
  deployer: Truffle.Deployer,
  network: Network
  // accounts: string[]
) => {
  console.log(network);

  await deployer.deploy(Life, "Life NFT", "BIO");

  const life = await Life.deployed();
  console.log(`Life NFT deployed at ${life.address} in network: ${network}.`);
};

export {};
