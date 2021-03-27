// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity =0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/INFTKEYMarketPlaceV1.sol";

/**
 * @title NFTKEY MarketPlace contract V1
 * Note: This marketplace contract is collection based. It serves one ERC721 contract only
 */

// TODO: Create and use modifiers
// TODO: Order expiration time (min and max)
// TODO: Surface min and max timeout range and Allow owner change time range settings

contract NFTKEYMarketPlaceV1 is INFTKEYMarketPlaceV1, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct TokenOrder {
        uint256 tokenId;
        EnumerableSet.AddressSet bidders;
        mapping(address => Order) orders;
    }

    constructor(address _erc721Address, address _payoutTokenAddress) public {
        _erc721 = IERC721(_erc721Address);
        _payoutToken = IERC20(_payoutTokenAddress);
    }

    IERC721 private immutable _erc721;
    IERC20 private immutable _payoutToken;

    bool private _isListingAndOrderEnabled = true;
    uint8 private _feeFraction = 1;
    uint8 private _feeBase = 100;
    uint256 private constant _actionTimeOutRangeMin = 86400;
    uint256 private constant _actionTimeOutRangeMax = 63072000;

    mapping(uint256 => Listing) private _tokenListing;
    EnumerableSet.UintSet private _tokenIdWithListing;

    mapping(uint256 => TokenOrder) private _tokenOrders;
    EnumerableSet.UintSet private _tokenIdWithOrder;

    EnumerableSet.AddressSet private _emptyBidders;
    mapping(address => Order) private _emptyOrders;

    modifier onlyMarketplaceOpen() {
        require(!_isListingAndOrderEnabled, "Listing and order are not enabled");
        _;
    }

    /**
     * @dev Check if a listing is valid or not
     * The seller must be the owner
     * The seller must have give this contract allowance
     * The sell price must be more than 0
     */
    function _isListingValid(Listing memory listing) private view returns (bool) {
        if (
            listing.seller == _erc721.ownerOf(listing.tokenId) &&
            _erc721.getApproved(listing.tokenId) == address(this) &&
            listing.listingPrice > 0 &&
            listing.expireTimestamp > block.timestamp
        ) {
            return true;
        }
    }

    function getTokenListing(uint256 tokenId) public view returns (Listing memory) {
        Listing memory listing = _tokenListing[tokenId];
        if (_isListingValid(listing)) {
            return listing;
        }
    }

    function getTokenListings() external view returns (Listing[] memory) {
        Listing[] memory listings = new Listing[](_tokenIdWithListing.length());
        for (uint256 i; i < _tokenIdWithListing.length(); i++) {
            listings[i] = getTokenListing(_tokenIdWithListing.at(i));
        }
        return listings;
    }

    /**
     * @dev Check if an order is valid or not
     * Bidder must not be the owner
     * Bidder must give the contract allowance same or more than bid price
     * Order mustn't been expired
     */
    function _isOrderValid(Order memory order) private view returns (bool) {
        if (
            order.bidder != _erc721.ownerOf(order.tokenId) &&
            _payoutToken.allowance(order.bidder, address(this)) >= order.bidPrice &&
            order.bidPrice > 0 &&
            order.expireTimestamp > block.timestamp
        ) {
            return true;
        }
    }

    function getBidderTokenOrder(uint256 tokenId, address bidder)
        public
        view
        returns (Order memory)
    {
        Order memory order = _tokenOrders[tokenId].orders[bidder];
        if (_isOrderValid(order)) {
            return order;
        }
    }

    function getTokenOrders(uint256 tokenId) public view returns (Order[] memory) {
        Order[] memory orders = new Order[](_tokenOrders[tokenId].bidders.length());

        uint256 nextIndex = 0;
        for (uint256 i; i < _tokenOrders[tokenId].bidders.length(); i++) {
            address bidder = _tokenOrders[tokenId].bidders.at(i);
            Order memory order = _tokenOrders[tokenId].orders[bidder];
            if (_isOrderValid(order)) {
                orders[nextIndex] = order;
                nextIndex = nextIndex + 1;
            } else {
                delete orders[orders.length - 1];
            }
        }

        return orders;
    }

    function getTokenHighestOrder(uint256 tokenId) public view returns (Order memory) {
        Order memory highestOrder = Order(tokenId, 0, address(0), 0);
        for (uint256 i; i < _tokenOrders[tokenId].bidders.length(); i++) {
            address bidder = _tokenOrders[tokenId].bidders.at(i);
            Order memory order = _tokenOrders[tokenId].orders[bidder];
            if (_isOrderValid(order) && order.bidPrice > highestOrder.bidPrice) {
                highestOrder = order;
            }
        }
        return highestOrder;
    }

    function getAllTokenHighestOrders() external view returns (Order[] memory) {
        Order[] memory allHighestOrders = new Order[](_tokenIdWithOrder.length());
        for (uint256 i; i < _tokenIdWithOrder.length(); i++) {
            allHighestOrders[i] = getTokenHighestOrder(_tokenIdWithOrder.at(i));
        }
        return allHighestOrders;
    }

    function getInvalidListingCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _tokenIdWithListing.length(); i++) {
            if (!_isListingValid(_tokenListing[_tokenIdWithListing.at(i)])) {
                count = count.add(1);
            }
        }
        return count;
    }

    function _getInvalidOrderOfTokenCount(uint256 tokenId) private view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _tokenOrders[tokenId].bidders.length(); i++) {
            address bidder = _tokenOrders[tokenId].bidders.at(i);
            Order memory order = _tokenOrders[tokenId].orders[bidder];
            if (!_isOrderValid(order)) {
                count = count.add(1);
            }
        }
        return count;
    }

    function getInvalidOrderCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _tokenIdWithOrder.length(); i++) {
            count = count.add(_getInvalidOrderOfTokenCount(_tokenIdWithOrder.at(i)));
        }
        return count;
    }

    // Start Mutations
    // Internal functions:
    function _delistToken(uint256 tokenId) private {
        delete _tokenListing[tokenId];
        _tokenIdWithListing.remove(tokenId);
    }

    function _cleanInvalidListingOfToken(uint256 tokenId) private {
        if (!_isListingValid(_tokenListing[tokenId])) {
            _delistToken(tokenId);
        }
    }

    function _removeOrderOfBidder(uint256 tokenId, address bidder) private {
        if (_tokenOrders[tokenId].bidders.contains(bidder)) {
            // Step 1: delete the order and the address
            delete _tokenOrders[tokenId].orders[bidder];
            _tokenOrders[tokenId].bidders.remove(bidder);

            // Step 2: if no order left, _tokenIdWithOrder.remove(tokenId)
            if (_tokenOrders[tokenId].bidders.length() == 0) {
                _tokenIdWithOrder.remove(tokenId);
            }
        }
    }

    function _cleanInvalidOrdersOfToken(uint256 tokenId) private {
        for (uint256 i = 0; i < _tokenOrders[tokenId].bidders.length(); i++) {
            address bidder = _tokenOrders[tokenId].bidders.at(i);
            Order memory order = _tokenOrders[tokenId].orders[bidder];
            if (!_isOrderValid(order)) {
                _removeOrderOfBidder(tokenId, bidder);
            }
        }
    }

    function listToken(
        uint256 tokenId,
        uint256 value,
        uint256 expireTimestamp
    ) external onlyMarketplaceOpen {
        require(value > 0, "Please list for more than 0 or use the transfer function");
        require(
            expireTimestamp.sub(block.timestamp) >= _actionTimeOutRangeMin,
            "Please make the listing valid for more than 24 hours"
        );
        require(_erc721.ownerOf(tokenId) == msg.sender, "Only token owner can list token");
        require(
            _erc721.getApproved(tokenId) == address(this),
            "This token is not allowed to sell by this contract"
        );

        _tokenListing[tokenId] = Listing(tokenId, value, msg.sender, expireTimestamp);
        _tokenIdWithListing.add(tokenId);

        emit TokenListed(tokenId, value, msg.sender, address(0));
        _cleanInvalidOrdersOfToken(tokenId);
    }

    function delistToken(uint256 tokenId) external {
        require(_tokenListing[tokenId].seller == msg.sender, "Only token seller can delist token");
        emit TokenDelisted(tokenId, _tokenListing[tokenId].seller);
        _delistToken(tokenId);
        _cleanInvalidOrdersOfToken(tokenId);
    }

    function buyToken(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = getTokenListing(tokenId);

        require(listing.seller != address(0), "Token is not for sale");
        require(_erc721.ownerOf(tokenId) != msg.sender, "This Token belongs to this address");

        uint256 fees = listing.listingPrice.mul(_feeFraction).div(_feeBase);
        require(
            msg.value >= listing.listingPrice + fees,
            "The value send is below sale price plus fees"
        );

        uint256 valueWithoutFees = msg.value.sub(fees);

        Address.sendValue(payable(_erc721.ownerOf(tokenId)), valueWithoutFees);
        Address.sendValue(payable(owner()), fees);

        emit TokenBought(tokenId, valueWithoutFees, listing.seller, msg.sender);
        _erc721.safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit TokenDelisted(tokenId, listing.seller);
        _delistToken(tokenId);
        _cleanInvalidOrdersOfToken(tokenId);
    }

    function enterBidForToken(
        uint256 tokenId,
        uint256 bidPrice,
        uint256 expireTimestamp
    ) external onlyMarketplaceOpen {
        require(bidPrice > 0, "Please bid for more than 0");
        require(
            _erc721.ownerOf(tokenId) != msg.sender,
            "You are the owner of Token, don't need to bid on it"
        );
        require(
            _payoutToken.allowance(msg.sender, address(this)) >= bidPrice,
            "Need to have enough token holding to bid on this token"
        );
        require(
            expireTimestamp.sub(block.timestamp) >= _actionTimeOutRangeMin,
            "Please make the bid valid for more than 24 hours"
        );

        Order memory order = Order(tokenId, bidPrice, msg.sender, expireTimestamp);

        // if no bids of this token add a entry to both records _tokenIdWithOrder and _tokenOrders
        if (!_tokenIdWithOrder.contains(tokenId)) {
            _tokenIdWithOrder.add(tokenId);
            _tokenOrders[tokenId] = TokenOrder(tokenId, _emptyBidders);
        }

        _tokenOrders[tokenId].bidders.add(msg.sender);
        _tokenOrders[tokenId].orders[msg.sender] = order;

        emit TokenBidEntered(tokenId, bidPrice, msg.sender);

        _cleanInvalidListingOfToken(tokenId);
        _cleanInvalidOrdersOfToken(tokenId);
    }

    function withdrawBidForToken(uint256 tokenId) public {
        Order memory order = _tokenOrders[tokenId].orders[msg.sender];
        require(order.bidder == msg.sender, "This address doesn't have bid on this token");

        emit TokenBidWithdrawn(tokenId, order.bidPrice, order.bidder);
        _removeOrderOfBidder(tokenId, msg.sender);
        _cleanInvalidOrdersOfToken(tokenId);
    }

    function acceptBidForToken(uint256 tokenId, address bidder) external nonReentrant {
        require(_erc721.ownerOf(tokenId) == msg.sender, "Only token owner can accept bid of token");
        require(
            _erc721.getApproved(tokenId) == address(this),
            "The token is not approved to spend by the contract"
        );

        Order memory existingOrder = getBidderTokenOrder(tokenId, bidder);
        require(
            existingOrder.bidPrice > 0 && existingOrder.bidder == bidder,
            "This Bio doesn't have a matching bid"
        );

        uint256 fees = existingOrder.bidPrice.mul(_feeFraction).div(_feeBase + _feeFraction);
        uint256 tokenValue = existingOrder.bidPrice.sub(fees);

        SafeERC20.safeTransferFrom(_payoutToken, existingOrder.bidder, msg.sender, tokenValue);
        SafeERC20.safeTransferFrom(_payoutToken, existingOrder.bidder, owner(), fees);

        _erc721.safeTransferFrom(msg.sender, existingOrder.bidder, tokenId);

        emit TokenBidAccepted(tokenId, existingOrder.bidPrice, msg.sender, existingOrder.bidder);

        _cleanInvalidListingOfToken(tokenId);
        _cleanInvalidOrdersOfToken(tokenId);
    }

    function cleanAllInvalidListings() external {
        for (uint256 i = 0; i < _tokenIdWithListing.length(); i++) {
            _cleanInvalidListingOfToken(_tokenIdWithListing.at(i));
        }
    }

    function cleanAllInvalidOrders() external {
        for (uint256 i = 0; i < _tokenIdWithOrder.length(); i++) {
            _cleanInvalidOrdersOfToken(_tokenIdWithOrder.at(i));
        }
    }

    function isListingAndOrderEnabled() external view returns (bool) {
        return _isListingAndOrderEnabled;
    }

    function changeMarketplaceStatus(bool enabled) external onlyOwner {
        _isListingAndOrderEnabled = enabled;
    }

    /**
     * @dev Service fee
     */
    function serviceFee() external view returns (uint8, uint8) {
        return (_feeFraction, _feeBase);
    }

    /**
     * @dev Change withdrawal fee percentage.
     * If 1%, then input (1,100)
     * If 0.5%, then input (5,1000)
     * @param feeFraction_ Fraction of withdrawal fee based on feeBase_
     * @param feeBase_ Fraction of withdrawal fee base
     */
    function changeSeriveFee(uint8 feeFraction_, uint8 feeBase_) external onlyOwner {
        require(feeFraction_ <= feeBase_, "Fee fraction exceeded base.");
        uint256 percentage = (feeFraction_ * 1000) / feeBase_;
        require(percentage <= 25, "Attempt to set percentage higher than 2.5%.");

        _feeFraction = feeFraction_;
        _feeBase = feeBase_;
    }
}
