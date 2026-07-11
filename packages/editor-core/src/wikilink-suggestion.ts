import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";

export interface WikiLinkSuggestionOptions {
  getSuggestions: () => string[];
}

type SelectedWikiLink = { target: string };

export const WikiLinkSuggestion = Extension.create<WikiLinkSuggestionOptions>({
  name: "wikiLinkSuggestion",

  addOptions() {
    return {
      getSuggestions: () => [],
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;
    return [
      Suggestion<string, SelectedWikiLink>({
        editor: this.editor,
        char: "[[",
        allowSpaces: true,
        items: ({ query }) => {
          const normalized = query.toLowerCase();
          return extensionOptions
            .getSuggestions()
            .filter((title) => title.toLowerCase().includes(normalized))
            .slice(0, 8);
        },
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              { type: "wikiLink", attrs: { target: props.target } },
              { type: "text", text: " " },
            ])
            .run();
        },
        render: createWikiLinkSuggestionRenderer,
      }),
    ];
  },
});

export function createWikiLinkSuggestionRenderer() {
  let element: HTMLDivElement | null = null;
  let unmount: (() => void) | null = null;
  let items: string[] = [];
  let selectedIndex = 0;
  let latestCommand: ((props: SelectedWikiLink) => void) | null = null;

  function renderItems(): void {
    if (!element) {
      return;
    }
    element.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "myc-suggestion-item myc-suggestion-item--empty";
      empty.textContent = "No matching notes";
      element.appendChild(empty);
      return;
    }
    items.forEach((title, index) => {
      const item = document.createElement("div");
      item.className =
        "myc-suggestion-item" + (index === selectedIndex ? " myc-suggestion-item--active" : "");
      item.textContent = title;
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        latestCommand?.({ target: title });
      });
      element!.appendChild(item);
    });
  }

  return {
    onStart(props: SuggestionProps<string, SelectedWikiLink>) {
      items = props.items;
      selectedIndex = 0;
      latestCommand = props.command;
      element = document.createElement("div");
      element.className = "myc-suggestion-popup";
      renderItems();
      unmount = props.mount(element);
    },
    onUpdate(props: SuggestionProps<string, SelectedWikiLink>) {
      items = props.items;
      selectedIndex = 0;
      latestCommand = props.command;
      renderItems();
    },
    onKeyDown(props: SuggestionKeyDownProps): boolean {
      if (props.event.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1);
        renderItems();
        return true;
      }
      if (props.event.key === "ArrowUp") {
        selectedIndex = (selectedIndex - 1 + items.length) % Math.max(items.length, 1);
        renderItems();
        return true;
      }
      if (props.event.key === "Enter") {
        const selected = items[selectedIndex];
        if (selected) {
          latestCommand?.({ target: selected });
        }
        return true;
      }
      if (props.event.key === "Escape") {
        unmount?.();
        return true;
      }
      return false;
    },
    onExit() {
      unmount?.();
      element = null;
    },
  };
}
