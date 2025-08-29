const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwanCollection", function () {
  let swanToken;
  let swanCollection;
  let owner;
  let player1;
  let player2;

  // Constants for artifact test data
  const ARTIFACT_ID_0 = 0; // First artifact with ID 0
  const ARTIFACT_ID_1 = 1; // Second artifact with ID 1
  const ARTIFACT_ID_2 = 2; // Third artifact with ID 2
  const ARTIFACT_ID_3 = 3; // Fourth artifact with ID 3
  const ARTIFACT_PRICE_0 = ethers.parseEther("100");
  const ARTIFACT_PRICE_1 = ethers.parseEther("200");
  const ARTIFACT_PRICE_2 = ethers.parseEther("300");
  const ARTIFACT_PRICE_3 = ethers.parseEther("400");
  const PLAYER_INITIAL_BALANCE = ethers.parseEther("1000");

  beforeEach(async function () {
    // Get signers (accounts)
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy the Swan ERC20 token
    const SwanERC20Token = await ethers.getContractFactory("SwanERC20Token");
    swanToken = await SwanERC20Token.deploy();
    await swanToken.waitForDeployment();

    // Deploy the SwanCollection with the token address
    const SwanCollection = await ethers.getContractFactory("SwanCollection");
    swanCollection = await SwanCollection.deploy(await swanToken.getAddress());
    await swanCollection.waitForDeployment();

    // Set token metadata for testing
    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_0,
      "First Artifact",
      "This is the first artifact",
      "https://swan.computer/artifacts/0.png",
      0, // level
      ARTIFACT_PRICE_0
    );

    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_1,
      "Second Artifact",
      "This is the second artifact",
      "https://swan.computer/artifacts/1.png",
      1, // level
      ARTIFACT_PRICE_1
    );

    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_2,
      "Third Artifact",
      "This is the third artifact",
      "https://swan.computer/artifacts/2.png",
      2, // level
      ARTIFACT_PRICE_2
    );

    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_3,
      "Fourth Artifact",
      "This is the fourth artifact",
      "https://swan.computer/artifacts/3.png",
      3, // level
      ARTIFACT_PRICE_3
    );

    // Mint some SWAN tokens to player1 for testing
    await swanToken.mint(player1.address, PLAYER_INITIAL_BALANCE);

    // Approve collection contract to spend player1's tokens
    await swanToken.connect(player1).approve(await swanCollection.getAddress(), PLAYER_INITIAL_BALANCE);
  });

  describe("Constructor Validation", function () {
    it("Should revert deployment with zero address for token", async function () {
      const SwanCollection = await ethers.getContractFactory("SwanCollection");
      await expect(
        SwanCollection.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token address");
    });
  });

  describe("Token Setup", function () {
    it("Should have the correct Swan ERC20 Token address", async function () {
      const tokenAddress = await swanCollection.swanToken();
      expect(tokenAddress).to.equal(await swanToken.getAddress());
    });

    it("Should mint SWAN tokens to an address", async function () {
      // Owner mints tokens to player2
      await swanToken.mint(player2.address, ethers.parseEther("500"));

      // Check the balance
      const balance = await swanToken.balanceOf(player2.address);
      expect(balance).to.equal(ethers.parseEther("500"));
    });
  });

  describe("Artifact Minting", function () {
    it("Should allow minting artifact 0 with sufficient SWAN tokens", async function () {
      // Check initial balances
      const initialSwanBalance = await swanToken.balanceOf(player1.address);
      expect(initialSwanBalance).to.equal(PLAYER_INITIAL_BALANCE);

      // Mint artifact 0
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Check artifact was received
      const artifactBalance = await swanCollection.balanceOf(player1.address, ARTIFACT_ID_0);
      expect(artifactBalance).to.equal(1);

      // Check SWAN tokens were transferred
      const finalSwanBalance = await swanToken.balanceOf(player1.address);
      const expectedBalance = PLAYER_INITIAL_BALANCE - ARTIFACT_PRICE_0;
      expect(finalSwanBalance).to.equal(expectedBalance);

      // Check contract's token balance
      const contractBalance = await swanToken.balanceOf(await swanCollection.getAddress());
      expect(contractBalance).to.equal(ARTIFACT_PRICE_0);
    });

    it("Should update player level after minting an artifact", async function () {
      // Check initial level
      const initialLevel = await swanCollection.playerLevel(player1.address);
      expect(initialLevel).to.equal(0);

      // Mint artifact 0
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Check player level increased
      const newLevel = await swanCollection.playerLevel(player1.address);
      expect(newLevel).to.equal(1);
    });

    it("Should fail when minting higher level artifact without required level", async function () {
      // Try to mint artifact 1 without having required level
      await expect(
        swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_1)
      ).to.be.revertedWith("Level too low");
    });

    it("Should allow sequential artifact minting with level progression", async function () {
      // Start at level 0 (default)
      expect(await swanCollection.playerLevel(player1.address)).to.equal(0);

      // Mint artifact 0 (requires level 0)
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Player should now be level 1
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
      expect(await swanCollection.balanceOf(player1.address, ARTIFACT_ID_0)).to.equal(1);

      // Mint artifact 1 (requires level 1)
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_1);

      // Player should now be level 2
      expect(await swanCollection.playerLevel(player1.address)).to.equal(2);
      expect(await swanCollection.balanceOf(player1.address, ARTIFACT_ID_1)).to.equal(1);

      // Mint artifact 2 (requires level 2)
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_2);

      // Player should now be level 3
      expect(await swanCollection.playerLevel(player1.address)).to.equal(3);
      expect(await swanCollection.balanceOf(player1.address, ARTIFACT_ID_2)).to.equal(1);

      // Mint artifact 3 (requires level 3)
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_3);

      // Player should now be level 4
      expect(await swanCollection.playerLevel(player1.address)).to.equal(4);
      expect(await swanCollection.balanceOf(player1.address, ARTIFACT_ID_3)).to.equal(1);

      // Check final balance after minting all artifacts
      const expectedFinalBalance = PLAYER_INITIAL_BALANCE
                                 - ARTIFACT_PRICE_0
                                 - ARTIFACT_PRICE_1
                                 - ARTIFACT_PRICE_2
                                 - ARTIFACT_PRICE_3;
      expect(await swanToken.balanceOf(player1.address)).to.equal(expectedFinalBalance);
    });

    it("Should fail when player doesn't have enough SWAN tokens", async function () {
      // Mint some tokens to player2 but not enough
      const smallAmount = ethers.parseEther("50"); // Less than artifact price
      await swanToken.mint(player2.address, smallAmount);
      await swanToken.connect(player2).approve(await swanCollection.getAddress(), smallAmount);

      // Try to mint artifact 0 with insufficient funds
      await expect(
        swanCollection.connect(player2).mintArtifact(ARTIFACT_ID_0)
      ).to.be.revertedWith("Not enough SWAN tokens");
    });

    it("Should verify correct metadata for all artifacts", async function () {
      // Check metadata for artifact 0
      const tokenURI0 = await swanCollection.uri(ARTIFACT_ID_0);
      const jsonData0 = JSON.parse(Buffer.from(tokenURI0.split("data:application/json;base64,")[1], "base64").toString());
      expect(jsonData0.name).to.equal("First Artifact");
      expect(jsonData0.level).to.equal("0");
      expect(jsonData0.price).to.equal(ARTIFACT_PRICE_0.toString());

      // Check metadata for artifact 1
      const tokenURI1 = await swanCollection.uri(ARTIFACT_ID_1);
      const jsonData1 = JSON.parse(Buffer.from(tokenURI1.split("data:application/json;base64,")[1], "base64").toString());
      expect(jsonData1.name).to.equal("Second Artifact");
      expect(jsonData1.level).to.equal("1");
      expect(jsonData1.price).to.equal(ARTIFACT_PRICE_1.toString());

      // Check metadata for artifact 2
      const tokenURI2 = await swanCollection.uri(ARTIFACT_ID_2);
      const jsonData2 = JSON.parse(Buffer.from(tokenURI2.split("data:application/json;base64,")[1], "base64").toString());
      expect(jsonData2.name).to.equal("Third Artifact");
      expect(jsonData2.level).to.equal("2");
      expect(jsonData2.price).to.equal(ARTIFACT_PRICE_2.toString());

      // Check metadata for artifact 3
      const tokenURI3 = await swanCollection.uri(ARTIFACT_ID_3);
      const jsonData3 = JSON.parse(Buffer.from(tokenURI3.split("data:application/json;base64,")[1], "base64").toString());
      expect(jsonData3.name).to.equal("Fourth Artifact");
      expect(jsonData3.level).to.equal("3");
      expect(jsonData3.price).to.equal(ARTIFACT_PRICE_3.toString());
    });

    // Additional tests for artifact minting
    it("Should allow minting the same artifact multiple times if player has the required level", async function () {
      // Mint artifact 0 first time
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Mint artifact 0 second time
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Check player has 2 of the same artifact
      const artifactBalance = await swanCollection.balanceOf(player1.address, ARTIFACT_ID_0);
      expect(artifactBalance).to.equal(2);
    });

    it("Should only increment level once per level-appropriate artifact", async function () {
      // Player starts at level 0
      expect(await swanCollection.playerLevel(player1.address)).to.equal(0);

      // Mint artifact 0 first time - should increase to level 1
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);

      // Mint artifact 0 again - level should remain 1 (not increase to 2)
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
    });

    it("Should measure gas cost of artifact minting", async function () {
      const tx = await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      const receipt = await tx.wait();
      console.log(`Gas used for minting: ${receipt.gasUsed}`);

      // We can set a gas threshold and assert against it
      expect(receipt.gasUsed).to.be.lessThan(300000); // Adjust threshold as needed
    });
  });

  describe("URI Generation", function () {
    it("Should return the correct token URI with metadata", async function () {
      const tokenURI = await swanCollection.uri(ARTIFACT_ID_0);
      expect(tokenURI).to.include("data:application/json;base64,");

      // Decode the base64 part to check the JSON content
      const base64Data = tokenURI.split("data:application/json;base64,")[1];
      const jsonData = JSON.parse(Buffer.from(base64Data, "base64").toString());

      expect(jsonData.name).to.equal("First Artifact");
      expect(jsonData.description).to.equal("This is the first artifact");
      expect(jsonData.image).to.equal("https://swan.computer/artifacts/0.png");
      expect(jsonData.level).to.equal("0");
      expect(jsonData.price).to.equal(ARTIFACT_PRICE_0.toString());
    });

    it("Should fail for non-existent token ID", async function () {
      const nonExistentId = 999;
      await expect(swanCollection.uri(nonExistentId)).to.be.revertedWith("Metadata not set for this token");
    });
  });

  describe("Token Withdrawal", function () {
    it("Should allow owner to withdraw SWAN tokens", async function () {
      // First mint an artifact to get tokens in the contract
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      const initialContractBalance = await swanToken.balanceOf(await swanCollection.getAddress());
      const initialOwnerBalance = await swanToken.balanceOf(owner.address);

      // Owner withdraws tokens
      await swanCollection.connect(owner).withdrawSwanTokens(ARTIFACT_PRICE_0);

      // Check balances after withdrawal
      const finalContractBalance = await swanToken.balanceOf(await swanCollection.getAddress());
      const finalOwnerBalance = await swanToken.balanceOf(owner.address);

      expect(finalContractBalance).to.equal(0);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + ARTIFACT_PRICE_0);
    });

    it("Should not allow non-owners to withdraw tokens", async function () {
      await expect(
        swanCollection.connect(player1).withdrawSwanTokens(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(swanCollection, "OwnableUnauthorizedAccount");
    });

    // Additional tests for token withdrawal
    it("Should fail to withdraw more tokens than available in contract", async function () {
      // Mint an artifact to get tokens in the contract
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Try to withdraw more than available
      const excessAmount = ARTIFACT_PRICE_0 + ethers.parseEther("100");
      await expect(
        swanCollection.withdrawSwanTokens(excessAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail to withdraw zero tokens", async function () {
      await expect(
        swanCollection.withdrawSwanTokens(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should handle partial withdrawals", async function () {
      // Mint artifact to get tokens in contract
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      const initialContractBalance = await swanToken.balanceOf(await swanCollection.getAddress());
      const withdrawAmount = initialContractBalance / 2n;

      // Withdraw half the tokens
      await swanCollection.withdrawSwanTokens(withdrawAmount);

      // Check balances
      const finalContractBalance = await swanToken.balanceOf(await swanCollection.getAddress());
      expect(finalContractBalance).to.equal(initialContractBalance - withdrawAmount);
    });
  });

  describe("Token Metadata Management", function () {
    it("Should prevent setting metadata with an empty name", async function () {
      await expect(
        swanCollection.setTokenMetadata(
          100, "", "Description", "image-url", 1, ethers.parseEther("100")
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should prevent setting metadata with an empty image", async function () {
      await expect(
        swanCollection.setTokenMetadata(
          100, "Name", "Description", "", 1, ethers.parseEther("100")
        )
      ).to.be.revertedWith("Image cannot be empty");
    });

    it("Should allow updating existing token metadata", async function () {
      // Update the metadata for artifact 0
      const newName = "Updated Artifact";
      const newPrice = ethers.parseEther("150");

      await swanCollection.setTokenMetadata(
        ARTIFACT_ID_0,
        newName,
        "Updated description",
        "https://new-image-url.png",
        0,
        newPrice
      );

      // Verify the updated metadata
      const tokenURI = await swanCollection.uri(ARTIFACT_ID_0);
      const jsonData = JSON.parse(Buffer.from(tokenURI.split("data:application/json;base64,")[1], "base64").toString());

      expect(jsonData.name).to.equal(newName);
      expect(jsonData.price).to.equal(newPrice.toString());
    });
  });

  describe("Event Emissions", function () {
    it("Should emit ArtifactMinted event when minting an artifact", async function () {
      await expect(swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0))
        .to.emit(swanCollection, "ArtifactMinted")
        .withArgs(player1.address, ARTIFACT_ID_0, ARTIFACT_PRICE_0);
    });

    it("Should emit PlayerLevelIncreased event when level increases", async function () {
      await expect(swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0))
        .to.emit(swanCollection, "PlayerLevelIncreased")
        .withArgs(player1.address, 1);
    });

    it("Should emit TokenMetadataSet event when setting token metadata", async function () {
      await expect(swanCollection.setTokenMetadata(
        999, "New Artifact", "Description", "image-url", 5, ethers.parseEther("500")
      ))
        .to.emit(swanCollection, "TokenMetadataSet")
        .withArgs(999, "New Artifact", 5, ethers.parseEther("500"));
    });

    it("Should emit TokensWithdrawn event when withdrawing tokens", async function () {
      // First mint to get tokens in the contract
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);

      // Check event emission on withdrawal
      await expect(swanCollection.withdrawSwanTokens(ARTIFACT_PRICE_0))
        .to.emit(swanCollection, "TokensWithdrawn")
        .withArgs(owner.address, ARTIFACT_PRICE_0);
    });
  });

  describe("Multi-player Scenarios", function () {
    it("Should handle multiple players with different levels", async function () {
      // Setup player2 with tokens and approvals
      await swanToken.mint(player2.address, PLAYER_INITIAL_BALANCE);
      await swanToken.connect(player2).approve(await swanCollection.getAddress(), PLAYER_INITIAL_BALANCE);

      // Player1 advances to level 2
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_1);

      // Player2 advances to level 1
      await swanCollection.connect(player2).mintArtifact(ARTIFACT_ID_0);

      // Verify levels
      expect(await swanCollection.playerLevel(player1.address)).to.equal(2);
      expect(await swanCollection.playerLevel(player2.address)).to.equal(1);

      // Player1 can mint level 2 artifact, but player2 can't
      await expect(swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_2)).not.to.be.reverted;
      await expect(swanCollection.connect(player2).mintArtifact(ARTIFACT_ID_2)).to.be.revertedWith("Level too low");
    });

    it("Should track correct individual player levels", async function () {
      // Setup player2 with tokens and approvals
      await swanToken.mint(player2.address, PLAYER_INITIAL_BALANCE);
      await swanToken.connect(player2).approve(await swanCollection.getAddress(), PLAYER_INITIAL_BALANCE);

      // Both players mint the level 0 artifact
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      await swanCollection.connect(player2).mintArtifact(ARTIFACT_ID_0);

      // Check both players are now level 1
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
      expect(await swanCollection.playerLevel(player2.address)).to.equal(1);

      // Player1 mints another artifact to reach level 2
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_1);

      // Verify player1 is level 2 but player2 is still level 1
      expect(await swanCollection.playerLevel(player1.address)).to.equal(2);
      expect(await swanCollection.playerLevel(player2.address)).to.equal(1);
    });
  });

  describe("Non-existent Artifacts", function () {
    it("Should fail when trying to mint a non-existent artifact", async function () {
      const nonExistentId = 999;
      await expect(
        swanCollection.connect(player1).mintArtifact(nonExistentId)
      ).to.be.revertedWith("Artifact does not exist");
    });
  });
});
