export interface Point {
  x: number;
  y: number;
}

/**
 * Places nodes evenly around a circle. Good enough for a first graph render;
 * a force-directed/canvas layout is a later, larger-vault concern.
 */
export function computeCircularLayout(nodeIds: string[], radius = 150): Map<string, Point> {
  const positions = new Map<string, Point>();
  const count = nodeIds.length;

  if (count === 0) {
    return positions;
  }

  if (count === 1) {
    positions.set(nodeIds[0]!, { x: 0, y: 0 });
    return positions;
  }

  nodeIds.forEach((id, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    positions.set(id, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  });

  return positions;
}
