export const contracts_addresses_filename = "./scripts/contracts.json"

let contracts_addresses

export function getAddresses() {
    return contracts_addresses
}

function main() {
    const fs = require('fs')
    if (!fs.existsSync(contracts_addresses_filename)) {
        console.log("No file " + contracts_addresses_filename + " found, so no actions on contracts are possible.")
        return
    }
    const contracts_addresses_file = fs.readFileSync(contracts_addresses_filename, 'utf8')
    contracts_addresses = JSON.parse(contracts_addresses_file)

    console.log("Contract addresses read from " + contracts_addresses_filename)
}

main()