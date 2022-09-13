import { task, HardhatUserConfig } from "hardhat/config";
import { deployAllContracts, deployDVP, deployPOT, deployCMTAT, deployERC20} from "./scripts/deploy_contracts";
import { dvp_deactivateOldPot, dvp_readDeliveryExecuted, dvp_readSettlementCanceled, dvp_cancelSettlement, pot_confirmPayment, dvp_executeDelivery, erc20_balanceOfReceiver, dvp_readDeliveryConfirmed, erc20_readTransfer, pot_initiatePayment, pot_transfer, initializeCmtat, erc20_mint, erc20_balanceOfDvp, initializeDvp, mintAt, increaseAllowance, approve, readApproval, allowance, issuePaymentToken, dvp_checkDeliveryForPot, cmtat_name, erc20_name, erc20_allowance, erc20_getVersion, dvp_getVersion, dvp_setPotAddress, deactivatePot, pot_getVersion, pot_owner, pot_getStatus, erc20_increaseAllowance} from "./scripts/test_dvp_setup";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solpp";
import "hardhat-gas-reporter";
const { types } = require("hardhat/config");

//Tasks to deploy contracts
task("deploy_all_contracts", "Deploys DVP, POT and AT contract", async (taskArgs, hre) => {
  await deployAllContracts(hre);
});

task("deploy_dvp_contract", "Deploys DVP contract", async (taskArgs, hre) => {
  await deployDVP(hre);
});

task("deploy_cmtat_contract", "Deploys CMTAT contract", async (taskArgs, hre) => {
  await deployCMTAT(hre);
});

task("deploy_erc20_contract", "Deploys plain vanilla ERC 20 contract", async (taskArgs, hre) => {
  await deployERC20(hre);
});

task("deploy_pot_contract", "Deploys POT contract", async (taskArgs, hre) => {
  await deployPOT(hre);
});

//Tasks to call CMTA SC functions
task("cmtat_initialize", "Initialize CMTAT-Contract", async (taskArgs, hre) => {
  await initializeCmtat();
});

task("cmtat_mint", "Mint AT").addOptionalParam("num", "Number of AT to mint", 1, types.int).setAction(async ({num}) => {
  await mintAt(num);
});

task("cmtat_increaseAllowance", "Increase Allowance of AT for DvP SC", async (taskArgs, hre) => {
  await increaseAllowance();
});

task("cmtat_approve", "Set approval of AT for DvP SC", async (taskArgs, hre) => {
  await approve();
});

task("cmtat_read_approval_event", "Read all Approval Events", async (taskArgs, hre) => {
  await readApproval();
});

task("cmtat_allowance", "Read Allowance of DvP SC for Receiver", async (taskArgs, hre) => {
  await allowance();
});

task("cmtat_name", "Calls name function of CMTAT SC", async (taskArgs, hre) => {
  await cmtat_name();
});

//Tasks to call DvP SC functions
task("dvp_initialize", "Initialize DvP-Contract", async (taskArgs, hre) => {
  await initializeDvp();
});

task("dvp_getVersion", "Calls version function of DvP SC", async (taskArgs, hre) => {
  await dvp_getVersion();
});

task("dvp_setPotAddress", "Sets the address of teh POT SC", async (taskArgs, hre) => {
  await dvp_setPotAddress();
});

task("dvp_checkDeliveryForPot", "Executes checkDeliveryForPot function")
    .addParam("tokenid", "TokenId of POT to check delivery for", 1, types.int)
    .setAction(async (taskArgs) => {
  await dvp_checkDeliveryForPot(taskArgs.tokenid);
});

task("dvp_executeDelivery", "Executes executeDelivery function")
    .addParam("tokenid", "TokenId of POT to execute delivery for", 1, types.int)
    .setAction(async (taskArgs) => {
  await dvp_executeDelivery(taskArgs.tokenid);
});

task("dvp_cancelSettlement", "Executes cancelSettlement function")
    .addParam("tokenid", "TokenId of POT to cancel Settlement for", 1, types.int)
    .setAction(async (taskArgs) => {
  await dvp_cancelSettlement(taskArgs.tokenid);
});

