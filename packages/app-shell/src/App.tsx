import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVault, countWords, type VaultFileInfo } from "@manyouscript/data-layer";
import { MarkdownEditor } from "@manyouscript/editor-core";
import { GraphView, type GraphViewEdge, type GraphViewNode } from "@manyouscript/graph-view";
import { VaultIndex, type LinkRecord, type FileRecord, type Manuscript } from "@manyouscript/index-db";
import {
  deriveTitle,
  extractStructuredBlocks,
  parseNote,
  stringifyNote,
  upsertStructuredBlock,
} from "@manyouscript/markdown-io";
import { isStatBlockSchemaId, STAT_BLOCK_REGISTRY } from "@manyouscript/rpg-schemas";
import { Button, Panel } from "@manyouscript/ui";
import { CharacterSheetForm } from "./CharacterSheetForm";
import { deriveIndexInputs } from "./derive-index-inputs";
import { computeReorderSwap } from "./compute-reorder-swap";
import "./styles.css";

const SAVE_DEBOUNCE_MS = 500;

type ViewMode = "editor" | "sheet";

export function App() {
  const vault = useVault();
  const [vaultRoot, setVaultRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<VaultFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<VaultFileInfo | null>(null);
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [indexVersion, setIndexVersion] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [distractionFree, setDistractionFree] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const vaultIndexRef = useRef(new VaultIndex());
  const frontmatterRef = useRef<Record<string, unknown>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const indexFile = useCallback(
    async (file: VaultFileInfo, rawOverride?: string) => {
      const raw = rawOverride ?? (await vault.readFile(file.path));
      const parsed = parseNote(raw);
      const { entitySchemaId, links } = deriveIndexInputs(parsed);
      const record: FileRecord = {
        path: file.path,
        relativePath: file.relativePath,
        title: deriveTitle(file.name, parsed.frontmatter),
        frontmatter: parsed.frontmatter,
        wordCount: countWords(parsed.body),
        ...(entitySchemaId ? { entitySchemaId } : {}),
      };
      vaultIndexRef.current.setFile(record, links);
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
      setViewMode("editor");
      setMobileNavOpen(false);
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
        const { entitySchemaId, links } = deriveIndexInputs(parseNote(raw));
        const record: FileRecord = {
          path: selectedFile.path,
          relativePath: selectedFile.relativePath,
          title: deriveTitle(selectedFile.name, frontmatterRef.current),
          frontmatter: frontmatterRef.current,
          wordCount: countWords(content),
          ...(entitySchemaId ? { entitySchemaId } : {}),
        };
        vaultIndexRef.current.setFile(record, links);
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

  const handleSaveStatBlock = useCallback((schemaId: string, data: Record<string, unknown>) => {
    setContent((prev) => upsertStructuredBlock(prev, schemaId, data));
    setIsDirty(true);
  }, []);

  const currentStatBlock = useMemo(() => {
    return extractStructuredBlocks(content).find((b) => isStatBlockSchemaId(b.schemaId)) ?? null;
  }, [content]);

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

  const sessions = useMemo(() => {
    return vaultIndexRef.current
      .getAllFiles()
      .filter((f) => f.frontmatter.type === "session")
      .sort((a, b) => String(a.frontmatter.date ?? "").localeCompare(String(b.frontmatter.date ?? "")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexVersion]);

  const entities = useMemo(() => {
    return vaultIndexRef.current.getEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexVersion]);

  const manuscripts = useMemo(() => {
    return vaultIndexRef.current.getManuscripts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexVersion]);

  const handleReorderChapter = useCallback(
    async (chapters: FileRecord[], index: number, direction: -1 | 1) => {
      const steps = computeReorderSwap(chapters, index, direction);
      if (!steps) {
        return;
      }
      for (const { path, newOrder } of steps) {
        if (selectedFile && path === selectedFile.path) {
          frontmatterRef.current = { ...frontmatterRef.current, order: newOrder };
          await vault.writeFile(path, stringifyNote(frontmatterRef.current, content));
        } else {
          const raw = await vault.readFile(path);
          const parsed = parseNote(raw);
          const updatedFrontmatter = { ...parsed.frontmatter, order: newOrder };
          await vault.writeFile(path, stringifyNote(updatedFrontmatter, parsed.body));
        }
        const info = files.find((f) => f.path === path);
        if (info) {
          await indexFile(info);
        }
      }
      setIndexVersion((v) => v + 1);
    },
    [selectedFile, content, vault, files, indexFile],
  );

  const handleGraphNodeClick = useCallback(
    (node: GraphViewNode) => {
      const match = files.find((f) => f.path === node.id);
      if (match) {
        void handleSelectFile(match);
      }
    },
    [files, handleSelectFile],
  );

  const navigateToPath = useCallback(
    (path: string) => {
      const match = files.find((f) => f.path === path);
      if (match) {
        void handleSelectFile(match);
      }
    },
    [files, handleSelectFile],
  );

  return (
    <div
      className={
        "myc-layout" +
        (distractionFree ? " myc-layout--focus" : "") +
        (mobileNavOpen ? " myc-layout--nav-open" : "")
      }
    >
      <button
        type="button"
        className="myc-mobile-nav-toggle"
        onClick={() => setMobileNavOpen((open) => !open)}
        aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileNavOpen ? "✕" : "☰"}
      </button>
      {mobileNavOpen ? (
        <div className="myc-mobile-nav-scrim" onClick={() => setMobileNavOpen(false)} />
      ) : null}
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
        {manuscripts.length > 0 ? (
          <Panel title="Manuscripts">
            {manuscripts.map((manuscript: Manuscript) => (
              <div key={manuscript.name} className="myc-manuscript">
                <div className="myc-manuscript__title">
                  {manuscript.name}
                  <span className="myc-entity-schema">{manuscript.totalWordCount} words</span>
                </div>
                <ul className="myc-file-list">
                  {manuscript.chapters.map((chapter, index) => (
                    <li key={chapter.path} className="myc-chapter-row">
                      <button
                        type="button"
                        className={
                          chapter.path === selectedFile?.path
                            ? "myc-file-list__item myc-file-list__item--active"
                            : "myc-file-list__item"
                        }
                        onClick={() => navigateToPath(chapter.path)}
                      >
                        {chapter.title}
                        <span className="myc-entity-schema">{chapter.wordCount ?? 0} words</span>
                      </button>
                      <span className="myc-chapter-row__controls">
                        <button
                          type="button"
                          className="myc-reorder-button"
                          disabled={index === 0}
                          onClick={() => void handleReorderChapter(manuscript.chapters, index, -1)}
                          aria-label={`Move ${chapter.title} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="myc-reorder-button"
                          disabled={index === manuscript.chapters.length - 1}
                          onClick={() => void handleReorderChapter(manuscript.chapters, index, 1)}
                          aria-label={`Move ${chapter.title} down`}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Panel>
        ) : null}
        {sessions.length > 0 ? (
          <Panel title="Sessions">
            <ul className="myc-file-list">
              {sessions.map((session) => (
                <li key={session.path}>
                  <button
                    type="button"
                    className="myc-file-list__item"
                    onClick={() => navigateToPath(session.path)}
                  >
                    {typeof session.frontmatter.date === "string" ? `${session.frontmatter.date} — ` : ""}
                    {session.title}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
        {entities.length > 0 ? (
          <Panel title="Characters & NPCs">
            <ul className="myc-file-list">
              {entities.map((entity) => (
                <li key={entity.path}>
                  <button
                    type="button"
                    className="myc-file-list__item"
                    onClick={() => navigateToPath(entity.path)}
                  >
                    {entity.title}
                    <span className="myc-entity-schema">
                      {entity.entitySchemaId ? STAT_BLOCK_REGISTRY[entity.entitySchemaId as keyof typeof STAT_BLOCK_REGISTRY]?.label : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </aside>
      <main className="myc-main">
        {selectedFile ? (
          <>
            <div className="myc-editor-header">
              <span>{selectedFile.relativePath}</span>
              <span className="myc-editor-header__actions">
                <button
                  type="button"
                  className="myc-view-toggle"
                  onClick={() => setDistractionFree((v) => !v)}
                >
                  {distractionFree ? "Exit Focus Mode" : "Focus Mode"}
                </button>
                <button
                  type="button"
                  className="myc-view-toggle"
                  onClick={() => setViewMode(viewMode === "editor" ? "sheet" : "editor")}
                >
                  {viewMode === "editor" ? "Character Sheet" : "Back to Note"}
                </button>
                <span>
                  {countWords(content)} words &middot; {isDirty ? "saving…" : "saved"}
                </span>
              </span>
            </div>
            {viewMode === "sheet" ? (
              <CharacterSheetForm
                schemaId={currentStatBlock?.schemaId ?? null}
                data={(currentStatBlock?.data as Record<string, unknown>) ?? {}}
                onSave={handleSaveStatBlock}
              />
            ) : (
              <MarkdownEditor
                value={content}
                onChange={handleContentChange}
                onNavigateWikilink={handleNavigateWikilink}
                getWikilinkSuggestions={getWikilinkSuggestions}
              />
            )}
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
                  <li key={`${link.sourcePath}-${link.kind}`}>
                    <button
                      type="button"
                      className="myc-file-list__item"
                      onClick={() => navigateToPath(link.sourcePath)}
                    >
                      {source?.title ?? link.sourcePath}
                      {link.kind !== "wikilink" ? <span className="myc-entity-schema">{link.kind}</span> : null}
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
