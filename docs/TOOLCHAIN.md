# TOOLCHAIN

The following is an overview of the libraries listed in the file `package.json` in the `src/solidity` folder.

The `dependencies` section contains only the well-known **@openzeppelin** libraries.

The `devDependencies` section contains:


### Ethers.js

**[ethers.js](https://docs.ethers.io/)**
Library for interacting with the Ethereum Blockchain


### Hardhat

**[Hardhat](https://hardhat.org)**
Development environment and testing framework for blockchains using the Ethereum Virtual Machine (EVM). Extensible with plugins

**[@nomiclabs/hardhat-ethers](https://www.npmjs.com/package/@nomiclabs/hardhat-ethers)**
Hardhat plugin for integration with ethers.js

**[@nomiclabs/hardhat-waffle](https://www.npmjs.com/package/@nomiclabs/hardhat-waffle)**
Hardhat plugin for integration with Waffle

**[@nomiclabs/hardhat-solpp](https://www.npmjs.com/package/@nomiclabs/hardhat-solpp)**
Hardhat plugin for integration with the solpp preprocessor.
The preprocessor is used to toggle log statements in the solidity code.

**[@openzeppelin/hardhat-upgrades](https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades)**
Hardhat plugin for deploying and managing upgradeable contracts

**[hardhat-gas-reporter](https://www.npmjs.com/package/hardhat-gas-reporter)**
eth-gas-reporter plugin for hardhat


### Test

**[typescript](https://www.typescriptlang.org)**
The unit tests are written in TypeScript

**[ts-node](https://www.npmjs.com/package/ts-node)**
TypeScript execution engine for Node.js

**[Chai](https://www.chaijs.com), [@types/chai](https://www.npmjs.com/package/@types/chai)**
Library used for the tests, plus type definitions

**[@types/mocha](https://www.npmjs.com/package/@types/mocha)**
Type definitions for the JavaScript test framework [mocha](https://mochajs.org)

**[@types/node](https://www.npmjs.com/package/@types/node)**
Type definitions for Node.js


### Waffle

**[ethereum-waffle](https://www.npmjs.com/package/ethereum-waffle)**
Framework for testing smart contracts, required by Hardhat


### Linter

**[ESLint](https://eslint.org)**
Static analyzer of the code, comes with [@typescript-eslint/eslint-plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
and [@typescript-eslint/parser](https://www.npmjs.com/package/@typescript-eslint/parser)

**[Ethlint](https://github.com/duaraghav8/Ethlint)**
Ethlint analyzes Solidity code for style & security issues and fixes them
