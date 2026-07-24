import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-this-secret",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  momoApiKey: process.env.MOMO_API_KEY || "",
  momoApiSecret: process.env.MOMO_API_SECRET || ""
};

