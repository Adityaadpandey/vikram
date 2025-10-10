
// Browser-compatible encryption utilities
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
    // For demo purposes - in production, use Web Crypto API
    const keyPair = {
        publicKey: `PUBLIC_KEY_${Date.now()}`,
        privateKey: `PRIVATE_KEY_${Date.now()}`,
    };
    return keyPair;
};

export const encryptMessage = (message: string, publicKey: string): string => {
    // Simple base64 encoding for demo (use proper encryption in production)
    return btoa(message + '::' + publicKey);
};

export const decryptMessage = (encrypted: string, privateKey: string): string => {
    // Simple base64 decoding for demo
    try {
        const decoded = atob(encrypted);
        return decoded.split('::')[0];
    } catch {
        return encrypted;
    }
};
