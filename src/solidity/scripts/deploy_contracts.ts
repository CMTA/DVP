import { ContractFactory } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { contracts_addresses_filename } from './config'
import "@nomiclabs/hardhat-ethers";
import '@openzeppelin/hardhat-upgrades';

/**
 * Deploys DVP-Contract to the network configured via hardhat.
 * @param hre
 */
export async function deployDVP(hre: HardhatRuntimeEnvironment, single: boolean, pot_address: string) {
    console.log("DVP will be initialized with POT at " + pot_address)
    return await deployUpgradeableContract(hre, single, "cache/solpp-generated-contracts/DVP.sol:DVP", "DVP",
        pot_address)
}

/**
 * Upgrades DVP-Contract to DVPv2 to the network configured via hardhat.
 * @param hre
 */
export async function upgradeDVPtoV2(hre: HardhatRuntimeEnvironment) {
    return await upgradeContract(hre, "cache/solpp-generated-contracts/DVPv2.sol:DVPv2", "DVP",
        "0x5b1869D9A4C187F2EAa108f3062412ecf0526b24" // DVP address!
        )
}

/**
 * Upgrades an upgradeable contract.
 * @param hre
 * @param contractName syntax like "cache/solpp-generated-contracts/DVP.sol:DVP"
 * @param name only for logging
 */
async function upgradeContract(hre: HardhatRuntimeEnvironment, contractName: string, name: string,
        address: string) {
    const contractFactory = await hre.ethers.getContractFactory(contractName)
    const contract = await hre.upgrades.upgradeProxy(address, contractFactory)
    await contract.deployed()

    console.log("Upgraded " + name + " contract into " + hre.network.name + " network at address " + contract.address)
    return contract
}

/**
 * Deploys an upgradeable contract.
 * @param hre
 * @param single if true, only one contract is being deployed (only for logging)
 * @param contractName syntax like "cache/solpp-generated-contracts/DVP.sol:DVP"
 * @param name only for logging
 * @param ...args optional initializer parameters
 */
async function deployUpgradeableContract(hre: HardhatRuntimeEnvironment, single, contractName: string, name: string,
        ...args: Array<any>) {
    const contractFactory = await hre.ethers.getContractFactory(contractName);
    const contract = await hre.upgrades.deployProxy(contractFactory, [...args], {
        initializer: "initialize"});
    await contract.deployed()

    let padding = single ? name.length : 5
    console.log("Deployed " + name.padStart(padding) + " contract into " + hre.network.name + " network at address " + contract.address)
    if (single) {
        console.log("Don't forget to update the contract address in " + contracts_addresses_filename + " and possibly other scripts.")
    }
    return contract
}