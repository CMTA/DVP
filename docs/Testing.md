# Testing

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

