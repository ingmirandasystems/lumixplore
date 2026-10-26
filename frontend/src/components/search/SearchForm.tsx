import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import searchIcon from "../../assets/icons/search.svg";
import "./SearchForm.css";

interface SearchFormProps {
  autoFocus?: boolean;
  onSearch?: () => void;
}

export function SearchForm({ autoFocus = false, onSearch }: SearchFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const search = query.trim();

    if (!search) return;

    const parameters = new URLSearchParams({ q: search });

    navigate(`/search?${parameters}`);
    onSearch?.();
  }

  return (
    <form role="search" className="header-search" onSubmit={handleSubmit}>
      <div className="search-input__container">
        <input
          ref={inputRef}
          id={inputId}
          name="q"
          type="search"
          enterKeyHint="search"
          aria-label={t("search.placeholder")}
          required
          maxLength={200}
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />

        <button
          type="submit"
          disabled={!query.trim()}
          aria-label={t("search.submit")}
        >
          <img src={searchIcon} alt="" className="search-icon" />
        </button>
      </div>
    </form>
  );
}
