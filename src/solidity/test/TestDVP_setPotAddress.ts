import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ContractFactory, Contract } from "ethers"
import { ethers, upgrades } from "hardhat"
import { storeName } from "./TestDVP_common"

/**
 * These variables are initialized in before() method
 */
let atFactory: ContractFactory
let potFactory: ContractFactory
let dvpFactory: ContractFactory
let sender: SignerWithAddress
let receiver: SignerWithAddress

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

// Test data
const atTestData: ATTestData = { contractName: "AssetToken", name: "Asset Token", symbol: "AT" }
const potTestData: POTTestData = { contractName: "POT", name: "Payment Order Token", symbol: "POT", baseURI: "localhost" }
const dvpTestData: DVPTestData = { contractName: "DVP" }

/**
 * Contract factory and test accounts have to be requested only once for all tests
 */
before(async function () {
  atFactory  = await ethers.getContractFactory(atTestData.contractName)
  potFactory = await ethers.getContractFactory(potTestData.contractName)
  dvpFactory = await ethers.getContractFactory(dvpTestData.contractName);
  [sender, receiver] = await ethers.getSigners()
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

describe("DVP.setPotAddress", function () {

  it("Tests that the DvP was initialized with the POT address.", async function () {
    console.log("dvp.address = " + dvp.address)
    console.log("pot.address = " + pot.address)

    const address = await dvp.getPotAddress()
    expect(address).to.be.eq(pot.address)
  })

  it("Tests that the address can be set and get.", async function () {
    console.log("dvp.address = " + dvp.address)
    console.log("pot.address = " + pot.address)

    await dvp.setPotAddress(sender.address) // just a valid address
    const address = await dvp.getPotAddress()

    expect(address).to.be.eq(sender.address)
  })

  it("Tests that a caller other than the DvP cannot call setPotAddress.", async function () {
    await expect(dvp.connect(receiver).setPotAddress(sender.address)).to.be.revertedWith("Ownable: caller is not the owner")
  })
})