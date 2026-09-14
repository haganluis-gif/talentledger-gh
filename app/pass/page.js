"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import VideoBackground from "@/components/VideoBackground";

export default function PassPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [contestant, setContestant] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchContestant = async () => {
      try {
        const res = await fetch(`/api/contestant?id=${id}`);
        const data = await res.json();
        if (data.contestant) {
          setContestant(data.contestant);
          const qr = await QRCode.toDataURL(
            `${window.location.origin}/pass?id=${data.contestant.contestant_id}`,
            {
              width: 200,
              margin: 2,
            }
          );
          setQrUrl(qr);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContestant();
  }, [id]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <VideoBackground />
        <p className="relative text-white/90 text-lg">Loading your pass...</p>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <VideoBackground />
        <p className="relative text-white text-lg">Contestant not found.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <VideoBackground />
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">The Next Gospel Star</h1>
            <p className="text-green-100 text-sm mt-1">Digital Audition Pass</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Contestant ID
              </p>
              <p className="text-2xl font-mono font-bold text-green-700 mt-1">
                {contestant.contestant_id}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  contestant.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {contestant.payment_status === "paid" ? "✓ Paid" : "Pending"}
              </span>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Name</span>
                <span className="text-gray-800 font-medium text-sm">
                  {contestant.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Location</span>
                <span className="text-gray-800 font-medium text-sm">
                  {contestant.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Phone</span>
                <span className="text-gray-800 font-medium text-sm">
                  {contestant.phone}
                </span>
              </div>
            </div>

            {qrUrl && (
              <div className="flex justify-center pt-2">
                <Image
                  src={qrUrl}
                  alt="QR Code"
                  width={160}
                  height={160}
                  unoptimized
                  className="w-40 h-40"
                />
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-2">
              Show this QR code at venue check-in to confirm your pass
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Screenshot this page to save your pass
        </p>
      </div>
    </div>
  );
}
