export default function VideoBackground({ src = "/backgrounds/bg-main.mp4" }) {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/backgrounds/bg-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50" />
    </>
  );
}