// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// #def LOG false

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../POT/IPOT.sol";

// #if LOG
import "../Log.sol";
import "hardhat/console.sol";
// #endif


// This is a copy of the DVP contract with these changes (to test upgradeability):
// - new function getFixFunction()
// - different return value of function getVersion()

/**
 * @title DvP (Delivery versus Payment)
 * @dev The DvP smart contract interacts with an Asset Token smart contract (Delivery) and a Payment Order Token smart contract (Payment).
 * Its task is to
 * - receive the Payment Order Token
 * - transfer the Asset Token(s) from the wallet of the seller to itself
 * - initiate the payment promised by the POT and
 * - after receiving the confirmation of payment, sending the AT to the wallet of the buyer
 */
contract DVPv2 is
Initializable,
PausableUpgradeable,
OwnableUpgradeable,
UUPSUpgradeable,
ERC721HolderUpgradeable
// #if LOG
, Log
// #endif
{
    /** Address of POT SC. Set in initialize function. */
    IPOT private potAddress;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev For upgradeability, this function replaces the constructor
     */
    function initialize(IPOT _potAddress)
    public
    initializer
    {
        // #if LOG
        console.log("[DVP] Initializing DVP");
        // #endif
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();

        potAddress = _potAddress;
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyOwner
    override
    {
        // Overrides virtual function from UUPSUpgradeable.sol.
        // No implementation; access control is relevant.
    }

    /**
     * @dev Logs the confirmation of the delivery of a valid POT and the associated AT to the DvP.
     */
    event DeliveryConfirmed(uint256 indexed tokenId, address indexed assetTokenAddress);

    /**
     * @dev Logs the execution of the delivery of AT to the sender of a valid POT.
     */
    event DeliveryExecuted(uint256 indexed tokenId, address indexed assetTokenAddress, address indexed to);

    /**
     * @dev Logs the cancellation of the settlement of a POT.
     */
    event SettlementCanceled(uint256 indexed tokenId, address indexed assetTokenAddress, address indexed to);

    /**
     * @dev Logs change of the POT address.
     */
    event POTAddressChanged(IPOT indexed potAddress);

    /**
     * @dev Checks, for a specific POT, that
     * (1) the POT is owned by the DvP and
     * (2) the DvP has a sufficient allowance for the AT of the receiver to settle the POT.
     * Then transfers the AT to its own address, initiates the payment tied to the POT and emits a DeliveryConfirmed event.
     */
    function checkDeliveryForPot(uint256 tokenId)
    external
    whenNotPaused()
    {
        // #if LOG
        console.log("[DVP] DVP.checkDeliveryForPot(", tokenId, ")");
        // #endif

        (IPOT.potStatus potStatus, address owner, address assetTokenAddress, uint256 numAssetTokensForSettlement,
            address receiver) = IPOT(potAddress).getDetails(tokenId);

        // #if LOG
        console.log("[DVP] owner:", nice(owner), "Status:", Log.statusToString(potStatus));
        // #endif

        // if the POT is not in "Issued" status, revert
        if (potStatus != IPOT.potStatus.Issued) {
            revert(string.concat("POT ", Strings.toString(tokenId), " does not have status 'Issued'."));
        }
        // #if LOG
        console.log("[DVP] POT is in state 'Issued'");
        // #endif

        // require that DvP has ownership over the POT
        require(owner == address(this), string.concat("DvP is not owner of POT ", Strings.toString(tokenId), "."));
        // #if LOG
        console.log("[DVP] DvP is owner of the POT");
        // #endif

        // #if LOG
        console.log("\n[DVP] Balances before token transfer to DvP:");
        logBalances(tokenId);
        // #endif

        // transfer AT from receiver to DvP
        bool transferOK = IERC20(assetTokenAddress).transferFrom(receiver, address(this), numAssetTokensForSettlement);
        require(transferOK, "Token transfer failed.");

        // #if LOG
        console.log("\n[DVP] Balances after token transfer:");
        logBalances(tokenId);
        // #endif

        // initiate payment
        IPOT(potAddress).initiatePayment(tokenId);

        // #if LOG
        console.log("\n[DVP] Emitting DeliveryConfirmed event");
        // #endif
        emit DeliveryConfirmed(tokenId, assetTokenAddress);
    }

    /**
     * @dev Checks, for a specific POT, that
     * (1) the status of the POT is "Payment confirmed" and
     * (2) the DvP is owner of the POT.
     * Then sends the number of AT stated in the POT to the sender (of money) stated in the POT and emits a DeliveryExecuted event.
     */
    function executeDelivery(uint256 tokenId)
    external
    whenNotPaused()
    {
        (IPOT.potStatus potStatus, address owner, address assetTokenAddress,
            uint256 numAssetTokensForSettlement, address sender) = IPOT(potAddress).getDetailsForDelivery(tokenId);

        // if the POT is not in "Payment Confirmed" status, revert
        if (potStatus != IPOT.potStatus.PaymentConfirmed) {
            revert(string.concat("POT ", Strings.toString(tokenId), " does not have status 'Payment Confirmed'."));
        }
        // #if LOG
        console.log("[DVP] POT is in state 'Payment Confirmed'");
        // #endif

        // require that DvP has ownership over the POT
        require(owner == address(this), string.concat("DvP is not owner of POT ", Strings.toString(tokenId)));
        // #if LOG
        console.log("[DVP] DvP is owner of the POT");
        // #endif

        // #if LOG
        console.log("\n[DVP] Balances before transferring Asset Tokens from DVP to sender:");
        logBalances(tokenId);
        // #endif

        IPOT(potAddress).deactivatePot(tokenId);

        // #if LOG
        console.log("\n[DVP] Transferring", numAssetTokensForSettlement, "Asset Tokens from DVP to sender");
        // #endif

        // transfer the ATs to the sender (of money)
        bool transferOK = IERC20(assetTokenAddress).transfer(sender, numAssetTokensForSettlement);
        require(transferOK, "Token transfer failed.");

        // #if LOG
        console.log("\n[DVP] Balances after token transfer:");
        logBalances(tokenId);
        // #endif

        // #if LOG
        console.log("\n[DVP] Emitting DeliveryExecuted event");
        // #endif
        emit DeliveryExecuted(tokenId, assetTokenAddress, sender);
    }

    // #if LOG
    function logBalances(uint256 tokenId) internal view {
        console.log("[DVP] numAssetTokensForSettlement:", IPOT(potAddress).getDealDetailNum(tokenId));
        address assetTokenAddress = IPOT(potAddress).getDealDetailAddress(tokenId);
        address receiver = IPOT(potAddress).getReceiver(tokenId);
        console.log("[DVP] allowance                  :", IERC20(assetTokenAddress).allowance(receiver, address(this)));
        console.log("[DVP] numAssetTokensOfReceiver   :", IERC20(assetTokenAddress).balanceOf(receiver));
        console.log("[DVP] numAssetTokensOfSender     :", IERC20(assetTokenAddress).balanceOf(IPOT(potAddress).getSender(tokenId)));
        console.log("[DVP] numAssetTokensOfDvP        :", IERC20(assetTokenAddress).balanceOf(address(this)));
    }
    // #endif

    /**
     * @dev Sends the AT back to the seller and deactivates the POT. Emits a SettlementCanceled event.
     */
    function cancelSettlement(uint256 tokenId)
    external
    whenNotPaused()
    onlyOwner
    {
        (IPOT.potStatus potStatus, address owner, address assetTokenAddress, uint256 numAssetTokensForSettlement,
            address receiver) = IPOT(potAddress).getDetails(tokenId);

        // if the POT is not in "Payment Initiated" status, revert
        if (potStatus != IPOT.potStatus.PaymentInitiated) {
            revert(string.concat("POT ", Strings.toString(tokenId), " does not have status 'Payment Initiated'."));
        }

        // require that DvP has ownership over the POT
        require(owner == address(this), string.concat("DvP is not owner of POT ", Strings.toString(tokenId)));

        // #if LOG
        logBalances(tokenId);
        // #endif

        // change POT status to "Deactivated"
        IPOT(potAddress).deactivatePot(tokenId);

        // send the number of AT to the receiver (of money) address
        bool transferOK = IERC20(assetTokenAddress).transfer(receiver, numAssetTokensForSettlement);
        require(transferOK, "Token transfer failed.");

        // #if LOG
        console.log("\n[DVP] Emitting SettlementCanceled event");
        // #endif
        emit SettlementCanceled(tokenId, assetTokenAddress, receiver);
    }

    /**
     * @dev Deactivates a POT held by the DvP if it is older than 4 days.
     */
    function deactivateOldPot(uint256 tokenId)
    external
    whenNotPaused()
    onlyOwner
    {
        (IPOT.potStatus potStatus, uint256 mintTime) = IPOT(potAddress).getStatusAndMintTime(tokenId);

        // if the POT is not in "Issued" status, revert
        if (potStatus != IPOT.potStatus.Issued) {
            revert(string.concat("POT ", Strings.toString(tokenId), " does not have status 'Issued'."));
        }

        // if the POT is not older than 4 days, revert
        uint256 potAge = block.timestamp - mintTime; // Note: "now" has been deprecated. Use "block.timestamp" instead.
        if (potAge < 4 days) {
            revert(string.concat("POT ", Strings.toString(tokenId), " is not older than 96 hours."));
        }

        IPOT(potAddress).deactivatePot(tokenId);
    }

    /**
     * @dev Sets the potAddress. Emits a POTAddressChanged event.
     */
    function setPotAddress(IPOT _potAddress)
    external
    onlyOwner
    {
        if (potAddress != _potAddress) {
            potAddress = _potAddress;
            emit POTAddressChanged(potAddress);
        }
    }

    /**
     * @dev Returns the potAddress.
     */
    function getPotAddress()
    public
    view
    returns (IPOT)
    {
        return potAddress;
    }

    function pause()
    external
    onlyOwner
    {
        _pause();
    }

    function unpause()
    external
    onlyOwner
    {
        _unpause();
    }

    function getVersion()
    public
    pure
    returns (string memory)
    {
        return "UPGRADED";
    }

    function getFixFunction()
    public
    pure
    returns (string memory)
    {
        return "new function";
    }
}
