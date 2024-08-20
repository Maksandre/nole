// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./nilcore/NilCurrencyBase.sol";

contract NoleWallet is NilCurrencyBase {
    bytes private s_pubkey;
    mapping(address spender => mapping(uint256 tokenId => uint256 amount))
        private s_allowances;

    constructor(bytes memory _pubkey) payable {
        s_pubkey = _pubkey;
    }

    receive() external payable {}

    function bounce(string calldata err) external payable {}

    function allowance(
        address _spender,
        uint256 _token
    ) public view returns (uint256) {
        return s_allowances[_spender][_token];
    }

    function approve(
        address _spender,
        Nil.Token[] memory _tokens
    ) public onlyExternal {
        uint256 length = _tokens.length;
        for (uint256 i = 0; i < length; i++) {
            Nil.Token memory tkn = _tokens[i];
            s_allowances[_spender][tkn.id] = tkn.amount;
        }
    }

    function transfer(
        Nil.Token[] memory _tokens,
        address _recepient
    ) public onlyInternal {
        uint256 length = _tokens.length;
        for (uint i = 0; i < length; i++) {
            Nil.Token memory tkn = _tokens[i];
            require(
                s_allowances[msg.sender][tkn.id] >= tkn.amount,
                "Transfer more than allowed"
            );
            s_allowances[msg.sender][tkn.id] -= tkn.amount;
        }

        Nil.asyncCall(
            _recepient,
            address(this),
            address(this),
            gasleft(),
            Nil.FORWARD_NONE,
            false,
            0,
            _tokens,
            ""
        );
    }

    function send(bytes calldata _message) public onlyExternal {
        Nil.sendMessage(gasleft(), _message);
    }

    function asyncCall(
        address _dst,
        address _refundTo,
        address _bounceTo,
        uint256 _gas,
        bool _deploy,
        Nil.Token[] memory _tokens,
        uint256 _value,
        bytes calldata _callData
    ) public onlyExternal {
        bool success = Nil.asyncCall(
            _dst,
            _refundTo,
            _bounceTo,
            _gas,
            Nil.FORWARD_NONE,
            _deploy,
            _value,
            _tokens,
            _callData
        );
        require(success, "asyncCall failed");
    }

    function syncCall(
        address _dst,
        uint256 _gas,
        uint256 _value,
        bytes memory _call_data
    ) public onlyExternal {
        (bool success, ) = _dst.call{value: _value, gas: _gas}(_call_data);
        require(success, "Call failed");
    }

    function verifyExternal(
        uint256 _hash,
        bytes calldata _signature
    ) external view returns (bool) {
        return Nil.validateSignature(s_pubkey, _hash, _signature);
    }
}
