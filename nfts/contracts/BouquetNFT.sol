// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// A minimal single-supply ERC-721 for the Bouquet artifact.
// The tokenURI is provided at deploy time (recommended: data:application/json;base64,<...>)
contract BouquetNFT is ERC721URIStorage, Ownable {
    uint256 public constant TOKEN_ID = 1;

    constructor(string memory tokenUri) ERC721("Swan Bouquet", "SBOUQ") Ownable(msg.sender) {
        _safeMint(msg.sender, TOKEN_ID);
        _setTokenURI(TOKEN_ID, tokenUri);
    }
}

