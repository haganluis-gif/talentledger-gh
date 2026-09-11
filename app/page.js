"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  validateRegistration,
  MEDIA_TYPES,
  MEDIA_EXTENSIONS,
  MAX_MEDIA_SIZE,
} from "@/lib/validation";
import VideoBackground from "@/components/VideoBackground";

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    location: "",
    phone: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      return;
    }
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0];
      if (rejected.file.size > MAX_MEDIA_SIZE) {
        setErrors(["File must be 50MB or smaller."]);
      } else {
        setErrors([
          `Invalid file type. Allowed: ${MEDIA_EXTENSIONS.join(", ")}`,
        ]);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: MEDIA_TYPES.reduce((acc, type) => {
      acc[type] = MEDIA_EXTENSIONS;
      return acc;
    }, {}),
    maxFiles: 1,
    maxSize: MAX_MEDIA_SIZE,
    useFsAccessApi: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegistration({ ...form, file });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("location", form.location);
      formData.append("phone", form.phone);
      formData.append("file", file);

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors);
        } else {
          setMessage(data.error || "Registration failed.");
        }
        return;
      }

      const paymentRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestantId: data.contestant.contestant_id }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
        return;
      }

      router.push(`/pass?id=${data.contestant.contestant_id}`);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <VideoBackground />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
            ⭐ The Next Gospel Star ⭐
          </h1>
          <p className="text-gray-500 mt-2">Contestant Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Accra, Ghana"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 024XXXXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              30-Second Audition Clip
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-green-400"
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div>
                  <p className="text-green-600 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    Drag & drop your clip here, or tap to browse
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    MP4, MOV, AVI, WebM, MP3, WAV (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Registering..." : "Register & Pay"}
          </button>

          {errors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 mt-2">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}

          {message && (
            <p className="text-center text-sm text-red-600 mt-2">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}