import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { WikiLink } from "./wikilink-node";
import { WikiLinkSuggestion } from "./wikilink-suggestion";

if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

function createEditor(getSuggestions: () => string[]): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, WikiLink, WikiLinkSuggestion.configure({ getSuggestions })],
    content: "<p></p>",
  });
}

// The suggestion plugin's items() resolution always goes through a
// Promise, even for a synchronous return, so callers must flush a
// microtask before the popup reflects the (filtered) result.
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("WikiLinkSuggestion end-to-end", () => {
  it("opens a popup listing matching titles when typing [[ followed by a query", async () => {
    const editor = createEditor(() => ["Aria", "Riverbend", "Wolfsbane"]);
    editor.commands.insertContent("[[River");
    await flushMicrotasks();

    const popup = document.body.querySelector(".myc-suggestion-popup");
    expect(popup).not.toBeNull();
    expect(popup!.textContent).toContain("Riverbend");
    expect(popup!.textContent).not.toContain("Aria");
    expect(popup!.textContent).not.toContain("Wolfsbane");

    editor.destroy();
  });

  it("clicking a suggestion inserts a wikiLink node and closes the popup", async () => {
    const editor = createEditor(() => ["Aria", "Riverbend"]);
    editor.commands.insertContent("[[River");
    await flushMicrotasks();

    const item = document.body.querySelector(".myc-suggestion-item") as HTMLElement;
    expect(item.textContent).toBe("Riverbend");
    item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    let target: string | null = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "wikiLink") {
        target = node.attrs.target as string;
      }
    });
    expect(target).toBe("Riverbend");
    expect(document.body.querySelector(".myc-suggestion-popup")).toBeNull();

    editor.destroy();
  });
});
