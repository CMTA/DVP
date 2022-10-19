import { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, upgrades } from "hardhat";
import { ContractFactory, Contract } from "ethers";

describe("DVP Upgradeability", function () {

  it("Tests DVP Upgradeability.", async function () {

    let potFactory = await ethers.getContractFactory("POT")
    let dvpFactory = await ethers.getContractFactory("DVP")
    let dvp2Factory = await ethers.getContractFactory("DVPv2")

    let pot = await potFactory.deploy("Payment Order Token", "POT", "localhost")
    await pot.deployed()

    let dvp = await upgrades.deployProxy(dvpFactory, [pot.address])
    await dvp.deployed()
    dvp.initialize(pot.address)

    console.log("[TEST] deployed POT and DVP")

    let version = await dvp.getVersion()
    console.log(version)
    expect(version).to.equal('D1')

    // function must not be available
    expect(() => {
     dvp.getFixFunction()
    }).to.throw(TypeError)

    dvp = await upgrades.upgradeProxy(dvp.address, dvp2Factory)
    console.log("[TEST] Upgraded DVP")

    version = await dvp.getVersion()
    console.log(version)
    expect(version).to.equal('UPGRADED')

    const returnValue = await dvp.getFixFunction()
    expect(returnValue).to.equal('new function')

    // back to initial contract
    dvp = await upgrades.upgradeProxy(dvp.address, dvpFactory)
    console.log("[TEST] Downgraded DVP")

    version = await dvp.getVersion()
    console.log(version)
  })
})