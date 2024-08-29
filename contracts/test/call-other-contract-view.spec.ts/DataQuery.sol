// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DataSource.sol";

contract Test_DataQuery {
    event PrintValue(uint256);

    function queryDataFromSource(address source) external returns (uint256) {
        uint256 value = Test_DataSource(source).getValue();

        emit PrintValue(value);
        return value;
    }
}
