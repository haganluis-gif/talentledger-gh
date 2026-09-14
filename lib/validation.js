export const MEDIA_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
];

export const MEDIA_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".avi",
  ".webm",
  ".mp3",
  ".wav",
  ".m4a",
];

export const MAX_MEDIA_SIZE = 4 * 1024 * 1024; // 4MB (Vercel request body limit is 4.5MB)
export const REQUIRED_FIELDS = ["fullName", "location", "phone"];

// Never derive the stored file extension from the (attacker-controlled)
// filename. Always map from the validated MIME type to a fixed suffix.
export const MIME_TO_EXT = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/mp4": "mp4",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
};

export function extensionForMime(mime) {
  return Object.hasOwn(MIME_TO_EXT, mime) ? MIME_TO_EXT[mime] : null;
}

function ascii(bytes, from, to) {
  return String.fromCharCode.apply(null, bytes.slice(from, to));
}

// Server-side magic-byte sniffing so a browser-supplied MIME value can
// never be used to store arbitrary content.
const MAGIC_CHECKERS = {
  "video/mp4": (b) => b.length >= 12 && ascii(b, 4, 8) === "ftyp",
  "video/quicktime": (b) => b.length >= 12 && ascii(b, 4, 8) === "ftyp",
  "video/x-msvideo": (b) =>
    b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "AVI ",
  "video/webm": (b) =>
    b.length >= 4 &&
    b[0] === 0x1a &&
    b[1] === 0x45 &&
    b[2] === 0xdf &&
    b[3] === 0xa3,
  "audio/mpeg": (b) =>
    (b.length >= 3 && ascii(b, 0, 3) === "ID3") ||
    (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
  "audio/wav": (b) =>
    b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WAVE",
  "audio/mp4": (b) => b.length >= 12 && ascii(b, 4, 8) === "ftyp",
  "audio/x-m4a": (b) => b.length >= 12 && ascii(b, 4, 8) === "ftyp",
  "audio/m4a": (b) => b.length >= 12 && ascii(b, 4, 8) === "ftyp",
};

export function isValidMediaHeader(mime, buffer) {
  if (!Object.hasOwn(MAGIC_CHECKERS, mime)) return false;
  const checker = MAGIC_CHECKERS[mime];
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return false;
  return checker(bytes);
}

// Reject any non-basename filename outright (path traversal defence).
export function isSafeFilename(name) {
  if (typeof name !== "string" || name.length === 0) return false;
  if (name.length > 200) return false;
  if (/[\/\\]/.test(name)) return false;
  if (/^\.+$/.test(name)) return false;
  return !String(name).includes("..");
}

export function validateGhanaPhone(phone) {
  const normalized = phone.replace(/[\s-]/g, "");
  return /^0[2357]\d{8}$/.test(normalized);
}

const NAME_PATTERN = /^[A-Za-z]+(?:[' .-][A-Za-z]+)*$/;
const LOCATION_PATTERN = /^[A-Za-z0-9]+(?:[ ,.'-]+[A-Za-z0-9]+)*$/;

function isLikelyGibberish(term) {
  const letters = term.replace(/[^A-Za-z]/g, "");
  if (!letters) return false;
  if (/([A-Za-z])\1{3,}/.test(letters)) return true;
  const vowelCount = (letters.match(/[aeiouyAEIOUY]/g) || []).length;
  return vowelCount / letters.length < 0.2;
}

export function validateRegistration({ fullName, location, phone, file }) {
  const errors = [];

  if (!fullName || !fullName.trim()) {
    errors.push("Full name is required.");
  } else {
    const name = fullName.trim();
    if (name.length < 3) {
      errors.push("Full name must be at least 3 characters.");
    } else if (name.length > 60) {
      errors.push("Full name is too long (maximum 60 characters).");
    } else if (!NAME_PATTERN.test(name)) {
      errors.push(
        "Enter a valid name using letters only (spaces, hyphens, periods and apostrophes allowed)."
      );
    } else if (isLikelyGibberish(name)) {
      errors.push(
        "That doesn't look like a real name. Please enter your actual full name."
      );
    }
  }

  if (!location || !location.trim()) {
    errors.push("Location is required.");
  } else {
    const loc = location.trim();
    if (loc.length < 2) {
      errors.push("Location must be at least 2 characters.");
    } else if (loc.length > 60) {
      errors.push("Location is too long (maximum 60 characters).");
    } else if (!LOCATION_PATTERN.test(loc)) {
      errors.push(
        "Enter a valid location using letters and numbers only, e.g. Accra, Ghana."
      );
    } else if (isLikelyGibberish(loc)) {
      errors.push(
        "That doesn't look like a real location. Please enter your town or city."
      );
    }
  }

  if (!phone || !phone.trim()) {
    errors.push("Phone number is required.");
  } else if (!validateGhanaPhone(phone)) {
    errors.push(
      "Enter a valid Ghana phone number (e.g. 024 123 4567 or 0551234567)."
    );
  }

  if (!file) {
    errors.push("Please upload your 30-second audition clip.");
  } else {
    if (!MEDIA_TYPES.includes(file.type)) {
      errors.push(
        `Invalid file type. Allowed: ${MEDIA_EXTENSIONS.join(", ")}`
      );
    }
    if (file.size > MAX_MEDIA_SIZE) {
      errors.push("File must be 4MB or smaller.");
    }
  }

  return errors;
}