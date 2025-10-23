import dotenv from "dotenv";
dotenv.config();

interface Config {
  SERVICE_NAME: string;
  PORT: number;
  LOG_LEVEL: string;
  NODE_ENV: string;
  REDIS_URL: string;
  JWT_SECRET: string;

  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
}

export const config: Config = {
  SERVICE_NAME: require("../../package.json").name || "api-gateway",
  PORT: parseInt(process.env.PORT || "7001", 10),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_URL: process.env.REDIS_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "default_secret_key",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",
};
