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
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        potAddress = _potAddress;
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyOwner
    override
    {}

    /**
     * @dev Logs the confirmation of the delivery of a valid POT and the associated AT to the DvP.
     */
    event DeliveryConfirmed(uint256 indexed _tokenId, address indexed _numAt);

    /**
     * @dev Logs the execution of the delivery of AT to the sender of a valid POT.
     */
    event DeliveryExecuted(uint256 indexed _tokenId, address indexed _numAt, address indexed to);

    /**
     * @dev Logs the cancellation of the settlement of a POT.
     */
    event SettlementCanceled(uint256 indexed _tokenId, address indexed _numAt, address indexed to);

    /**
     * Checks, for a specific POT, that
     * (1) the POT is owned by the DvP and
     * (2) the DvP has a sufficient allowance for the AT of the receiver to settle the POT.
     * Then transfers the AT to its own address and initiates the payment tied to the POT.
     */
    function checkDeliveryForPot(uint256 tokenId)
    external
    whenNotPaused()
    {
        // #if LOG
        console.log("[DVP] DVP.checkDeliveryForPot(", tokenId, ")");
        // #endif

        address owner = IPOT(potAddress).ownerOf(tokenId);
        IPOT.potStatus potStatus = IPOT(potAddress).getStatus(tokenId);

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

        address assetTokenAddress = IPOT(potAddress).getDealDetailAddress(tokenId);
        // receiver is owner, address(this) = DVP is spender
        address receiver = IPOT(potAddress).getReceiver(tokenId);
        uint256 allowance = IERC20(assetTokenAddress).allowance(receiver, address(this));
        // DealDetailNum contains the number of AssetTokens needed for settlement
        uint256 numAssetTokensForSettlement = IPOT(potAddress).getDealDetailNum(tokenId);
        uint256 numAssetTokensOfReceiver = IERC20(assetTokenAddress).balanceOf(receiver);

        // #if LOG
        console.log("\n[DVP] Balances before token transfer:");
        logBalances(tokenId);
        // #endif

        // if the number of tokens needed exceeds the allowance, revert
        if (numAssetTokensForSettlement > allowance) {
            revert(string.concat("Allowance ", Strings.toString(allowance), " not sufficient to settle POT ",
                Strings.toString(tokenId), ". Allowance of minimum ", Strings.toString(numAssetTokensForSettlement), " needed."));
        }

        // if the receiver's balance is less than required, revert
        if (numAssetTokensOfReceiver < numAssetTokensForSettlement) {
            revert(string.concat("Balance ", Strings.toString(numAssetTokensOfReceiver), " of receiver not sufficient to settle POT ",
                Strings.toString(tokenId), ". Balance of minimum ", Strings.toString(numAssetTokensForSettlement), " needed."));
        }

        // #if LOG
        console.log("\n[DVP] Number of asset tokens for settlement is not larger than allowance, receiver holds enough tokens, so transferring the tokens to DvP");
        // #endif

        // transfer AT from receiver to DvP
        IERC20(assetTokenAddress).transferFrom(receiver, address(this), numAssetTokensForSettlement);

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
     * Checks, for a specific POT, that
     * (1) the status of the POT is "Payment confirmed" and
     * (2) the DvP is owner of the POT.
     * Then sends the number of AT stated in the POT to the sender (of money) stated in the POT.
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

        uint256 numAssetTokensOfDvP = IERC20(assetTokenAddress).balanceOf(address(this));

        // #if LOG
        console.log("\n[DVP] Balances before transferring Asset Tokens from DVP to sender:");
        logBalances(tokenId);
        // #endif

        // if the number of AT in escrow is smaller than the number of AT held by the DvP, revert
        if (numAssetTokensOfDvP < numAssetTokensForSettlement) {
            revert(string.concat("AT-Balance ", Strings.toString(numAssetTokensOfDvP), " not sufficient for delivery. Minimum ",
                Strings.toString(numAssetTokensForSettlement), " needed."));
        }

        IPOT(potAddress).deactivatePot(tokenId);

        // #if LOG
        console.log("\n[DVP] Transferring", numAssetTokensForSettlement, "Asset Tokens from DVP to sender");
        // #endif

        // transfer the ATs to the sender (of money)
        IERC20(assetTokenAddress).transfer(sender, numAssetTokensForSettlement);

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
     * Sends the AT back to the seller and deactivates the POT.
     */
    function cancelSettlement(uint256 tokenId)
    external
    whenNotPaused()
    onlyOwner
    {
        (IPOT.potStatus potStatus, address owner, address assetTokenAddress, uint256 numAssetTokensForSettlement,
            address receiver) = IPOT(potAddress).getDetailsForSettlement(tokenId);

        // if the POT is not in "Payment Initiated" status, revert
        if (potStatus != IPOT.potStatus.PaymentInitiated) {
            revert(string.concat("POT ", Strings.toString(tokenId), " does not have status 'Payment Initiated'."));
        }

        // require that DvP has ownership over the POT
        require(owner == address(this), string.concat("DvP is not owner of POT ", Strings.toString(tokenId)));

        uint256 numAssetTokensOfDvP = IERC20(assetTokenAddress).balanceOf(address(this));
        // #if LOG
        logBalances(tokenId);
        // #endif

        // if the number of AT in escrow is too small, revert
        if (numAssetTokensOfDvP < numAssetTokensForSettlement) {
            revert(string.concat("AT-Balance ", Strings.toString(numAssetTokensOfDvP), " not sufficient for delivery. Minimum ",
                Strings.toString(numAssetTokensForSettlement), " needed."));
        }

        // change POT status to "Deactivated"
        IPOT(potAddress).deactivatePot(tokenId);

        // send the number of AT to the receiver (of money) address
        IERC20(assetTokenAddress).transfer(receiver, numAssetTokensForSettlement);

        // #if LOG
        console.log("\n[DVP] Emitting SettlementCanceled event");
        // #endif
        emit SettlementCanceled(tokenId, assetTokenAddress, receiver);
    }

    /**
     * Deactivates a POT held by the DvP if it is older than 4 days.
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
     * Sets the potAddress.
     */
    function setPotAddress(IPOT _potAddress)
    external
    onlyOwner
    {
        potAddress = _potAddress;
    }

    /**
     * Returns the potAddress.
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
