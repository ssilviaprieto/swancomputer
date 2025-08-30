// contracts/SwanCollection.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// SwanCollection is an ERC-1155 collection for in-game artifacts.
// ERC20 SWAN token has been removed. Minting is free for now.
// Bouquet is tokenId 0. Additional artifacts use sequential IDs.
contract SwanCollection is ERC1155, Ownable {
    // Mapping to track player levels
    mapping(address => uint256) public playerLevel;

    // Struct for token metadata
    struct TokenMetadata {
        string name;
        string description;
        string image;
        uint256 level; // required player level
        uint256 price; // informational only (no payment enforced)
    }

    // Mapping for token metadata
    mapping(uint256 => TokenMetadata) public tokenMetadata;

    // Events
    event TokenMetadataSet(uint256 indexed tokenId, string name, uint256 level, uint256 price);
    event ArtifactMinted(address indexed player, uint256 indexed artifactId, uint256 price);
    event PlayerLevelIncreased(address indexed player, uint256 newLevel);

    constructor() ERC1155("") Ownable(msg.sender) {}

    // Internal mint logic
    function _mintArtifact(uint256 artifactId) internal {
        // Check artifact exists
        require(bytes(tokenMetadata[artifactId].name).length > 0, "Artifact does not exist");

        // Verify the player has the required level
        uint256 requiredLevel = tokenMetadata[artifactId].level;
        require(playerLevel[msg.sender] >= requiredLevel, "Level too low");

        // Update player level if this is their current level artifact
        if (playerLevel[msg.sender] == requiredLevel) {
            playerLevel[msg.sender]++;
            emit PlayerLevelIncreased(msg.sender, playerLevel[msg.sender]);
        }

        // Mint the artifact
        _mint(msg.sender, artifactId, 1, "");

        // Emit with informational price from metadata (may be zero)
        emit ArtifactMinted(msg.sender, artifactId, tokenMetadata[artifactId].price);
    }

    // Mint an artifact if the player meets the required level.
    // Free mint: no ERC20/ETH payment enforced.
    function mintArtifact(uint256 artifactId) external {
        _mintArtifact(artifactId);
    }

    // Note: No dedicated mintBouquet function; mint via mintArtifact(0)

    // Function to set token metadata
    function setTokenMetadata(
        uint256 tokenId,
        string memory name,
        string memory description,
        string memory image,
        uint256 level,
        uint256 price
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(image).length > 0, "Image cannot be empty");

        tokenMetadata[tokenId] = TokenMetadata(name, description, image, level, price);
        emit TokenMetadataSet(tokenId, name, level, price);
    }

    // Override URI function to return metadata as data URI
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(bytes(tokenMetadata[tokenId].name).length > 0, "Metadata not set for this token");

        TokenMetadata memory metadata = tokenMetadata[tokenId];
        string memory json = string.concat(
            '{"name":"', metadata.name, '",',
            '"description":"', metadata.description, '",',
            '"image":"', metadata.image, '",',
            '"level":"', Strings.toString(metadata.level), '",',
            '"price":"', Strings.toString(metadata.price), '"}'
        );
        string memory base64Json = Base64.encode(bytes(json));
        return string.concat("data:application/json;base64,", base64Json);
    }
}
