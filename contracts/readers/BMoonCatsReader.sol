// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity =0.6.12;

contract MoonCatRescue {
    enum Modes {Inactive, Disabled, Test, Live}

    Modes public mode = Modes.Inactive;

    address owner = 0xaF826434ac09C398654670f78E7024AC276ff22B;

    bytes16 public imageGenerationCodeMD5 = 0xdbad5c08ec98bec48490e3c196eec683; // use this to verify mooncatparser.js the cat image data generation javascript file.

    string public name = "MoonCats";
    string public symbol = "🐱"; // unicode cat symbol
    uint8 public decimals = 0;

    uint256 public totalSupply = 25600;
    uint16 public remainingCats = 25600 - 64; // there will only ever be 25,000 cats
    uint16 public remainingGenesisCats = 64; // there can only be a maximum of 64 genesis cats
    uint16 public rescueIndex = 0;

    bytes5[25600] public rescueOrder;

    bytes32 public searchSeed = 0x0; // gets set with the immediately preceding blockhash when the contract is activated to prevent "premining"

    struct AdoptionOffer {
        bool exists;
        bytes5 catId;
        address seller;
        uint256 price;
        address onlyOfferTo;
    }

    struct AdoptionRequest {
        bool exists;
        bytes5 catId;
        address requester;
        uint256 price;
    }

    mapping(bytes5 => AdoptionOffer) public adoptionOffers;
    mapping(bytes5 => AdoptionRequest) public adoptionRequests;

    mapping(bytes5 => bytes32) public catNames;
    mapping(bytes5 => address) public catOwners;
    mapping(address => uint256) public balanceOf; //number of cats owned by a given address
    mapping(address => uint256) public pendingWithdrawals;
}

contract BMoonCatsReader {
    constructor() public {}

    MoonCatRescue private constant bMoonCats =
        MoonCatRescue(0x7A00B19eDc00fa5fB65F32B4D263CE753Df8f651);

    function getCatOwners(uint256 from, uint256 size) external view returns (address[] memory) {
        if (from < 25600 && size > 0) {
            uint256 querySize = size;
            if ((from + size) > 25600) {
                querySize = 25600 - from;
            }
            address[] memory owners = new address[](querySize);
            for (uint256 i = 0; i < querySize; i++) {
                owners[i] = bMoonCats.catOwners(bMoonCats.rescueOrder(i + from));
            }
            return owners;
        }
    }
}
