import { describe, expect, it, vi } from "vitest";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { createWikiLinkSuggestionRenderer } from "./wikilink-suggestion";

type SelectedWikiLink = { target: string };

function fakeStartProps(
  items: string[],
  command: (props: SelectedWikiLink) => void,
): SuggestionProps<string, SelectedWikiLink> {
  return {
    items,
    command,
    mount: (element: HTMLElement) => {
      document.body.appendChild(element);
      return () => element.remove();
    },
  } as unknown as SuggestionProps<string, SelectedWikiLink>;
}

function keyEvent(key: string): SuggestionKeyDownProps {
  return { event: { key } } as unknown as SuggestionKeyDownProps;
}

describe("wikiLink suggestion popup renderer", () => {
  it("mounts a popup listing the given items on start", () => {
    const command = vi.fn();
    const renderer = createWikiLinkSuggestionRenderer();
    renderer.onStart(fakeStartProps(["Aria", "Riverbend"], command));

    const popup = document.body.querySelector(".myc-suggestion-popup");
    expect(popup).not.toBeNull();
    const items = popup!.querySelectorAll(".myc-suggestion-item");
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toBe("Aria");
    expect(items[1]!.textContent).toBe("Riverbend");

    renderer.onExit();
  });

  it("shows a placeholder when there are no matching items", () => {
    const renderer = createWikiLinkSuggestionRenderer();
    renderer.onStart(fakeStartProps([], vi.fn()));

    const popup = document.body.querySelector(".myc-suggestion-popup");
    expect(popup!.textContent).toBe("No matching notes");

    renderer.onExit();
  });

  it("invokes command with the clicked item's title", () => {
    const command = vi.fn();
    const renderer = createWikiLinkSuggestionRenderer();
    renderer.onStart(fakeStartProps(["Aria", "Riverbend"], command));

    const items = document.body.querySelectorAll(".myc-suggestion-item");
    items[1]!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(command).toHaveBeenCalledWith({ target: "Riverbend" });
    renderer.onExit();
  });

  it("moves selection with arrow keys and confirms with Enter", () => {
    const command = vi.fn();
    const renderer = createWikiLinkSuggestionRenderer();
    renderer.onStart(fakeStartProps(["Aria", "Riverbend", "Wolfsbane"], command));

    renderer.onKeyDown(keyEvent("ArrowDown"));
    renderer.onKeyDown(keyEvent("ArrowDown"));
    const activeAfterTwoDowns = document.body.querySelector(".myc-suggestion-item--active");
    expect(activeAfterTwoDowns?.textContent).toBe("Wolfsbane");

    renderer.onKeyDown(keyEvent("ArrowUp"));
    const activeAfterUp = document.body.querySelector(".myc-suggestion-item--active");
    expect(activeAfterUp?.textContent).toBe("Riverbend");

    renderer.onKeyDown(keyEvent("Enter"));
    expect(command).toHaveBeenCalledWith({ target: "Riverbend" });

    renderer.onExit();
  });

  it("removes the popup from the DOM on Escape and on exit", () => {
    const renderer = createWikiLinkSuggestionRenderer();
    renderer.onStart(fakeStartProps(["Aria"], vi.fn()));
    expect(document.body.querySelector(".myc-suggestion-popup")).not.toBeNull();

    renderer.onKeyDown(keyEvent("Escape"));
    expect(document.body.querySelector(".myc-suggestion-popup")).toBeNull();
  });
});
