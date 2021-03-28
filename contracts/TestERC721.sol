// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity =0.6.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestERC721 is ERC721 {
    constructor() public ERC721("Test ERC721", "T721") {}

    function mint() external {
        _safeMint(msg.sender, totalSupply());
    }
}
