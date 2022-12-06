# Logging and Preprocessing

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
