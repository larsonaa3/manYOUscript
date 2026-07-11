import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { describe, expect, it, vi } from "vitest";
import { WikiLink } from "./wikilink-node";

interface MarkdownStorage {
  markdown: {
    getMarkdown(): string;
  };
}

function createEditor(markdown: string, onNavigate: (target: string) => void = () => {}): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, Markdown, WikiLink.configure({ onNavigate })],
    content: markdown,
  });
}

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

describe("WikiLink node markdown round-trip", () => {
  it("parses [[Target]] into a wikiLink node and serializes it back unchanged", () => {
    const input = "See [[Chapter One]] for details.";
    const editor = createEditor(input);
    const wikiLinkNodes: string[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "wikiLink") {
        wikiLinkNodes.push(node.attrs.target as string);
      }
    });
    expect(wikiLinkNodes).toEqual(["Chapter One"]);

    const output = getMarkdown(editor);
    editor.destroy();
    expect(output).toBe(input);
  });

  it("is idempotent across a second parse/serialize cycle", () => {
    const input = "Allies: [[The Iron Compact]] and [[Riverbend]].";
    const first = createEditor(input);
    const firstOutput = getMarkdown(first);
    first.destroy();

    const second = createEditor(firstOutput);
    const secondOutput = getMarkdown(second);
    second.destroy();

    expect(secondOutput).toBe(firstOutput);
  });

  it("strips alias/heading-anchor syntax down to a bare target on parse", () => {
    const editor = createEditor("Meet [[Aria|our hero]] at [[Riverbend#Docks]].");
    const targets: string[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "wikiLink") {
        targets.push(node.attrs.target as string);
      }
    });
    editor.destroy();
    expect(targets).toEqual(["Aria", "Riverbend"]);
  });

  it("invokes onNavigate when the rendered node view is clicked", () => {
    const onNavigate = vi.fn();
    const editor = createEditor("See [[Chapter One]].", onNavigate);
    const span = editor.view.dom.querySelector("span[data-type='wiki-link']") as HTMLElement;
    expect(span).not.toBeNull();
    span.click();
    editor.destroy();
    expect(onNavigate).toHaveBeenCalledWith("Chapter One");
  });
});
