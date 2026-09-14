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

// Miss Akwaaba photo uploads.
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_EXTENSIONS = [".jpg", ".png", ".webp"];
// 1.5MB per photo. Two photos + multipart overhead stay comfortably
// under the ~4.5MB serverless request body limit.
export const MAX_PHOTO_SIZE = Math.round(1.5 * 1024 * 1024);
export const IMAGE_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function imageExtensionForMime(mime) {
  return Object.hasOwn(IMAGE_MIME_TO_EXT, mime)
    ? IMAGE_MIME_TO_EXT[mime]
    : null;
}

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

const IMAGE_MAGIC_CHECKERS = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b.length >= 8 &&
    ascii(b, 0, 4) === "\x89PNG" &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
  "image/webp": (b) =>
    b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
};

export function isValidImageHeader(mime, buffer) {
  if (!Object.hasOwn(IMAGE_MAGIC_CHECKERS, mime)) return false;
  const checker = IMAGE_MAGIC_CHECKERS[mime];
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
const LANGUAGES_PATTERN = /^[A-Za-z0-9&,()' .-]+$/;

function isLikelyGibberish(term) {
  const letters = term.replace(/[^A-Za-z]/g, "");
  if (!letters) return false;
  if (/([A-Za-z])\1{3,}/.test(letters)) return true;
  const vowelCount = (letters.match(/[aeiouyAEIOUY]/g) || []).length;
  return vowelCount / letters.length < 0.2;
}

function validateName(fullName) {
  if (!fullName || !fullName.trim()) {
    return "Full name is required.";
  }
  const name = fullName.trim();
  if (name.length < 3) {
    return "Full name must be at least 3 characters.";
  }
  if (name.length > 60) {
    return "Full name is too long (maximum 60 characters).";
  }
  if (!NAME_PATTERN.test(name)) {
    return "Enter a valid name using letters only (spaces, hyphens, periods and apostrophes allowed).";
  }
  if (isLikelyGibberish(name)) {
    return "That doesn't look like a real name. Please enter your actual full name.";
  }
  return null;
}

function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return "Phone number is required.";
  }
  if (!validateGhanaPhone(phone)) {
    return "Enter a valid Ghana phone number (e.g. 024 123 4567 or 0551234567).";
  }
  return null;
}

function validateRegion(region) {
  if (!region || !region.trim()) {
    return "Region is required.";
  }
  const value = region.trim();
  if (value.length < 2) {
    return "Region must be at least 2 characters.";
  }
  if (value.length > 60) {
    return "Region is too long (maximum 60 characters).";
  }
  if (!LOCATION_PATTERN.test(value)) {
    return "Enter a valid region, e.g. Greater Accra.";
  }
  return null;
}

function validateLanguages(languages) {
  if (!languages || !languages.trim()) {
    return "Languages are required.";
  }
  const value = languages.trim();
  if (value.length < 2) {
    return "Languages must be at least 2 characters.";
  }
  if (value.length > 80) {
    return "Languages are too long (maximum 80 characters).";
  }
  if (!LANGUAGES_PATTERN.test(value)) {
    return "Enter the languages you speak, e.g. English, Twi.";
  }
  return null;
}

function validateAge(age) {
  if (age === null || age === undefined || String(age).trim() === "") {
    return "Age is required.";
  }
  const num = Number(age);
  if (!Number.isInteger(num) || num < 16 || num > 99) {
    return "Enter a valid age (16-99).";
  }
  return null;
}

// Miss Akwaaba pageant registration validation. Mirrors the gospel
// validation style (strict formats, gibberish detection, sniffed
// content) applied to the pageant-specific fields.
export function validateAkwaabaRegistration({
  fullName,
  phone,
  age,
  region,
  languages,
  headshot,
  traditional,
}) {
  const errors = [];
  const nameError = validateName(fullName);
  if (nameError) errors.push(nameError);

  const phoneError = validatePhone(phone);
  if (phoneError) errors.push(phoneError);

  const ageError = validateAge(age);
  if (ageError) errors.push(ageError);

  const regionError = validateRegion(region);
  if (regionError) errors.push(regionError);

  const languagesError = validateLanguages(languages);
  if (languagesError) errors.push(languagesError);

  if (!headshot) {
    errors.push("Please upload your headshot photo.");
  } else {
    if (!IMAGE_TYPES.includes(headshot.type)) {
      errors.push(`Invalid headshot type. Allowed: ${IMAGE_EXTENSIONS.join(", ")}`);
    }
    if (headshot.size > MAX_PHOTO_SIZE) {
      errors.push("Headshot photo must be 1.5MB or smaller.");
    }
  }

  if (!traditional) {
    errors.push("Please upload your traditional photo.");
  } else {
    if (!IMAGE_TYPES.includes(traditional.type)) {
      errors.push(`Invalid traditional photo type. Allowed: ${IMAGE_EXTENSIONS.join(", ")}`);
    }
    if (traditional.size > MAX_PHOTO_SIZE) {
      errors.push("Traditional photo must be 1.5MB or smaller.");
    }
  }

  return errors;
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