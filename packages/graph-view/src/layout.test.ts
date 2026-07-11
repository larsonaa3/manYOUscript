import { describe, expect, it } from "vitest";
import { computeCircularLayout } from "./layout";

describe("computeCircularLayout", () => {
  it("returns an empty map for no nodes", () => {
    expect(computeCircularLayout([]).size).toBe(0);
  });

  it("places a single node at the center", () => {
    const positions = computeCircularLayout(["a"]);
    expect(positions.get("a")).toEqual({ x: 0, y: 0 });
  });

  it("places every node at the same distance from the center", () => {
    const positions = computeCircularLayout(["a", "b", "c", "d"], 100);
    for (const id of ["a", "b", "c", "d"]) {
      const { x, y } = positions.get(id)!;
      expect(Math.hypot(x, y)).toBeCloseTo(100, 5);
    }
  });

  it("spreads nodes evenly around the circle", () => {
    const positions = computeCircularLayout(["a", "b", "c"], 100);
    const a = positions.get("a")!;
    const b = positions.get("b")!;
    const c = positions.get("c")!;
    const angleBetween = (p: { x: number; y: number }, q: { x: number; y: number }) =>
      Math.acos((p.x * q.x + p.y * q.y) / (Math.hypot(p.x, p.y) * Math.hypot(q.x, q.y)));
    expect(angleBetween(a, b)).toBeCloseTo((2 * Math.PI) / 3, 5);
    expect(angleBetween(b, c)).toBeCloseTo((2 * Math.PI) / 3, 5);
  });
});
