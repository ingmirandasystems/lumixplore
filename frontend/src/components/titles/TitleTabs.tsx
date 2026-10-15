import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

type TabId = "similar" | "extra" | "trailer";

interface TitleTabsProps {
  similar: ReactNode;
  extra: ReactNode;
  trailer?: ReactNode;
}

export function TitleTabs({ similar, extra, trailer }: TitleTabsProps) {
  const { t } = useTranslation();
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabId>("similar");

  const hasTrailer = trailer !== null && trailer !== undefined;

  const tabs: { id: TabId; label: string; content: ReactNode }[] = [
    {
      id: "similar",
      label: t("title.similarTab"),
      content: similar,
    },
    {
      id: "extra",
      label: t("title.extraTab"),
      content: extra,
    },
  ];

  if (hasTrailer) {
    tabs.push({
      id: "trailer",
      label: t("title.trailerTab"),
      content: trailer,
    });
  }

  const activeTab =
    selectedTab === "trailer" && !hasTrailer ? "similar" : selectedTab;

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();

    const nextTab = tabs[nextIndex];
    if (!nextTab) return;

    setSelectedTab(nextTab.id);
    buttons.current[nextIndex]?.focus();
  }

  return (
    <div className="title-tabs">
      <div
        className="title-tabs__list"
        role="tablist"
        aria-label={t("title.tabsLabel")}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            id={`${id}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${id}-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={
              activeTab === tab.id
                ? "title-tabs__tab is-active"
                : "title-tabs__tab"
            }
            onClick={() => setSelectedTab(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${id}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="title-tabs__panel"
        >
          {activeTab === tab.id ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
