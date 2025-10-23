interface Config {
  SERVICE_NAME: string;
  PORT: number;
  DEFAULT_TIMEOUT: number;
  LOG_LEVEL: string;
  NODE_ENV: string;
  AUTH_SERVICE_URL: string;
  WS_SERVICE_URL: string;
}

export const config: Config = {
  SERVICE_NAME: require("../../package.json").name || "api-gateway",
  PORT: parseInt(process.env.PORT || "7123", 10),
  DEFAULT_TIMEOUT: parseInt(process.env.DEFAULT_TIMEOUT || "5000", 10),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  NODE_ENV: process.env.NODE_ENV || "development",
  AUTH_SERVICE_URL:
    process.env.AUTH_SERVICE_URL?.trim() || "http://localhost:7001",
  WS_SERVICE_URL: process.env.WS_SERVICE_URL?.trim() || "ws://localhost:7002",
};
