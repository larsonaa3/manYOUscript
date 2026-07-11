import { describe, expect, it } from "vitest";
import { colorForEdgeKind } from "./edge-color";

describe("colorForEdgeKind", () => {
  it("returns a distinct known color for well-known relationship kinds", () => {
    const ally = colorForEdgeKind("ally");
    const enemy = colorForEdgeKind("enemy");
    const wikilink = colorForEdgeKind("wikilink");
    expect(new Set([ally, enemy, wikilink]).size).toBe(3);
  });

  it("is case-insensitive", () => {
    expect(colorForEdgeKind("Ally")).toBe(colorForEdgeKind("ally"));
  });

  it("is deterministic for unknown kinds", () => {
    expect(colorForEdgeKind("mentor")).toBe(colorForEdgeKind("mentor"));
  });

  it("gives unknown kinds a color distinct from the default wikilink color", () => {
    expect(colorForEdgeKind("mentor")).not.toBe(colorForEdgeKind("wikilink"));
  });
});
