// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@nilfoundation/smart-contracts/contracts/Nil.sol";

interface IXWallet {
    event Approval(address indexed spender, uint256 indexed tokenId, uint256 amount);

    function allowance(address spender, uint256 token) external view returns (uint256);

    function approve(address spender, Nil.Token[] memory tokens) external;

    function transfer(Nil.Token[] memory tokens, address recepient) external;
}
