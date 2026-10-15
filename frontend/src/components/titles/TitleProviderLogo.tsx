import { useState } from "react";

interface TitleProviderLogoProps {
  path: string | null;
}

export function TitleProviderLogo({ path }: TitleProviderLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <span
        aria-hidden="true"
        className="title-provider__placeholder"
        style={{
          display: "grid",
          placeItems: "center",
          width: 48,
          height: 48,
          background: "#333",
          borderRadius: 8,
        }}
      >
        ?
      </span>
    );
  }

  return (
    <img
      src={`https://image.tmdb.org/t/p/w92${path}`}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ borderRadius: 8, objectFit: "cover" }}
    />
  );
}
