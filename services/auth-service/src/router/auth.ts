import * as bip39 from "bip39";
import crypto from "crypto";
import { Router } from "express";
import { prisma } from "../config/db";
import { redis } from "../config/redis";
import { sendSMS } from "../config/twilio";

const router = Router();

// Helper function to generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to generate key pair
const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  return { publicKey, privateKey };
};

// Helper function to encrypt private key with seed phrase
const encryptPrivateKey = (privateKey: string, seedPhrase: string): string => {
  const key = crypto.scryptSync(seedPhrase, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

// Helper function to decrypt private key with seed phrase
const decryptPrivateKey = (
  encryptedKey: string,
  seedPhrase: string,
): string => {
  const key = crypto.scryptSync(seedPhrase, "salt", 32);
  const parts = encryptedKey.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Registration endpoint - Step 1: Send OTP
router.post("/register", async (req, res) => {
  try {
    const { armyId, phoneNumber } = req.body;

    // Validate input
    if (!armyId || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Army ID and phone number are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ armyId }, { phone: phoneNumber }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this Army ID or phone number",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Redis with 5 minute expiration
    await redis.setex(`otp:${phoneNumber}:${armyId}`, 300, otp);

    // Send OTP via SMS
    await sendSMS(otp, phoneNumber);

    res.status(200).json({ message: "OTP sent to phone number" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// OTP Verification and Key Generation endpoint - Step 2
router.post("/verify-otp", async (req, res) => {
  try {
    const { armyId, phoneNumber, otp, name, designation } = req.body;

    // Validate input
    if (!armyId || !phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Army ID, phone number, and OTP are required" });
    }

    // Verify OTP from Redis
    const storedOTP = await redis.get(`otp:${phoneNumber}:${armyId}`);

    if (!storedOTP || storedOTP !== otp) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    // Generate seed phrase (12 words)
    const seedPhrase = bip39.generateMnemonic();

    // Generate RSA key pair
    const { publicKey, privateKey } = generateKeyPair();

    // Encrypt private key with seed phrase
    const encryptedPrivateKey = encryptPrivateKey(privateKey, seedPhrase);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        armyId,
        phone: phoneNumber,
        name: name || null,
        designation: designation || null,
        keys: {
          create: {
            publicKey,
            privateKey: encryptedPrivateKey,
          },
        },
      },
      include: {
        keys: true,
      },
    });

    // Delete OTP from Redis
    await redis.del(`otp:${phoneNumber}:${armyId}`);

    // Return seed phrase and public key to user
    // IMPORTANT: Seed phrase should be shown only once and user must save it
    res.status(200).json({
      message: "User registered successfully",
      userId: user.id,
      publicKey,
      seedPhrase, // User must save this securely
      warning:
        "Save your seed phrase securely. You will need it to access your account.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login endpoint - Step 1: Send OTP
router.post("/login", async (req, res) => {
  try {
    const { armyId, phoneNumber } = req.body;

    // Validate input
    if (!armyId || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Army ID and phone number are required" });
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        armyId,
        phone: phoneNumber,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Redis with 5 minute expiration
    await redis.setex(`login:otp:${phoneNumber}:${armyId}`, 300, otp);

    // Send OTP via SMS
    await sendSMS(otp, phoneNumber);

    res.status(200).json({ message: "OTP sent to phone number" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login Verification endpoint - Step 2
router.post("/login-verify", async (req, res) => {
  try {
    const { armyId, phoneNumber, otp, seedPhrase } = req.body;

    // Validate input
    if (!armyId || !phoneNumber || !otp || !seedPhrase) {
      return res.status(400).json({
        message: "Army ID, phone number, OTP, and seed phrase are required",
      });
    }

    // Verify OTP from Redis
    const storedOTP = await redis.get(`login:otp:${phoneNumber}:${armyId}`);

    if (!storedOTP || storedOTP !== otp) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    // Get user with keys
    const user = await prisma.user.findFirst({
      where: {
        armyId,
        phone: phoneNumber,
      },
      include: {
        keys: true,
      },
    });

    if (!user || user.keys.length === 0) {
      return res.status(404).json({ message: "User or keys not found" });
    }

    // Get the latest key
    const latestKey = user.keys[user.keys.length - 1];

    // Try to decrypt private key with provided seed phrase
    try {
      const decryptedPrivateKey = decryptPrivateKey(
        latestKey.privateKey,
        seedPhrase,
      );

      // Delete OTP from Redis
      await redis.del(`login:otp:${phoneNumber}:${armyId}`);

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString("hex");

      // Store session in Redis (expires in 24 hours)
      await redis.setex(
        `session:${sessionToken}`,
        86400,
        JSON.stringify({
          userId: user.id,
          armyId: user.armyId,
          phone: user.phone,
        }),
      );

      // Return user data and keys
      res.status(200).json({
        message: "Login successful",
        sessionToken,
        user: {
          id: user.id,
          armyId: user.armyId,
          phone: user.phone,
          name: user.name,
          designation: user.designation,
        },
        keys: {
          publicKey: latestKey.publicKey,
          privateKey: decryptedPrivateKey,
        },
      });
    } catch (decryptError) {
      return res.status(401).json({ message: "Invalid seed phrase" });
    }
  } catch (error) {
    console.error("Login verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      await redis.del(`session:${sessionToken}`);
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export { router as authRouter };
