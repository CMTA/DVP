import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ContractFactory, Contract, BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import { Hex } from "web3/utils"
import { storeName } from "./TestDVP_common"

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
const atTestData: ATTestData = { contractName: "AssetToken", name: "Asset Token", symbol: "AT" }
const potTestData: POTTestData = { contractName: "POT", name: "Payment Order Token", symbol: "POT", baseURI: "localhost" }
const dvpTestData: DVPTestData = { contractName: "DVP" }
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
  atFactory  = await ethers.getContractFactory(atTestData.contractName)
  potFactory = await ethers.getContractFactory(potTestData.contractName)
  dvpFactory = await ethers.getContractFactory(dvpTestData.contractName);
  [sender, receiver, ...addrs] = await ethers.getSigners()
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

describe("DVP.checkDeliveryForPot", function () {

  it("Tests that checkDeliveryForPot is only executed if the POT is in Issued state.", async () => {
    await pot.issuePaymentToken(
      dvp.address, // to
      token1.tokenId,
      token1.businessId,
      2, // dealDetailNum
      3, // dealDetailNum2
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    await pot.deactivatePot(token1.tokenId) // sets POT state to Deactivated

    await expect(dvp.checkDeliveryForPot(token1.tokenId)).to.be.revertedWith("POT 1 does not have status 'Issued'.")
  })

  it("Tests that checkDeliveryForPot is only executed if the DvP is the owner of the POT.", async () => {
    await pot.issuePaymentToken(
      receiver.address, // to, not DvP
      token1.tokenId,
      token1.businessId,
      2, // dealDetailNum
      3, // dealDetailNum2
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    await expect(dvp.checkDeliveryForPot(token1.tokenId)).to.be.revertedWith("DvP is not owner of POT 1.")
  })

  it("Tests that checkDeliveryForPot is only executed with a sufficient allowance.", async () => {
    // (3), (4) Let POT contract mint a POT
    console.log("\n[TEST] Minting POT")
    await pot.issuePaymentToken(
      dvp.address, // to
      token1.tokenId,
      token1.businessId,
      2, // dealDetailNum
      3, // dealDetailNum2
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    // (5) No allowance was set, so there must be the following error
    await expect(dvp.checkDeliveryForPot(token1.tokenId)).to.be.revertedWith("Allowance 0 not sufficient to settle POT 1. Allowance of minimum 2 needed.")

    // set the allowance to 1
    await at.connect(receiver).increaseAllowance(dvp.address, 1)

    // still not enough
    await expect(dvp.checkDeliveryForPot(token1.tokenId)).to.be.revertedWith("Allowance 1 not sufficient to settle POT 1. Allowance of minimum 2 needed.")

    // increase the allowance to 3
    await at.connect(receiver).increaseAllowance(dvp.address, 2)

    // now, checkDeliveryForPot must succeed
    dvp.checkDeliveryForPot(token1.tokenId)
  })

  it("Tests that checkDeliveryForPot is only executed with a sufficient balance.", async () => {
    // (3), (4) Let POT contract mint a POT
    console.log("\n[TEST] Minting POT")
    await pot.issuePaymentToken(
      dvp.address, // to
      token1.tokenId,
      token1.businessId,
      10, // dealDetailNum = number of AssetTokens needed for settlement
      3, // dealDetailNum2
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    // increase the allowance to 2
    await at.connect(receiver).increaseAllowance(dvp.address, 20)

    await expect(dvp.checkDeliveryForPot(token1.tokenId)).to.be.revertedWith("Balance 0 of receiver not sufficient to settle POT 1. Balance of minimum 10 needed.")
  })

  it("Tests that the correct amount of ATs is transferred to the DVP.", async function () {
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
      2, // dealDetailNum, used as numAssetTokensForSettlement
      3, // dealDetailNum2, not used here
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    console.log("\n[TEST] at.increaseAllowance()")
    await at.connect(receiver).increaseAllowance(dvp.address, 111)

    console.log("\n[TEST] Minting AT")
    await at.mint(receiver.address, 7)
    console.log("[TEST] Minted AT")

    // (5)
    await dvp.checkDeliveryForPot(token1.tokenId)

    // now the DVP must own 2 ATs
    const dvpBalance = await at.balanceOf(dvp.address)
    expect(dvpBalance).to.equal(2)
  })

  it("Tests that the POT goes into PaymentConfirmed status.", async function () {
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
      2, // dealDetailNum, used as numAssetTokensForSettlement
      3, // dealDetailNum2, not used here
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    console.log("\n[TEST] at.increaseAllowance()")
    await at.connect(receiver).increaseAllowance(dvp.address, 111)

    console.log("\n[TEST] Minting AT")
    await at.mint(receiver.address, 7)
    console.log("[TEST] Minted AT")

    // (5)
    await dvp.checkDeliveryForPot(token1.tokenId)

    // now the DVP must own 2 ATs
    const dvpBalance = await at.balanceOf(dvp.address)
    expect(dvpBalance).to.equal(2)

    // (10) bring the pot into PaymentConfirmed status
    // this is normally triggered externally by SIC
    await pot.confirmPayment(token1.tokenId)

    const potStatus = await pot.getStatus(token1.tokenId)
    console.log("\n[TEST] POT state after pot.confirmPayment: " + await pot.statusToString(potStatus) + " (" + potStatus + ")")

    // the POT must now be in Status PaymentConfirmed (2)
    expect(potStatus).to.equal(2)
  })

  it("Tests that the DeliveryConfirmed Event is emitted.", async function () {
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
      2, // dealDetailNum, used as numAssetTokensForSettlement
      3, // dealDetailNum2, not used here
      at.address,
      "EUR",
      25,
      sender.address,
      receiver.address)

    console.log("\n[TEST] at.increaseAllowance()")
    await at.connect(receiver).increaseAllowance(dvp.address, 111)

    console.log("\n[TEST] Minting AT")
    await at.mint(receiver.address, 7)
    console.log("[TEST] Minted AT")

    // (5)
    await expect(await dvp.checkDeliveryForPot(token1.tokenId)).to.emit(dvp, "DeliveryConfirmed").withArgs(
      token1.tokenId,
      at.address)

    console.log("\n[TEST] Detected DeliveryConfirmed Event")
  })
})