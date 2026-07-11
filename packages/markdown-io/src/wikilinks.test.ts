import { describe, expect, it } from "vitest";
import { extractWikilinkTargets } from "./wikilinks";

describe("extractWikilinkTargets", () => {
  it("finds basic [[Target]] links", () => {
    expect(extractWikilinkTargets("See [[Chapter One]] for details.")).toEqual(["Chapter One"]);
  });

  it("finds multiple links and strips aliases and heading anchors", () => {
    const body = "Allies: [[The Iron Compact|the Compact]] and [[Riverbend#History]].";
    expect(extractWikilinkTargets(body)).toEqual(["The Iron Compact", "Riverbend"]);
  });

  it("returns an empty array when there are no links", () => {
    expect(extractWikilinkTargets("Just plain prose.")).toEqual([]);
  });
});
