import { expect } from "chai"
import { ethers, upgrades } from "hardhat"

describe("DVP Upgradeability", function () {

  it("Tests DVP Upgradeability.", async function () {

    const potFactory = await ethers.getContractFactory("POT")
    const dvpFactory = await ethers.getContractFactory("DVP")
    const dvp2Factory = await ethers.getContractFactory("DVPv2")

    const pot = await potFactory.deploy("Payment Order Token", "POT", "localhost")
    await pot.deployed()

    let dvp = await upgrades.deployProxy(dvpFactory, [pot.address])
    await dvp.deployed()
    dvp.initialize(pot.address)

    console.log("[TEST] deployed POT and DVP")

    let version = await dvp.getVersion()
    console.log(version)
    expect(version).to.equal('D2')

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
