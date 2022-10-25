//run npm install @types/node --save-dev for "require" to work
import { ContractFactory, Contract, BigNumber, ContractTransaction, ContractReceipt, ethers } from "ethers";
import { getAddresses } from "./config";

//require core modules
const fs = require("fs");
const path = require("path");

//define variables
const senderAddress: string = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"

//define provider
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
const signerSender = provider.getSigner(senderAddress)

let dvpContract: Contract

let addresses
let potAddress
let dvpAddress

async function main() {
    addresses = await getAddresses()
    if (addresses) {
        potAddress = addresses.pot
        dvpAddress = addresses.dvp
    }
}

/**
 * Creates a contract (i.e., an object to access a deployed contract).
 *
 * @param abiPath the path to the contract's ABI file
 * @param contractAddress the address at which the contract is deployed on the blockchain
 */
function createContract(abiPath: string, contractAddress: string) {
    const filename = path.resolve(
        __dirname, // __dirname is the directory containing the currently executing file
        "../build/cache/solpp-generated-contracts/" // solpp places the generated abi files here
         + abiPath)
    const file = fs.readFileSync(filename, "utf8")
    const json = JSON.parse(file)
    const abi = json.abi
    const contract = new ethers.Contract(contractAddress, abi, signerSender)
    return contract
}

// creates DvP once
function createDvP() {
    if (dvpContract == null) {
        dvpContract = createContract("DVP.sol/DVP.json", dvpAddress)
    }
    return dvpContract
}

// creates DvPv2 once
function createDvPv2() {
    if (dvpContract == null) {
        dvpContract = createContract("test/DVPv2.sol/DVPv2.json", dvpAddress)
    }
    return dvpContract
}

//
//DvP functions
//

//initializes DvP-Contract
export async function initializeDvp() {
    await createDvP().initialize(potAddress)
}

//calls getVersion
export async function dvp_getVersion() {
    return await createDvP().getVersion()
}

//calls owner function
export async function dvp_owner() {
    let owner = await createDvP().owner()
    console.log(owner)
}

//calls getFixFunction
export async function dvp_getFixFunction() {
    let response = await createDvPv2().getFixFunction()
    console.log(response)
}

//calls setPotAddress
export async function dvp_setPotAddress() {
    let address = await createDvP().setPotAddress(potAddress)
    console.log(address)
}

//calls getPotAddress
export async function dvp_getPotAddress() {
    return await createDvP().getPotAddress()
}

//calls checkDeliveryForPot
export async function dvp_checkDeliveryForPot(tokenId: number) {
    return await createDvP().checkDeliveryForPot(tokenId)
}

//calls executeDelivery
export async function dvp_executeDelivery(tokenId: number) {
    await createDvP().executeDelivery(tokenId)
}

//calls cancelSettlement
export async function dvp_cancelSettlement(tokenId: number) {
    await createDvP().cancelSettlement(tokenId)
}

//calls deactivateOldPot
export async function dvp_deactivateOldPot(tokenId: number) {
    await createDvP().deactivateOldPot(tokenId)
}

//reads and returns DeliveryConfirmed-Events
export async function dvp_readDeliveryConfirmed() {
    let transferDeliveryConfirmed = createDvP().filters.DeliveryConfirmed()
    let deliveryConfirmed = await createDvP().queryFilter(transferDeliveryConfirmed, -10)
    console.log(deliveryConfirmed)
}

//reads and returns DeliveryExecuted-Events
export async function dvp_readDeliveryExecuted() {
    let eventDeliveryExecuted = createDvP().filters.DeliveryExecuted()
    let deliveryExecuted = await createDvP().queryFilter(eventDeliveryExecuted, -10)
    console.log(deliveryExecuted)
}

//reads and returns SettlementCanceled-Events
export async function dvp_readSettlementCanceled() {
    let eventSettlementCanceled = createDvP().filters.SettlementCanceled()
    let settlementCanceled = await createDvP().queryFilter(eventSettlementCanceled, -10)
    console.log(settlementCanceled)
}

main()