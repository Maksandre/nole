// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "../nilcore/Nil.sol";

interface IXWallet {
    function allowance(address _spender, uint256 _token) external view returns (uint256);

    function approve(address _spender, Nil.Token[] memory _tokens) external;

    function transfer(Nil.Token[] memory _tokens, address _recepient) external;
}
