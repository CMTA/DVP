import { ContractFactory, Contract } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from 'fs';
import { hrtime } from "process";

/**
 * Deploys DVP, POT and AT (CMTAT or ERC20) to the network configured via hardhat
 * @param hre
 */
export async function deployAllContracts(hre: HardhatRuntimeEnvironment) {
    let dvp = await deployDVP(hre)
    let pot = await deployPOT(hre)
    let cmtat = await deployCMTAT(hre)
    let erc20 = await deployERC20(hre)

    // Write contract addresses into JSON file.
    // Can be used to determine contract addresses used during deployment via gitlab-ci
    fs.writeFileSync(
        "./build/contracts.json",
        JSON.stringify({dvp: dvp.address, pot: pot.address, cmtat: cmtat.address, erc20: erc20.address}, null, 4))
}

async function deployContract(hre: HardhatRuntimeEnvironment, contractName: string, name: string, ...args: Array<any>) {
    let contractFactory: ContractFactory = await hre.ethers.getContractFactory(contractName)
    let contract = await contractFactory.deploy(...args)
    await contract.deployed()

    console.log("Deployed " + name + " contract into " + hre.network.name + " network at address " + contract.address)
    return contract
}

/**
 * Deploys DVP-Contract to the network configured via hardhat
 * @param hre
 */
export async function deployDVP(hre: HardhatRuntimeEnvironment) {
    return await deployContract(hre, "cache/solpp-generated-contracts/DVP.sol:DVP", "  DVP")
}

/**
 * Deploys POT-Contract to the network configured via hardhat
 * @param hre
 */
export async function deployPOT(hre: HardhatRuntimeEnvironment) {
    // the variable argument must match the contract's constructor parameters
    return await deployContract(hre, "cache/solpp-generated-contracts/POT/POT.sol:POT", "  POT",
        /*name*/ "Payment Order Token", /*symbol*/ "POT", /*baseUri*/ "http://localhost:8082/pot-metadata")
}

/**
 * Deploys CMTAT-Contract to the network configured via hardhat
 * @param hre
 */
export async function deployCMTAT(hre: HardhatRuntimeEnvironment) {
    return await deployContract(hre, "cache/solpp-generated-contracts/CMTAT/CMTAT.sol:CMTAT", "CMTAT")
}

/**
 * Deploys Plain-Vanilla-ERC20-Contract to the network configured via hardhat
 * @param hre
 */
export async function deployERC20(hre: HardhatRuntimeEnvironment) {
    return await deployContract(hre, "cache/solpp-generated-contracts/ERC20/ERC20_plain.sol:AssetToken", "ERC20")
}
