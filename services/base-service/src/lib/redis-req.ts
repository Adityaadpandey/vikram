import logger from "../config/logger";
import { redis } from "../config/redis";

// Redis Cache Keys
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  SESSION: (userId: string, tokenHash: string) =>
    `session:${userId}:${tokenHash}`,
  GOOGLE_ACCOUNT: (googleId: string) => `google:${googleId}`,
  BLACKLISTED_TOKEN: (tokenHash: string) => `blacklist:${tokenHash}`,
  ALL_CATEGORIES: "categories:all",
};

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  USER: 3600, // 1 hour
  SESSION: 604800, // 7 days (same as JWT expiry)
  BLACKLIST: 604800, // 7 days
};

// Helper functions for caching
export const getCachedUser = async (userId: string) => {
  try {
    const cached = await redis.get(CACHE_KEYS.USER(userId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error("Redis get user error:", error);
    return null;
  }
};

export const setCachedUser = async (userId: string, userData: any) => {
  try {
    await redis.setex(
      CACHE_KEYS.USER(userId),
      CACHE_TTL.USER,
      JSON.stringify(userData),
    );
  } catch (error) {
    logger.error("Redis set user error:", error);
  }
};

export const getCachedUserByEmail = async (email: string) => {
  try {
    const cached = await redis.get(CACHE_KEYS.USER_BY_EMAIL(email));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error("Redis get user by email error:", error);
    return null;
  }
};

export const setCachedUserByEmail = async (email: string, userData: any) => {
  try {
    await redis.setex(
      CACHE_KEYS.USER_BY_EMAIL(email),
      CACHE_TTL.USER,
      JSON.stringify(userData),
    );
  } catch (error) {
    logger.error("Redis set user by email error:", error);
  }
};

export const invalidateUserCache = async (userId: string, email?: string) => {
  try {
    const pipeline = redis.pipeline();
    pipeline.del(CACHE_KEYS.USER(userId));
    if (email) {
      pipeline.del(CACHE_KEYS.USER_BY_EMAIL(email));
    }
    await pipeline.exec();
  } catch (error) {
    logger.error("Redis invalidate user cache error:", error);
  }
};

export const setSessionCache = async (
  userId: string,
  tokenHash: string,
  sessionData: any,
) => {
  try {
    await redis.setex(
      CACHE_KEYS.SESSION(userId, tokenHash),
      CACHE_TTL.SESSION,
      JSON.stringify(sessionData),
    );
  } catch (error) {
    logger.error("Redis set session error:", error);
  }
};

export const getSessionCache = async (userId: string, tokenHash: string) => {
  try {
    const cached = await redis.get(CACHE_KEYS.SESSION(userId, tokenHash));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error("Redis get session error:", error);
    return null;
  }
};

export const blacklistToken = async (tokenHash: string) => {
  try {
    await redis.setex(
      CACHE_KEYS.BLACKLISTED_TOKEN(tokenHash),
      CACHE_TTL.BLACKLIST,
      "1",
    );
  } catch (error) {
    logger.error("Redis blacklist token error:", error);
  }
};

export const isTokenBlacklisted = async (
  tokenHash: string,
): Promise<boolean> => {
  try {
    const result = await redis.get(CACHE_KEYS.BLACKLISTED_TOKEN(tokenHash));
    return result === "1";
  } catch (error) {
    logger.error("Redis check blacklist error:", error);
    return false;
  }
};
