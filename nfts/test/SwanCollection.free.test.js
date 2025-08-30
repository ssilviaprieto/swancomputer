const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwanCollection (ERC-1155, free mint)", function () {
  let swanCollection;
  let owner;
  let player1;
  let player2;

  // Artifact IDs
  const ARTIFACT_ID_0 = 0; // Bouquet
  const ARTIFACT_ID_1 = 1; // Next artifact
  const ARTIFACT_ID_2 = 2;
  const ARTIFACT_ID_3 = 3;

  // Informational prices (not enforced)
  const ARTIFACT_PRICE_0 = 0n;
  const ARTIFACT_PRICE_1 = ethers.parseEther("200");
  const ARTIFACT_PRICE_2 = ethers.parseEther("300");
  const ARTIFACT_PRICE_3 = ethers.parseEther("400");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const SwanCollection = await ethers.getContractFactory("SwanCollection");
    swanCollection = await SwanCollection.deploy();
    await swanCollection.waitForDeployment();

    // Set token metadata for testing
    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_0,
      "Bouquet",
      "This bouquet will help you make the swans reveal their secrets to you with its enchanting smell. It may be used anytime.",
      "https://swan.computer/artifacts/bouquet.png",
      0, // level required
      ARTIFACT_PRICE_0
    );

    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_1,
      "Second Artifact",
      "This is the second artifact",
      "https://swan.computer/artifacts/1.png",
      1, // level required
      ARTIFACT_PRICE_1
    );

    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_2,
      "Third Artifact",
      "This is the third artifact",
      "https://swan.computer/artifacts/2.png",
      2,
      ARTIFACT_PRICE_2
    );

    await swanCollection.setTokenMetadata(
      ARTIFACT_ID_3,
      "Fourth Artifact",
      "This is the fourth artifact",
      "https://swan.computer/artifacts/3.png",
      3,
      ARTIFACT_PRICE_3
    );
  });

  describe("Artifact Minting and Levels", function () {
    it("Mints bouquet (id 0) free and increments level to 1", async function () {
      expect(await swanCollection.playerLevel(player1.address)).to.equal(0);
      await expect(swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0))
        .to.emit(swanCollection, "ArtifactMinted")
        .withArgs(player1.address, ARTIFACT_ID_0, ARTIFACT_PRICE_0);

      expect(await swanCollection.balanceOf(player1.address, ARTIFACT_ID_0)).to.equal(1);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
    });

    it("Prevents minting higher level artifacts before reaching required level", async function () {
      await expect(swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_1))
        .to.be.revertedWith("Level too low");
    });

    it("Allows sequential minting with level progression (0->1->2->3)", async function () {
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_1);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(2);
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_2);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(3);
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_3);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(4);
    });

    it("Allows re-minting the same artifact without increasing level twice", async function () {
      expect(await swanCollection.playerLevel(player1.address)).to.equal(0);
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
      await swanCollection.connect(player1).mintArtifact(ARTIFACT_ID_0);
      expect(await swanCollection.playerLevel(player1.address)).to.equal(1);
      expect(await swanCollection.balanceOf(player1.address, ARTIFACT_ID_0)).to.equal(2);
    });
  });

  describe("URI Generation", function () {
    it("Returns metadata as data: URI with expected fields", async function () {
      const tokenURI = await swanCollection.uri(ARTIFACT_ID_0);
      expect(tokenURI).to.include("data:application/json;base64,");
      const base64Data = tokenURI.split("data:application/json;base64,")[1];
      const jsonData = JSON.parse(Buffer.from(base64Data, "base64").toString());
      expect(jsonData.name).to.equal("Bouquet");
      expect(jsonData.level).to.equal("0");
      expect(jsonData.price).to.equal(ARTIFACT_PRICE_0.toString());
    });

    it("Reverts for non-existent token ID", async function () {
      await expect(swanCollection.uri(999)).to.be.revertedWith("Metadata not set for this token");
    });
  });

  describe("Events", function () {
    it("Emits TokenMetadataSet when setting metadata", async function () {
      await expect(swanCollection.setTokenMetadata(99, "New", "Desc", "image-url", 5, 0))
        .to.emit(swanCollection, "TokenMetadataSet")
        .withArgs(99, "New", 5, 0);
    });
  });
});

