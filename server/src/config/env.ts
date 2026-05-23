import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FIREBASE_PROJECT_ID: z.string().default("metabolic"),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  AI_PROVIDER: z.enum(["mock", "openai", "gemini"]).default("mock"),
  OPENAI_API_KEY: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().optional().default(""),
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TWILIO_PHONE_NUMBER: z.string().optional().default(""),
  CLIENT_URL: z.string().url().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
