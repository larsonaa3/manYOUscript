import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, LoginGate } from "@manyouscript/app-shell";
import { AuthProvider } from "@manyouscript/auth-client";
import { VaultProvider } from "@manyouscript/data-layer";
import { createWebVaultAdapter, isFileSystemAccessSupported } from "@manyouscript/fs-adapters";
import "./index.css";

const vaultAdapter = createWebVaultAdapter();
const hasFullFsAccess = isFileSystemAccessSupported();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    {!hasFullFsAccess ? (
      <div className="myc-browser-banner">
        Your browser doesn&apos;t support the File System Access API (Chrome or Edge do). You can still
        import a folder of notes, but saving a file downloads it instead of writing back to disk directly —
        or use the desktop app for live sync.
      </div>
    ) : null}
    <AuthProvider>
      <LoginGate>
        <VaultProvider adapter={vaultAdapter}>
          <App />
        </VaultProvider>
      </LoginGate>
    </AuthProvider>
  </StrictMode>,
);
