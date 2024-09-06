// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ICollection {
    event Mint(address indexed receiver, uint256 tokenId);

    error Collection__TokenMinted();

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}
