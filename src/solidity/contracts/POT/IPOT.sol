// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

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

    /**
     * @dev The payment adapter detects this event and initiates the associated bank transfer.
     */
    event PaymentInitiated(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed receiver,
        string businessId,
        uint256 dealDetailNum,
        uint256 dealDetailNum2,
        address dealDetailAddress,
        uint256 finalAmount,
        string currency,
        string tokenURI);

    /**
     * @dev This event is emitted when the payment adapter confirms the payment associated with the POT.
     *      It can be used to trigger deliveries in a DvP setup.
     */
    event PaymentConfirmed(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed receiver,
        string businessId,
        uint256 dealDetailNum,
        uint256 dealDetailNum2,
        address dealDetailAddress,
        uint256 finalAmount,
        string currency,
        string tokenURI);

    /**
     * @dev This event is emitted when a Pot is deactivated by its owner.
     */
    event PotDeactivated(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed receiver,
        string businessId,
        uint256 dealDetailNum,
        uint256 dealDetailNum2,
        address dealDetailAddress,
        uint256 finalAmount,
        string currency,
        string tokenURI);

    /**
     * @dev This event is emitted when the final amount of a POT is changed. It is registered by the payment adapter and
     *      causes a change of the final amount of the POT in its database.
     * @param finalAmount which will be updated in the payment adapter.
     */
    event ChangeFinalAmount(
        uint256 indexed tokenId,
        uint256 finalAmount,
        string currency);


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