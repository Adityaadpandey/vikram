import { prisma } from "@repo/database";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { getCachedUser, setCachedUser } from "../lib/redis-req";
import { AuthenticatedRequest, JwtPayload } from "../types/auth";

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Decode and verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    ) as unknown as JwtPayload;
    const userId = decoded.userId;

    // Try Redis cache first
    let user = await getCachedUser(userId);

    if (!user) {
      // Not in cache → fetch from DB
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        res.status(401).json({ error: "Invalid token." });
        return;
      }

      // Cache it for next time
      await setCachedUser(userId, user);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ error: "Invalid token." });
  }
};
