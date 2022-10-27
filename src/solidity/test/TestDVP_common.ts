import { Contract } from "ethers"

export function storeName(contract: Contract, address: string, name: string) {
  try {
    contract.store(address, name + ' (' + address.toLowerCase() + ')')
  } catch(err) {
    // this happens when DVP.sol is preprocessed with #def LOG false and therefore does not implement the store method; safe to ignore
  }
}