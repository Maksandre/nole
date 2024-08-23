// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface ICollection {
    event Mint(address indexed receiver, uint256 tokenId);

    error Collection__TokenMinted();

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}
