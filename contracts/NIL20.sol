// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./nilcore/Nil.sol";

contract NIL20 is NilBase {
    constructor() {
        Nil.mintToken();
    }
}
