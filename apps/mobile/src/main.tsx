import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@manyouscript/app-shell";
import { VaultProvider } from "@manyouscript/data-layer";
import { CapacitorVaultAdapter } from "@manyouscript/fs-adapters";

const vaultAdapter = new CapacitorVaultAdapter();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <VaultProvider adapter={vaultAdapter}>
      <App />
    </VaultProvider>
  </StrictMode>,
);
