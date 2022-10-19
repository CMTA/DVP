# DvP for CMTA

The commands below must be executed in the `src/solidity` folder.

### Setup

- `npm install`

uses package.json

### Compilation and Test

- `npx hardhat compile`
- `npx hardhat test`

uses hardhat.config.ts

### Deployment

- `npx hardhat deploy_all_contracts`

uses hardhat.config.ts

### Upgradeability

To provide upgradeability, DVP.sol extends the UUPSUpgradeable contract and the "Upgradeable" variants of other OZ contracts, and has an `initialize()` function instead of a constructor.

To test this, there is a contract DVPv2.sol which differs from DVP.sol in the additional function `getFixFunction()` and a different implementation of `getVersion()`.

Test:

```shell
$ npx hardhat deploy_dvp_contract --potaddress 0x9b1f7F645351AF3631a656421eD2e40f2802E6c0 --network localhost
DVP will be initialized with POT at 0x9b1f7F645351AF3631a656421eD2e40f2802E6c0
Deployed DVP contract into localhost network at address 0xFC628dd79137395F3C9744e33b1c5DE554D94882

// insert this DVP address in scripts/contracts.json

$ npx hardhat dvp_getVersion --network localhost
D1

$ npx hardhat dvp_getFixFunction --network localhost
An unexpected error occurred:

TypeError: createDvPv2(...).getFixFunction is not a function
...

$ npx hardhat dvp_upgrade_contract --network localhost
Upgraded DVPv2 contract into localhost network at address 0xFC628dd79137395F3C9744e33b1c5DE554D94882

$ npx hardhat dvp_getVersion --network localhost
UPGRADED

$ npx hardhat dvp_getFixFunction --network localhost
new function
```

##### Implementation details

The script deploy_contracts.ts contains functions to deploy smart contracts in an upgradeable manner (`function deployUpgradeableContract`).

