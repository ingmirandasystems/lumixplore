import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MediaType } from "../../services/titles";
import {
  getWatchlistStatus,
  setWatchlistStatus,
} from "../../services/watchlist";
import { getCommonErrorKey } from "../../services/api";
import "./WatchlistButton.css";
import addIcon from "../../assets/icons/plus.svg";
import removeIcon from "../../assets/icons/minus.svg";

interface WatchlistButtonProps {
  mediaType: MediaType;
  tmdbId: number;
}

export function WatchlistButton({ mediaType, tmdbId }: WatchlistButtonProps) {
  const { t } = useTranslation();

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatus() {
      setStatusLoaded(false);
      setLoading(true);
      setErrorKey(null);

      try {
        const result = await getWatchlistStatus(
          mediaType,
          tmdbId,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setInWatchlist(result.inWatchlist);
          setStatusLoaded(true);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setErrorKey(getCommonErrorKey(error, "watchlist.statusError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStatus();

    return () => controller.abort();
  }, [mediaType, tmdbId]);

  async function handleToggle() {
    if (!statusLoaded || saving) return;

    setSaving(true);
    setErrorKey(null);

    try {
      const result = await setWatchlistStatus(mediaType, tmdbId, !inWatchlist);

      setInWatchlist(result.inWatchlist);
    } catch (error: unknown) {
      setErrorKey(getCommonErrorKey(error, "watchlist.updateError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="watchlist-control">
      <button
        type="button"
        className={inWatchlist ? "is-saved" : ""}
        onClick={handleToggle}
        disabled={!statusLoaded || saving}
        aria-pressed={inWatchlist}
      >
        <img src={inWatchlist ? removeIcon : addIcon} alt="" />

        {loading ? (
          <span>{t("watchlist.checking")}</span>
        ) : saving ? (
          <span>{t("watchlist.saving")}</span>
        ) : inWatchlist ? (
          <span>{t("watchlist.remove")}</span>
        ) : (
          <span>{t("watchlist.add")}</span>
        )}
      </button>

      {errorKey && <p role="alert">{t(errorKey)}</p>}
    </div>
  );
}
