import { describe, expect, it } from "vitest";
import { deriveNoteType } from "./derive-note-type";

describe("deriveNoteType", () => {
  it("defaults to note when there are no signals", () => {
    expect(deriveNoteType({}, false)).toBe("note");
  });

  it("infers chapter from a non-empty manuscript field", () => {
    expect(deriveNoteType({ manuscript: "Test Novel" }, false)).toBe("chapter");
  });

  it("does not infer chapter from a blank manuscript field", () => {
    expect(deriveNoteType({ manuscript: "   " }, false)).toBe("note");
  });

  it("infers character from a stat block", () => {
    expect(deriveNoteType({}, true)).toBe("character");
  });

  it("prefers chapter over character when both signals are present", () => {
    expect(deriveNoteType({ manuscript: "Test Novel" }, true)).toBe("chapter");
  });

  it("honors an explicit type even when it conflicts with inferred signals", () => {
    expect(deriveNoteType({ type: "session", manuscript: "Test Novel" }, true)).toBe("session");
    expect(deriveNoteType({ type: "note" }, true)).toBe("note");
  });

  it("ignores an invalid explicit type and falls back to inference", () => {
    expect(deriveNoteType({ type: "grocery-list", manuscript: "Test Novel" }, false)).toBe("chapter");
  });
});
