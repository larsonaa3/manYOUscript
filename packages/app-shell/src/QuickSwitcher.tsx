import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { VaultFileInfo } from "@manyouscript/data-layer";
import { filterFilesByQuery } from "./quick-switcher-filter";

export interface QuickSwitcherProps {
  files: VaultFileInfo[];
  onSelect: (file: VaultFileInfo) => void;
  onClose: () => void;
}

export function QuickSwitcher({ files, onSelect, onClose }: QuickSwitcherProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => filterFilesByQuery(files, query), [files, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const file = filtered[selectedIndex];
      if (file) {
        onSelect(file);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="myc-quick-switcher-overlay" onClick={onClose}>
      <div className="myc-quick-switcher" onClick={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          className="myc-quick-switcher__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Jump to note..."
        />
        <ul className="myc-quick-switcher__list">
          {filtered.map((file, index) => (
            <li key={file.path}>
              <button
                type="button"
                className={
                  index === selectedIndex
                    ? "myc-quick-switcher__item myc-quick-switcher__item--active"
                    : "myc-quick-switcher__item"
                }
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => onSelect(file)}
              >
                {file.relativePath}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="myc-quick-switcher__empty">No matches</li> : null}
        </ul>
      </div>
    </div>
  );
}
