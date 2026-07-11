import { useMemo } from "react";
import { computeCircularLayout } from "./layout";

export interface GraphViewNode {
  id: string;
  label: string;
  isGhost?: boolean;
}

export interface GraphViewEdge {
  source: string;
  target: string;
}

export interface GraphViewProps {
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
  activeNodeId?: string | null;
  onNodeClick?: (node: GraphViewNode) => void;
  radius?: number;
}

const VIEWBOX_PADDING = 40;

export function GraphView({ nodes, edges, activeNodeId, onNodeClick, radius = 150 }: GraphViewProps) {
  const positions = useMemo(
    () => computeCircularLayout(nodes.map((n) => n.id), radius),
    [nodes, radius],
  );

  const extent = radius + VIEWBOX_PADDING;

  if (nodes.length === 0) {
    return <p className="myc-graph-empty">No notes to graph yet.</p>;
  }

  return (
    <svg
      className="myc-graph-view"
      viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
      role="img"
      aria-label="Note graph"
    >
      {edges.map((edge, index) => {
        const from = positions.get(edge.source);
        const to = positions.get(edge.target);
        if (!from || !to) {
          return null;
        }
        return (
          <line
            key={`${edge.source}->${edge.target}-${index}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="myc-graph-edge"
          />
        );
      })}
      {nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) {
          return null;
        }
        const isActive = node.id === activeNodeId;
        return (
          <g
            key={node.id}
            transform={`translate(${position.x}, ${position.y})`}
            className={
              "myc-graph-node" +
              (node.isGhost ? " myc-graph-node--ghost" : "") +
              (isActive ? " myc-graph-node--active" : "")
            }
            onClick={() => onNodeClick?.(node)}
          >
            <circle r={8} />
            <text y={20} textAnchor="middle">
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
