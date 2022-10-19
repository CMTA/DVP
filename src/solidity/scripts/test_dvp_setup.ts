//run npm install @types/node --save-dev for "require" to work
import { ContractFactory, Contract, BigNumber, ContractTransaction, ContractReceipt, ethers } from "ethers";
import { getAddresses } from "./config";

//require core modules
const fs = require("fs");
const path = require("path");

//define variables
const senderAddress: string = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
const receiverAddress: string = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"
const potTokenId: BigNumber = BigNumber.from("25508521003322753386496418337090822004")

//define provider
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
const signerSender = provider.getSigner(senderAddress)
const signerReceiver = provider.getSigner(receiverAddress)

let potContract: Contract
let dvpContract: Contract
let erc20Contract: Contract

let addresses
let potAddress
let dvpAddress
let erc20Address

async function main() {
    addresses = await getAddresses()
    if (addresses) {
        potAddress = addresses.pot
        dvpAddress = addresses.dvp
        erc20Address = addresses.erc20
    }
}

export async function getInfo() {
    let potVersion = await pot_getVersion()
    let dvpVersion = await dvp_getVersion()
    return {pot: potAddress,
            potVersion: potVersion,
            dvp: dvpAddress,
            dvpVersion: dvpVersion,
            potUsedByDvP: await createDvP().getPotAddress(),
            erc20: erc20Address}
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
        dvpContract = createContract("DVPv2.sol/DVPv2.json", dvpAddress)
    }
    return dvpContract
}

// creates POT once
function createPOT() {
    if (potContract == null) {
        potContract = createContract("POT/POT.sol/POT.json", potAddress)
    }
    return potContract
}

// creates ERC20 once
function createERC20() {
    if (erc20Contract == null) {
        erc20Contract = createContract("ERC20/ERC20_plain.sol/AssetToken.json", erc20Address)
    }
    return erc20Contract
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


//
//POT functions
//

//mints POT
export async function issuePaymentToken(amount: number, tokenId: number, to: string) {
    let pot = await createPOT().issuePaymentToken(to, tokenId, "TestID", amount, 0, erc20Address, "CHF", 100, senderAddress, receiverAddress)
    console.log(pot)
}

//calls initiatePayment for POT as sender
export async function pot_initiatePayment(tokenId: number) {
    let pot = await createPOT().initiatePayment(tokenId)
    console.log(pot)
}

//calls confirmPayment for POT as sender
export async function pot_confirmPayment(tokenId: number) {
    let pot = await createPOT().confirmPayment(tokenId)
    console.log(pot)
}

//transfers POT to DvP SC
export async function pot_transfer(tokenId: number) {
    let pot = await createPOT()['safeTransferFrom(address,address,uint256)'](senderAddress,dvpAddress,tokenId)
    console.log(pot)
}

//deactivates POT at DvP address
export async function deactivatePot(tokenId: BigNumber) {
    await createPOT().deactivatePot(tokenId)
}

//calls getVersion
export async function pot_getVersion() {
    return await createPOT().getVersion()
}

//calls getBaseURI
export async function pot_getBaseURI() {
    return await createPOT().getBaseURI()
}

//calls getDealDetailNum
export async function pot_getDealDetailNum(tokenId: BigNumber) {
    let dealDetailNum = await createPOT().getDealDetailNum(tokenId)
    console.log(dealDetailNum)
}

//calls getDealDetailNum2
export async function pot_getDealDetailNum2(tokenId: BigNumber) {
    let dealDetailNum2 = await createPOT().getDealDetailNum2(tokenId)
    console.log(dealDetailNum2)
}

//calls getDealDetailAddress
export async function pot_getDealDetailAddress(tokenId: BigNumber) {
    let dealDetailAddress = await createPOT().getDealDetailAddress(tokenId)
    console.log(dealDetailAddress)
}

//calls owner function of POT
export async function pot_owner() {
    let owner = await createPOT().owner()
    console.log(owner)
}

//calls getStatus
export async function pot_getStatus(tokenId: BigNumber) {
    let status = await createPOT().getStatus(tokenId)
    console.log(status)
}

//calls getMintTime
export async function pot_getMintTime(tokenId: BigNumber) {
    let mintTime = await createPOT().getMintTime(tokenId)
    console.log(mintTime)
}

//calls getReceiver
export async function pot_getReceiver(tokenId: BigNumber) {
    let receiver = await createPOT().getReceiver(tokenId)
    console.log(receiver)
}

//calls getSender
export async function pot_getSender(tokenId: BigNumber) {
    let sender = await createPOT().getSender(tokenId)
    console.log(sender)
}

//calls getAmount
export async function pot_getAmount(tokenId: BigNumber) {
    let amount = await createPOT().getAmount(tokenId)
    console.log(amount)
}

//calls getCurrency
export async function pot_getCurrency(tokenId: BigNumber) {
    let currency = await createPOT().getCurrency(tokenId)
    console.log(currency)
}

//calls getBusinessId
export async function pot_getBusinessId(tokenId: BigNumber) {
    let businessId = await createPOT().getBusinessId(tokenId)
    console.log(businessId)
}

//calls getBusinessId
export async function pot_ownerOf(tokenId: BigNumber) {
    let owner = await createPOT().ownerOf(tokenId)
    console.log(owner)
}

//
//ERC20 functions
//

//calls name function of ERC20
export async function erc20_name() {
    let name = await createERC20().name()
    console.log(name)
}

//calls getVersion
export async function erc20_getVersion() {
    let version = await createERC20().getVersion()
    console.log(version)
}

//calls balanceOf function of ERC20 for DvP
export async function erc20_balanceOfDvP() {
    let balanceBigNum = await createERC20().balanceOf(dvpAddress)
    console.log(balanceBigNum.toNumber())
}

//calls balanceOf function of ERC20 for Receiver
export async function erc20_balanceOfReceiver() {
    let balanceBigNum = await createERC20().balanceOf(receiverAddress)
    console.log(balanceBigNum.toNumber())
}

//calls balanceOf function of ERC20 for Sender
export async function erc20_balanceOfSender() {
    let balanceBigNum = await createERC20().balanceOf(senderAddress)
    console.log(balanceBigNum.toNumber())
}

//calls mint function
export async function erc20_mint() {
    await createERC20().mint(receiverAddress,5)
}

//calls increaseAllowance
export async function erc20_increaseAllowance() {
    await createERC20().connect(signerReceiver).increaseAllowance(dvpAddress, 5)
}

//calls allowance
export async function erc20_allowance() {
    let allowanceBigNum = await createERC20().allowance(receiverAddress, dvpAddress)
    console.log(allowanceBigNum.toNumber())
}

export async function erc20_transfer(toaddress: String) {
    await createERC20().transfer(toaddress, 2)
}

//reads and returns Transfer-Events of ERC20
export async function erc20_readTransfer() {
    let transferFilter = createERC20().filters.Transfer()
    let transfers = await createERC20().queryFilter(transferFilter, -10)
    console.log(transfers)
}


main()