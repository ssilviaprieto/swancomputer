// This script encrypts/decrypts your diary entries with passwords
// Each password will decrypt to different content
// Run it with Node.js:
// To encrypt: node encrypt-entries.js encrypt [master_password] path/to/entry.txt
// To decrypt: node encrypt-entries.js decrypt password output.txt
//            or node encrypt-entries.js decrypt master_password output/  (recreates all files)

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

function getEncryptedPath(outputPath) {
  if (outputPath) {
    return path.resolve(process.cwd(), outputPath);
  }
  return path.resolve(__dirname, "./diary/encrypted-entry.js.enc");
}

// Simplified encryption configuration
const CONFIG = {
  iterations: 1000000,
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
  tagLength: 16,
};

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(
    password,
    salt,
    CONFIG.iterations,
    CONFIG.keyLength,
    "sha512"
  );
}

function encryptContent(content, password, salt, iv) {
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(content, "utf8"),
    cipher.final(),
  ]);
  return { encrypted, authTag: cipher.getAuthTag() };
}

async function encryptEntries(masterPassword, entryPath, outputPath) {
  // Check if entry file exists
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Entry file not found: ${entryPath}`);
  }

  // Read the entry content
  const entryContent = fs.readFileSync(entryPath, "utf8");
  const filename = path.basename(entryPath);
  
  // Create entries array with the entry file
  const entries = [
    { 
      password: "default", // Default password for the entry
      content: entryContent,
      filename 
    }
  ];

  // Use the same salt and IV for all encryptions
  const salt = crypto.randomBytes(CONFIG.saltLength);
  const iv = crypto.randomBytes(CONFIG.ivLength);

  // If master password provided, add master entry with all files info
  if (masterPassword) {
    const masterContent = JSON.stringify(
      entries.map((e) => ({
        filename: e.filename,
        content: e.content,
      }))
    );
    entries.push({ password: masterPassword, content: masterContent });
  }

  // Encrypt each content with its password
  const encryptedParts = entries.map(({ password, content }) => {
    const { encrypted, authTag } = encryptContent(content, password, salt, iv);
    return { encrypted, authTag };
  });

  // Combine all encrypted parts
  // Format: [salt][iv][size1][enc1][tag1][size2][enc2][tag2]...
  const parts = [salt, iv];
  encryptedParts.forEach(({ encrypted, authTag }) => {
    // Add 4-byte size header for each part
    const sizeBuffer = Buffer.alloc(4);
    sizeBuffer.writeUInt32BE(encrypted.length);
    parts.push(sizeBuffer, encrypted, authTag);
  });

  const encryptedPath = getEncryptedPath(outputPath);
  
  // Ensure the diary directory exists
  const diaryDir = path.dirname(encryptedPath);
  if (!fs.existsSync(diaryDir)) {
    fs.mkdirSync(diaryDir, { recursive: true });
  }

  const result = Buffer.concat(parts);
  fs.writeFileSync(encryptedPath, result);

  console.log(`Encrypted entry saved to ${encryptedPath}`);
  console.log(`\nSecurity parameters:`);
  console.log(`- Key derivation: SHA-512`);
  console.log(`- Iterations: ${CONFIG.iterations.toLocaleString()}`);
  console.log(
    `- Salt/Key/IV lengths: ${CONFIG.saltLength * 8}/${CONFIG.keyLength * 8}/${
      CONFIG.ivLength * 8
    } bits`
  );
  console.log(`- Number of encrypted parts: ${entries.length}`);
}

async function decryptEntries(password, inputPath, outputPath) {
  const encryptedPath = getEncryptedPath(inputPath);
  
  if (!fs.existsSync(encryptedPath)) {
    console.error(`Encrypted file not found: ${encryptedPath}`);
    process.exit(1);
  }

  const encryptedData = fs.readFileSync(encryptedPath);

  // Extract common components
  let offset = 0;
  const salt = encryptedData.slice(offset, (offset += CONFIG.saltLength));
  const iv = encryptedData.slice(offset, (offset += CONFIG.ivLength));

  const key = deriveKey(password, salt);
  const decryptedParts = [];

  // Try to decrypt each part
  while (offset < encryptedData.length) {
    try {
      // Read size of next encrypted part
      const size = encryptedData.readUInt32BE(offset);
      offset += 4;

      // Extract encrypted content and tag
      const encrypted = encryptedData.slice(offset, offset + size);
      offset += size;
      const authTag = encryptedData.slice(offset, offset + CONFIG.tagLength);
      offset += CONFIG.tagLength;

      // Try to decrypt this part
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      decryptedParts.push(decrypted);
    } catch (error) {
      // Try next part
      continue;
    }
  }

  if (decryptedParts.length === 0) {
    console.error("Decryption failed. Invalid password or corrupted file.");
    process.exit(1);
  }

  // If output is a directory, try to parse as master password result
  if (outputPath.endsWith("/")) {
    try {
      // Try to parse as JSON (master password result)
      const files = JSON.parse(decryptedParts[0]);

      // Ensure directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Write each file
      files.forEach(({ filename, content }) => {
        const outputFile = path.join(outputPath, filename);
        fs.writeFileSync(outputFile, content);
        console.log(`Decrypted ${filename} saved to ${outputFile}`);
      });
      return;
    } catch (e) {
      // Not master password result, fall through to single file
    }
  }

  // Normal single-file decryption
  fs.writeFileSync(outputPath, decryptedParts[0]);
  console.log(`Decrypted entry saved to ${outputPath}`);
}

const action = process.argv[2];
const args = process.argv.slice(3);

if (!action || !["encrypt", "decrypt"].includes(action)) {
  console.error(
    "Usage:\n" +
      "  Encrypt: node encrypt-entries.js encrypt [master_password] path/to/entry.txt\n" +
      "  Decrypt: node encrypt-entries.js decrypt password output.txt"
  );
  process.exit(1);
}

if (action === "encrypt") {
  const masterPassword = args[0]; // Optional master password
  const entryPath = args[1];
  const outputPath = args[2]; // Optional output path
  
  if (!entryPath) {
    console.error("Encrypt requires an entry file path");
    process.exit(1);
  }
  
  encryptEntries(masterPassword, entryPath, outputPath);
} else {
  const [password, inputPath, outputPath] = args;
  if (!password || !inputPath || !outputPath) {
    console.error("Decrypt requires password, input path, and output path");
    console.error(
      "Use directory path ending with / for master password to recreate all files"
    );
    process.exit(1);
  }
  decryptEntries(password, inputPath, outputPath);
}