// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

contract Test_Receiver {
    event MsgSenderIs(address caller);

    function receiveCall() external {
        emit MsgSenderIs(msg.sender);
    }
}
