import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

const FOCUSABLE_SELECTOR = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Scrim + panel overlay: click-outside and Escape both close, focus moves
 * into the panel on open and returns to the trigger element on close, and
 * Tab is trapped within the panel while it's open.
 */
export function Modal({ onClose, children, className, ...rest }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? panel)?.focus();

    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const focusableEls = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableEls.length === 0) {
        return;
      }
      const first = focusableEls[0]!;
      const last = focusableEls[focusableEls.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleScrimClick = () => onClose();
  const handlePanelClick = (event: ReactMouseEvent) => event.stopPropagation();

  return (
    <div className="myc-modal-scrim" onClick={handleScrimClick}>
      <div
        ref={panelRef}
        className={className ? `myc-modal ${className}` : "myc-modal"}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={handlePanelClick}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
