import { describe, expect, it } from "vitest";
import { parseNote } from "@manyouscript/markdown-io";
import { deriveIndexInputs } from "./derive-index-inputs";

describe("deriveIndexInputs", () => {
  it("returns no entitySchemaId and only wikilinks when there are no structured blocks", () => {
    const parsed = parseNote("Meets [[Aria]] in town.");
    expect(deriveIndexInputs(parsed)).toEqual({ entitySchemaId: undefined, links: ["Aria"] });
  });

  it("picks up entitySchemaId from a recognized stat block", () => {
    const parsed = parseNote("```rpg:dnd5e-v1\nname: Goblin Scout\n```\n");
    const result = deriveIndexInputs(parsed);
    expect(result.entitySchemaId).toBe("dnd5e-v1");
  });

  it("ignores an unrecognized schema id for entity classification", () => {
    const parsed = parseNote("```rpg:pathfinder-v1\nname: Whatever\n```\n");
    expect(deriveIndexInputs(parsed).entitySchemaId).toBeUndefined();
  });

  it("turns a relationships-v1 block into typed links alongside wikilinks", () => {
    const raw =
      "Allies with [[Aria]].\n\n```rpg:relationships-v1\nrelationships:\n  - target: Aria\n    type: ally\n```\n";
    const parsed = parseNote(raw);
    const result = deriveIndexInputs(parsed);
    expect(result.links).toEqual(["Aria", { targetTitle: "Aria", kind: "ally" }]);
  });

  it("does not add relationship links when the block fails validation", () => {
    const raw = "```rpg:relationships-v1\nrelationships:\n  - target: Aria\n```\n";
    const parsed = parseNote(raw);
    expect(deriveIndexInputs(parsed).links).toEqual([]);
  });
});
