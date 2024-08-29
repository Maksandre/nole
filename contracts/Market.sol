// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IXWallet.sol";
import "./XToken.sol";
import "./nilcore/Nil.sol";
import "./types/Order.sol";

contract Market is NilBase {
    mapping(uint256 nftId => Order) private s_orders;
    mapping(address buyer => uint256 nftId) private s_pendingBuyers;
    mapping(address => mapping(uint256 currencyId => uint256 balance)) private s_virtualBalance;

    function bounce(string calldata err) external payable {
        Nil.Token[] memory tokens = Nil.msgTokens();

        s_virtualBalance[msg.sender][tokens[0].id] += tokens[0].amount;
    }

    constructor() {}

    receive() external payable {
        // Get received currency and check only one attached
        Nil.Token[] memory tokens = Nil.msgTokens();
        require(tokens.length == 1, "Multiple currencies are not supported");
        Nil.Token memory receivedToken = tokens[0];

        // If received currency is NFT on sale
        if (s_orders[receivedToken.id].state == OrderState.BUY_CURRENCY_RECEIVED) {
            // msg.sender is SELLER
            // receivedToken is NFT
            require(receivedToken.amount == 1, "NFT amount should be 1");
            Order storage order = s_orders[receivedToken.id];
            // change order status
            order.state = OrderState.SWAPPED;

            // Swap NFT and currency virtually.
            // NFT goes to buyer, currency moves to seller
            s_virtualBalance[msg.sender][order.currencyId] += order.price;
            s_virtualBalance[order.buyer][order.currencyId] -= order.price;
            s_virtualBalance[order.buyer][receivedToken.id] += 1;
        } else {
            // TODO check allowance of an NFT and if it is not allowed - refund and remove Order
            // msg.sender is BUYER
            uint256 tokenId = s_pendingBuyers[msg.sender];
            require(tokenId != 0, "Sender is not a buyer");

            // Check if msg.sender is buyer
            // and attached token is required one
            Order storage order = s_orders[tokenId];
            require(order.currencyId == receivedToken.id);
            require(order.price == receivedToken.amount);

            // Top-up buyer's virtual balance
            s_virtualBalance[msg.sender][receivedToken.id] += receivedToken.amount;
            order.state = OrderState.BUY_CURRENCY_RECEIVED;
            order.buyer = msg.sender;

            // Make async transfer of NFT from seller's wallet
            _transferFromAsync(order.seller, address(this), Nil.Token(tokenId, 1));
        }

        revert();
    }

    function put(uint256 _nftId, uint256 _currencyId, uint256 _price) public onlyInternal {
        // TODO uncoment when STATICCALL fixed: require(_checkAllowanceToMarket(msg.sender, _nftId, 1), "NFT is not approved");
        s_orders[_nftId] = Order(msg.sender, address(0), _currencyId, _price, OrderState.PLACED);
    }

    function initBuy(uint256 _nftId) external {
        Order storage order = s_orders[_nftId];
        require(order.price > 0, "Order not found");
        s_pendingBuyers[msg.sender] = _nftId;

        // TODO uncoment when STATICCALL fixed: require(_checkAllowanceToMarket(msg.sender, order.currencyId, order.price), "Approved value low");
        bool success = _transferFromAsync(msg.sender, address(this), Nil.Token(_nftId, order.price));
        require(success, "Buy is not initiated");
    }

    function withdraw() external {
        revert("Not implemented");
    }

    function getBalance(address _owner, uint256 _token) external view returns (uint256) {
        return s_virtualBalance[_owner][_token];
    }

    function getOrder(uint256 _nftId) external view returns (Order memory) {
        return s_orders[_nftId];
    }

    function getPendingBuyer(address _buyer) external view returns (uint256) {
        return s_pendingBuyers[_buyer];
    }

    function _transferFromAsync(address _from, address _to, Nil.Token memory _token) private returns (bool) {
        Nil.Token[] memory tokens = new Nil.Token[](1);
        tokens[0] = _token;

        return Nil.asyncCall(_from, address(this), 0, abi.encodeCall(IXWallet.transfer, (tokens, _to)));
    }

    function _checkAllowanceToMarket(address _from, uint256 _currencyId, uint256 _amount) private view returns (bool) {
        uint256 allowance = IXWallet(_from).allowance(address(this), _currencyId);
        return allowance >= _amount;
    }
}
