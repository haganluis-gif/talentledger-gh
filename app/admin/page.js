"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import VideoBackground from "@/components/VideoBackground";

const PROGRAM_FILTERS = [
  { key: "all", label: "All Programs" },
  { key: "ngs", label: "🎤 Gospel Star" },
  { key: "akwaaba", label: "👑 Miss Akwaaba" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseMediaUrls(value) {
  if (!value) return [];
  try {
    const urls = JSON.parse(value);
    return Array.isArray(urls) ? urls.filter((u) => typeof u === "string" && u) : [];
  } catch {
    return [];
  }
}

function LockIcon() {
  return (
    <svg
      className="w-5 h-5 text-amber-300/80"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-white/40"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ProgramBadge({ program }) {
  const isAkwaaba = program === "akwaaba";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
        isAkwaaba
          ? "bg-rose-400/15 text-rose-300 border-rose-400/30"
          : "bg-amber-400/15 text-amber-300 border-amber-400/30"
      }`}
    >
      {isAkwaaba ? "👑" : "🎤"} {isAkwaaba ? "Miss Akwaaba" : "Gospel Star"}
    </span>
  );
}

function PaymentBadge({ status }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
        paid
          ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/30"
          : "bg-orange-400/15 text-orange-300 border-orange-400/30"
      }`}
    >
      {paid ? "✅" : "⏳"} {paid ? "Paid" : "Pending"}
    </span>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSigningIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid password.");
        return;
      }
      setAuthenticated(true);
      setPassword("");
      const loaded = await fetchContestants();
      if (!loaded.ok) {
        setError(loaded.error || "Failed to load contestants.");
      }
    } catch (err) {
      setError("Failed to log in.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      // ignore network errors; still clear local state
    }
    setAuthenticated(false);
    setContestants([]);
    setPassword("");
    setError("");
    setFilter("all");
    setSearch("");
    setPreview(null);
  };

  const fetchContestants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contestants");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setAuthenticated(false);
        return { ok: false, error: data.error || "Failed to load contestants." };
      }
      setContestants(data.contestants || []);
      return { ok: true };
    } catch (err) {
      setError("Failed to load contestants.");
      return { ok: false, error: "Failed to load contestants." };
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (contestant) => {
    const confirmed = window.confirm(
      `Remove ${contestant.full_name} (${contestant.contestant_id})?\n\nThis permanently deletes their audition clip and/or photos. This cannot be undone.`
    );
    if (!confirmed) return;

    setRemoving(contestant.contestant_id);
    setError("");
    try {
      const res = await fetch(
        `/api/contestants?id=${encodeURIComponent(contestant.contestant_id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          return;
        }
        setError(data.error || "Failed to remove contestant.");
        return;
      }
      setContestants((prev) =>
        prev.filter((c) => c.contestant_id !== contestant.contestant_id)
      );
    } catch (err) {
      setError("Failed to remove contestant.");
    } finally {
      setRemoving(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="relative isolate min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <VideoBackground />

        <div className="relative z-10 w-full max-w-5xl animate-fade-in">
          <div className="rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/50 grid md:grid-cols-5">
            <div className="md:col-span-2 p-6 sm:p-10 flex flex-col justify-between gap-8 bg-gradient-to-br from-black/40 to-transparent border-b md:border-b-0 md:border-r border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 text-xl">
                    ⭐
                  </span>
                  <div>
                    <p className="text-white font-bold leading-tight">
                      Ceejay Multimedia
                    </p>
                    <p className="text-amber-300 text-[11px] font-semibold tracking-[0.2em] uppercase">
                      TalentLedger
                    </p>
                  </div>
                </div>

                <h1 className="mt-8 text-white font-extrabold text-3xl sm:text-4xl leading-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Judges &amp; Admin Portal
                </h1>
                <p className="mt-3 text-white/70 text-sm leading-relaxed">
                  Manage auditions, pageant entries, payments and contestant
                  media from one secure control room.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/10 border border-amber-400/20 rounded-2xl p-4 hover:border-amber-400/50 hover:bg-white/15 transition-all">
                  <span className="text-2xl" aria-hidden="true">
                    🎤
                  </span>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      The Next Gospel Star
                    </p>
                    <p className="text-white/55 text-xs mt-0.5">
                      Review 30-second audition clips
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 border border-rose-400/20 rounded-2xl p-4 hover:border-rose-400/50 hover:bg-white/15 transition-all">
                  <span className="text-2xl" aria-hidden="true">
                    👑
                  </span>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      Miss Akwaaba
                    </p>
                    <p className="text-white/55 text-xs mt-0.5">
                      Review pageant headshots &amp; traditional photos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 p-6 sm:p-10 flex items-center">
              <div className="w-full">
                <p className="text-amber-300 font-semibold tracking-[0.25em] uppercase text-xs mb-2">
                  Secure Access
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Sign In to Dashboard
                </h2>
                <p className="text-white/70 text-sm mt-1 mb-8">
                  Enter the admin password to continue.
                </p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="block text-sm font-medium text-white mb-1.5"
                    >
                      Admin Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2">
                        <LockIcon />
                      </span>
                      <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        autoComplete="current-password"
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/30 text-white placeholder-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm sm:text-base transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white py-3 rounded-xl font-bold hover:brightness-110 shadow-lg shadow-orange-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {signingIn ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In to Dashboard"
                    )}
                  </button>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl bg-red-950/70 border border-red-500/40 p-3.5"
                    >
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}
                </form>

                <p className="text-center text-xs text-white/50 mt-8 inline-flex items-center justify-center gap-1.5 w-full">
                  <LockIcon /> Authorized access only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const total = contestants.length;
  const ngsCount = contestants.filter((c) => c.program !== "akwaaba").length;
  const akwaabaCount = contestants.filter((c) => c.program === "akwaaba").length;
  const pendingCount = contestants.filter((c) => c.payment_status !== "paid").length;
  const paidCount = contestants.filter((c) => c.payment_status === "paid").length;

  const query = search.trim().toLowerCase();
  const filtered = contestants.filter((c) => {
    const matchesProgram =
      filter === "all" || c.program === filter;
    const matchesSearch =
      !query ||
      c.full_name?.toLowerCase().includes(query) ||
      c.contestant_id?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.location?.toLowerCase().includes(query);
    return matchesProgram && matchesSearch;
  });

  const overview = [
    {
      key: "total",
      label: "Total Contestants",
      value: total,
      icon: "📊",
      tint: "border-white/20",
      text: "text-white",
    },
    {
      key: "ngs",
      label: "Next Gospel Star",
      value: ngsCount,
      icon: "🎤",
      tint: "border-amber-400/30",
      text: "text-amber-300",
    },
    {
      key: "akwaaba",
      label: "Miss Akwaaba",
      value: akwaabaCount,
      icon: "👑",
      tint: "border-rose-400/30",
      text: "text-rose-300",
    },
    {
      key: "pending",
      label: "Pending Payments",
      value: pendingCount,
      icon: "⏳",
      tint: "border-orange-400/30",
      text: "text-orange-300",
    },
    {
      key: "paid",
      label: "Paid Entries",
      value: paidCount,
      icon: "✅",
      tint: "border-emerald-400/30",
      text: "text-emerald-300",
    },
  ];

  return (
    <div className="relative isolate min-h-dvh w-full flex flex-col overflow-hidden">
      <VideoBackground />

      <div className="relative flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/60 backdrop-blur-xl border-b border-white/15">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 text-lg shrink-0">
                ⭐
              </span>
              <div className="min-w-0">
                <h1 className="text-white font-extrabold leading-tight truncate">
                  Judges &amp; Admin Portal
                </h1>
                <p className="text-white/50 text-xs truncate">
                  Ceejay Multimedia · TalentLedger
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                📊 {total} contestant{total === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => fetchContestants()}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                <RefreshIcon />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:brightness-110 shadow-lg shadow-orange-500/25 transition-all"
              >
                <LogoutIcon />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1 space-y-6 sm:space-y-8">
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-950/70 border border-red-500/40 p-4"
            >
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <section aria-label="Overview" className="space-y-3 sm:space-y-4">
            <h2 className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              Competition Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {overview.map((stat) => (
                <div
                  key={stat.key}
                  className={`bg-white/10 backdrop-blur border ${stat.tint} rounded-2xl p-4 hover:bg-white/15 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-2xl font-extrabold ${stat.text}`}
                    >
                      {stat.value}
                    </span>
                    <span className="text-xl" aria-hidden="true">
                      {stat.icon}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs font-medium mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section aria-label="Search and filters" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 sm:max-w-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, ID, region..."
                  aria-label="Search contestants"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/30 text-white placeholder-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm transition-all"
                />
              </div>
              <div
                className="inline-flex items-center gap-1 bg-white/5 border border-white/15 rounded-xl p-1 w-full sm:w-auto overflow-x-auto"
                role="group"
                aria-label="Filter by program"
              >
                {PROGRAM_FILTERS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    aria-pressed={filter === option.key}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                      filter === option.key
                        ? option.key === "akwaaba"
                          ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-500/25"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {(!query && filter !== "all" ? contestants.length : filtered.length) > 0 && (
              <p className="text-white/50 text-xs" aria-live="polite">
                Showing {filtered.length} of {contestants.length} contestant
                {contestants.length === 1 ? "" : "s"}
                {filter !== "all"
                  ? ` in ${filter === "akwaaba" ? "Miss Akwaaba" : "Gospel Star"}`
                  : ""}
              </p>
            )}
          </section>

          {loading ? (
            <section
              aria-label="Loading contestants"
              aria-busy="true"
              className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="h-5 w-20 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-5 w-32 bg-white/10 rounded" />
                  <div className="h-8 w-full bg-white/10 rounded-lg" />
                  <div className="h-36 w-full bg-white/10 rounded-xl" />
                </div>
              ))}
            </section>
          ) : contestants.length === 0 ? (
            <section className="flex items-center justify-center min-h-[50vh]">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 md:p-14 text-center max-w-lg shadow-2xl shadow-black/40">
                <div className="text-5xl mb-4" aria-hidden="true">
                  🎭
                </div>
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                  No Applications Yet
                </h2>
                <p className="text-white/70 text-sm mt-3 leading-relaxed">
                  No one has applied as a contestant yet. Once contestants sign
                  up, their audition clips and pageant photos will appear here
                  for review.
                </p>
              </div>
            </section>
          ) : filtered.length === 0 ? (
            <section className="flex items-center justify-center min-h-[40vh]">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 md:p-12 text-center max-w-lg shadow-2xl shadow-black/40">
                <div className="text-5xl mb-4" aria-hidden="true">
                  🔍
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  No Matches Found
                </h2>
                <p className="text-white/70 text-sm mt-3 leading-relaxed">
                  No contestants match the current search or program filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-sm hover:brightness-110 shadow-lg shadow-orange-500/25 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </section>
          ) : (
            <section aria-label="Contestants" className="space-y-3">
              <h2 className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Contestants
              </h2>
              <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => {
                  const isAkwaaba = c.program === "akwaaba";
                  const photos = isAkwaaba ? parseMediaUrls(c.media_url) : [];
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/15 overflow-hidden hover:border-amber-400/40 hover:bg-white/15 transition-all flex flex-col"
                    >
                      <div
                        className={`h-1.5 w-full bg-gradient-to-r ${
                          isAkwaaba
                            ? "from-rose-400 via-pink-500 to-fuchsia-500"
                            : "from-amber-400 via-orange-500 to-rose-500"
                        }`}
                      />
                      <div className="px-4 pt-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-300">
                            {c.contestant_id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <ProgramBadge program={c.program} />
                            <PaymentBadge status={c.payment_status} />
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 flex-1">
                        <h3 className="text-white font-bold truncate">
                          {c.full_name}
                        </h3>
                        <dl className="mt-2 space-y-1">
                          {isAkwaaba ? (
                            <>
                              {c.age
                                ? (
                                  <div className="flex items-start justify-between gap-2">
                                    <dt className="text-white/45 text-xs font-medium">
                                      Age
                                    </dt>
                                    <dd className="text-white/85 text-xs text-right">
                                      {c.age}
                                    </dd>
                                  </div>
                                )
                                : null}
                              {c.city
                                ? (
                                  <div className="flex items-start justify-between gap-2">
                                    <dt className="text-white/45 text-xs font-medium">
                                      Region
                                    </dt>
                                    <dd className="text-white/85 text-xs text-right truncate">
                                      {c.city}
                                    </dd>
                                  </div>
                                )
                                : null}
                              {c.church_denomination
                                ? (
                                  <div className="flex items-start justify-between gap-2">
                                    <dt className="text-white/45 text-xs font-medium">
                                      Languages
                                    </dt>
                                    <dd className="text-white/85 text-xs text-right truncate">
                                      {c.church_denomination}
                                    </dd>
                                  </div>
                                )
                                : null}
                            </>
                          ) : (
                            <>
                              {c.location
                                ? (
                                  <div className="flex items-start justify-between gap-2">
                                    <dt className="text-white/45 text-xs font-medium">
                                      Location
                                    </dt>
                                    <dd className="text-white/85 text-xs text-right truncate">
                                      {c.location}
                                    </dd>
                                  </div>
                                )
                                : null}
                            </>
                          )}
                          {c.phone
                            ? (
                              <div className="flex items-start justify-between gap-2">
                                <dt className="text-white/45 text-xs font-medium">
                                  Contact
                                </dt>
                                <dd className="text-white/85 text-xs text-right truncate">
                                  {c.phone}
                                </dd>
                              </div>
                            )
                            : null}
                          <div className="flex items-start justify-between gap-2">
                            <dt className="text-white/45 text-xs font-medium">
                              Registered
                            </dt>
                            <dd className="text-white/85 text-xs text-right">
                              {formatDate(c.created_at)}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {isAkwaaba ? (
                        photos.length > 0 ? (
                          <div className="border-t border-white/10 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              {photos.map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() =>
                                    setPreview({ urls: photos, index: i })
                                  }
                                  className="group relative rounded-xl overflow-hidden border border-white/10 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                  aria-label={`View ${i === 0 ? "headshot" : "traditional"} photo of ${c.full_name}`}
                                >
                                  <img
                                    src={url}
                                    alt={`${i === 0 ? "Headshot" : "Traditional attire"} of ${c.full_name}`}
                                    className="h-28 w-full object-cover"
                                    loading="lazy"
                                  />
                                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-1.5 text-left">
                                    <span className="text-[11px] font-bold text-white">
                                      {i === 0 ? "Headshot" : "Traditional"}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="border-t border-white/10 bg-white/5 p-5 text-center">
                            <p className="text-sm text-white/40">
                              No photos uploaded
                            </p>
                          </div>
                        )
                      ) : c.clip_url ? (
                        <div className="border-t border-white/10">
                          <video
                            src={c.clip_url}
                            controls
                            preload="metadata"
                            className="w-full aspect-video object-cover bg-black/40"
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>
                      ) : (
                        <div className="border-t border-white/10 bg-white/5 p-5 text-center">
                          <p className="text-sm text-white/40">
                            🎬 No audition clip
                          </p>
                        </div>
                      )}

                      <div className="p-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleRemove(c)}
                          disabled={removing === c.contestant_id}
                          className="w-full bg-red-950/50 text-red-300 border border-red-500/30 py-2 rounded-xl font-semibold hover:bg-red-600 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {removing === c.contestant_id ? (
                            <>
                              <span className="w-4 h-4 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <TrashIcon />
                              Remove Contestant
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <footer className="border-t border-white/10 bg-slate-950/40 backdrop-blur">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-white/40 text-xs">
              TalentLedger · Ceejay Multimedia
            </p>
            <Link
              href="/"
              className="text-amber-300/80 hover:text-amber-300 text-xs font-semibold transition-colors"
            >
              ← Back to site
            </Link>
          </div>
        </footer>
      </div>

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${preview.index === 0 ? "Headshot" : "Traditional"} photo preview`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-slate-900/90 border border-white/15 shadow-2xl shadow-black/50 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-white font-semibold text-sm">
                {preview.index === 0 ? "Headshot" : "Traditional Attire"}
              </p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close photo preview"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex items-center justify-center bg-black/60 p-2">
              <img
                src={preview.urls[preview.index]}
                alt={`Photo preview ${preview.index + 1} of ${preview.urls.length}`}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            {preview.urls.length > 1 && (
              <div className="flex items-center justify-between gap-2 p-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setPreview((p) => ({
                      ...p,
                      index: (p.index - 1 + p.urls.length) % p.urls.length,
                    }))
                  }
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  ← Previous
                </button>
                <p className="text-white/60 text-xs">
                  Photo {preview.index + 1} of {preview.urls.length}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setPreview((p) => ({
                      ...p,
                      index: (p.index + 1) % p.urls.length,
                    }))
                  }
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}