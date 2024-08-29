// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum OrderState {
    PLACED,
    BUY_INIT,
    BUY_CURRENCY_RECEIVED,
    SWAPPED
}

struct Order {
    address seller;
    address buyer;
    uint256 currencyId;
    uint256 price;
    OrderState state;
}
