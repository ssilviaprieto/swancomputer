// contracts/SwanCollection.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./SwanERC20Token.sol";

contract SwanCollection is ERC1155, Ownable {
    // Reference to the ERC20 SWAN token
    SwanERC20Token public swanToken;

    // Mapping to track player levels
    mapping(address => uint256) public playerLevel;

    // Struct for token metadata
    struct TokenMetadata {
        string name;
        string description;
        string image;
        uint256 level;
        uint256 price;
    }

    // Mapping for token metadata
    mapping(uint256 => TokenMetadata) public tokenMetadata;

    // Events
    event TokenMetadataSet(uint256 indexed tokenId, string name, uint256 level, uint256 price);
    event ArtifactMinted(address indexed player, uint256 indexed artifactId, uint256 price);
    event PlayerLevelIncreased(address indexed player, uint256 newLevel);
    event TokensWithdrawn(address indexed owner, uint256 amount);

    constructor(address _swanTokenAddress) ERC1155("") Ownable(msg.sender) {
        require(_swanTokenAddress != address(0), "Invalid token address");
        swanToken = SwanERC20Token(_swanTokenAddress);
    }

    // Function to mint artifacts when players find the right command
    function mintArtifact(uint256 artifactId) external {
        // Check artifact exists
        require(bytes(tokenMetadata[artifactId].name).length > 0, "Artifact does not exist");

        // Verify the player has the required level
        uint256 requiredLevel = tokenMetadata[artifactId].level;
        require(playerLevel[msg.sender] >= requiredLevel, "Level too low");

        // Get price for the token
        uint256 price = tokenMetadata[artifactId].price;
        require(swanToken.balanceOf(msg.sender) >= price, "Not enough SWAN tokens");

        // Update player level if this is their current level artifact
        if (playerLevel[msg.sender] == requiredLevel) {
            playerLevel[msg.sender]++;
            emit PlayerLevelIncreased(msg.sender, playerLevel[msg.sender]);
        }

        // Transfer the SWAN tokens from player to this contract
        bool transferSuccess = swanToken.transferFrom(msg.sender, address(this), price);
        require(transferSuccess, "Token transfer failed");

        // Mint the artifact
        _mint(msg.sender, artifactId, 1, "");

        emit ArtifactMinted(msg.sender, artifactId, price);
    }

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

    // Owner can withdraw SWAN tokens from the contract
    function withdrawSwanTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(swanToken.balanceOf(address(this)) >= amount, "Insufficient balance");

        bool success = swanToken.transfer(owner(), amount);
        require(success, "Transfer failed");

        emit TokensWithdrawn(owner(), amount);
    }
}
