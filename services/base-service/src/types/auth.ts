import { User } from "@repo/database";
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: Pick<User, "id" | "email" | "name">;
}
