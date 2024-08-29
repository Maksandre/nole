// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMinter {
    function create(uint256 amount, address owner, string memory name, address sendTo) external payable returns (bool);

    function getIdByName(string memory name) external view returns (uint256);

    function getName(uint256 id) external view returns (string memory);
}
