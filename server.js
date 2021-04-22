const ganache = require("ganache-cli");
const dotenv = require("dotenv");

dotenv.config();
const mnemonic = process.env.MNEUMONIC;
const infuraKey = process.env.INFURA_PROJECT_ID;

const server = ganache.server({
  fork: `https://mainnet.infura.io/v3/${infuraKey}`,
  mnemonic,
  ws: false,
});

server.listen("7545", function () {
  console.log("Server started at: localhost:7545");
});
