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

const TABS = [
  { key: "home", label: "Home" },
  { key: "how", label: "How It Works" },
  { key: "about", label: "About" },
];

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState("landing"); // landing | form | success
  const [activeTab, setActiveTab] = useState("home");
  const [form, setForm] = useState({
    fullName: "",
    location: "",
    phone: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      return;
    }
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0];
      if (rejected.file.size > MAX_MEDIA_SIZE) {
        setErrors(["File must be 4MB or smaller."]);
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

  const resetForm = () => {
    setForm({ fullName: "", location: "", phone: "" });
    setFile(null);
    setErrors([]);
    setMessage("");
    setSuccess(null);
  };

  const goHome = () => {
    resetForm();
    setView("landing");
    setActiveTab("home");
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

      setSuccess({ contestant: data.contestant });
      setView("success");
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <VideoBackground />

      <div className="relative flex-1 flex flex-col px-4 py-5 sm:py-8">
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8 sm:mb-12">
          <button
            onClick={goHome}
            className="flex items-center gap-2.5"
            type="button"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 text-xl">
              ⭐
            </span>
            <span className="text-white font-bold text-base sm:text-lg">
              Ceejay Multimedia
            </span>
          </button>

          <nav className="flex items-center gap-1 bg-white/10 backdrop-blur rounded-full p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setView("landing");
                }}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  view === "landing" && activeTab === tab.key
                    ? "bg-amber-400 text-slate-900"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {view !== "form" && (
              <button
                type="button"
                onClick={() => setView("form")}
                className="px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white hover:brightness-110 transition-all"
              >
                Apply Now
              </button>
            )}
          </nav>
        </header>

        <main className="max-w-5xl mx-auto w-full flex-1 flex items-center justify-center">
          {view === "landing" && (
            <div key={activeTab} className="animate-fade-in w-full">
              {activeTab === "home" && (
                <div className="text-center max-w-3xl mx-auto">
                  <p className="text-amber-300 font-semibold tracking-[0.25em] uppercase text-xs sm:text-sm mb-3">
                    Welcome to
                  </p>
                  <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    Ceejay Multimedia
                    <span className="block">Audition</span>
                  </h1>
                  <p className="text-white/85 mt-5 text-base sm:text-lg">
                    ⭐ The Next Gospel Star ⭐
                    <br />
                    Show the world your amazing talent.
                  </p>
                  <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setView("form")}
                      className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-base shadow-xl shadow-orange-500/30 hover:brightness-110 hover:scale-105 transition-all"
                    >
                      Start Your Application
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("how")}
                      className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-base backdrop-blur hover:bg-white/20 transition-colors"
                    >
                      How It Works
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "how" && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    How It Works
                  </h2>
                  <p className="text-white/80 mt-2">
                    Three simple steps to your audition pass
                  </p>
                </div>
              )}

              {activeTab === "about" && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    About the Audition
                  </h2>
                  <p className="text-white/80 mt-4 max-w-2xl mx-auto leading-relaxed">
                    Ceejay Multimedia brings gospel talent into the spotlight. If
                    you have a gift for singing or performing, this is your
                    chance to stand out and share your testimony through your
                    talent.
                  </p>
                </div>
              )}

              {activeTab === "how" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      n: "01",
                      title: "Fill in your details",
                      text: "Tell us your name, location and upload your 30-second audition clip.",
                    },
                    {
                      n: "02",
                      title: "Complete your fee",
                      text: "Pay the audition fee quickly and securely through Paystack.",
                    },
                    {
                      n: "03",
                      title: "Get your digital pass",
                      text: "Receive your audition pass with a QR code and show it at the venue.",
                    },
                  ].map((step) => (
                    <div
                      key={step.n}
                      className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-6 text-center hover:border-amber-400/50 hover:bg-white/15 transition-all"
                    >
                      <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 font-extrabold">
                        {step.n}
                      </span>
                      <h3 className="text-white font-bold mt-4">{step.title}</h3>
                      <p className="text-white/70 text-sm mt-2 leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "about" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      icon: "🎤",
                      title: "Showcase Your Talent",
                      text: "Sing from the heart and let the judges hear what makes you unique.",
                    },
                    {
                      icon: "⭐",
                      title: "Win the Title",
                      text: "The Next Gospel Star is your chance to be crowned and shine on stage.",
                    },
                    {
                      icon: "🙏",
                      title: "Gospel First",
                      text: "From gospel family to gospel family — this audition celebrates faith through music.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-6 text-center hover:border-amber-400/50 hover:bg-white/15 transition-all"
                    >
                      <span className="text-4xl">{item.icon}</span>
                      <h3 className="text-white font-bold mt-3">{item.title}</h3>
                      <p className="text-white/70 text-sm mt-2 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "form" && (
            <div className="animate-fade-in w-full max-w-lg">
              <button
                type="button"
                onClick={goHome}
                className="text-amber-200/90 text-sm font-semibold hover:text-amber-300 mb-3 inline-flex items-center gap-1"
              >
                ← Back to Home
              </button>

              <div className="rounded-2xl p-4 sm:p-8 bg-gradient-to-br from-slate-900/95 via-purple-950/95 to-slate-900/95 border border-amber-400/20 shadow-2xl shadow-black/60 backdrop-blur-xl">
                <div className="text-center mb-4 sm:mb-8">
                  <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                    ⭐ The Next Gospel Star ⭐
                  </h1>
                  <p className="text-amber-200/80 mt-1 sm:mt-2">
                    Contestant Application Form
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-amber-200 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white/10 border border-white/15 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400/60 outline-none text-sm sm:text-base backdrop-blur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-200 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Accra, Ghana"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white/10 border border-white/15 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400/60 outline-none text-sm sm:text-base backdrop-blur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-200 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 024XXXXXXX"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white/10 border border-white/15 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400/60 outline-none text-sm sm:text-base backdrop-blur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-200 mb-1">
                      30-Second Audition Clip
                    </label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-amber-300/30 hover:border-amber-400"
                      }`}
                    >
                      <input {...getInputProps()} />
                      {file ? (
                        <div>
                          <p className="text-amber-300 font-medium">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-amber-100/90">
                            Drag & drop your clip here, or tap to browse
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            MP4, MOV, AVI, WebM, MP3, WAV (max 4MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:brightness-110 shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Submitting..." : "Submit Application"}
                  </button>

                  {errors.length > 0 && (
                    <div className="rounded-lg bg-red-950/70 border border-red-500/40 p-3 mt-2">
                      {errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-200">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}

                  {message && (
                    <p className="text-center text-sm text-red-300 mt-2">
                      {message}
                    </p>
                  )}
                </form>
              </div>
            </div>
          )}

          {view === "success" && success && (
            <div className="animate-fade-in w-full max-w-lg">
              <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-slate-900/95 via-purple-950/95 to-slate-900/95 border border-amber-400/20 shadow-2xl shadow-black/60 backdrop-blur-xl text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Thank You!
                </h2>
                <p className="text-white/85 mt-4 leading-relaxed">
                  Thanks for applying,{" "}
                  <span className="text-amber-300 font-bold">
                    {success.contestant.full_name}
                  </span>
                  ! {"We're"} so excited to have you join the{" "}
                  <span className="text-amber-300 font-semibold">
                    Ceejay Multimedia Audition
                  </span>{" "}
                  — The Next Gospel Star. Your audition clip has been received
                  safely.
                </p>
                <p className="text-white/70 mt-3 leading-relaxed">
                  We will be happy to see you and your amazing talent at the
                  audition venue. 🌟
                </p>

                <div className="mt-6 rounded-2xl bg-white/10 border border-amber-400/20 p-4">
                  <p className="text-sm text-amber-200">Your Contestant ID</p>
                  <p className="text-2xl font-mono font-bold text-white mt-1">
                    {success.contestant.contestant_id}
                  </p>
                </div>

                <div className="mt-7 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/pass?id=${success.contestant.contestant_id}`
                      )
                    }
                    className="w-full px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-orange-500/30 hover:brightness-110 hover:scale-105 transition-all"
                  >
                    View My Digital Pass
                  </button>
                  <button
                    type="button"
                    onClick={goHome}
                    className="w-full px-8 py-3.5 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-base backdrop-blur hover:bg-white/20 transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}