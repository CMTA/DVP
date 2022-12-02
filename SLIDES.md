# DvP for CMTA



The DvP (Delivery versus Payment) smart contract (DVP.sol) interacts with an Asset Token contract (Delivery) and a _Payment Order Token_ contract (Payment).

#### Asset Token

DVP.sol can interact with any smart contract that implements the `IERC20Upgradeable` interface, e.g. CMTA's CMTAT contract.

#### Payment Order Token

targens provides a Payment Order Token (Interface: src/solidity/contracts/POT/IPOT.sol) that is agnostic of other contracts expect for the OpenZeppelin ones and logging support.



### Deployment

#### On Ganache

For realistic tests, the smart contracts should be deployed on an instance of Ganache (a personal Ethereum blockchain).

There a several ways to access Ganache:

* running it locally: `ganache --networkId=1337 --deterministic --verbose --accounts=3 --host=0.0.0.0 --gasLimit=9000001`
* running it locally with Docker: `docker compose up --detach` (uses docker-compose.yml)
* using a running instance, e.g. a cloud installation, either with port-forwarding or by configuring the HardhatUserConfig in hardhat.config.ts

Assuming the Ganache instance being accessible locally, the smart contracts can be deployed like this:

`npx hardhat deploy_all_contracts --network localhost`


The `deploy_all_contracts` task writes the addresses of the newly deployed contracts into the file build/contracts.json, from which other tasks can read them.

## Testing

The DvP contract comes with a suite of unit tests that are implemented in TypeScript, as well as a set of hardhat tasks for interactive testing.

#### Unit Tests

As described above, the TypeScript tests in the test folder can be executed with `npx hardhat test`.

The test files have speaking names and strive to cover all "happy paths" and all revert cases.

#### Hardhat Tasks

Apart from built-in tasks such as `compile` and `test`, hardhat allows the definition of own tasks in hardhat.config.ts.

`npx hardhat` lists all available tasks.

e.g.

```shell
$ npx hardhat dvp_getVersion --network localhost
D1
```



## Logging and Preprocessing

DVP.sol makes heavy use of logging, for which it uses the utility contract hardhat/console.sol.

Logging facilitates the development and testing of the contracts. However, this is not meant for production (i.e. deployment on mainnet).

To strip the log statements from the code before compilation, the solidity preprocessor _SOLPP_ is used. It removes statements like this:

```solidity
// #if LOG
import "hardhat/console.sol";
// #endif

...

// #if LOG
address receiver = IPOT(potAddress).getReceiver(tokenId);
console.log("[DVP] receiverBalance:", IERC20(assetTokenAddress).balanceOf(receiver));
// #endif
```

when a contract starts with this line:

```solidity
// #def LOG false
```

During development, this can be set to `true`.

With the log statements, the code is slightly too large, as stated by this compiler warning:

```
Warning: Contract code size is 24959 bytes and exceeds 24576 bytes (a limit introduced in Spurious Dragon). This contract may not be deployable on mainnet.
```

