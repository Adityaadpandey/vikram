import { User } from "@repo/database";
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  phone: string;
  armyId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: Pick<User, "id" | "phone" | "armyId" | "name">;
}
