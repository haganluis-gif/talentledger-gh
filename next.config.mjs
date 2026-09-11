import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["172.18.0.1"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;