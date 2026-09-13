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

export function validateGhanaPhone(phone) {
  const normalized = phone.replace(/[\s-]/g, "");
  return /^0[2357]\d{8}$/.test(normalized);
}

const NAME_PATTERN = /^[A-Za-z]+(?:[' .-][A-Za-z]+)*$/;
const LOCATION_PATTERN = /^[A-Za-z0-9]+(?:[ ,.'-]+[A-Za-z0-9]+)*$/;

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