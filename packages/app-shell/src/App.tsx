import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVault, countWords, type VaultFileInfo } from "@manyouscript/data-layer";
import { MarkdownEditor } from "@manyouscript/editor-core";
import { GraphView, type GraphViewEdge, type GraphViewNode } from "@manyouscript/graph-view";
import { VaultIndex, type LinkRecord } from "@manyouscript/index-db";
import { deriveTitle, extractWikilinkTargets, parseNote, stringifyNote } from "@manyouscript/markdown-io";
import { Button, Panel } from "@manyouscript/ui";
import "./styles.css";

const SAVE_DEBOUNCE_MS = 500;

export function App() {
  const vault = useVault();
  const [vaultRoot, setVaultRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<VaultFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<VaultFileInfo | null>(null);
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [indexVersion, setIndexVersion] = useState(0);

  const vaultIndexRef = useRef(new VaultIndex());
  const frontmatterRef = useRef<Record<string, unknown>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const indexFile = useCallback(
    async (file: VaultFileInfo, rawOverride?: string) => {
      const raw = rawOverride ?? (await vault.readFile(file.path));
      const parsed = parseNote(raw);
      vaultIndexRef.current.setFile(
        {
          path: file.path,
          relativePath: file.relativePath,
          title: deriveTitle(file.name, parsed.frontmatter),
          frontmatter: parsed.frontmatter,
        },
        parsed.wikilinkTargets,
      );
      return parsed;
    },
    [vault],
  );

  const refreshFiles = useCallback(
    async (root: string) => {
      const found = await vault.listMarkdownFiles(root);
      setFiles(found);
      for (const file of found) {
        await indexFile(file);
      }
      setIndexVersion((v) => v + 1);
    },
    [vault, indexFile],
  );

  const handleOpenVault = useCallback(async () => {
    const root = await vault.pickVaultRoot();
    if (!root) {
      return;
    }
    setVaultRoot(root);
    await refreshFiles(root);
  }, [vault, refreshFiles]);

  const handleSelectFile = useCallback(
    async (file: VaultFileInfo) => {
      const raw = await vault.readFile(file.path);
      const parsed = parseNote(raw);
      frontmatterRef.current = parsed.frontmatter;
      setSelectedFile(file);
      setContent(parsed.body);
      setIsDirty(false);
    },
    [vault],
  );

  const handleNavigateWikilink = useCallback(
    (target: string) => {
      const path = vaultIndexRef.current.findPathByTitle(target);
      if (!path) {
        return;
      }
      const match = files.find((f) => f.path === path);
      if (match) {
        void handleSelectFile(match);
      }
    },
    [files, handleSelectFile],
  );

  const getWikilinkSuggestions = useCallback(() => {
    return vaultIndexRef.current.getAllFiles().map((f) => f.title);
  }, []);

  useEffect(() => {
    if (!selectedFile || !isDirty) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const raw = stringifyNote(frontmatterRef.current, content);
      void vault.writeFile(selectedFile.path, raw).then(() => {
        setIsDirty(false);
        vaultIndexRef.current.setFile(
          {
            path: selectedFile.path,
            relativePath: selectedFile.relativePath,
            title: deriveTitle(selectedFile.name, frontmatterRef.current),
            frontmatter: frontmatterRef.current,
          },
          extractWikilinkTargets(content),
        );
        setIndexVersion((v) => v + 1);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, isDirty, selectedFile, vault]);

  const handleContentChange = useCallback((next: string) => {
    setContent(next);
    setIsDirty(true);
  }, []);

  const backlinks: LinkRecord[] = useMemo(() => {
    if (!selectedFile) {
      return [];
    }
    return vaultIndexRef.current.getBacklinks(selectedFile.path);
    // indexVersion is a deliberate dependency: it's the signal that the
    // (mutable) VaultIndex has changed and this memo should recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, indexVersion]);

  const graph = useMemo(() => {
    const raw = vaultIndexRef.current.getGraph();
    const nodes: GraphViewNode[] = raw.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      isGhost: n.path === null,
    }));
    const edges: GraphViewEdge[] = raw.edges;
    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexVersion]);

  const handleGraphNodeClick = useCallback(
    (node: GraphViewNode) => {
      const match = files.find((f) => f.path === node.id);
      if (match) {
        void handleSelectFile(match);
      }
    },
    [files, handleSelectFile],
  );

  return (
    <div className="myc-layout">
      <aside className="myc-sidebar">
        <Panel title="Vault">
          <Button onClick={() => void handleOpenVault()}>
            {vaultRoot ? "Change Folder" : "Open Vault Folder"}
          </Button>
          {vaultRoot ? <p className="myc-vault-path">{vaultRoot}</p> : null}
          <ul className="myc-file-list">
            {files.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  className={
                    file.path === selectedFile?.path
                      ? "myc-file-list__item myc-file-list__item--active"
                      : "myc-file-list__item"
                  }
                  onClick={() => void handleSelectFile(file)}
                >
                  {file.relativePath}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>
      <main className="myc-main">
        {selectedFile ? (
          <>
            <div className="myc-editor-header">
              <span>{selectedFile.relativePath}</span>
              <span>
                {countWords(content)} words &middot; {isDirty ? "saving…" : "saved"}
              </span>
            </div>
            <MarkdownEditor
              value={content}
              onChange={handleContentChange}
              onNavigateWikilink={handleNavigateWikilink}
              getWikilinkSuggestions={getWikilinkSuggestions}
            />
          </>
        ) : (
          <Panel title="manYOUscript">
            <p>Open a vault folder to start writing.</p>
          </Panel>
        )}
      </main>
      <aside className="myc-right-sidebar">
        <Panel title="Backlinks">
          {selectedFile && backlinks.length > 0 ? (
            <ul className="myc-file-list">
              {backlinks.map((link) => {
                const source = vaultIndexRef.current.getFile(link.sourcePath);
                return (
                  <li key={link.sourcePath}>
                    <button
                      type="button"
                      className="myc-file-list__item"
                      onClick={() => {
                        const match = files.find((f) => f.path === link.sourcePath);
                        if (match) {
                          void handleSelectFile(match);
                        }
                      }}
                    >
                      {source?.title ?? link.sourcePath}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="myc-vault-path">No backlinks yet.</p>
          )}
        </Panel>
        <Panel title="Graph">
          <GraphView
            nodes={graph.nodes}
            edges={graph.edges}
            activeNodeId={selectedFile?.path ?? null}
            onNodeClick={handleGraphNodeClick}
            radius={100}
          />
        </Panel>
      </aside>
    </div>
  );
}
