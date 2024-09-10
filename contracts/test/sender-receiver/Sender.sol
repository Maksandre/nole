// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./Receiver.sol";
import "@nilfoundation/smart-contracts/contracts/Nil.sol";

contract Test_Sender is NilBase {
    function callReceiver(address receiver) public {
        Nil.asyncCall(receiver, address(this), 0, abi.encodeCall(Test_Receiver.receiveCall, ()));
    }
}
