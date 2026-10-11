import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required."),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  TAX_RATE: z.coerce.number().min(0).max(100).default(5),
});

export const env = envSchema.parse(process.env);
