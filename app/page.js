"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  validateRegistration,
  validateAkwaabaRegistration,
  MEDIA_TYPES,
  MEDIA_EXTENSIONS,
  MAX_MEDIA_SIZE,
  IMAGE_TYPES,
  IMAGE_EXTENSIONS,
  MAX_PHOTO_SIZE,
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
    age: "",
    region: "",
    languages: "",
  });
  const [program, setProgram] = useState("ngs"); // ngs | akwaaba
  const [file, setFile] = useState(null);
  const [headshot, setHeadshot] = useState(null);
  const [traditional, setTraditional] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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

  const onDropHeadshot = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length > 0) {
      setHeadshot(acceptedFiles[0]);
      return;
    }
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0];
      if (rejected.file.size > MAX_PHOTO_SIZE) {
        setErrors(["Headshot photo must be 1.5MB or smaller."]);
      } else {
        setErrors([
          `Invalid headshot type. Allowed: ${IMAGE_EXTENSIONS.join(", ")}`,
        ]);
      }
    }
  }, []);

  const onDropTraditional = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length > 0) {
      setTraditional(acceptedFiles[0]);
      return;
    }
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0];
      if (rejected.file.size > MAX_PHOTO_SIZE) {
        setErrors(["Traditional photo must be 1.5MB or smaller."]);
      } else {
        setErrors([
          `Invalid traditional photo type. Allowed: ${IMAGE_EXTENSIONS.join(", ")}`,
        ]);
      }
    }
  }, []);

  const imageAccept = IMAGE_TYPES.reduce((acc, type) => {
    acc[type] = IMAGE_EXTENSIONS;
    return acc;
  }, {});

  const clipDropzone = useDropzone({
    onDrop,
    accept: MEDIA_TYPES.reduce((acc, type) => {
      acc[type] = MEDIA_EXTENSIONS;
      return acc;
    }, {}),
    maxFiles: 1,
    maxSize: MAX_MEDIA_SIZE,
    useFsAccessApi: false,
  });

  const headshotDropzone = useDropzone({
    onDrop: onDropHeadshot,
    accept: imageAccept,
    maxFiles: 1,
    maxSize: MAX_PHOTO_SIZE,
    useFsAccessApi: false,
  });

  const traditionalDropzone = useDropzone({
    onDrop: onDropTraditional,
    accept: imageAccept,
    maxFiles: 1,
    maxSize: MAX_PHOTO_SIZE,
    useFsAccessApi: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ fullName: "", location: "", phone: "", age: "", region: "", languages: "" });
    setFile(null);
    setHeadshot(null);
    setTraditional(null);
    setErrors([]);
    setMessage("");
    setSuccess(null);
  };

  const switchProgram = (next) => {
    if (next === program) return;
    setProgram(next);
    // Never leak files/fields from one program into the other.
    setFile(null);
    setHeadshot(null);
    setTraditional(null);
    setForm((f) => ({ ...f, age: "", region: "", languages: "", location: "" }));
    setErrors([]);
    setMessage("");
  };

  const startApplication = () => {
    resetForm();
    setMobileOpen(false);
    setView("form");
  };

  const goHome = () => {
    resetForm();
    setMobileOpen(false);
    setView("landing");
    setActiveTab("home");
  };

  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted) {
        setView("landing");
        setActiveTab("home");
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors =
      program === "akwaaba"
        ? validateAkwaabaRegistration({
            fullName: form.fullName,
            phone: form.phone,
            age: form.age,
            region: form.region,
            languages: form.languages,
            headshot,
            traditional,
          })
        : validateRegistration({ ...form, file });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("program", program);
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);

      if (program === "akwaaba") {
        formData.append("age", form.age);
        formData.append("region", form.region);
        formData.append("languages", form.languages);
        formData.append("headshot", headshot);
        formData.append("traditional", traditional);
      } else {
        formData.append("location", form.location);
        formData.append("file", file);
      }

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

      if (paymentRes.ok && paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
        return;
      }

      if (!paymentRes.ok) {
        setMessage(
          paymentData.error ||
            "Your registration was saved, but payment could not be started."
        );
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
    <div className="relative isolate min-h-dvh w-full flex flex-col overflow-hidden">
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
            <span className="hidden sm:inline text-white font-bold text-base sm:text-lg">
              Ceejay Multimedia
            </span>
          </button>

          <nav className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur rounded-full p-1">
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
                onClick={startApplication}
                className="px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white hover:brightness-110 transition-all"
              >
                Apply Now
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:hidden">
            {view !== "form" && (
              <button
                type="button"
                onClick={startApplication}
                className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white hover:brightness-110 transition-all"
              >
                Apply Now
              </button>
            )}
            {view === "landing" && (
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white hover:bg-white/20 transition-colors"
              >
                <span className="text-lg leading-none">
                  {mobileOpen ? "✕" : "☰"}
                </span>
              </button>
            )}
          </div>
        </header>

        {mobileOpen && view === "landing" && (
          <div className="sm:hidden max-w-5xl mx-auto w-full mb-6 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 p-2 shadow-xl shadow-black/40 animate-fade-in">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setView("landing");
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  view === "landing" && activeTab === tab.key
                    ? "bg-amber-400 text-slate-900"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <main className="max-w-5xl mx-auto w-full flex-1 flex items-center justify-center py-12 md:py-24">
          {view === "landing" && (
            <div key={activeTab} className="animate-fade-in w-full">
              {activeTab === "home" && (
                <div className="text-center max-w-3xl mx-auto">
                  <p className="text-amber-300 font-semibold tracking-[0.25em] uppercase text-xs sm:text-sm mb-3">
                    Welcome to
                  </p>
                  <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    Ceejay Multimedia
                    <span className="block">Audition</span>
                  </h1>
                  <p className="text-white/85 mt-5 text-sm sm:text-lg">
                    ⭐ The Next Gospel Star ⭐
                    <br />
                    Show the world your amazing talent.
                  </p>
                  <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={startApplication}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:brightness-110 hover:scale-105 transition-all"
                    >
                      Start Your Application
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("how")}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-sm sm:text-base backdrop-blur hover:bg-white/20 transition-colors"
                    >
                      How It Works
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "how" && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Three Easy Steps to the Stage
                  </h2>
                  <p className="text-white/80 mt-2">
                    Follow along — you&apos;ll be ready to audition in minutes.
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
                <div className="space-y-8 w-full max-w-4xl mx-auto">
                  <div className="grid gap-4 sm:grid-cols-3 relative">
                    {[
                      {
                        n: "01",
                        icon: "📝",
                        title: "Fill in your details",
                        text: "Tell us your name, location and upload your 30-second audition clip (MP4, MOV, AVI, WebM, MP3 or WAV, up to 4MB).",
                      },
                      {
                        n: "02",
                        icon: "💳",
                        title: "Complete your fee",
                        text: "Pay the GHS 50 audition fee quickly and securely through Paystack.",
                      },
                      {
                        n: "03",
                        icon: "🎟️",
                        title: "Get your digital pass",
                        text: "Receive your audition pass with a QR code and show it at the venue on audition day.",
                      },
                    ].map((step) => (
                      <div
                        key={step.n}
                        className="relative bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-6 text-center hover:border-amber-400/50 hover:bg-white/15 hover:-translate-y-1 transition-all"
                      >
                        {step.n !== "03" && (
                          <span className="hidden sm:flex absolute top-1/2 -right-3 z-10 w-6 h-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 font-extrabold text-sm -translate-y-1/2">
                            →
                          </span>
                        )}
                        <span className="block text-4xl">{step.icon}</span>
                        <span className="block mt-3 text-[11px] font-bold tracking-[0.25em] uppercase text-amber-300">
                          Step {step.n}
                        </span>
                        <h3 className="text-white font-bold mt-1">
                          {step.title}
                        </h3>
                        <p className="text-white/70 text-sm mt-2 leading-relaxed">
                          {step.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur border border-amber-400/20 p-5 sm:p-7">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🛎️</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          Need Help?
                        </h3>
                        <p className="text-white/70 text-sm mt-0.5">
                          Quick answers to the questions we hear the most.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      {[
                        {
                          q: "How much is the audition fee?",
                          a: "The audition fee is GHS 50 per contestant. You pay it securely online through Paystack right after submitting your clip.",
                        },
                        {
                          q: "What do I need to apply?",
                          a: "Your full name, location, a valid Ghana phone number, and a 30-second audition clip (MP4, MOV, AVI, WebM, MP3 or WAV, up to 4MB).",
                        },
                        {
                          q: "What happens after I apply?",
                          a: "You'll receive a digital audition pass with your QR code. Just show it at the venue on audition day to check in.",
                        },
                      ].map((faq, i) => {
                        const open = openFaq === i;
                        return (
                          <div key={faq.q} className="border-b border-white/10 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => toggleFaq(i)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
                            >
                              <span className="text-white/90 text-sm font-semibold">
                                {faq.q}
                              </span>
                              <span
                                className={`flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 font-bold text-sm transition-transform ${
                                  open ? "rotate-45" : ""
                                }`}
                              >
                                +
                              </span>
                            </button>
                            {open && (
                              <p className="px-4 pb-4 -mt-1 text-sm text-white/70 leading-relaxed">
                                {faq.a}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
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

              <div className="rounded-2xl p-4 sm:p-8 bg-white border border-amber-300/70 shadow-2xl shadow-black/40">
                <div className="text-center mb-4 sm:mb-5">
                  <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                    {program === "akwaaba" ? "👑 Miss Akwaaba 👑" : "⭐ The Next Gospel Star ⭐"}
                  </h1>
                  <p className="text-slate-500 mt-1 sm:mt-2">
                    Application Form
                  </p>
                </div>

                <div className="mb-4 sm:mb-6">
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Which application are you submitting?
                  </p>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose application program">
                    <button
                      id="btnGospel"
                      type="button"
                      onClick={() => switchProgram("ngs")}
                      aria-pressed={program === "ngs"}
                      className={`px-3 py-3 rounded-xl border text-sm font-bold transition-all ${
                        program === "ngs"
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-orange-500/25"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ⭐ Gospel Star
                    </button>
                    <button
                      id="btnAkwaaba"
                      type="button"
                      onClick={() => switchProgram("akwaaba")}
                      aria-pressed={program === "akwaaba"}
                      className={`px-3 py-3 rounded-xl border text-sm font-bold transition-all ${
                        program === "akwaaba"
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-orange-500/25"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      👑 Miss Akwaaba
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base"
                    />
                  </div>

                  {program === "ngs" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="e.g. Accra, Ghana"
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          name="age"
                          min="16"
                          max="99"
                          value={form.age}
                          onChange={handleChange}
                          placeholder="Enter your age"
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Region
                        </label>
                        <input
                          type="text"
                          name="region"
                          value={form.region}
                          onChange={handleChange}
                          placeholder="e.g. Greater Accra"
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Languages Spoken
                        </label>
                        <input
                          type="text"
                          name="languages"
                          value={form.languages}
                          onChange={handleChange}
                          placeholder="e.g. English, Twi"
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Headshot Photo
                        </label>
                        <div
                          {...headshotDropzone.getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-colors bg-white ${
                            headshotDropzone.isDragActive
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-300 hover:border-amber-500"
                          }`}
                        >
                          <input {...headshotDropzone.getInputProps()} />
                          {headshot ? (
                            <div>
                              <p className="text-amber-600 font-medium">
                                {headshot.name}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                {(headshot.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-slate-500">
                                Drag & drop a clear face photo, or tap to browse
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                JPEG, PNG, WebP (max 1.5MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Traditional Photo
                        </label>
                        <div
                          {...traditionalDropzone.getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-colors bg-white ${
                            traditionalDropzone.isDragActive
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-300 hover:border-amber-500"
                          }`}
                        >
                          <input {...traditionalDropzone.getInputProps()} />
                          {traditional ? (
                            <div>
                              <p className="text-amber-600 font-medium">
                                {traditional.name}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                {(traditional.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-slate-500">
                                Drag & drop your photo in traditional attire, or tap to browse
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                JPEG, PNG, WebP (max 1.5MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 024XXXXXXX"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base"
                    />
                  </div>

                  {program === "ngs" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        30-Second Audition Clip
                      </label>
                      <div
                        {...clipDropzone.getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors bg-white ${
                          clipDropzone.isDragActive
                            ? "border-amber-500 bg-amber-50"
                            : "border-slate-300 hover:border-amber-500"
                        }`}
                      >
                        <input {...clipDropzone.getInputProps()} />
                        {file ? (
                          <div>
                            <p className="text-amber-600 font-medium">
                              {file.name}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-500">
                              Drag & drop your clip here, or tap to browse
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              MP4, MOV, AVI, WebM, MP3, WAV (max 4MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:brightness-110 shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Submitting..." : "Submit Application"}
                  </button>

                  {errors.length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-400/60 p-3 mt-2">
                      {errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-600">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}

                  {message && (
                    <p className="text-center text-sm text-red-600 mt-2">
                      {message}
                    </p>
                  )}
                </form>
              </div>
            </div>
          )}

          {view === "success" && success && (
            <div className="animate-fade-in w-full max-w-lg">
              <div className="rounded-3xl p-6 sm:p-10 bg-white border border-amber-300/70 shadow-2xl shadow-black/40 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  Thank You!
                </h2>
                <p className="text-slate-700 mt-4 leading-relaxed">
                  Thanks for applying,{" "}
                  <span className="text-amber-600 font-bold">
                    {success.contestant.full_name}
                  </span>
                  ! {"We're"} so excited to have you join the{" "}
                  <span className="text-amber-600 font-semibold">
                    {success.contestant.program === "akwaaba"
                      ? "Miss Akwaaba"
                      : "Ceejay Multimedia Audition"}
                  </span>
                  .{" "}
                  {success.contestant.program === "akwaaba"
                    ? "Your photos have been received safely."
                    : "Your audition clip has been received safely."}
                </p>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  We will be happy to see you at the venue. 🌟
                </p>

                <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-slate-500">Your Contestant ID</p>
                  <p className="text-2xl font-mono font-bold text-slate-900 mt-1">
                    {success.contestant.contestant_id}
                  </p>
                </div>

                <div className="mt-7 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={startApplication}
                    className="w-full px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-orange-500/30 hover:brightness-110 hover:scale-105 transition-all"
                  >
                    Register Another Contestant
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/pass?id=${success.contestant.contestant_id}`
                      )
                    }
                    className="w-full px-8 py-3.5 rounded-full bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-100 transition-colors"
                  >
                    View My Digital Pass
                  </button>
                  <button
                    type="button"
                    onClick={goHome}
                    className="w-full px-8 py-3.5 rounded-full bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-100 transition-colors"
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