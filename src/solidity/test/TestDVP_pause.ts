import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ContractFactory, Contract, BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import { Hex } from "web3/utils"

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

function storeName(contract: Contract, address: string, name: string) {
  contract.store(address, name + ' (' + address.toLowerCase() + ')')
}

describe("DVP Pauseability", function () {

  it("Tests that functions cannot be called if the DvP is paused.", async function () {
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
    await at.connect(receiver).increaseAllowance(dvp.address, 111)
    await at.mint(receiver.address, 7)

    let paused = await dvp.paused()
    console.log("[TEST] Is DVP initially paused? " + paused)

    console.log("[TEST] Pausing DVP")
    await dvp.pause()
    paused = await dvp.paused()
    console.log("Is DVP paused? " + paused)

    console.log("[TEST] Calling dvp.checkDeliveryForPot")
    await expect(dvp.checkDeliveryForPot(token1.tokenId)).to.be.revertedWith("Pausable: paused")
  })
})
