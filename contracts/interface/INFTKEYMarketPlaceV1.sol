// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity =0.6.12;

interface INFTKEYMarketPlaceV1 {
    struct Order {
        uint256 tokenId;
        uint256 bidPrice;
        address bidder;
    }

    struct Listing {
        uint256 tokenId;
        uint256 listingPrice;
        address seller;
    }

    event TokenListed(
        uint256 indexed tokenId,
        uint256 minValue,
        address indexed fromAddress,
        address indexed toAddress
    );
    event TokenDelisted(uint256 indexed tokenId, address indexed fromAddress);
    event TokenBidEntered(uint256 indexed tokenId, uint256 value, address indexed fromAddress);
    event TokenBidWithdrawn(uint256 indexed tokenId, uint256 value, address indexed fromAddress);
    event TokenBidRemoved(uint256 indexed tokenId, address indexed fromAddress);
    event TokenBought(
        uint256 indexed tokenId,
        uint256 value,
        address indexed fromAddress,
        address indexed toAddress
    );
    event TokenBidAccepted(
        uint256 indexed tokenId,
        uint256 value,
        address indexed fromAddress,
        address indexed toAddress
    );
}
