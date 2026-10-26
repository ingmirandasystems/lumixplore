import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "./SettingsModal.css";

interface SettingsModalProps {
  title: string;
  children: ReactNode;
  busy?: boolean;
  onClose: () => void;
}

export function SettingsModal({
  title,
  children,
  busy = false,
  onClose,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    const firstControl = dialog.querySelector<HTMLElement>(
      "input:not(:disabled), select:not(:disabled), [data-modal-heading]",
    );

    firstControl?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="settings-modal"
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) {
          onClose();
        }
      }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;

        const bounds = event.currentTarget.getBoundingClientRect();

        const clickedOutside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;

        if (clickedOutside) {
          onClose();
        }
      }}
    >
      <header className="settings-modal__header">
        <h2 id={titleId} tabIndex={-1} data-modal-heading>
          {title}
        </h2>

        <button
          type="button"
          className="settings-modal__close"
          aria-label={t("settings.ui.close")}
          disabled={busy}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="settings-modal__body">{children}</div>
    </dialog>
  );
}
