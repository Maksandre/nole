// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@nilfoundation/smart-contracts/contracts/Nil.sol";
import "@nilfoundation/smart-contracts/contracts/NilCurrencyBase.sol";

contract XToken is NilBase, NilCurrencyBase {
    address private s_collectionAddress;
    uint256 private s_tokenId;

    constructor(address _owner, string memory _name, uint256 _tokenId, address _collectionAddress) payable {
        mintCurrencyInternal(1);
        sendCurrencyInternal(_owner, getCurrencyId(), 1);

        s_collectionAddress = _collectionAddress;
        s_tokenId = _tokenId;
    }

    receive() external payable {}

    function collectionAddress() public view returns (address) {
        return s_collectionAddress;
    }

    function tokenId() public view returns (uint256) {
        return s_tokenId;
    }
}
