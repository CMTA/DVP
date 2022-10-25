import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractFactory, Contract, BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Hex } from "web3/utils";

/**
 * These variables are initialized in before() method
 */
let atFactory: ContractFactory
let potFactory: ContractFactory
let dvpFactory: ContractFactory
let sender: SignerWithAddress
let receiver: SignerWithAddress
let addrs: SignerWithAddress[]

/**
 * These variables are initialized in beforeEach() method
 */
let at: Contract
let pot: Contract
let dvp: Contract

/**
 * Interfaces to structure test data
 */
interface ATTestData {
  contractName: string,
  name: string,
  symbol: string
}

interface POTTestData {
  contractName: string,
  name: string,
  symbol: string,
  baseURI: string
}

interface DVPTestData {
  contractName: string
}

interface TokenTestData {
  tokenId: BigNumber,
  businessId: string
}

// Test data
let atTestData: ATTestData = { contractName: "AssetToken", name: "Asset Token", symbol: "AT" }
let potTestData: POTTestData = { contractName: "POT", name: "Payment Order Token", symbol: "POT", baseURI: "localhost" }
let dvpTestData: DVPTestData = { contractName: "DVP" }
const businessId1 = "Deal_1"
const businessId2 = "Deal_2"
// note: token1 and token3 have the same businessId, token2's is different
const token1: TokenTestData = { tokenId: BigNumber.from(1), businessId: businessId1 }
const token2: TokenTestData = { tokenId: BigNumber.from(2), businessId: businessId2 }
const token3: TokenTestData = { tokenId: BigNumber.from(3), businessId: businessId1 }

// Supported interfaces
const ERC_721: Hex = 0x80ac58cd
const ERC_721_Metadata: Hex = 0x5b5e139f

/**
 * Contract factory and test accounts have to be requested only once for all tests
 */
before(async function () {
  atFactory  = await ethers.getContractFactory(atTestData.contractName);
  potFactory = await ethers.getContractFactory(potTestData.contractName);
  dvpFactory = await ethers.getContractFactory(dvpTestData.contractName);
  [sender, receiver, ...addrs] = await ethers.getSigners();
})

/**
 * Deploy new contracts for each test
 */
beforeEach(async function () {
  at = await atFactory.deploy()
  await at.deployed()

  pot = await potFactory.deploy(potTestData.name, potTestData.symbol, potTestData.baseURI)
  await pot.deployed()

  dvp = await upgrades.deployProxy(dvpFactory, [pot.address], {
                      initializer: "initialize"})

  console.log("[TEST] beforeEach: deployed AT, POT and DVP")

  storeName(dvp, dvp.address, 'DVP')
  storeName(dvp, pot.address, 'POT')
  storeName(dvp, sender.address, 'Sender')
  storeName(dvp, receiver.address, 'Receiver')

  storeName(pot, dvp.address, 'DVP')
  storeName(pot, pot.address, 'POT')
  storeName(pot, sender.address, 'Sender')
  storeName(pot, receiver.address, 'Receiver')
})

function storeName(contract: Contract, address: string, name: string) {
  contract.store(address, name + ' (' + address.toLowerCase() + ')')
}

