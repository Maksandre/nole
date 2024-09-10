// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Test_ERC20 is ERC721 {
    uint256 lastTokenId = 0;

    constructor() ERC721("Name", "SYM") {}

    function mint(address owner) external {
        lastTokenId++;
        _mint(owner, lastTokenId);
    }
}
