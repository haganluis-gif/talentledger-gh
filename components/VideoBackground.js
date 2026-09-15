export default function VideoBackground({
  src = "/backgrounds/bg-main.mp4",
  poster = "/backgrounds/bg-poster.jpg",
}) {
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