import { describe, expect, it } from "vitest";
import { extractStructuredBlocks, upsertStructuredBlock } from "./structured-blocks";

describe("extractStructuredBlocks", () => {
  it("returns an empty array when there are no fenced rpg blocks", () => {
    expect(extractStructuredBlocks("Just plain prose.")).toEqual([]);
  });

  it("extracts a single fenced rpg:dnd5e-v1 block", () => {
    const body = "```rpg:dnd5e-v1\nname: Goblin Scout\narmorClass: 15\n```\n";
    const blocks = extractStructuredBlocks(body);
    expect(blocks).toEqual([
      {
        schemaId: "dnd5e-v1",
        raw: "name: Goblin Scout\narmorClass: 15\n",
        data: { name: "Goblin Scout", armorClass: 15 },
      },
    ]);
  });

  it("extracts multiple blocks with different schema ids", () => {
    const body =
      "```rpg:novel-character-v1\nname: Aria\n```\n\nSome prose.\n\n```rpg:relationships-v1\nrelationships:\n  - target: Riverbend\n    type: hometown\n```\n";
    const blocks = extractStructuredBlocks(body);
    expect(blocks.map((b) => b.schemaId)).toEqual(["novel-character-v1", "relationships-v1"]);
    expect(blocks[1]!.data).toEqual({ relationships: [{ target: "Riverbend", type: "hometown" }] });
  });

  it("skips a block with malformed YAML instead of throwing", () => {
    const body = "```rpg:dnd5e-v1\nname: [unterminated\n```\n";
    expect(() => extractStructuredBlocks(body)).not.toThrow();
    expect(extractStructuredBlocks(body)).toEqual([]);
  });

  it("ignores plain code fences without the rpg: prefix", () => {
    const body = "```js\nconst x = 1;\n```\n";
    expect(extractStructuredBlocks(body)).toEqual([]);
  });
});

describe("upsertStructuredBlock", () => {
  it("appends a new block when none exists yet, preserving existing prose", () => {
    const body = "Some prose about the goblin.\n";
    const result = upsertStructuredBlock(body, "dnd5e-v1", { name: "Goblin Scout", armorClass: 15 });
    expect(result).toBe(
      "Some prose about the goblin.\n\n```rpg:dnd5e-v1\nname: Goblin Scout\narmorClass: 15\n```\n",
    );
    expect(extractStructuredBlocks(result)).toEqual([
      { schemaId: "dnd5e-v1", raw: "name: Goblin Scout\narmorClass: 15\n", data: { name: "Goblin Scout", armorClass: 15 } },
    ]);
  });

  it("replaces an existing block with the same schemaId in place", () => {
    const body = "Before.\n\n```rpg:dnd5e-v1\nname: Old Name\n```\n\nAfter.\n";
    const result = upsertStructuredBlock(body, "dnd5e-v1", { name: "New Name", armorClass: 12 });
    expect(result).toBe(
      "Before.\n\n```rpg:dnd5e-v1\nname: New Name\narmorClass: 12\n```\n\nAfter.\n",
    );
  });

  it("appends into an empty body without a leading blank line", () => {
    const result = upsertStructuredBlock("", "novel-character-v1", { name: "Aria" });
    expect(result).toBe("```rpg:novel-character-v1\nname: Aria\n```\n");
  });

  it("leaves a differently-schemaId block untouched and appends a new one", () => {
    const body = "```rpg:relationships-v1\nrelationships: []\n```\n";
    const result = upsertStructuredBlock(body, "dnd5e-v1", { name: "Goblin Scout" });
    expect(result).toContain("```rpg:relationships-v1\nrelationships: []\n```");
    expect(result).toContain("```rpg:dnd5e-v1\nname: Goblin Scout\n```");
  });
});
