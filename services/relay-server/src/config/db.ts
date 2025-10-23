import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient({
  log: ["error", "warn"], // Reduce logging
  errorFormat: "minimal",
});

// Test connection
prisma
  .$connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    // Don't exit, just log
  });

export { prisma };
