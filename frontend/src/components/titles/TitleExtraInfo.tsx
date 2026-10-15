import { useTranslation } from "react-i18next";
import type { CatalogTitle } from "../../services/titles";
import { TitleCast } from "./TitleCast";

interface TitleExtraInfoProps {
  title: CatalogTitle;
}

export function TitleExtraInfo({ title }: TitleExtraInfoProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";

  function formatMoney(value: number | null, currency: string) {
    if (value === null) return t("title.notAvailable");

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const directors = [
    ...new Set(
      title.crew
        .filter((person) => person.job === "Director")
        .map((person) => person.name),
    ),
  ];

  const rows = [
    {
      label: t("title.originalTitle"),
      value: title.originalTitle,
    },
    {
      label: t("title.directors"),
      value: directors.join(", "),
    },
    {
      label: t("title.productionCompanies"),
      value: title.productionCompanies
        .map((company) => company.name)
        .join(", "),
    },
    {
      label: t("title.productionCountries"),
      value: title.productionCountries
        .map((country) => country.name)
        .join(", "),
    },
    {
      label: t("title.spokenLanguages"),
      value: title.spokenLanguages
        .map((language) => language.name || language.englishName)
        .join(", "),
    },
  ];

  return (
    <div className="title-extra">
      <section className="title-extra__details">
        <h2>{t("title.detailsHeading")}</h2>

        <dl>
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value || t("title.notAvailable")}</dd>
            </div>
          ))}

          {title.movie && (
            <>
              <div>
                <dt>{t("title.budget")}</dt>
                <dd>{formatMoney(title.movie.budget, title.movie.currency)}</dd>
              </div>

              <div>
                <dt>{t("title.revenue")}</dt>
                <dd>
                  {formatMoney(title.movie.revenue, title.movie.currency)}
                </dd>
              </div>
            </>
          )}

          {title.series && (
            <>
              <div>
                <dt>{t("title.seasons")}</dt>
                <dd>{title.series.seasons ?? t("title.notAvailable")}</dd>
              </div>

              <div>
                <dt>{t("title.episodes")}</dt>
                <dd>{title.series.episodes ?? t("title.notAvailable")}</dd>
              </div>

              <div>
                <dt>{t("title.creators")}</dt>
                <dd>
                  {title.series.creators
                    .map((person) => person.name)
                    .join(", ") || t("title.notAvailable")}
                </dd>
              </div>

              <div>
                <dt>{t("title.networks")}</dt>
                <dd>
                  {title.series.networks
                    .map((network) => network.name)
                    .join(", ") || t("title.notAvailable")}
                </dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <TitleCast cast={title.cast} />
    </div>
  );
}
