// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;

import "./NilCurrencyBase.sol";

contract Wallet is NilCurrencyBase {
    bytes pubkey;

    receive() external payable {}

    function bounce(string calldata err) external payable {}

    constructor(bytes memory _pubkey) payable {
        pubkey = _pubkey;
    }

    function send(bytes calldata message) public onlyExternal {
        Nil.sendMessage(gasleft(), message);
    }

    function asyncCall(
        address dst,
        address refundTo,
        address bounceTo,
        uint gas,
        bool deploy,
        Nil.Token[] memory tokens,
        uint value,
        bytes calldata callData
    ) public onlyExternal {
        bool success = Nil.asyncCall(dst, refundTo, bounceTo, gas, Nil.FORWARD_NONE, deploy, value, tokens, callData);
        require(success, "asyncCall failed");
    }

    function syncCall(address dst, uint gas, uint value, bytes memory call_data) public onlyExternal {
        (bool success, ) = dst.call{value: value, gas: gas}(call_data);
        require(success, "Call failed");
    }

    function verifyExternal(uint256 hash, bytes calldata signature) external view returns (bool) {
        return Nil.validateSignature(pubkey, hash, signature);
    }
}
