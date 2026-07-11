import { useMemo } from "react";
import { computeCircularLayout } from "./layout";
import { colorForEdgeKind } from "./edge-color";

export interface GraphViewNode {
  id: string;
  label: string;
  isGhost?: boolean;
}

export interface GraphViewEdge {
  source: string;
  target: string;
  kind?: string;
}

export interface GraphViewProps {
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
  activeNodeId?: string | null;
  onNodeClick?: (node: GraphViewNode) => void;
  radius?: number;
  showLegend?: boolean;
}

const VIEWBOX_PADDING = 40;
const DEFAULT_KIND = "wikilink";

export function GraphView({
  nodes,
  edges,
  activeNodeId,
  onNodeClick,
  radius = 150,
  showLegend = true,
}: GraphViewProps) {
  const positions = useMemo(
    () => computeCircularLayout(nodes.map((n) => n.id), radius),
    [nodes, radius],
  );

  const extent = radius + VIEWBOX_PADDING;

  const legendKinds = useMemo(() => {
    const kinds = new Set(edges.map((e) => e.kind ?? DEFAULT_KIND));
    return [...kinds].sort();
  }, [edges]);

  if (nodes.length === 0) {
    return <p className="myc-graph-empty">No notes to graph yet.</p>;
  }

  return (
    <div className="myc-graph-container">
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
          const kind = edge.kind ?? DEFAULT_KIND;
          return (
            <line
              key={`${edge.source}->${edge.target}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="myc-graph-edge"
              stroke={colorForEdgeKind(kind)}
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
      {showLegend && legendKinds.length > 1 ? (
        <ul className="myc-graph-legend">
          {legendKinds.map((kind) => (
            <li key={kind} className="myc-graph-legend__item">
              <span
                className="myc-graph-legend__swatch"
                style={{ backgroundColor: colorForEdgeKind(kind) }}
              />
              {kind}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
