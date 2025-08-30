// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// ERC-721 for the Bouquet artifact with public mint().
// The same metadata URI is used for every token (edition-style).
contract BouquetNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    string public editionTokenURI;
    bool public mintOpen = true;

    constructor(string memory tokenUri) ERC721("Swan Bouquet", "SBOUQ") Ownable(msg.sender) {
        editionTokenURI = tokenUri;
    }

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
    }

    function setEditionTokenURI(string memory tokenUri) external onlyOwner {
        editionTokenURI = tokenUri;
    }

    function mint() external returns (uint256 tokenId) {
        require(mintOpen, "Mint closed");
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, editionTokenURI);
    }
}
