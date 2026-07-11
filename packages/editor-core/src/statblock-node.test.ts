import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { describe, expect, it } from "vitest";
import { StatBlock } from "./statblock-node";

interface MarkdownStorage {
  markdown: {
    getMarkdown(): string;
  };
}

function createEditor(markdown: string): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, Markdown, StatBlock],
    content: markdown,
  });
}

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

describe("StatBlock node markdown round-trip", () => {
  it("parses a fenced rpg: block into a statBlock node and serializes it back unchanged", () => {
    const input = "```rpg:dnd5e-v1\nname: Goblin Scout\narmorClass: 15\n```";
    const editor = createEditor(input);

    const statBlocks: { schemaId: string; raw: string }[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "statBlock") {
        statBlocks.push({ schemaId: node.attrs.schemaId as string, raw: node.attrs.raw as string });
      }
    });
    expect(statBlocks).toEqual([
      { schemaId: "dnd5e-v1", raw: "name: Goblin Scout\narmorClass: 15\n" },
    ]);

    const output = getMarkdown(editor);
    editor.destroy();
    expect(output).toBe(input);
  });

  it("is idempotent across a second parse/serialize cycle", () => {
    const input =
      "```rpg:novel-character-v1\nname: Aria\nrole: protagonist\n```\n\nSome prose after.";
    const first = createEditor(input);
    const firstOutput = getMarkdown(first);
    first.destroy();

    const second = createEditor(firstOutput);
    const secondOutput = getMarkdown(second);
    second.destroy();

    expect(secondOutput).toBe(firstOutput);
  });

  it("leaves ordinary (non-rpg) fenced code blocks as plain code blocks", () => {
    const input = "```js\nconst x = 1;\n```";
    const editor = createEditor(input);

    let sawStatBlock = false;
    let sawCodeBlock = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "statBlock") sawStatBlock = true;
      if (node.type.name === "codeBlock") sawCodeBlock = true;
    });
    expect(sawStatBlock).toBe(false);
    expect(sawCodeBlock).toBe(true);

    const output = getMarkdown(editor);
    editor.destroy();
    expect(output).toBe(input);
  });

  it("handles multiple setContent cycles on the same long-lived editor without breaking (fence wrapper is idempotent)", () => {
    const editor = createEditor("Initial content.");
    for (let i = 0; i < 3; i += 1) {
      editor.commands.setContent("```rpg:generic-v1\nname: Attempt " + i + "\n```");
    }
    const statBlocks: string[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "statBlock") {
        statBlocks.push(node.attrs.raw as string);
      }
    });
    expect(statBlocks).toEqual(["name: Attempt 2\n"]);

    const jsOutput = (() => {
      editor.commands.setContent("```js\nconst y = 2;\n```");
      return getMarkdown(editor);
    })();
    editor.destroy();
    expect(jsOutput).toBe("```js\nconst y = 2;\n```");
  });

  it("renders a node view card showing the parsed name and raw YAML", () => {
    const editor = createEditor("```rpg:dnd5e-v1\nname: Goblin Scout\narmorClass: 15\n```");
    const card = editor.view.dom.querySelector(".myc-statblock") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.querySelector(".myc-statblock__title")?.textContent).toBe("Goblin Scout");
    expect(card.querySelector(".myc-statblock__subtitle")?.textContent).toBe("dnd5e-v1");
    expect(card.querySelector(".myc-statblock__raw")?.textContent).toContain("armorClass: 15");
    editor.destroy();
  });
});