describe("DVP.executeDelivery", function () {

  it("Tests that after delivery, the POT is in state Deactivated and the ATs were transferred to the sender.", async function () {
    console.log("dvp.address      = " + dvp.address)
    console.log("sender.address   = " + sender.address)
    console.log("receiver.address = " + receiver.address)

    // the numbers of the steps refer to "Table 1: List of steps in greater setup" in Concept_Delivery_vs_Payment_Smart_Contract_CMTA_v1.2.pdf

    // (3), (4) Let POT contract mint a POT
    console.log("\n[TEST] Minting POT")
    await pot.issuePaymentToken(
        dvp.address, // to
        token1.tokenId,
        token1.businessId,
        3, // dealDetailNum, used as numAssetTokensForSettlement
        4, // dealDetailNum2, not used here
        at.address,
        "EUR",
        25,
        sender.address,
        receiver.address)
    // leads to (ERC721.sol): emit Transfer(address(0), to, tokenId);
    // this Event is caught by the DvP Manager, which then calls dvp.checkDeliveryForPot

    // Note: Calling approve [e.g. await at.connect(receiver).approve(dvp.address, 100);]
    // leads to TypeError: at.connect(...).approve is not a function
    // Instead, we call increaseAllowance(...), see function comment in ERC20Upgradeable.sol
    console.log("\n[TEST] at.increaseAllowance()")
    await at.connect(receiver).increaseAllowance(dvp.address, 111)

    // function mint(address to, uint256 amount) public {
    console.log("\n[TEST] Minting AT")
    await at.mint(receiver.address, 7)
    console.log("[TEST] Minted AT")

    // (5)
    await dvp.checkDeliveryForPot(token1.tokenId)

    // (10)
    // bring the pot into PaymentConfirmed status
    // this is normally triggered externally by SIC
    await pot.confirmPayment(token1.tokenId)

    let potStatus = await pot.getStatus(token1.tokenId)
    await expect(potStatus).to.equal(2)
    console.log("\n[TEST] state after pot.confirmPayment: " + await pot.statusToString(potStatus) + " (" + potStatus + ")")

    // (12)
    await dvp.executeDelivery(token1.tokenId)

    potStatus = await pot.getStatus(token1.tokenId)
    console.log("\n[TEST] POT state after dvp.cancelSettlement: " + await pot.statusToString(potStatus) + " (" + potStatus + ")")
    await expect(potStatus).to.equal(3) // 3 = Deactivated

    // now the Sender must own 3 ATs
    let senderBalance = await at.balanceOf(sender.address)
    console.log("senderBalance=" + senderBalance)
    await expect(senderBalance).to.equal(3)
  })

  it("Tests that after delivery, the DeliveryExecuted Event is emitted.", async function () {
    console.log("dvp.address      = " + dvp.address)
    console.log("sender.address   = " + sender.address)
    console.log("receiver.address = " + receiver.address)

    // the numbers of the steps refer to "Table 1: List of steps in greater setup" in Concept_Delivery_vs_Payment_Smart_Contract_CMTA_v1.2.pdf

    // (3), (4) Let POT contract mint a POT
    console.log("\n[TEST] Minting POT")
    await pot.issuePaymentToken(
        dvp.address, // to
        token1.tokenId,
        token1.businessId,
        3, // dealDetailNum, used as numAssetTokensForSettlement
        4, // dealDetailNum2, not used here
        at.address,
        "EUR",
        25,
        sender.address,
        receiver.address)

    console.log("\n[TEST] at.increaseAllowance()")
    await at.connect(receiver).increaseAllowance(dvp.address, 111)

    // function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    console.log("\n[TEST] Minting AT")
    await at.mint(receiver.address, 7)
    console.log("[TEST] Minted AT")

    // (5)
    await dvp.checkDeliveryForPot(token1.tokenId)

    // (10)
    // bring the pot into PaymentConfirmed status
    // this is normally triggered externally by SIC
    await pot.confirmPayment(token1.tokenId)

    const potStatus = await pot.getStatus(token1.tokenId)
    await expect(potStatus).to.equal(2)
    console.log("\n[TEST] state after pot.confirmPayment: " + await pot.statusToString(potStatus) + " (" + potStatus + ")")

    // (12)
    await expect(await dvp.executeDelivery(token1.tokenId)).to.emit(dvp, "DeliveryExecuted").withArgs(
        token1.tokenId,
        at.address,
        sender.address)
    console.log("\n[TEST] Detected DeliveryExecuted Event")
  })

  it("Tests that executeDelivery is only executed if the POT is in state 'Payment Confirmed'.", async function () {
    console.log("dvp.address      = " + dvp.address)
    console.log("sender.address   = " + sender.address)
    console.log("receiver.address = " + receiver.address)

    console.log("\n[TEST] Minting POT")
    await pot.issuePaymentToken(
        dvp.address, // to
        token1.tokenId,
        token1.businessId,
        2, // dealDetailNum, used as numAssetTokensForSettlement
        3, // dealDetailNum2, not used here
        at.address,
        "EUR",
        25,
        sender.address,
        receiver.address)
    // leads to (ERC721.sol): emit Transfer(address(0), to, tokenId);
    // this Event is caught by the DvP Manager, which then calls dvp.checkDeliveryForPot

    // this brings the pot into PaymentInitiated status
    await pot.initiatePayment(token1.tokenId)

    console.log("\n[TEST] Minting AT for DVP")
    await at.mint(dvp.address, 5)
    console.log("[TEST] Minted AT")

    const potStatus = await pot.getStatus(token1.tokenId)
    await expect(potStatus).to.equal(1)
    console.log("\n[TEST] state after pot.confirmPayment: " + await pot.statusToString(potStatus) + " (" + potStatus + ")")

    await expect(dvp.executeDelivery(token1.tokenId)).to.be.revertedWith("POT 1 does not have status 'Payment Confirmed'")
  })

  it("Tests that executeDelivery is only executed if the POT is in state 'Payment Confirmed'.", async function () {
    console.log("dvp.address      = " + dvp.address)
    console.log("sender.address   = " + sender.address)
    console.log("receiver.address = " + receiver.address)

    console.log("\n[TEST] Minting POT")
    await pot.issuePaymentToken(
        dvp.address, // to
        token1.tokenId,
        token1.businessId,
        2, // dealDetailNum, used as numAssetTokensForSettlement
        3, // dealDetailNum2, not used here
        at.address,
        "EUR",
        25,
        sender.address,
        receiver.address)
    // leads to (ERC721.sol): emit Transfer(address(0), to, tokenId);
    // this Event is caught by the DvP Manager, which then calls dvp.checkDeliveryForPot

    // this brings the pot into PaymentInitiated status
    await pot.initiatePayment(token1.tokenId)

    console.log("\n[TEST] Minting AT for DVP")
    await at.mint(dvp.address, 5)
    console.log("[TEST] Minted AT")

    const potStatus = await pot.getStatus(token1.tokenId)
    await expect(potStatus).to.equal(1)
    console.log("\n[TEST] state after pot.confirmPayment: " + await pot.statusToString(potStatus) + " (" + potStatus + ")")

    await expect(dvp.connect(receiver).executeDelivery(token1.tokenId)).to.be.revertedWith("POT 1 does not have status 'Payment Confirmed'.")
  })
})
