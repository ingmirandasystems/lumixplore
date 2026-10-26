import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogTitle } from "../../services/titles";
import "./TitleCast.css";

interface TitleCastProps {
  cast: CatalogTitle["cast"];
}

function CastPhoto({ path }: { path: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <div className="title-cast__placeholder" aria-hidden="true">
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
    />
  );
}

export function TitleCast({ cast }: TitleCastProps) {
  const { t } = useTranslation();

  if (cast.length === 0) return null;

  return (
    <section className="title-cast">
      <h2>{t("title.cast")}</h2>

      <ul className="title-cast__list">
        {cast.map((person, index) => (
          <li key={`${person.id}-${index}`} className="title-cast__person">
            <CastPhoto key={person.profilePath} path={person.profilePath} />

            <p className="title-cast__name">{person.name}</p>

            {person.character && (
              <p className="title-cast__character">{person.character}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
