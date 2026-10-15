import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogTitle } from "../../services/titles";

interface TitleCastProps {
  cast: CatalogTitle["cast"];
}

function CastPhoto({ path }: { path: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <div
        className="title-cast__placeholder"
        aria-hidden="true"
        style={{
          width: 120,
          height: 180,
          display: "grid",
          placeItems: "center",
          background: "#333",
        }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={`https://image.tmdb.org/t/p/w185${path}`}
      alt=""
      loading="lazy"
      width={120}
      height={180}
      onError={() => setFailed(true)}
      style={{ objectFit: "cover" }}
    />
  );
}

export function TitleCast({ cast }: TitleCastProps) {
  const { t } = useTranslation();

  if (cast.length === 0) return null;

  return (
    <section className="title-cast">
      <h2>{t("title.cast")}</h2>

      <ul
        className="title-cast__list"
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          listStyle: "none",
          padding: 0,
        }}
      >
        {cast.map((person, index) => (
          <li
            key={`${person.id}-${index}`}
            className="title-cast__person"
            style={{ flex: "0 0 120px" }}
          >
            <CastPhoto key={person.profilePath} path={person.profilePath} />

            <p>{person.name}</p>
            {person.character && <p>{person.character}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
