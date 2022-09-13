//run npm install @types/node --save-dev for "require" to work
import { ContractFactory, Contract, BigNumber, ContractTransaction, ContractReceipt, ethers } from "ethers";

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

//define contracts
const dvpAddress: string = "0xB349FB172D6D5f693b0aA1C6eEc4c61cFd6846f4"
let dvpContract: Contract

const potAddress: string = "0x5f8e26fAcC23FA4cbd87b8d9Dbbd33D5047abDE1"
let potContract: Contract

const cmtatAddress: string = "0x21a59654176f2689d12E828B77a783072CD26680"
let cmtatContract: Contract

const erc20Address: string = "0xaD888d0Ade988EbEe74B8D4F39BF29a8d0fe8A8D"
let erc20Contract: Contract

// creates a contract
function createContract(relPath: string, contractAddress: string) {
    const filename = path.resolve(__dirname, "../build/cache/solpp-generated-contracts/" + relPath)
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

// creates POT once
function createPOT() {
    if (potContract == null) {
        potContract = createContract("POT/POT.sol/POT.json", potAddress)
    }
    return potContract
}

// creates CMTAT once
function createCMTAT() {
    if (cmtatContract == null) {
        cmtatContract = createContract("CMTAT/CMTAT.sol/CMTAT.json", cmtatAddress)
    }
    return cmtatContract
}

// creates ERC20 once
function createERC20() {
    if (erc20Contract == null) {
        erc20Contract = createContract("ERC20/ERC20_plain.sol/AssetToken.json", erc20Address)
    }
    return erc20Contract
}

//CMTAT functions
//initializes CMTAT-Contract
export async function initializeCmtat() {
    await createCMTAT().initialize(receiverAddress, receiverAddress, "CMTA-Token", "CMTAT", "", "")
}

//mints CMTAT at receiver address
export async function mintAt(num: number) {
    await createCMTAT().mint(receiverAddress,num)
}

//sets approval for CMTAT for DvP SC
export async function increaseAllowance() {
    await createCMTAT().connect(signerReceiver).increaseAllowance(dvpAddress,5)
}

//sets approval for CMTAT for DvP SC
export async function approve() {
    await createCMTAT().connect(signerReceiver).approve(dvpAddress,5)
}

//reads and returns Approval-Events of CMTAT SC
export async function readApproval() {
    let approvalFilter = createCMTAT().filters.Approval()
    let approvals = await createCMTAT().queryFilter(approvalFilter)
    console.log(approvals)
}

//reads allowance for CMTAT for DvP SC
export async function allowance() {
    let allowance = await createCMTAT().allowance(senderAddress,dvpAddress)
    console.log(allowance.toNumber())
}

//call name function of CMTAT
export async function cmtat_name() {
    let name = await createCMTAT().name()
    console.log(name)
}

//DvP functions
//initializes DvP-Contract
export async function initializeDvp() {
    await createDvP().initialize(potAddress)
}

//call getVersion function of DvP
export async function dvp_getVersion() {
    let version = await createDvP().getVersion()
    console.log(version)
}

//call setPotAddress function of DvP
export async function dvp_setPotAddress() {
    let address = await createDvP().setPotAddress(potAddress)
    console.log(address)
}

//call checkDeliveryForPot
export async function dvp_checkDeliveryForPot(tokenId: number) {
    await createDvP().checkDeliveryForPot(tokenId)
}

//call executeDelivery
export async function dvp_executeDelivery(tokenId: number) {
    await createDvP().executeDelivery(tokenId)
}

//call cancelSettlement
export async function dvp_cancelSettlement(tokenId: number) {
    await createDvP().cancelSettlement(tokenId)
}

//call deactivateOldPot
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

//POT functions
//mints POT
export async function issuePaymentToken(amount: number, tokenId: number, to: string) {
    let pot = await createPOT().issuePaymentToken(to, tokenId, "TestID", amount, 0, erc20Address, "CHF", 100, senderAddress, receiverAddress)
    console.log(pot)
}

//call initiatePayment for POT as sender
export async function pot_initiatePayment(tokenId: number) {
    let pot = await createPOT().initiatePayment(tokenId)
    console.log(pot)
}

//call confirmPayment for POT as sender
export async function pot_confirmPayment(tokenId: number) {
    let pot = await createPOT().confirmPayment(tokenId)
    console.log(pot)
}

//transfer POT to DvP SC
export async function pot_transfer(tokenId: number) {
    let pot = await createPOT()['safeTransferFrom(address,address,uint256)'](senderAddress,dvpAddress,tokenId)
    console.log(pot)
}

//deactivate POT at DvP address
export async function deactivatePot(tokenId: BigNumber) {
    await createPOT().deactivatePot(tokenId)
}

//call getVersion function of POT
export async function pot_getVersion() {
    let version = await createPOT().getVersion()
    console.log(version)
}

//call owner function of POT
export async function pot_owner() {
    let owner = await createPOT().owner()
    console.log(owner)
}

//call getStatus function of POT
export async function pot_getStatus(tokenId: number) {
    let status = await createPOT().getStatus(tokenId)
    console.log(status)
}

//ERC20 functions
//call name function of ERC20
export async function erc20_name() {
    let name = await createERC20().name()
    console.log(name)
}

//call getVersion function of ERC20
export async function erc20_getVersion() {
    let version = await createERC20().getVersion()
    console.log(version)
}

//call balanceOf function of ERC20 for DvP
export async function erc20_balanceOfDvp() {
    let result = await createERC20().balanceOf(dvpAddress)
    console.log(result)
}

//call balanceOf function of ERC20 for Receiver
export async function erc20_balanceOfReceiver() {
    let result = await createERC20().balanceOf(receiverAddress)
    console.log(result)
}

//call mint function of ERC20
export async function erc20_mint() {
    await createERC20().mint(receiverAddress,5)
}

//call increaseAllowance function of ERC20
export async function erc20_increaseAllowance() {
    await createERC20().connect(signerReceiver).increaseAllowance(dvpAddress,5)
}

//call allowance function of ERC20
export async function erc20_allowance() {
    let result = await createERC20().allowance(receiverAddress, dvpAddress)
    console.log(result)
}

//reads and returns Transfer-Events of ERC20 SC
export async function erc20_readTransfer() {
    let transferFilter = createERC20().filters.Transfer()
    let transfers = await createERC20().queryFilter(transferFilter, -10)
    console.log(transfers)
}