// SPDX-License-Identifier: MIT
pragma solidity >=0.8.12 <0.9.0;

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

    function initiatePayment(uint256 tokenId)
    external;

    function deactivatePot(uint256 tokenId)
    external;

    function getMintTime(uint256 _tokenId)
    external
    view
    returns (uint256);

    function getStatus(uint256 _tokenId)
    external
    view
    returns (potStatus);

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