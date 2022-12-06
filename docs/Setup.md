# DvP for CMTA - Setup

The commands below must be executed in the `src/solidity` folder.

For compilation, tests and deployment, hardhat (https://hardhat.org) is used.

### Installation

- `npm install` installs hardhat, ethers and other tools defined in package.json

### Compilation and Test

- `npx hardhat compile` compiles (uses hardhat.config.ts)
- `npx hardhat test` runs all tests
- `npx hardhat test test/TestDVP_checkDeliveryForPot_1.ts` runs tests from individual file

