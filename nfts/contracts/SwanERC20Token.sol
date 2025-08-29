// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SwanERC20Token is ERC20, Ownable {
    // Maximum supply cap
    uint256 public immutable MAX_SUPPLY;

    // Event for easier tracking of minting operations
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("Swan Token", "SWAN") Ownable(msg.sender) {
        // Set maximum supply to 1B
        MAX_SUPPLY = 1_000_000_000 * 10**decimals();
    }

    // Only owner can mint additional tokens
    function mint(address to, uint256 amount) external onlyOwner {
        // Ensure we don't exceed maximum supply
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        require(to != address(0), "Cannot mint to zero address");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}
