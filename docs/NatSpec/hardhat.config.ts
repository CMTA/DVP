import { task, HardhatUserConfig } from "hardhat/config";
import { deployDVP, upgradeDVPtoV2 } from "./scripts/deploy_contracts";
import { dvp_deactivateOldPot, dvp_readDeliveryExecuted, dvp_readSettlementCanceled, dvp_cancelSettlement } from "./scripts/test_dvp_setup";
import { dvp_executeDelivery, dvp_readDeliveryConfirmed, dvp_getVersion, dvp_owner, dvp_getFixFunction } from "./scripts/test_dvp_setup";
import { dvp_getPotAddress, dvp_setPotAddress, dvp_checkDeliveryForPot, initializeDvp } from "./scripts/test_dvp_setup";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solpp";
import "hardhat-gas-reporter";
import '@openzeppelin/hardhat-upgrades';
import "@nomiclabs/hardhat-etherscan";
require('hardhat-docgen');

const { types } = require("hardhat/config")

//Task to manually deploy and upgrade DvP-Contract
task("deploy_dvp_contract", "Deploys DVP contract")
    .addParam("potaddress", "Address of POT contract", "", types.string)
    .setAction(async (taskArgs, hre) => {
  await deployDVP(hre, true, taskArgs.potaddress)
})

task("dvp_upgrade_contract", "Upgrades DVP contract", async (taskArgs, hre) => {
  await upgradeDVPtoV2(hre)
})

//Tasks to call DvP SC functions
task("dvp_initialize", "Initializes DvP-Contract", async (taskArgs, hre) => {
  await initializeDvp()
})

task("dvp_getVersion", "Calls version function of DvP SC", async (taskArgs, hre) => {
  console.log(await dvp_getVersion())
})

task("dvp_getOwner", "Gets owner of DvP SC", async (taskArgs, hre) => {
  await dvp_owner()
})

task("dvp_getFixFunction", "Calls getFixFunction function of DvPv2 SC", async (taskArgs, hre) => {
  await dvp_getFixFunction()
})

task("dvp_setPotAddress", "Sets the address of POT SC", async (taskArgs, hre) => {
  await dvp_setPotAddress()
})

task("dvp_getPotAddress", "Gets the address of POT SC", async (taskArgs, hre) => {
  console.log(await dvp_getPotAddress())
})

task("dvp_checkDeliveryForPot", "Executes checkDeliveryForPot function")
    .addParam("tokenid", "TokenId of POT to check delivery for", 1, types.string)
    .setAction(async (taskArgs) => {
  console.log(await dvp_checkDeliveryForPot(taskArgs.tokenid))
})

task("dvp_executeDelivery", "Executes executeDelivery function")
    .addParam("tokenid", "TokenId of POT to execute delivery for", 1, types.string)
    .setAction(async (taskArgs) => {
  await dvp_executeDelivery(taskArgs.tokenid)
})

task("dvp_cancelSettlement", "Executes cancelSettlement function")
    .addParam("tokenid", "TokenId of POT to cancel Settlement for", 1, types.int)
    .setAction(async (taskArgs) => {
  await dvp_cancelSettlement(taskArgs.tokenid)
})

task("dvp_deactivateOldPot", "Executes deactivateOldPot function")
    .addParam("tokenid", "TokenId of POT to deactivate", 1, types.int)
    .setAction(async (taskArgs) => {
  await dvp_deactivateOldPot(taskArgs.tokenid)
})

task("dvp_readDeliveryConfirmed", "Returns all DeliveryConfirmed events in the last 10 blocks", async (taskArgs, hre) => {
  await dvp_readDeliveryConfirmed()
})

task("dvp_readDeliveryExecuted", "Returns all DeliveryExecuted events in the last 10 blocks", async (taskArgs, hre) => {
  await dvp_readDeliveryExecuted()
})

task("dvp_readSettlementCanceled", "Returns all SettlementCanceled events in the last 10 blocks", async (taskArgs, hre) => {
  await dvp_readSettlementCanceled()
})

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
        details: { yul: true },
      },
    },
  },
  paths: {
      artifacts: "./build",
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 1337
    }
  },
  solpp: {
    noPreprocessor: false
  },
  //Doku for configuration at https://github.com/cgewecke/hardhat-gas-reporter
  gasReporter: {
    enabled: false, // set to true for gas report
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  }
};

export default config;
