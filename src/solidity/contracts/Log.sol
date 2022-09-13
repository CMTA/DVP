// SPDX-License-Identifier: MIT
pragma solidity >=0.8.15 <0.9.0;

import "./POT/IPOT.sol";

/**
 * Contract that supports improved logging. 
 * Derive a contract from Log to use it.
 */
contract Log {

  mapping(address => string) names;

  // Allows to store names for addresses
  function store(address _address, string memory name)
  public
  {
    names[_address] = name;
  }

  // Returns the name associated with a specific address or address as string
  function nice(address _address)
  public
  view
  returns(string memory) {
    string memory name = names[_address];

    bytes memory tempEmptyString = bytes(name);
    if (tempEmptyString.length == 0) {
      return toString(_address);
    }
    return name;
  }

  // Convert address into a string
  function toString(address account)
  public
  pure
  returns(string memory) {
    return toString(abi.encodePacked(account));
  }

  // Convert bytes into a string
  function toString(bytes memory data)
  public
  pure
  returns(string memory) {
    bytes memory alphabet = "0123456789abcdef";

    bytes memory str = new bytes(2 + data.length * 2);
    str[0] = "0";
    str[1] = "x";
    for (uint i = 0; i < data.length; i++) {
      str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
      str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
    }
    return string(str);
  }

  // Returns string representation of IPOT.potStatus
  function statusToString(IPOT.potStatus status)
  public
  pure
  returns(string memory) {
    if (status == IPOT.potStatus.Issued) return "Issued";
    if (status == IPOT.potStatus.PaymentInitiated) return "PaymentInitiated";
    if (status == IPOT.potStatus.PaymentConfirmed) return "PaymentConfirmed";
    if (status == IPOT.potStatus.Deactivated) return "Deactivated";
    return "Invalid";
  }
}
