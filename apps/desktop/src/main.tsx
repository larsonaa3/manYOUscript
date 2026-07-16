import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, ThemeProvider } from "@manyouscript/app-shell";
import { VaultProvider } from "@manyouscript/data-layer";
import { TauriVaultAdapter } from "@manyouscript/fs-adapters";

const vaultAdapter = new TauriVaultAdapter();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <VaultProvider adapter={vaultAdapter}>
        <App />
      </VaultProvider>
    </ThemeProvider>
  </StrictMode>,
);
