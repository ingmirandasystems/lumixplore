import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import nextIcon from "../../assets/icons/caret-right.svg";

interface ScrollableRowProps {
  children: ReactNode;
}

export function ScrollableRow({ children }: ScrollableRowProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLUListElement | null>(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    function updateArrows() {
      if (!list) return;

      const remaining = list.scrollWidth - list.clientWidth - list.scrollLeft;

      setCanGoBack(list.scrollLeft > 2);
      setCanGoForward(remaining > 2);
    }

    const observer = new ResizeObserver(updateArrows);

    observer.observe(list);

    for (const item of list.children) {
      observer.observe(item);
    }

    list.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();

    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateArrows);
    };
  }, [children]);

  function move(direction: -1 | 1) {
    const list = listRef.current;

    if (!list) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <div className="explore-row-container">
      <ul ref={listRef} className="explore-row">
        {children}
      </ul>

      <button
        type="button"
        className="explore-row-arrow explore-row-arrow--back"
        aria-label={t("explore.previous")}
        disabled={!canGoBack}
        onClick={() => move(-1)}
      >
        <img src={nextIcon} alt="" />
      </button>

      <button
        type="button"
        className="explore-row-arrow explore-row-arrow--next"
        aria-label={t("explore.next")}
        disabled={!canGoForward}
        onClick={() => move(1)}
      >
        <img src={nextIcon} alt="" />
      </button>
    </div>
  );
}
