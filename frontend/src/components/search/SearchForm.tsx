import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export function SearchForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputId = useId();

  const [query, setQuery] = useState("");

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const search = query.trim();

    if (!search) return;

    const parameters = new URLSearchParams({
      q: search,
    });

    navigate(`/search?${parameters}`);
  }

  return (
    <form role="search" className="header-search" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>{t("search.label")}</label>

      <input
        id={inputId}
        name="q"
        type="search"
        required
        maxLength={200}
        placeholder={t("search.placeholder")}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      <button type="submit" disabled={!query.trim()}>
        {t("search.submit")}
      </button>
    </form>
  );
}
