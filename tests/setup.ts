// Global test setup
import { vi } from "vitest";

// Mock console methods to reduce test noise
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

// Set test environment variables before any module loads
// NODE_ENV is read-only in TypeScript; vitest sets it automatically
process.env.MONGODB_URI = "mongodb://localhost:27017/legnoova_test";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.AUTH_SECRET = "test-auth-secret-do-not-use-in-production";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.CARD_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.ADMIN_EMAIL = "admin@test.com";
process.env.ADMIN_PASSWORD_HASH = "$2b$12$test.hash.for.testing.purposes.only";
