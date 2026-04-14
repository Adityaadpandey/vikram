import { prisma } from "@repo/database";

// Test connection
prisma
  .$connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    // Don't exit, just log
  });

export { prisma };
