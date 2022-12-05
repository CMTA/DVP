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

