// SPDX-License-Identifier: MIT
pragma solidity >=0.8.15 <0.9.0;

// #def LOG false

import "./POT/IPOT.sol";

/**
 * Contract that supports improved logging.
 * Derive a contract from Log to use it.
 */
contract Log {

    // #if LOG
    mapping(address => string) names;
    // #endif

    // Allows storing names for addresses.
    // Typically not called by other contracts, only by unit tests.
    function store(address _address, string memory name)
    public
    {
        // #if LOG
        names[_address] = name;
        // #endif
    }

    // Returns the name associated with a specific address or address as string.
    // Typically not called by other contracts, only by unit tests.
    function nice(address _address)
    public
    view
    returns(string memory) {
        // #if LOG
        string memory name = names[_address];

        bytes memory tempEmptyString = bytes(name);
        if (tempEmptyString.length == 0) {
            return toString(_address);
        }
        return name;
        // #endif
    }

    // #if LOG
    // Converts address into a string.
    function toString(address account)
    public
    pure
    returns(string memory) {
        return toString(abi.encodePacked(account));
    }

    // Converts bytes into a string.
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
    // #endif

    // Returns string representation of IPOT.potStatus.
    // May only be called from tests or log statements in contracts.
    function statusToString(IPOT.potStatus potStatus)
    public
    pure
    returns(string memory) {
        if (potStatus == IPOT.potStatus.Issued) return "Issued";
        if (potStatus == IPOT.potStatus.PaymentInitiated) return "PaymentInitiated";
        if (potStatus == IPOT.potStatus.PaymentConfirmed) return "PaymentConfirmed";
        if (potStatus == IPOT.potStatus.Deactivated) return "Deactivated";
        return "Invalid";
    }
}
