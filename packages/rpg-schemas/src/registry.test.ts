import { describe, expect, it } from "vitest";
import { validateStatBlock, validateRelationshipsBlock, isStatBlockSchemaId, getFieldDescriptors } from "./registry";

describe("validateStatBlock", () => {
  it("accepts a valid dnd5e-v1 stat block", () => {
    const result = validateStatBlock("dnd5e-v1", {
      name: "Goblin Scout",
      armorClass: 15,
      hitPoints: 7,
      abilities: { str: 8, dex: 14 },
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Goblin Scout");
  });

  it("rejects a stat block missing the required name field", () => {
    const result = validateStatBlock("dnd5e-v1", { armorClass: 15 });
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("name");
  });

  it("rejects an unknown schema id", () => {
    const result = validateStatBlock("pathfinder-v1", { name: "Whatever" });
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("Unknown stat block schema");
  });

  it("accepts a minimal novel-character-v1 profile", () => {
    const result = validateStatBlock("novel-character-v1", { name: "Aria", role: "protagonist" });
    expect(result.success).toBe(true);
  });

  it("accepts a generic-v1 stat block with freeform attributes", () => {
    const result = validateStatBlock("generic-v1", {
      name: "Cultist",
      system: "Call of Cthulhu",
      attributes: { sanity: 60, hp: 12 },
    });
    expect(result.success).toBe(true);
  });
});

describe("validateRelationshipsBlock", () => {
  it("accepts a list of typed relationship edges", () => {
    const result = validateRelationshipsBlock({
      relationships: [
        { target: "Aria", type: "ally" },
        { target: "The Iron Compact", type: "enemy", note: "since the siege" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an edge missing a type", () => {
    const result = validateRelationshipsBlock({ relationships: [{ target: "Aria" }] });
    expect(result.success).toBe(false);
  });
});

describe("isStatBlockSchemaId / getFieldDescriptors", () => {
  it("recognizes known schema ids and exposes their form fields", () => {
    expect(isStatBlockSchemaId("dnd5e-v1")).toBe(true);
    expect(isStatBlockSchemaId("bogus")).toBe(false);
    expect(getFieldDescriptors("dnd5e-v1").map((f) => f.key)).toContain("armorClass");
  });
});
