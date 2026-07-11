import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { describe, expect, it } from "vitest";

interface MarkdownStorage {
  markdown: {
    getMarkdown(): string;
  };
}

function createEditor(markdown: string): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, Markdown],
    content: markdown,
  });
}

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

describe("markdown round-trip (basic marks, no custom nodes)", () => {
  it("is idempotent: re-parsing serialized output yields the same output again", () => {
    const input = "# Title\n\nSome **bold** and *italic* text.\n\n- one\n- two\n";
    const first = createEditor(input);
    const firstOutput = getMarkdown(first);
    first.destroy();

    const second = createEditor(firstOutput);
    const secondOutput = getMarkdown(second);
    second.destroy();

    expect(secondOutput).toBe(firstOutput);
  });

  it("preserves heading, bold, italic, and list semantics through the round trip", () => {
    const input = "## Chapter One\n\nOur hero was **brave** and *quick*.\n\n1. Wake up\n2. Save the world\n";
    const editor = createEditor(input);
    const output = getMarkdown(editor);
    editor.destroy();

    expect(output).toContain("Chapter One");
    expect(output).toMatch(/\*\*brave\*\*/);
    expect(output).toMatch(/[*_]quick[*_]/);
    expect(output).toContain("Wake up");
    expect(output).toContain("Save the world");
  });
});
