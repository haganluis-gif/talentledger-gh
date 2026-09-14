import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_ORIGIN = "https://talentledger-gh.vercel.app";

const securityHeaders = [
  { key: "Content-Security-Policy", value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.paystack.co https://checkout.paystack.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.paystack.co",
    "frame-src 'self' https://checkout.paystack.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ") },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["172.18.0.1"],
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Restrict API responses to our own origin instead of the
        // platform-wide `Access-Control-Allow-Origin: *` default.
        source: "/api/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: APP_ORIGIN }],
      },
    ];
  },
};

export default nextConfig;