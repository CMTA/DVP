// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// #def LOG false

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
// #if LOG
import "hardhat/console.sol";
// #endif
import "../Log.sol";
import "./IPOT.sol";

contract POT is
IPOT,
Ownable,
Log,
ERC721Holder,
ERC721Pausable
{
    string private _tokenBaseURI;

    string public constant NOT_VALID_NFT = "003002";
    string public constant NOT_CURRENT_RECEIVER = "018003";
    string public constant INVALID_AMOUNT = "018004";

    struct Business {
        string businessId;
        uint256 dealDetailNum;
        uint256 dealDetailNum2;
        address dealDetailAddress;
        potStatus status;
        string currency;
        uint256 amount;
        uint256 finalAmount;
        address sender;
        address receiver;
        uint256 mintTime;
    }

    string constant VERSION = "P16";

    /** @dev Maps owners to POT tokenIds. */
    mapping(address => uint256[]) internal ownerToTokenIds;
    /** @dev Maps NFT ID to Business */
    mapping(uint256 => Business) internal idToBusiness;
    /** @dev Maps businessIds to POT tokenIds */
    mapping(string => uint256) internal businessIdToTokenId;
    /** @dev Stores minted POT tokenIds */
    mapping(uint256 => bool) internal _minted;

    using Strings for uint256;

    /** @dev Sets baseURI for all POTs. */
    constructor(string memory name, string memory symbol, string memory baseURI) ERC721(name, symbol)
    {
        setBaseURI(baseURI);
    }

    /**
     * @dev modifier that makes sure a token has never been minted before.
     *      This is needed because the _burn function of openzeppelin would allow to re-mint a burned token
     * @param _tokenId the id of the token
     * @notice If a token with the given ID has been minted previously, this modifier will fail
     */
    modifier neverMinted(uint256 _tokenId) {
        require(!_minted[_tokenId], "ERC721: token already minted");
        _;
    }

    modifier onlyReceiver(uint256 _tokenId)
    {
        address receiver = idToBusiness[_tokenId].receiver;
        require(msg.sender == receiver, NOT_CURRENT_RECEIVER);
        _;
    }

    modifier onlyValidAmount(uint256 _tokenId, uint256 _amount)
    {
        uint256 initialAmount = idToBusiness[_tokenId].amount;
        require(_amount <= initialAmount, INVALID_AMOUNT);
        _;
    }

    /**
     * @dev Guarantees that _tokenId is a valid token
     * @param _tokenId ID of the NFT to validate
     */
    modifier validNFToken(
        uint256 _tokenId
    )
    {
        require(ownerOf(_tokenId) != address(0), NOT_VALID_NFT);
        _;
    }

    /**
     * @dev Mints an ERC721 Token with the supplied input values.
     *      Can only be called by the payment adapter.
     */
    function issuePaymentToken(
        address to,
        uint256 tokenId,
        string memory businessId,
        uint256 dealDetailNum,
        uint256 dealDetailNum2,
        address dealDetailAddress,
        string memory currency,
        uint256 amount,
        address sender,
        address receiver)
    external
    onlyOwner
    neverMinted(tokenId)
    whenNotPaused()
    {
        // remember that this token has been minted because the _burn implementation of openzeppelin would otherwise
        // allow to mint the burned token with the same ID again
        _minted[tokenId] = true;
        businessIdToTokenId[businessId] = tokenId;
        _safeMint(to, tokenId);
        _setBusinessDetails(
                tokenId,
                businessId,
                dealDetailNum,
                dealDetailNum2,
                dealDetailAddress,
                currency,
                amount,
                sender,
                receiver);
    }

    /**
     * @dev Sets details for a newly minted token. In addition to the passed parameters, the status is set to Issued
     *      and the mintTime is set to block.timestamp.
     * @notice This internal function must be called after minting.
     * @param _tokenId ID of the POT, details
     */
    function _setBusinessDetails(
        uint256 _tokenId,
        string memory _businessId,
        uint256 _dealDetailNum,
        uint256 _dealDetailNum2,
        address _dealDetailAddress,
        string memory _currency,
        uint256 _amount,
        address _sender,
        address _receiver
    )
    internal
    validNFToken(_tokenId)
    {
        Business storage business = idToBusiness[_tokenId];

        business.businessId = _businessId;
        business.dealDetailNum = _dealDetailNum;
        business.dealDetailNum2 = _dealDetailNum2;
        business.dealDetailAddress = _dealDetailAddress;
        business.status = potStatus.Issued;
        business.currency = _currency;
        business.amount = _amount;
        business.finalAmount = _amount;
        business.sender = _sender;
        business.receiver = _receiver;
        business.mintTime = block.timestamp;
    }

    /**
     * @dev Burns an NFT
     * @notice This internal function should be called from user-implemented external burn function.
     *         Also, note that this burn implementation allows the minter to re-mint a burned NFT.
     * @param _tokenId ID of the NFT to be burned
     */
    function _burn(uint256 _tokenId)
    internal
    override
    {
        string memory businessId = getBusinessId(_tokenId);
        super._burn(_tokenId);
        delete idToBusiness[_tokenId];
        delete(businessIdToTokenId[businessId]);
    }

    /**
     * @dev Changes the status of the POT to 'PaymentInitiated' and emits the 'PaymentInitiated' event.
     * @param _tokenId ID of the POT
     */
    function initiatePayment(
        uint256 _tokenId
    )
    external
    whenNotPaused()
    {
        //Check that message sender is owner of POT and that POT has status 'Issued'
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "Message sender is not owner nor approved for POT");
        require(idToBusiness[_tokenId].status == potStatus.Issued, "POT does not have status 'Issued'");
        //Change status of POT to 'PaymentInitiated'
        Business storage business = idToBusiness[_tokenId];
        business.status = potStatus.PaymentInitiated;
        //Emit event PaymentInitiated
        emit PaymentInitiated(
                _tokenId,
                business.sender,
                business.receiver,
                business.businessId,
                business.dealDetailNum,
                business.dealDetailNum2,
                business.dealDetailAddress,
                business.finalAmount,
                business.currency,
                tokenURI(_tokenId));
    }

    /**
     * @dev Changes the status of the POT to 'PaymentConfirmed' and emits the 'PaymentConfirmed' event.
     * @param _tokenId ID of the POT
     */
    function confirmPayment(
        uint256 _tokenId
    )
    external
    onlyOwner
    whenNotPaused()
    {
        //Check that POT has status 'PaymentInitiated'
        require(idToBusiness[_tokenId].status == potStatus.PaymentInitiated, "POT does not have status 'PaymentInitiated'");
        //Change status of POT to 'PaymentConfirmed'
        Business storage business = idToBusiness[_tokenId];
        business.status = potStatus.PaymentConfirmed;
        //Emit event PaymentConfirmed
        emit PaymentConfirmed(
                _tokenId,
                business.sender,
                business.receiver,
                business.businessId,
                business.dealDetailNum,
                business.dealDetailNum2,
                business.dealDetailAddress,
                business.finalAmount,
                business.currency,
                tokenURI(_tokenId));
    }

    /**
     * @dev Changes the status of the POT to 'Deactivated' and emits the 'PotDeactivated' event.
     * @param _tokenId ID of the POT
     */
    function deactivatePot(
        uint256 _tokenId
    )
    external
    whenNotPaused()
    {
        //Check that message sender is owner of POT and that POT does not have status 'Deactivated'
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "Message sender is not owner nor approved for POT");
        if (idToBusiness[_tokenId].status == potStatus.Deactivated) {revert("POT already has status 'Deactivated'");}
        //Change status of POT to 'Deactivated'
        Business storage business = idToBusiness[_tokenId];
        business.status = potStatus.Deactivated;
        //Emit event PotDeactivated
        emit PotDeactivated(
                _tokenId,
                business.sender,
                business.receiver,
                business.businessId,
                business.dealDetailNum,
                business.dealDetailNum2,
                business.dealDetailAddress,
                business.finalAmount,
                business.currency,
                tokenURI(_tokenId));
    }

    /**
     * @dev Sets the baseURI for all Pots. It can only be called by the payment adapter.
     */
    function setBaseURI(string memory baseURI)
    public
    onlyOwner
    whenNotPaused()
    {
        _tokenBaseURI = baseURI;
    }

    function getBaseURI()
    external
    view
    returns (string memory)
    {
        return _baseURI();
    }

    function _baseURI()
    internal
    view
    virtual override
    returns (string memory)
    {
        return _tokenBaseURI;
    }

    function getTokenIdByBusinessId(string memory businessId)
    external
    view
    returns (uint256 tokenId)
    {
        return businessIdToTokenId[businessId];
    }

    function getTokenIdsByOwner(address owner)
    external
    view
    returns (uint256[] memory)
    {
        return ownerToTokenIds[owner];
    }

    function changeAmount(uint256 _tokenId, uint256 amount)
    external
    whenNotPaused()
    {
        _changeFinalAmount(_tokenId, amount);
    }

    /**
     * @dev Changes final amount of the NFT.
     * @notice Changes the final amount. This can be only done by the receiver of the NFT
     *         and can only be less than the initial amount.
     * @param _tokenId and _amount to change the final amount variable
     */
    function _changeFinalAmount(uint256 _tokenId, uint256 _amount)
    internal
    onlyReceiver(_tokenId)
    onlyValidAmount(_tokenId, _amount)
    {
        idToBusiness[_tokenId].finalAmount = _amount;
        string memory _currency = idToBusiness[_tokenId].currency;
        emit ChangeFinalAmount(_tokenId, _amount, _currency);
    }

    function _transfer(address _from, address _to, uint256 _tokenId)
    internal
    virtual
    override
    {
        // initial minting will transfer the token from 0x0 to recipient, we do not want
        // to burn the token in this case, therefore we also test for "_from != address(0x0)"
        if(_from != address(0x0) && _to == address(this)) {
            // burn the token
            _burn(_tokenId);

        } else {
            // token has not been transferred to the POT contract, use default implementation
            // to move the token to the recipient
            super._transfer(_from, _to, _tokenId);
        }
    }

    /**
     * Additional actions needed after transfer, minting or burning of tokens.
     */
    function _afterTokenTransfer(address from, address to, uint256 tokenId)
    internal
    virtual override
    {
        // #if LOG
        console.log("[POT] _afterTokenTransfer: from =", nice(from));
        console.log("[POT] _afterTokenTransfer: to =", nice(to), ", tokenId =", tokenId);
        // #endif
        if (from == address(0)) {
            // Minting
            ownerToTokenIds[to].push(tokenId);
            // #if LOG
            console.log("[POT] Minted");
            // #endif
        } else if (to == address(0)) {
            // Burning
            _remove(tokenId, ownerToTokenIds[from]);
            // #if LOG
            console.log("[POT] Burnt");
            // #endif
        } else {
            // Transfer
            _remove(tokenId, ownerToTokenIds[from]);
            ownerToTokenIds[to].push(tokenId);
            // #if LOG
            console.log("[POT] Transferred to", nice(to));
            // #endif
        }
    }

    /**
     * Contract owner is always an approved token operator.
     */
    function isApprovedForAll(address owner, address operator)
    public
    view
    virtual override (ERC721, IERC721)
    returns (bool)
    {
        bool approved = operator == super.owner()
            || super.isApprovedForAll(owner, operator);
        // #if LOG
        console.log("[POT] isApprovedForAll, super.owner() =", nice(super.owner()));
        console.log("[POT] isApprovedForAll, owner         =", nice(owner));
        console.log("[POT] isApprovedForAll, operator      =", nice(operator));
        console.log("[POT] isApprovedForAll, approved =", approved);
        // #endif
        return approved;
    }

    function getBusinessId(uint256 _tokenId)
    public
    view
    returns (string memory)
    {
        return idToBusiness[_tokenId].businessId;
    }

    function getDealDetailNum(uint256 _tokenId)
    external
    view
    returns (uint256)
    {
        return idToBusiness[_tokenId].dealDetailNum;
    }

    function getDealDetailNum2(uint256 _tokenId)
    public
    view
    returns (uint256)
    {
        return idToBusiness[_tokenId].dealDetailNum2;
    }

    function getDealDetailAddress(uint256 _tokenId)
    external
    view
    returns (address)
    {
        return idToBusiness[_tokenId].dealDetailAddress;
    }

    function getStatus(uint256 _tokenId)
    external
    view
    returns (potStatus)
    {
        return idToBusiness[_tokenId].status;
    }

    function getCurrency(uint256 _tokenId)
    external
    view
    returns (string memory)
    {
        return idToBusiness[_tokenId].currency;
    }

    function getAmount(uint256 _tokenId)
    external
    view
    returns (uint256)
    {
        return idToBusiness[_tokenId].amount;
    }

    function getFinalAmount(uint256 _tokenId)
    external
    view
    returns (uint256)
    {
        return idToBusiness[_tokenId].finalAmount;
    }

    function getSender(uint256 _tokenId)
    external
    view
    returns (address)
    {
        return idToBusiness[_tokenId].sender;
    }

    function getReceiver(uint256 _tokenId)
    external
    view
    returns (address)
    {
        return idToBusiness[_tokenId].receiver;
    }

    function getMintTime(uint256 _tokenId)
    external
    view
    returns (uint256)
    {
        return idToBusiness[_tokenId].mintTime;
    }

    function getStatusAndMintTime(uint256 _tokenId)
    external
    view
    returns (potStatus, uint256)
    {
        return (idToBusiness[_tokenId].status, idToBusiness[_tokenId].mintTime);
    }

    function getDetails(uint256 _tokenId)
    external
    view
    returns (potStatus, address, address, uint256, address)
    {
        return (idToBusiness[_tokenId].status,
                ownerOf(_tokenId),
                idToBusiness[_tokenId].dealDetailAddress,
                idToBusiness[_tokenId].dealDetailNum,
                idToBusiness[_tokenId].receiver);
    }

    function getDetailsForDelivery(uint256 _tokenId)
    external
    view
    returns (potStatus, address, address, uint256, address)
    {
        return (idToBusiness[_tokenId].status,
                ownerOf(_tokenId),//  = IPOT(potAddress).ownerOf(tokenId);
                idToBusiness[_tokenId].dealDetailAddress,
                idToBusiness[_tokenId].dealDetailNum,
                idToBusiness[_tokenId].sender);
    }

    function getVersion()
    external
    pure
    returns (string memory)
    {
        return VERSION;
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

    /**
     * Removes a specific value from an array.
     * Replaces the value to be removed by the last entry in the list and popping the last value from the list afterwards.
     *
     * IMPORTANT: Order of elements in the array changes
     */
    function _remove(uint256 valueToFindAndRemove, uint256[] storage array)
    internal
    {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == valueToFindAndRemove) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
}