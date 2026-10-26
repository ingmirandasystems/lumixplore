import { useState } from "react";

interface PosterImageProps {
  src: string;
  title: string;
}

export function PosterImage({ src, title }: PosterImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  return (
    <div
      className={`poster-frame poster-frame--${status}`}
      aria-busy={status === "loading"}
    >
      {status !== "error" ? (
        <img
          src={src}
          alt=""
          className="poster-img"
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : (
        <span className="poster-frame__fallback">{title}</span>
      )}
    </div>
  );
}
