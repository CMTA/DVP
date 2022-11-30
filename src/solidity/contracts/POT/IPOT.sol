// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IPOT is IERC721
{
    enum potStatus {
        Issued,
        PaymentInitiated,
        PaymentConfirmed,
        Deactivated
    }

    function getStatus(uint256 _tokenId)
    external
    view
    returns (potStatus);

    function initiatePayment(uint256 _tokenId)
    external;

    function deactivatePot(uint256 _tokenId)
    external;

    function getMintTime(uint256 _tokenId)
    external
    view
    returns (uint256);

    function getStatusAndMintTime(uint256 _tokenId)
    external
    view
    returns (potStatus, uint256);

    /**
     * @dev Returns
     * - potStatus
     * - address of owner
     * - address of AssetToken
     * - number of AT to be delivered in exchange for the POT
     * - address of receiver
     */
    function getDetails(uint256 _tokenId)
    external
    view
    returns (potStatus, address, address, uint256, address);

    /**
     * @dev Returns
     * - potStatus
     * - address of owner
     * - address of AssetToken
     * - number of AT to be delivered in exchange for the POT
     * - address of sender
     */
    function getDetailsForDelivery(uint256 _tokenId)
    external
    view
    returns (potStatus, address, address, uint256, address);

    function getSender(uint256 _tokenId)
    external
    view
    returns (address);

    function getReceiver(uint256 _tokenId)
    external
    view
    returns (address);

    function getDealDetailNum(uint256 _tokenId)
    external
    view
    returns (uint256);

    function getDealDetailAddress(uint256 _tokenId)
    external
    view
    returns (address);
}