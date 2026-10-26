import { useState } from "react";

interface TitleLogoProps {
  path: string | null;
  name: string;
  className?: string;
}

export function TitleLogo({ path, name, className }: TitleLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return <span className={className}>{name}</span>;
  }

  return (
    <img
      className={className}
      src={`https://image.tmdb.org/t/p/original${path}`}
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}
