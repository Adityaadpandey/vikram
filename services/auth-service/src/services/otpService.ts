import { redis } from '../config/redis';
import { twilioClient, twilioPhone } from '../config/twilio';

const OTP_EXPIRY = 300; // 5 minutes

export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phone: string): Promise<boolean> => {
    try {
        const otp = generateOTP();

        // Store OTP in Redis with expiry
        await redis.setex(`otp:${phone}`, OTP_EXPIRY, otp);

        // Check if Twilio is properly configured
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.warn('⚠️ Twilio not configured, using console OTP for development');
            console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
            return true;
        }

        try {
            // Send OTP via Twilio
            await twilioClient.messages.create({
                body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
                from: twilioPhone,
                to: phone,
            });

            console.log(`✅ OTP sent to ${phone} via Twilio`);
        } catch (twilioError: any) {
            // If Twilio fails, log OTP to console for development
            console.error('❌ Twilio error:', twilioError.message);
            console.log(`\n🔐 OTP for ${phone}: ${otp} (Twilio failed, using console)\n`);
        }

        return true;
    } catch (error) {
        console.error('Error in sendOTP:', error);
        throw error;
    }
};

export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    try {
        const storedOTP = await redis.get(`otp:${phone}`);

        if (!storedOTP) {
            return false; // OTP expired or not found
        }

        if (storedOTP === otp) {
            // Delete OTP after successful verification
            await redis.del(`otp:${phone}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
};
