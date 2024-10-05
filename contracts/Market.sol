// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@nilfoundation/smart-contracts/contracts/NilCurrencyBase.sol";
import "@nilfoundation/smart-contracts/contracts/Nil.sol";
import {IXWallet} from "./interfaces/IXWallet.sol";
import {XToken} from "./XToken.sol";
import "./types/Order.sol";

contract Market is NilBase {
    mapping(uint256 nftId => Order) private s_orders;
    mapping(address => mapping(uint256 currencyId => uint256 balance)) private s_virtualBalance;

    function bounce(string calldata err) external payable {
        Nil.Token[] memory tokens = Nil.msgTokens();

        // TODO: hardcoded only one token
        s_virtualBalance[msg.sender][tokens[0].id] += tokens[0].amount;
    }

    constructor() {}

    /// @dev receive function is only for NFTs sent by transferFrom
    receive() external payable {
        // Get received currency and check only one attached
        Nil.Token memory attachedToken = _getAttachedCurrency();
        require(s_orders[attachedToken.id].price >= 0, "Received token is not NFT on sale");

        Order storage order = s_orders[attachedToken.id];

        // Get pendingBuyer and check it's balance
        require(order.buyer != address(0), "No pending buyers");
        require(s_virtualBalance[order.buyer][order.currencyId] >= order.price, "Buyer's virtual balance low");

        // Swap NFT and currency virtually
        s_virtualBalance[order.buyer][order.currencyId] -= order.price;
        s_virtualBalance[order.seller][order.currencyId] += order.price;
        s_virtualBalance[order.buyer][attachedToken.id] += attachedToken.amount;

        _withdrawAsync(order.buyer, attachedToken);
        _withdrawAsync(order.seller, Nil.Token(order.currencyId, order.price));
    }

    function put(uint256 _nftId, uint256 _currencyId, uint256 _price) public onlyInternal {
        // TODO: if wallet does not support approve/transferFrom it should be able to transfer token directly
        require(_checkAllowanceToMarket(msg.sender, _nftId, 1), "NFT is not approved");
        s_orders[_nftId] = Order(msg.sender, address(0), _currencyId, _price, OrderState.PLACED);
    }

    function buy(uint256 _nftId) external payable {
        Order storage order = s_orders[_nftId];
        require(order.price > 0, "Order not found");
        require(order.buyer == address(0), "Order has pending buyer");

        // Check order currency and price are eq to received tokens
        if (order.currencyId == 0) {
            // Order currency = native token
            require(msg.value == order.price, "Received amount is not equal to order's price");
        } else {
            // Order currenct = custom token
            Nil.Token memory attachedToken = _getAttachedCurrency();
            require(attachedToken.amount == order.price, "Received amount is not equal to order's price");
        }

        // Increase virtual balance
        s_virtualBalance[msg.sender][order.currencyId] += order.price;

        order.buyer = msg.sender;

        // init NFT transferFrom
        _transferFromAsync(order.seller, address(this), Nil.Token(_nftId, 1));
    }

    function withdraw(Nil.Token memory _token) external {
        _withdrawAsync(msg.sender, _token);
    }

    function getBalance(address _owner, uint256 _token) external view returns (uint256) {
        return s_virtualBalance[_owner][_token];
    }

    function getOrder(uint256 _nftId) external view returns (Order memory) {
        return s_orders[_nftId];
    }

    function getPendingBuyer(uint256 _nftId) external view returns (address) {
        return s_orders[_nftId].buyer;
    }

    function _withdrawAsync(address _to, Nil.Token memory _token) private {
        require(s_virtualBalance[_to][_token.id] >= _token.amount);
        s_virtualBalance[_to][_token.id] -= _token.amount;

        Nil.Token[] memory tokens = new Nil.Token[](1);
        tokens[0] = _token;

        // TODO: this function potentially leads to loosing funds
        // if async transfer will fail and there are not enough funds to pay for gas in bounce

        bytes memory context = abi.encodeWithSelector(this._proccessWithdrawResult.selector, _token);
        bytes memory callData = "";
        Nil.sendRequestWithTokens(_to, 0, tokens, Nil.ASYNC_REQUEST_MIN_GAS, context, callData);
        // Nil.asyncCall(_to, address(this), address(this), 0, Nil.FORWARD_REMAINING, false, 0, tokens, "");
    }

    function _proccessWithdrawResult(bool _success, bytes memory _returnData, bytes memory _context) public {
        if (_success) return;
        Nil.Token memory token = abi.decode(_context, (Nil.Token));
        s_virtualBalance[msg.sender][token.id] += token.amount;
    }

    function _transferFromAsync(address _from, address _to, Nil.Token memory _token) private {
        Nil.Token[] memory tokens = new Nil.Token[](1);
        tokens[0] = _token;

        return Nil.asyncCall(_from, address(this), 0, abi.encodeCall(IXWallet.transfer, (tokens, _to)));
    }

    function _checkAllowanceToMarket(address _from, uint256 _currencyId, uint256 _amount) private view returns (bool) {
        uint256 allowance = IXWallet(_from).allowance(address(this), _currencyId);
        return allowance >= _amount;
    }

    function _getAttachedCurrency() private returns (Nil.Token memory) {
        Nil.Token[] memory tokens = Nil.msgTokens();
        require(tokens.length == 1, "Multiple currencies are not supported");
        return tokens[0];
    }
}
