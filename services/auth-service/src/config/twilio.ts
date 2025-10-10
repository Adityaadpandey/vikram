import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client: any = null;

if (accountSid && authToken && twilioPhone) {
    try {
        client = twilio(accountSid, authToken);
        console.log('✅ Twilio client initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Twilio:', error);
    }
} else {
    console.warn('⚠️ Twilio credentials not found. Running in development mode.');
    console.warn('Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
}

export { client as twilioClient, twilioPhone };
