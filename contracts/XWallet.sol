// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@nilfoundation/smart-contracts/contracts/NilCurrencyBase.sol";
import "@nilfoundation/smart-contracts/contracts/Wallet.sol";
import "./interfaces/IXWallet.sol";

contract XWallet is IXWallet, Wallet {
    mapping(address spender => mapping(uint256 tokenId => uint256 amount)) private s_allowances;

    constructor(bytes memory _pubkey) payable Wallet(_pubkey) {}

    function allowance(address _spender, uint256 _token) public view returns (uint256) {
        return s_allowances[_spender][_token];
    }

    function approve(address _spender, Nil.Token[] memory _tokens) public onlyExternal {
        uint256 length = _tokens.length;
        for (uint256 i = 0; i < length; i++) {
            Nil.Token memory tkn = _tokens[i];
            s_allowances[_spender][tkn.id] = tkn.amount;
            emit Approval(_spender, tkn.id, tkn.amount);
        }
    }

    // rename to approvedTransfer? transferFrom?
    function transfer(Nil.Token[] memory _tokens, address _recepient) public onlyInternal {
        uint256 length = _tokens.length;
        for (uint i = 0; i < length; i++) {
            Nil.Token memory tkn = _tokens[i];
            require(s_allowances[msg.sender][tkn.id] >= tkn.amount, "Transfer more than allowed");
            s_allowances[msg.sender][tkn.id] -= tkn.amount;
        }

        Nil.asyncCallWithTokens(
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
}
