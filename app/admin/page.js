"use client";

import { useState } from "react";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
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
      `Remove ${contestant.full_name} (${contestant.contestant_id})?\n\nTheir audition clip will also be deleted. This cannot be undone.`
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden bg-white/95 backdrop-blur shadow-2xl">
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 p-10 text-white relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold mt-6 leading-tight">
                The Next Gospel Star
              </h2>
              <p className="mt-3 text-white/85 text-sm leading-relaxed">
                Judges Portal — review audition clips, check payment status and
                manage contestants from one beautiful dashboard.
              </p>
            </div>

            <div className="relative space-y-4">
              {[
                { icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", label: "Watch audition clips" },
                { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Track payment status" },
                { icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", label: "Remove contestants" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} />
                  </svg>
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </div>

            <p className="relative text-white/70 text-xs">⭐ Contestant Registration Portal</p>
          </div>

          <div className="p-8 md:p-12">
            <div className="md:hidden flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mb-6 shadow-lg shadow-amber-500/30 mx-auto">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-1 mb-8">
              Enter your password to access the judges dashboard.
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Login to Dashboard
              </button>
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              🔒 Authorized judge access only
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Judges Dashboard
              </h1>
              <p className="text-xs text-gray-500">The Next Gospel Star</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-amber-100 text-amber-700 font-medium px-3 py-1 rounded-full">
              {contestants.length} contestant{contestants.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => fetchContestants()}
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contestants.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-3xl p-10 md:p-14 text-center max-w-lg shadow-xl">
              <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
                <svg
                  className="w-10 h-10 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                No Applications Yet
              </h2>
              <p className="text-gray-500">
                No one has applied as a contestant yet. Once contestants sign
                up, their audition clips will appear here for review.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contestants.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-bold text-amber-600">
                      {c.contestant_id}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        c.payment_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {c.payment_status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{c.full_name}</h3>
                  <p className="text-sm text-gray-500">{c.location}</p>
                  <p className="text-sm text-gray-500">{c.phone}</p>
                </div>

                {c.clip_url ? (
                  <div className="border-t">
                    <video
                      src={c.clip_url}
                      controls
                      className="w-full h-48 object-cover"
                      preload="metadata"
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                ) : (
                  <div className="border-t bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-400">No audition clip</p>
                  </div>
                )}

                <div className="border-t px-5 py-3">
                  <button
                    onClick={() => handleRemove(c)}
                    disabled={removing === c.contestant_id}
                    className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {removing === c.contestant_id
                      ? "Removing..."
                      : "Remove Contestant"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}