// API Gateway Configuration
export const API_CONFIG = {
  // API Gateway (all requests go through this)
  GATEWAY_URL: __DEV__
    ? "http://localhost:7123"
    : "https://your-production-url.com",
  WS_GATEWAY_URL: __DEV__
    ? "ws://localhost:7123"
    : "wss://your-production-url.com",

  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth endpoints (proxied through gateway at /api/v1/auth/)
  REGISTER: "/api/v1/auth/register",
  VERIFY_OTP: "/api/v1/auth/verify-otp",
  LOGIN: "/api/v1/auth/login",
  LOGIN_VERIFY: "/api/v1/auth/login-verify",
  LOGOUT: "/api/v1/auth/logout",
  HEALTH: "/api/v1/auth/health",
};

// WebSocket endpoint (proxied through gateway)
export const WS_ENDPOINT = "/api/v1/ws/";
