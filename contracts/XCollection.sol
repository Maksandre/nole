// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./interfaces/ICollection.sol";
import "./XToken.sol";

contract XCollection is ICollection {
    string private s_collectionName;
    string private s_collectionSymbol;

    mapping(uint256 tokenId => address tokenAddress) s_tokens;

    constructor(string memory _collectionName, string memory _symbol) {
        s_collectionName = _collectionName;
        s_collectionSymbol = _symbol;
    }

    function name() external view override returns (string memory) {
        return s_collectionName;
    }

    function symbol() external view override returns (string memory) {
        return s_collectionSymbol;
    }

    function getTokenAddress(uint256 tokenId) public view returns (address) {
        return s_tokens[tokenId];
    }

    function mint(address _to, uint256 _tokenId) public {
        if (s_tokens[_tokenId] != address(0)) revert Collection__TokenMinted();

        XToken newToken = new XToken(_to, s_collectionSymbol, _tokenId, address(this));
        s_tokens[_tokenId] = address(newToken);
    }
}
