import { describe, expect, it } from "vitest";
import { VaultIndex } from "@manyouscript/index-db";
import { deriveTitle, parseNote } from "@manyouscript/markdown-io";
import { deriveIndexInputs } from "./derive-index-inputs";

/**
 * Simulates the Phase 3 demo criterion end-to-end at the data layer:
 * create a character with a stat block, a session log referencing it via
 * wikilink and a typed relationship, and confirm both show up correctly
 * in the index (entities, sessions, backlinks, and graph edges/coloring
 * inputs) - this is the same pipeline app-shell's indexFile()/save effect
 * drive, exercised here without needing a live vault or GUI.
 */
describe("Phase 3 demo scenario: character + session + typed relationship", () => {
  it("indexes a character note and a session note that references it", () => {
    const index = new VaultIndex();

    const ariaRaw = [
      "---",
      "title: Aria",
      "---",
      "Aria is a goblin scout the party keeps running into.",
      "",
      "```rpg:dnd5e-v1",
      "name: Aria",
      "armorClass: 15",
      "hitPoints: 7",
      "```",
      "",
    ].join("\n");
    const ariaPath = "/vault/aria.md";
    const ariaParsed = parseNote(ariaRaw);
    const ariaInputs = deriveIndexInputs(ariaParsed);
    index.setFile(
      {
        path: ariaPath,
        relativePath: "aria.md",
        title: deriveTitle("aria.md", ariaParsed.frontmatter),
        frontmatter: ariaParsed.frontmatter,
        ...(ariaInputs.entitySchemaId ? { entitySchemaId: ariaInputs.entitySchemaId } : {}),
      },
      ariaInputs.links,
    );

    const sessionRaw = [
      "---",
      "type: session",
      "date: 2024-01-05",
      "campaign: The Iron Coast",
      "---",
      "The party met [[Aria]] near the old bridge.",
      "",
      "```rpg:relationships-v1",
      "relationships:",
      "  - target: Aria",
      "    type: ally",
      "```",
      "",
    ].join("\n");
    const sessionPath = "/vault/session-1.md";
    const sessionParsed = parseNote(sessionRaw);
    const sessionInputs = deriveIndexInputs(sessionParsed);
    index.setFile(
      {
        path: sessionPath,
        relativePath: "session-1.md",
        title: deriveTitle("session-1.md", sessionParsed.frontmatter),
        frontmatter: sessionParsed.frontmatter,
        ...(sessionInputs.entitySchemaId ? { entitySchemaId: sessionInputs.entitySchemaId } : {}),
      },
      sessionInputs.links,
    );

    // Aria shows up in the character/NPC entity list.
    const entities = index.getEntities();
    expect(entities).toHaveLength(1);
    expect(entities[0]!.title).toBe("Aria");
    expect(entities[0]!.entitySchemaId).toBe("dnd5e-v1");

    // The session note is discoverable via its frontmatter (powers the Sessions panel).
    const sessionFile = index.getFile(sessionPath);
    expect(sessionFile?.frontmatter.type).toBe("session");
    expect(sessionFile?.frontmatter.date).toBe("2024-01-05");

    // Both a plain wikilink and a typed "ally" relationship point at Aria.
    const backlinks = index.getBacklinks(ariaPath);
    expect(backlinks.map((l) => l.kind).sort()).toEqual(["ally", "wikilink"]);
    expect(backlinks.every((l) => l.sourcePath === sessionPath)).toBe(true);

    // The graph carries both edges with distinct kinds, ready for color-coding.
    const graph = index.getGraph();
    const edgeKinds = graph.edges
      .filter((e) => e.source === sessionPath && e.target === ariaPath)
      .map((e) => e.kind)
      .sort();
    expect(edgeKinds).toEqual(["ally", "wikilink"]);
    expect(graph.nodes.map((n) => n.label).sort()).toEqual(["Aria", "session-1"]);
  });
});
