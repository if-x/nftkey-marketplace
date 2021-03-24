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
 * @title NFTKEY Life collection contract
 */

// TODO: Set an option to close this contract
contract NFTKEYMarketPlaceV1 is INFTKEYMarketPlaceV1, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;

    constructor(address _erc721Address, address _payoutTokenAddress) public {
        _erc721 = IERC721(_erc721Address);
        _payoutToken = IERC20(_payoutTokenAddress);
    }

    address private _erc721Address;
    IERC721 private immutable _erc721;
    IERC20 private immutable _payoutToken;

    uint8 private _feeFraction = 1;
    uint8 private _feeBase = 100;

    mapping(uint256 => Order) private _tokenOrder;
    EnumerableSet.UintSet private _tokenIdWithOrder;

    mapping(uint256 => Listing) private _tokenListing;
    EnumerableSet.UintSet private _tokenIdWithListing;

    function getTokenListing(uint256 tokenId) public view returns (Listing memory) {
        if (
            _tokenListing[tokenId].seller == _erc721.ownerOf(tokenId) &&
            _erc721.getApproved(tokenId) == address(this)
        ) {
            return _tokenListing[tokenId];
        }
    }

    function getTokenListings() external view returns (Listing[] memory) {
        Listing[] memory listings = new Listing[](_tokenIdWithListing.length());
        for (uint256 i; i < _tokenIdWithListing.length(); i++) {
            listings[i] = getTokenListing(_tokenIdWithListing.at(i));
        }
        return listings;
    }

    function getTokenOrder(uint256 tokenId) public view returns (Order memory) {
        if (
            _payoutToken.allowance(_tokenOrder[tokenId].bidder, address(this)) >=
            _tokenOrder[tokenId].bidPrice
        ) {
            return _tokenOrder[tokenId];
        }
    }

    function getTokenOrders() external view returns (Order[] memory) {
        Order[] memory orders = new Order[](_tokenIdWithOrder.length());
        for (uint256 i; i < _tokenIdWithOrder.length(); i++) {
            orders[i] = getTokenOrder(_tokenIdWithOrder.at(i));
        }
        return orders;
    }

    function listToken(uint256 tokenId, uint256 value) external {
        require(_erc721.ownerOf(tokenId) == _msgSender(), "Only token owner can list token");
        require(
            _erc721.getApproved(tokenId) == address(this),
            "This token is not allowed to sell by this contract"
        );

        _tokenListing[tokenId] = Listing(tokenId, value, msg.sender);
        if (!_tokenIdWithListing.contains(tokenId)) {
            _tokenIdWithListing.add(tokenId);
        }
        emit TokenListed(tokenId, value, msg.sender, address(0));
    }

    function _delistToken(uint256 tokenId) private {
        emit TokenDelisted(tokenId, _tokenListing[tokenId].seller);
        delete _tokenListing[tokenId];
        _tokenIdWithListing.remove(tokenId);
    }

    function delistToken(uint256 tokenId) external {
        require(_erc721.ownerOf(tokenId) == _msgSender(), "Only token owner can delist token");
        _delistToken(tokenId);
    }

    function _removeOrder(uint256 tokenId) private {
        emit TokenBidRemoved(tokenId, _tokenOrder[tokenId].bidder);
        delete _tokenOrder[tokenId];
        _tokenIdWithOrder.remove(tokenId);
    }

    function buyToken(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = getTokenListing(tokenId);

        require(listing.seller != address(0), "Token is not for sale");
        require(_erc721.ownerOf(tokenId) != _msgSender(), "This Token belongs to this address");

        uint256 fees = listing.listingPrice.mul(_feeFraction).div(_feeBase);
        require(
            msg.value >= listing.listingPrice + fees,
            "The value send is below sale price plus fees"
        );

        uint256 valueWithoutFees = msg.value.sub(fees);

        Address.sendValue(payable(_erc721.ownerOf(tokenId)), valueWithoutFees);
        Address.sendValue(payable(owner()), fees);

        emit TokenBought(tokenId, valueWithoutFees, listing.seller, msg.sender);

        _erc721.safeTransferFrom(listing.seller, _msgSender(), tokenId);

        _delistToken(tokenId);

        Order memory existingOrder = getTokenOrder(tokenId);
        if (existingOrder.bidder == msg.sender) {
            _removeOrder(tokenId);
        }
    }

    function enterBidForToken(uint256 tokenId, uint256 bidPrice) external {
        require(_erc721.ownerOf(tokenId) != msg.sender, "Owner of Token doesn't need to bid");
        require(
            _payoutToken.allowance(_msgSender(), address(this)) >= bidPrice,
            "Need to have enough token holding to bid on this token"
        );

        Order memory existingOrder = getTokenOrder(tokenId);
        require(bidPrice > existingOrder.bidPrice, "The bid price is no higher than existing one");

        _tokenOrder[tokenId] = Order(tokenId, bidPrice, msg.sender);
        emit TokenBidEntered(tokenId, bidPrice, msg.sender);
    }

    function acceptBidForToken(uint256 tokenId) external nonReentrant {
        require(
            _erc721.ownerOf(tokenId) == _msgSender(),
            "Only token owner can accept bid of token"
        );
        require(
            _erc721.getApproved(tokenId) == address(this),
            "The token is not approved to spend by the contract"
        );

        Order memory existingOrder = getTokenOrder(tokenId);
        require(
            existingOrder.bidPrice > 0 && existingOrder.bidder != address(0),
            "This Bio doesn't have a valid bid"
        );

        uint256 fees = existingOrder.bidPrice.mul(_feeFraction).div(_feeBase + _feeFraction);
        uint256 tokenValue = existingOrder.bidPrice.sub(fees);

        SafeERC20.safeTransferFrom(_payoutToken, existingOrder.bidder, _msgSender(), tokenValue);
        SafeERC20.safeTransferFrom(_payoutToken, existingOrder.bidder, owner(), fees);

        _erc721.safeTransferFrom(_msgSender(), existingOrder.bidder, tokenId);

        emit TokenBidAccepted(tokenId, existingOrder.bidPrice, msg.sender, existingOrder.bidder);

        _removeOrder(tokenId);

        Listing memory listing = getTokenListing(tokenId);
        if (listing.seller != address(0)) {
            _delistToken(tokenId);
        }
    }

    function withdrawBidForToken(uint256 tokenId) external nonReentrant {
        Order memory existingOrder = getTokenOrder(tokenId);
        require(existingOrder.bidder == _msgSender(), "This address doesn't have active bid");

        emit TokenBidWithdrawn(tokenId, existingOrder.bidPrice, existingOrder.bidder);
        _removeOrder(tokenId);
    }
}
