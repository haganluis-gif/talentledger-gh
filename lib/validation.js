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

export function validateRegistration({ fullName, location, phone, file }) {
  const errors = [];

  if (!fullName || !fullName.trim()) {
    errors.push("Full name is required.");
  } else if (fullName.trim().length < 3) {
    errors.push("Full name must be at least 3 characters.");
  }

  if (!location || !location.trim()) {
    errors.push("Location is required.");
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