import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:7123/api/v1";

// Token management
export const setToken = (token: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    // Set cookie for server-side access
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// API calls
export const signUp = async (userData: any) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Signup failed");
  }

  return data;
};

export const signIn = async (credentials: any) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
};

export const googleSignIn = async (tokenId: any) => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokenId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Google login failed");
  }

  return data;
};

export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get user");
  }

  return data;
};
