// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./nilcore/NilCurrencyBase.sol";

contract NoleWallet is NilCurrencyBase {
    bytes s_pubkey;
    mapping(address spender => mapping(address token => uint256 amount)) s_allowances;

    receive() external payable {}

    function bounce(string calldata err) external payable {}

    constructor(bytes memory _pubkey) payable {
        s_pubkey = _pubkey;
    }

    function approve(
        address _spender,
        address _token,
        uint256 _amount
    ) public onlyExternal {
        s_allowances[_spender][_token] = _amount;
    }

    function transfer(
        address _token,
        address _recepient,
        uint256 _amount
    ) public onlyInternal {
        require(
            s_allowances[msg.sender][_token] >= _amount,
            "Transfer more than allowed"
        );
        s_allowances[msg.sender][_token] -= _amount;
        Nil.Token[] memory token = new Nil.Token[](1);
        token[0] = Nil.Token({
            id: 1, // TODO
            amount: _amount
        });

        this.asyncCall(
            _recepient,
            address(this),
            address(this),
            gasleft(),
            false,
            token,
            0,
            ""
        );
    }

    function allowance(
        address _spender,
        address _token
    ) public view returns (uint256) {
        return s_allowances[_spender][_token];
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
        bool success = Nil.asyncCall(
            dst,
            refundTo,
            bounceTo,
            gas,
            Nil.FORWARD_NONE,
            deploy,
            value,
            tokens,
            callData
        );
        require(success, "asyncCall failed");
    }

    function syncCall(
        address dst,
        uint gas,
        uint value,
        bytes memory call_data
    ) public onlyExternal {
        (bool success, ) = dst.call{value: value, gas: gas}(call_data);
        require(success, "Call failed");
    }

    function verifyExternal(
        uint256 hash,
        bytes calldata signature
    ) external view returns (bool) {
        return Nil.validateSignature(s_pubkey, hash, signature);
    }
}
