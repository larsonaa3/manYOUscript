import { useCallback, useEffect, useRef, useState } from "react";
import { useVault, countWords, type VaultFileInfo } from "@manyouscript/data-layer";
import { MarkdownEditor } from "@manyouscript/editor-core";
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

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshFiles = useCallback(
    async (root: string) => {
      const found = await vault.listMarkdownFiles(root);
      setFiles(found);
    },
    [vault],
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
      const text = await vault.readFile(file.path);
      setSelectedFile(file);
      setContent(text);
      setIsDirty(false);
    },
    [vault],
  );

  useEffect(() => {
    if (!selectedFile || !isDirty) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void vault.writeFile(selectedFile.path, content).then(() => setIsDirty(false));
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
            <MarkdownEditor value={content} onChange={handleContentChange} />
          </>
        ) : (
          <Panel title="manYOUscript">
            <p>Open a vault folder to start writing.</p>
          </Panel>
        )}
      </main>
    </div>
  );
}
