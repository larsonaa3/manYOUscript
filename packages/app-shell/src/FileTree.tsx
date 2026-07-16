import { useState } from "react";
import type { VaultFileInfo } from "@manyouscript/data-layer";
import type { FileTreeNode } from "./file-tree";

export interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath?: string;
  onSelectFile: (file: VaultFileInfo) => void;
}

export function FileTree({ nodes, selectedPath, onSelectFile }: FileTreeProps) {
  return (
    <ul className="myc-file-list">
      {nodes.map((node) => (
        <FileTreeItem
          key={node.type === "folder" ? `folder:${node.path}` : `file:${node.file.path}`}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
    </ul>
  );
}

interface FileTreeItemProps {
  node: FileTreeNode;
  selectedPath?: string;
  onSelectFile: (file: VaultFileInfo) => void;
  depth: number;
}

function FileTreeItem({ node, selectedPath, onSelectFile, depth }: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const indent = { paddingLeft: `${depth * 0.9 + 0.5}rem` };

  if (node.type === "file") {
    const isActive = node.file.path === selectedPath;
    return (
      <li>
        <button
          type="button"
          className={isActive ? "myc-file-list__item myc-file-list__item--active" : "myc-file-list__item"}
          style={indent}
          onClick={() => onSelectFile(node.file)}
        >
          {node.name}
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className="myc-file-list__item myc-file-tree__folder"
        style={indent}
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="myc-file-tree__caret">{expanded ? "▾" : "▸"}</span>
        {node.name}
      </button>
      {expanded ? (
        <ul className="myc-file-list">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.type === "folder" ? `folder:${child.path}` : `file:${child.file.path}`}
              node={child}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
