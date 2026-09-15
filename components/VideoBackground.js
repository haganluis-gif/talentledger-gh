"use client";

import { useState } from "react";

export default function VideoBackground({
  src = "/backgrounds/bg-main.mp4",
  poster = "/backgrounds/bg-poster.jpg",
  media,
}) {
  const [index, setIndex] = useState(0);

  if (media && media.length > 1) {
    const item = media[index % media.length];
    return (
      <>
        <video
          key={item.src}
          autoPlay
          muted
          loop={false}
          playsInline
          preload="auto"
          poster={item.poster}
          onEnded={() => setIndex((i) => (i + 1) % media.length)}
          className="absolute inset-0 w-full h-full object-cover -z-10"
        >
          <source src={item.src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </>
    );
  }

  return (
    <>
      <video
        key={src}
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50" />
    </>
  );
}