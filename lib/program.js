// Single server-side source of truth for both registration programs.
// The browser can only *suggest* a program (whitelist-checked here);
// every derived value (ID prefix, fee, labels) is resolved server-side.

export const PROGRAMS = ["ngs", "akwaaba"];

export const PROGRAM_LABELS = Object.freeze({
  ngs: "The Next Gospel Star",
  akwaaba: "Miss Akwaaba",
});

// ID prefixes per program. Distinct prefixes make cross-program
// collision impossible at the format level.
export const PROGRAM_ID_PREFIXES = Object.freeze({
  ngs: "NGS",
  akwaaba: "MA",
});

// Fee in the smallest unit of GHS (pesewas). GHS 50.00 for both.
// Amounts are always chosen here, never taken from client input.
export const PROGRAM_FEES_PESEWAS = Object.freeze({
  ngs: 5000,
  akwaaba: 5000,
});

export function isProgram(value) {
  return PROGRAMS.includes(value);
}

// Anything that is not exactly "akwaaba" maps to the default gospel
// program, so existing clients/forms keep working untouched.
export function normalizeProgram(value) {
  return value === "akwaaba" ? "akwaaba" : "ngs";
}

export function programLabel(program) {
  return PROGRAM_LABELS[normalizeProgram(program)];
}