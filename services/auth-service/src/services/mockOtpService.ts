import { redis } from '../config/redis';

const OTP_EXPIRY = 300; // 5 minutes
const MOCK_OTP = '123456'; // Fixed OTP for development

export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phone: string): Promise<boolean> => {
    try {
        const otp = process.env.NODE_ENV === 'production' ? generateOTP() : MOCK_OTP;

        // Store OTP in Redis with expiry
        await redis.setex(`otp:${phone}`, OTP_EXPIRY, otp);

        // Log OTP to console (remove in production)
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🔐 OTP for ${phone}: ${otp}`);
        console.log(`⏰ Valid for ${OTP_EXPIRY} seconds`);
        console.log(`${'='.repeat(50)}\n`);

        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};

export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    try {
        const storedOTP = await redis.get(`otp:${phone}`);

        if (!storedOTP) {
            console.log(`❌ OTP not found or expired for ${phone}`);
            return false;
        }

        if (storedOTP === otp) {
            await redis.del(`otp:${phone}`);
            console.log(`✅ OTP verified successfully for ${phone}`);
            return true;
        }

        console.log(`❌ Invalid OTP for ${phone}`);
        return false;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
};
