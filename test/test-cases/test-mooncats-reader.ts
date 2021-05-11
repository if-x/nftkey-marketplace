import { BMoonCatsReaderInstance } from "../../types/truffle-contracts";

const BMoonCatsReader = artifacts.require("BMoonCatsReader");

export const testBMoonCatsReader = async () => {
  let bmooncatsReaderInstance: BMoonCatsReaderInstance;

  before(async () => {
    bmooncatsReaderInstance = await BMoonCatsReader.deployed();
  });

  it("Read 1000 batches", async () => {
    const promises = [];

    for (let i = 0; i < 26; i++) {
      const getBatch = async () => {
        const startTime = Date.now();
        const batch = await bmooncatsReaderInstance.getCatOwners(
          i * 1000,
          1000
        );
        const endTime = Date.now();
        console.log("batch", i, batch.length, endTime - startTime);
      };

      promises.push(getBatch());
    }

    await Promise.all(promises);
  });
};
