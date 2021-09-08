// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity =0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interface/INFTKEYMarketPlaceV1.sol";

contract MarketPlaceReader {
    constructor() public {}

    function _isTokenOwner(
        address marketplace,
        uint256 tokenId,
        address account
    ) private view returns (bool) {
        address tokenAddress = INFTKEYMarketPlaceV1(marketplace).tokenAddress();

        try IERC721(tokenAddress).ownerOf(tokenId) returns (address tokenOwner) {
            return tokenOwner == account;
        } catch {
            return false;
        }
    }

    function _isBidValid(address marketplace, INFTKEYMarketPlaceV1.Bid memory bid)
        private
        view
        returns (bool)
    {
        address paymentTokenAddress = INFTKEYMarketPlaceV1(marketplace).paymentTokenAddress();
        if (
            !_isTokenOwner(marketplace, bid.tokenId, bid.bidder) &&
            IERC20(paymentTokenAddress).allowance(bid.bidder, marketplace) >= bid.bidPrice &&
            IERC20(paymentTokenAddress).balanceOf(bid.bidder) >= bid.bidPrice &&
            bid.bidPrice > 0 &&
            bid.expireTimestamp > block.timestamp
        ) {
            return true;
        }
    }

    function getBidderTokenBid(
        address marketplace,
        uint256 tokenId,
        address bidder
    ) public view returns (INFTKEYMarketPlaceV1.Bid memory) {
        try INFTKEYMarketPlaceV1(marketplace).getBidderTokenBid(tokenId, bidder) returns (
            INFTKEYMarketPlaceV1.Bid memory bid
        ) {
            if (_isBidValid(marketplace, bid)) {
                return bid;
            } else {
                return INFTKEYMarketPlaceV1.Bid(tokenId, 0, address(0), 0);
            }
        } catch {
            return INFTKEYMarketPlaceV1.Bid(tokenId, 0, address(0), 0);
        }
    }

    function getTokenBids(address marketplace, uint256 tokenId)
        public
        view
        returns (INFTKEYMarketPlaceV1.Bid[] memory)
    {
        INFTKEYMarketPlaceV1.Bid[] memory bids = INFTKEYMarketPlaceV1(marketplace).getTokenBids(
            tokenId
        );
        for (uint256 i; i < bids.length; i++) {
            if (!_isBidValid(marketplace, bids[i])) {
                bids[i] = INFTKEYMarketPlaceV1.Bid(tokenId, 0, address(0), 0);
            }
        }
        return bids;
    }

    function getTokenHighestBid(address marketplace, uint256 tokenId)
        public
        view
        returns (INFTKEYMarketPlaceV1.Bid memory)
    {
        INFTKEYMarketPlaceV1.Bid memory highestBid = INFTKEYMarketPlaceV1.Bid(
            tokenId,
            0,
            address(0),
            0
        );
        INFTKEYMarketPlaceV1.Bid[] memory bids = getTokenBids(marketplace, tokenId);

        for (uint256 i; i < bids.length; i++) {
            if (bids[i].bidPrice > highestBid.bidPrice) {
                highestBid = bids[i];
            }
        }
        return highestBid;
    }

    function getTokenHighestBids(
        address marketplace,
        uint256 from,
        uint256 size
    ) external view returns (INFTKEYMarketPlaceV1.Bid[] memory) {
        INFTKEYMarketPlaceV1.Bid[] memory highestBids = INFTKEYMarketPlaceV1(marketplace)
        .getTokenHighestBids(from, size);

        for (uint256 i; i < highestBids.length; i++) {
            highestBids[i] = getTokenHighestBid(marketplace, highestBids[i].tokenId);
        }

        return highestBids;
    }

    function getAllTokenHighestBids(address marketplace)
        external
        view
        returns (INFTKEYMarketPlaceV1.Bid[] memory)
    {
        INFTKEYMarketPlaceV1.Bid[] memory allHighestBids = INFTKEYMarketPlaceV1(marketplace)
        .getAllTokenHighestBids();

        for (uint256 i; i < allHighestBids.length; i++) {
            allHighestBids[i] = getTokenHighestBid(marketplace, allHighestBids[i].tokenId);
        }

        return allHighestBids;
    }

    function getBidderBids(
        address marketplace,
        address bidder,
        uint256 from,
        uint256 size
    ) public view returns (INFTKEYMarketPlaceV1.Bid[] memory) {
        INFTKEYMarketPlaceV1.Bid[] memory highestBids = INFTKEYMarketPlaceV1(marketplace)
        .getTokenHighestBids(from, size);

        for (uint256 i; i < highestBids.length; i++) {
            highestBids[i] = getBidderTokenBid(marketplace, highestBids[i].tokenId, bidder);
        }

        return highestBids;
    }
}
