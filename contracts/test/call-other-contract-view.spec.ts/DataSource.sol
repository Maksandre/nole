// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Test_DataSource {
    uint256 private value = 42;

    function getValue() external view returns (uint256) {
        return value;
    }
}
