// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Test_ErrorSource {
    uint256 value;

    error CustomError(uint256);

    function throwCustomError(uint256 _value) external payable {
        value = _value;
        revert CustomError(value);
    }

    function throwWithReason(uint256 _value) external payable {
        value = _value;
        require(false, "Revert with reason");
    }
}
