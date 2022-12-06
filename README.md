# DvP for CMTA



The DvP (Delivery versus Payment) smart contract (DVP.sol) interacts with an Asset Token smart contract (Delivery) and a _Payment Order Token_ smart contract (Payment).

The task of the DvP is to

* receive the Payment Order Token
* transfer the Asset Token(s) from the wallet of the seller to itself
* initiate the payment promised by the POT and
* after receiving the confirmation of payment, sending the AT to the wallet of the buyer

#### Asset Token

DVP.sol can interact with any smart contract that implements the `IERC20Upgradeable` interface, e.g. CMTA's CMTAT contract.

#### Payment Order Token

targens provides a IERC721-compliant Payment Order Token (Interface: src/solidity/contracts/POT/IPOT.sol) that is agnostic of other contracts, except for the OpenZeppelin ones and logging support.



See the `docs` folder for documentation.

