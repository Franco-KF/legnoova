/**
 * Input sanitization helpers.
 *
 * Prevents NoSQL injection, XSS via stored fields, and oversized payloads.
 * All user-controlled strings that reach MongoDB queries or are echoed back
 * should be passed through these helpers first.
 */

import { z } from "zod";

/** Strictly alphanumeric + safe punctuation symbol (forex pair, e.g. EURUSD.a). */
export const SafeSymbolSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9._-]+$/, "Invalid symbol format");

/** Mongo-safe ObjectId string (24 hex). */
export const ObjectIdSchema = z.string().length(24).regex(/^[0-9a-fA-F]{24}$/);

/** Positive finite number, bounded. */
export const PositiveNumberSchema = z.number().finite().positive().max(1e9);

/** Non-empty trimmed string, max length, no null bytes or control chars. */
export const SafeTextSchema = (max = 500) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((s) => !/\u0000|[\u0001-\u001f\u007f-\u009f]/.test(s), {
      message: "Text contains control characters",
    });

/** Sanitize a raw object for safe insertion into MongoDB: strip $ and . keys. */
export function sanitizeForMongo<T extends Record<string, unknown>>(input: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith("$") || key.includes(".")) continue; // NoSQL injection guard
    cleaned[key] = value;
  }
  return cleaned as T;
}

/** Strip dangerous HTML/script patterns from a string before storage/display. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}
