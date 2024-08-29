// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./nilcore/Nil.sol";
import "./interfaces/IMinter.sol";

contract XToken is NilBase {
    IMinter constant MINTER = IMinter(Nil.MINTER_ADDRESS);

    address private s_collectionAddress;
    uint256 private s_tokenId;

    constructor(address _owner, string memory _name, uint256 _tokenId, address _collectionAddress) payable {
        bool success = Nil.asyncCall(
            Nil.MINTER_ADDRESS,
            address(0), // refundTo
            msg.sender, // bounceTo
            0, // gas
            Nil.FORWARD_REMAINING, // forwardKind
            false, // deploy
            0, // value
            abi.encodeCall(IMinter.create, (1, address(0), _name, _owner))
        );

        require(success);

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
