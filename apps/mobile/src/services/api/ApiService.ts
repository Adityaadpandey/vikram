import axios, { AxiosInstance, AxiosError } from "axios";
import { API_CONFIG, API_ENDPOINTS } from "../../config/api.config";
import { SecureStorage } from "../security/SecureStorage";

class ApiServiceClass {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add session token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await SecureStorage.clearAll();
          // Navigate to login (implement this based on your navigation)
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth APIs
  async register(armyId: string, phoneNumber: string) {
    const response = await this.client.post(API_ENDPOINTS.REGISTER, {
      armyId,
      phoneNumber,
    });
    return response.data;
  }

  async verifyRegistrationOTP(
    armyId: string,
    phoneNumber: string,
    otp: string,
    name: string,
    designation: string,
  ) {
    const response = await this.client.post(API_ENDPOINTS.VERIFY_OTP, {
      armyId,
      phoneNumber,
      otp,
      name,
      designation,
    });
    return response.data;
  }

  async login(armyId: string, phoneNumber: string) {
    const response = await this.client.post(API_ENDPOINTS.LOGIN, {
      armyId,
      phoneNumber,
    });
    return response.data;
  }

  async verifyLoginOTP(
    armyId: string,
    phoneNumber: string,
    otp: string,
    seedPhrase: string,
  ) {
    const response = await this.client.post(API_ENDPOINTS.LOGIN_VERIFY, {
      armyId,
      phoneNumber,
      otp,
      seedPhrase,
    });
    return response.data;
  }

  async logout(sessionToken: string) {
    const response = await this.client.post(API_ENDPOINTS.LOGOUT, {
      sessionToken,
    });
    return response.data;
  }
}

export const ApiService = new ApiServiceClass();
