import { task, HardhatUserConfig } from "hardhat/config";
import { deployDVP, upgradeDVPtoV2 } from "./scripts/deploy_contracts";
import { getInfo, dvp_deactivateOldPot, dvp_readDeliveryExecuted, dvp_readSettlementCanceled, dvp_cancelSettlement } from "./scripts/test_dvp_setup";
import { dvp_executeDelivery, dvp_readDeliveryConfirmed, dvp_getVersion, dvp_owner, dvp_getFixFunction } from "./scripts/test_dvp_setup";
import { dvp_getPotAddress, dvp_setPotAddress, dvp_checkDeliveryForPot, initializeDvp } from "./scripts/test_dvp_setup";
import { erc20_balanceOfSender, erc20_balanceOfReceiver, erc20_readTransfer, erc20_mint, erc20_balanceOfDvP } from "./scripts/test_dvp_setup";
import { erc20_transfer, erc20_name, erc20_allowance, erc20_getVersion, erc20_increaseAllowance } from "./scripts/test_dvp_setup";
import { pot_getBaseURI, pot_ownerOf, pot_initiatePayment, pot_confirmPayment, pot_transfer, pot_getBusinessId, pot_getCurrency, pot_getAmount, pot_getSender, pot_getReceiver, pot_getMintTime, pot_getVersion, pot_getDealDetailNum2, pot_getDealDetailNum, pot_getDealDetailAddress, pot_owner, pot_getStatus, deactivatePot } from "./scripts/test_dvp_setup";
import { issuePaymentToken } from "./scripts/test_dvp_setup";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solpp";
import "hardhat-gas-reporter";
import '@openzeppelin/hardhat-upgrades';
import "@nomiclabs/hardhat-etherscan";


const { types } = require("hardhat/config")

task("get_info", "Gets addresses of all contracts", async (taskArgs, hre) => {
  console.log(await getInfo())
})

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

//Tasks to call POT SC functions
task("pot_issuePaymentToken", "Issues POT at DvP-SC-Address from sender to receiver")
    .addParam("num", "Number of AT to settle via POT", 5, types.int)
    .addParam("tokenid", "Token-Id of POT to mint", 1, types.string)
    .addParam("to", "Address to mint the POT to", "0", types.string)
    .setAction(async (taskArgs) => {
  await issuePaymentToken(taskArgs.num, taskArgs.tokenid, taskArgs.to)
})

task("pot_initiatePayment", "Initiates Payment for POT as sender")
    .addParam("tokenid", "Token-Id of POT", 1, types.string)
    .setAction(async (taskArgs) => {
  await pot_initiatePayment(taskArgs.tokenid)
})

task("pot_confirmPayment", "Confirms Payment for POT as sender")
    .addParam("tokenid", "Token-Id of POT", 1, types.string)
    .setAction(async (taskArgs) => {
  await pot_confirmPayment(taskArgs.tokenid)
})

task("pot_transfer", "Transfers POT from sender to DvP")
    .addParam("tokenid", "Token-Id of POT", 1, types.string)
    .setAction(async (taskArgs) => {
  await pot_transfer(taskArgs.tokenid)
})

task("pot_deactivatePot", "Deactivates POT")
  .addParam("tokenid", "TokenId of POT to deactivate", 1, types.string)
  .setAction(async ({tokenid}) => {
  await deactivatePot(tokenid)
})

task("pot_getStatus", "Gets status of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getStatus(taskArgs.tokenid)
})

task("pot_getVersion", "Calls version function of POT SC", async (taskArgs, hre) => {
  console.log(await pot_getVersion())
})

task("pot_getBaseURI", "Gets Base-URI POT SC", async (taskArgs, hre) => {
  console.log(await pot_getBaseURI())
})

task("pot_getDealDetailNum2", "Gets DealDetailNum2 of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getDealDetailNum2(taskArgs.tokenid)
})

task("pot_getDealDetailNum", "Gets DealDetailNum of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getDealDetailNum(taskArgs.tokenid)
})

task("pot_getDealDetailAddress", "Gets DealDetailAddress of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getDealDetailAddress(taskArgs.tokenid)
})

task("pot_getMintTime", "Gets MintTime of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getMintTime(taskArgs.tokenid)
})

task("pot_getReceiver", "Gets Receiver of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getReceiver(taskArgs.tokenid)
})

task("pot_getSender", "Gets Sender of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getSender(taskArgs.tokenid)
})

task("pot_getAmount", "Gets Amount of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getAmount(taskArgs.tokenid)
})

task("pot_getCurrency", "Gets Currency of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getCurrency(taskArgs.tokenid)
})

task("pot_getBusinessId", "Gets Business-ID of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_getBusinessId(taskArgs.tokenid)
})

task("pot_ownerOf", "returns current owner of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.string)
    .setAction(async (taskArgs) => {
        await pot_ownerOf(taskArgs.tokenid)
})

task("pot_owner", "Returns current owner of POT SC", async (taskArgs, hre) => {
  await pot_owner()
})

//Tasks to call ERC20 SC functions
task("erc20_name", "Calls name function of ERC20 SC", async (taskArgs, hre) => {
  await erc20_name()
})

task("erc20_getVersion", "Calls version function of DvP SC", async (taskArgs, hre) => {
  await erc20_getVersion()
})

task("erc20_increaseAllowance", "Increases the allowance of DvP for receiver AT by 5", async (taskArgs, hre) => {
  await erc20_increaseAllowance()
})

task("erc20_allowance", "Shows allowance of DvP for receiver AT", async (taskArgs, hre) => {
  await erc20_allowance()
})

task("erc20_balanceOfDvP", "Shows balance AT of DvP address", async (taskArgs, hre) => {
  await erc20_balanceOfDvP()
})

task("erc20_balanceOfReceiver", "Shows balance AT of Receiver address", async (taskArgs, hre) => {
  await erc20_balanceOfReceiver()
})

task("erc20_balanceOfSender", "Shows balance AT of Sender address", async (taskArgs, hre) => {
  await erc20_balanceOfSender()
})

task("erc20_mint", "Mints 5 AT as receiver address", async (taskArgs, hre) => {
  await erc20_mint()
})

task("erc20_transfer", "Transfer 2 Token to other address")
    .addParam("toaddress", "Address to transfer 2 token to", "", types.string)
    .setAction(async (taskArgs) => {
        await erc20_transfer(taskArgs.toaddress)
})

task("erc20_readTransfer", "Returns all transfer events in the last 10 blocks", async (taskArgs, hre) => {
  await erc20_readTransfer()
})

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
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
  }
};

export default config;