task("dvp_deactivateOldPot", "Executes deactivateOldPot function")
    .addParam("tokenid", "TokenId of POT to deactivate", 1, types.int)
    .setAction(async (taskArgs) => {
  await dvp_deactivateOldPot(taskArgs.tokenid);
});


task("dvp_readDeliveryConfirmed", "Returns all DeliveryConfirmed events in the last 10 blocks", async (taskArgs, hre) => {
  await dvp_readDeliveryConfirmed();
});

task("dvp_readDeliveryExecuted", "Returns all DeliveryExecuted events in the last 10 blocks", async (taskArgs, hre) => {
  await dvp_readDeliveryExecuted();
});

task("dvp_readSettlementCanceled", "Returns all SettlementCanceled events in the last 10 blocks", async (taskArgs, hre) => {
  await dvp_readSettlementCanceled();
});

//Tasks to call POT SC functions
task("pot_issuePaymentToken", "Issue POT at DvP-SC-Address from sender to receiver")
    .addParam("num", "Number of AT to settle via POT", 5, types.int)
    .addParam("tokenid", "Token-Id of POT to mint", 1, types.int)
    .addParam("to", "Address to mint the POT to", "0", types.string)
    .setAction(async (taskArgs) => {
  await issuePaymentToken(taskArgs.num, taskArgs.tokenid, taskArgs.to);
});

task("pot_initiatePayment", "Iniate Payment for POT as sender")
    .addParam("tokenid", "Token-Id of POT", 1, types.int)
    .setAction(async (taskArgs) => {
  await pot_initiatePayment(taskArgs.tokenid);
});

task("pot_confirmPayment", "Confirm Payment for POT as sender")
    .addParam("tokenid", "Token-Id of POT", 1, types.int)
    .setAction(async (taskArgs) => {
  await pot_confirmPayment(taskArgs.tokenid);
});

task("pot_transfer", "Transfer POT from sender to DvP")
    .addParam("tokenid", "Token-Id of POT", 1, types.int)
    .setAction(async (taskArgs) => {
  await pot_transfer(taskArgs.tokenid);
});

task("pot_deactivatePot", "Deactivate POT").addOptionalParam("tokenId", "TokenId of POT to deactivate", 1, types.int).setAction(async ({tokenId}) => {
  await deactivatePot(tokenId);
});

task("pot_getStatus", "Get status of POT")
    .addParam("tokenid", "TokenId of POT", 1, types.int)
    .setAction(async (taskArgs) => {
        await pot_getStatus(taskArgs.tokenid);
});

task("pot_getVersion", "Calls version function of POT SC", async (taskArgs, hre) => {
  await pot_getVersion();
});

task("pot_owner", "Returns current owner of POT SC", async (taskArgs, hre) => {
  await pot_owner();
});

//Tasks to call ERC20 SC functions
task("erc20_name", "Calls name function of ERC20 SC", async (taskArgs, hre) => {
  await erc20_name();
});

task("erc20_getVersion", "Calls version function of DvP SC", async (taskArgs, hre) => {
  await erc20_getVersion();
});

task("erc20_increaseAllowance", "Increases the allowance of DvP for receiver AT by 5", async (taskArgs, hre) => {
  await erc20_increaseAllowance();
});

task("erc20_allowance", "Show allowance of DvP for receiver AT", async (taskArgs, hre) => {
  await erc20_allowance();
});

task("erc20_balanceOfDvp", "Show balance AT of DvP address", async (taskArgs, hre) => {
  await erc20_balanceOfDvp();
});

task("erc20_balanceOfReceiver", "Show balance AT of Receiver address", async (taskArgs, hre) => {
  await erc20_balanceOfReceiver();
});

task("erc20_mint", "Mint 5 AT as receiver address", async (taskArgs, hre) => {
  await erc20_mint();
});

task("erc20_readTransfer", "Returns all transfer events in the last 10 blocks", async (taskArgs, hre) => {
  await erc20_readTransfer();
});

const config: HardhatUserConfig = {
  solidity: "0.8.15",
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
