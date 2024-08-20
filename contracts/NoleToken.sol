// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./nilcore/Nil.sol";
import "./interfaces/IMinter.sol";

contract NoleToken is NilBase {
    IMinter MINTER = IMinter(Nil.MINTER_ADDRESS);
    string constant NAME = "MyName";

    constructor() payable {
        Nil.asyncCall(
            Nil.MINTER_ADDRESS,
            address(0), // refundTo
            address(0), // bounceTo
            0, // gas
            Nil.FORWARD_REMAINING, // forwardKind
            false, // deploy
            0, // value
            abi.encodeCall(IMinter.create, (1, address(0), NAME, address(this)))
        );
    }

    receive() external payable {}

    function doNothing() external view returns (uint256) {
        return MINTER.getIdByName(NAME);
    }
}
