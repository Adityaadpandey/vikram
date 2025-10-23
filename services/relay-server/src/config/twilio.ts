import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Twilio } from "twilio";
import { config } from ".";
import logger from "./logger";

const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

export const sendSMS = async (otp: string, phone: string) => {
  const parsed = parsePhoneNumberFromString(phone);

  if (!parsed?.isValid()) {
    logger.error(`Invalid phone number format for SMS: ${phone}`);
    throw new Error("Invalid phone number format");
  }

  try {
    const message = await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: config.TWILIO_PHONE_NUMBER,
      to: parsed.number, // Send normalized E.164 format
    });

    logger.info(
      `SMS sent successfully to ${parsed.number}, SID: ${message.sid}`,
    );
    return message.sid;
  } catch (error) {
    logger.error("Error sending SMS:", error);
    // throw new Error("Failed to send SMS");
  }
};
