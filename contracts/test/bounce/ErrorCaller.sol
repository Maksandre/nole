// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "../../nilcore/Nil.sol";
import "./ErrorSource.sol";

contract Test_ErrorCaller is NilBounceable {
    event BounceValue(string);
    event BounceAddress(address);

    function bounce(string calldata err) external payable override {
        emit BounceValue(err);
        emit BounceAddress(msg.sender);
    }

    receive() external payable {}

    function callCustomError(address _errorSource, uint256 _newNumber) external payable {
        Nil.asyncCall(
            _errorSource,
            address(this),
            msg.value,
            abi.encodeCall(Test_ErrorSource.throwCustomError, (_newNumber))
        );

        // Nil.asyncCall(
        //     _errorSource,
        //     _refundTo,
        //     _bounceTo,
        //     Nil.FORWARD_REMAINING,
        //     false,
        //     0,_newAmount
        //     new Nil.Token[](0),
        //     abi.encodeCall(Test_ErrorSource.throwCustomError, (_value))
        // );
    }

    function callRequireError(address _errorSource) external payable {
        Nil.asyncCall(_errorSource, address(this), msg.value, abi.encodeCall(Test_ErrorSource.throwWithReason, (42)));

        // Nil.asyncCall(
        //     _errorSource,
        //     _refundTo,
        //     _bounceTo,
        //     Nil.FORWARD_REMAINING,
        //     false,
        //     0,_newAmount
        //     new Nil.Token[](0),
        //     abi.encodeCall(Test_ErrorSource.throwCustomError, (_value))
        // );
    }
}

// address dst,
// address refundTo,
// address bounceTo,
// uint feeCredit,
// uint8 forwardKind,
// bool deploy,
// uint value,
// Token[] memory tokens,
// bytes memory callData
