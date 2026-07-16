import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, ThemeProvider } from "@manyouscript/app-shell";
import { VaultProvider } from "@manyouscript/data-layer";
import { TauriVaultAdapter } from "@manyouscript/fs-adapters";
import { ToastProvider } from "@manyouscript/ui";

const vaultAdapter = new TauriVaultAdapter();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <VaultProvider adapter={vaultAdapter}>
          <App />
        </VaultProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
