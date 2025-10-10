import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Generate seed phrase (12 words)
export const generateSeedPhrase = (): string => {
    const words = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
        'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
        // Add more BIP39 words or use a library
    ];

    const seedWords: string[] = [];
    for (let i = 0; i < 12; i++) {
        seedWords.push(words[Math.floor(Math.random() * words.length)]);
    }

    return seedWords.join(' ');
};

// Generate RSA key pair for E2E encryption
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    return { publicKey, privateKey };
};

// Encrypt private key with seed phrase + phone + armyId
export const encryptPrivateKey = (
    privateKey: string,
    seedPhrase: string,
    phone: string,
    armyId: string
): string => {
    const combinedKey = `${seedPhrase}:${phone}:${armyId}`;
    const encrypted = CryptoJS.AES.encrypt(privateKey, combinedKey).toString();
    return encrypted;
};

// Decrypt private key
export const decryptPrivateKey = (
    encryptedPrivateKey: string,
    seedPhrase: string,
    phone: string,
    armyId: string
): string => {
    const combinedKey = `${seedPhrase}:${phone}:${armyId}`;
    const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, combinedKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
};

// Encrypt message with recipient's public key
export const encryptMessage = (message: string, publicKey: string): string => {
    const buffer = Buffer.from(message, 'utf8');
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        },
        buffer
    );
    return encrypted.toString('base64');
};

// Decrypt message with private key
export const decryptMessage = (encryptedMessage: string, privateKey: string): string => {
    const buffer = Buffer.from(encryptedMessage, 'base64');
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        },
        buffer
    );
    return decrypted.toString('utf8');
};
