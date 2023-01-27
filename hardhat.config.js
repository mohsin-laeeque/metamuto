const { version } = require("chai");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-watcher");
require('hardhat-contract-sizer');
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const APIKEY = process.env.APIKEY;

module.exports = {
  defaultNetwork: "localhost",
  networks: {
    hardhat: {},
    polygon_mainnet: {
      url: "https://polygonapi.terminet.io/rpc",
      accounts: [PRIVATE_KEY]
    },
    polygon_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY]
    }
  },
  watcher: {
    compilation: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
    },
    ci: {
      tasks: ["clean", { command: "compile", params: { quiet: true } }, {
        command: "test",
        params: { noCompile: true, testFiles: ["testfile.ts"] }
      }],
    }
  },
  etherscan: {
    apiKey: APIKEY // polygon
    
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17"
     },
     {
        version: "0.8.9"
      },
      {
        version: "0.5.17",
      },
      {
        version: "0.6.0"
      }, 
    ],
    overrides: {
      "contracts/RecruitCoin.sol": {
        version: "0.8.17",
      },
      "contracts/RecruitCoinTest.sol": {
        version: "0.8.17",
      },
      "contracts/FaucetTokenDai.sol": {
        version: "0.5.17",
      },
      "contracts/FaucetTokenBUSD.sol": {
        version: "0.5.17",
      },
      "contracts/TUSDFaucet.sol": {
        version: "0.5.17",
      },
      "contracts/ERC20MockUSDT.sol": {
        version: "0.6.0",
      }

    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: { yul: false },
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 2000000
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  }
}