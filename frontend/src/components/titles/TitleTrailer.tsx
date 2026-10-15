import { useTranslation } from "react-i18next";
import type { CatalogTitle } from "../../services/titles";

interface TitleTrailerProps {
  trailer: NonNullable<CatalogTitle["trailer"]>;
  titleName: string;
}

export function TitleTrailer({ trailer, titleName }: TitleTrailerProps) {
  const { t } = useTranslation();

  return (
    <section className="title-trailer">
      <iframe
        className="title-trailer__video"
        src={`https://www.youtube-nocookie.com/embed/${trailer.youtubeKey}`}
        title={t("title.trailerVideoTitle", { name: titleName })}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "16 / 9",
          border: 0,
        }}
      />

      <a
        href={`https://www.youtube.com/watch?v=${trailer.youtubeKey}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("title.watchOnYoutube")}
      </a>
    </section>
  );
}
