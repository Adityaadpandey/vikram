// Update this with your actual backend URL
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? "http://localhost:3000"
    : "https://your-production-url.com",
  WS_URL: __DEV__ ? "ws://localhost:3000" : "wss://your-production-url.com",
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth
  REGISTER: "/auth/register",
  VERIFY_OTP: "/auth/verify-otp",
  LOGIN: "/auth/login",
  LOGIN_VERIFY: "/auth/login-verify",
  LOGOUT: "/auth/logout",
};
