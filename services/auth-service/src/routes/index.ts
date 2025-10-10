import crypto from 'crypto';
import { Router } from 'express';
import { prisma } from '../config/db';
import { generateToken } from '../config/jwt';
import { redis } from '../config/redis';
import { sendOTP, verifyOTP } from '../services/otpService';
import { encryptPrivateKey, generateSeedPhrase } from '../utils/encryption';

const router = Router();

// Step 1: Send OTP
router.post('/register', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Validate phone format (basic validation)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                error: 'Invalid phone format. Use E.164 format (e.g., +1234567890)'
            });
        }

        await sendOTP(phone);

        res.status(200).json({
            message: 'OTP sent successfully',
            expiresIn: 300 // seconds
        });
    } catch (err: any) {
        console.error('Register error:', err);
        res.status(500).json({
            error: 'Failed to send OTP',
            message: err.message
        });
    }
});

// Step 2: Verify OTP
router.post('/verify', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                error: 'Phone number and OTP are required'
            });
        }

        const isValid = await verifyOTP(phone, otp);

        if (!isValid) {
            return res.status(400).json({
                error: 'Invalid or expired OTP'
            });
        }

        // Check if user exists WITH keys relation
        let user = await prisma.user.findUnique({
            where: { phone },
            include: { keys: true }, // ✅ Include keys relation
        });

        let requiresKeySetup = true;

        // Create user if doesn't exist
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    phone,
                },
                include: { keys: true }, // ✅ Include keys in create response
            });
            requiresKeySetup = true;
        } else {
            // Check if user has keys
            requiresKeySetup = !user.keys || user.keys.length === 0;
        }

        // Generate seed phrase and store temporarily
        const seedPhrase = generateSeedPhrase();
        await redis.setex(`seed:${user.id}`, 600, seedPhrase); // 10 min expiry

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            phone: user.phone
        });

        res.status(200).json({
            message: 'OTP verified successfully',
            token,
            userId: user.id,
            seedPhrase, // Send once, user must save it
            requiresKeySetup,
        });
    } catch (err: any) {
        console.error('Verify error:', err);
        res.status(500).json({
            error: 'Verification failed',
            message: err.message
        });
    }
});

// Step 3: Save encrypted keys
router.post('/keys-saved', async (req, res) => {
    try {
        const {
            userId,
            armyId,
            publicKey,
            privateKey,
            seedPhrase,
            name,
            designation
        } = req.body;

        if (!userId || !armyId || !publicKey || !privateKey || !seedPhrase) {
            return res.status(400).json({
                error: 'All fields are required (userId, armyId, publicKey, privateKey, seedPhrase)'
            });
        }

        // Verify seed phrase matches
        const storedSeed = await redis.get(`seed:${userId}`);
        if (storedSeed !== seedPhrase) {
            return res.status(400).json({
                error: 'Invalid seed phrase'
            });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user already has keys
        const existingKey = await prisma.key.findFirst({
            where: { userId: user.id },
        });

        if (existingKey) {
            return res.status(400).json({
                error: 'Keys already exist for this user'
            });
        }

        // Encrypt private key with seedPhrase + phone + armyId
        const encryptedPrivateKey = encryptPrivateKey(
            privateKey,
            seedPhrase,
            user.phone,
            armyId
        );

        // Save keys to database
        await prisma.key.create({
            data: {
                userId: user.id,
                publicKey,
                privateKey: encryptedPrivateKey,
            },
        });

        // Update user with name and designation
        await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                designation,
            },
        });

        // Delete seed from Redis
        await redis.del(`seed:${userId}`);

        res.status(200).json({
            message: 'Keys saved successfully',
            warning: 'Store your seed phrase safely. It cannot be recovered!'
        });
    } catch (err: any) {
        console.error('Keys save error:', err);
        res.status(500).json({
            error: 'Failed to save keys',
            message: err.message
        });
    }
});

export { router as authRouter };
