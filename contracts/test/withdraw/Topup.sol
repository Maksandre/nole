// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@nilfoundation/smart-contracts/contracts/NilCurrencyBase.sol";

contract Test_Withdraw {
    mapping(address => uint256) balanceOf;

    constructor() payable {
        balanceOf[msg.sender] = msg.value;
    }

    function withdraw() external {}
}
