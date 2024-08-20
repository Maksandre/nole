// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IMinter {
    function create(uint256 amount, address owner, string memory name, address sendTo) external payable returns (bool);

    function getIdByName(string memory name) external view returns (uint256);
}
