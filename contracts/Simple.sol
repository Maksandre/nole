// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

contract Simple {
    constructor() {}

    function doNothing() external pure returns (uint256) {
        return 42;
    }
}
