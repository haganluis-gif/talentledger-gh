import { randomUUID } from "crypto";
import { isProgram, PROGRAM_ID_PREFIXES } from "./program";

// Random segment length. 6 uppercase hex chars ~= 16.7M values per
// prefix/year; combined with the distinct program prefixes this makes
// accidental collisions negligible and cross-program collisions
// impossible at the format level.
export const ID_SEGMENT_LENGTH = 6;

export function idYear() {
  return new Date().getUTCFullYear();
}

// Server-side ID generation ONLY. The client can never supply an ID;
// callers pass a program that has already been whitelist-validated.
export function generateContestantId(program) {
  if (!isProgram(program)) {
    throw new Error(`Cannot generate an ID for unknown program: ${program}`);
  }
  const prefix = PROGRAM_ID_PREFIXES[program];
  const segment = randomUUID()
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase()
    .slice(0, ID_SEGMENT_LENGTH);
  return `${prefix}-${idYear()}-${segment}`;
}

// Format check, e.g. NGS-2026-A1B2C3 / MA-2026-9F8E7D.
export function isGeneratedId(value) {
  const segments = String(value).split("-");
  if (segments.length !== 3) return false;
  const [prefix, year, segment] = segments;
  if (!/^[A-Z]{2,3}$/.test(prefix)) return false;
  if (!/^\d{4}$/.test(year)) return false;
  return new RegExp(`^[0-9A-F]{${ID_SEGMENT_LENGTH}}$`).test(segment);
}