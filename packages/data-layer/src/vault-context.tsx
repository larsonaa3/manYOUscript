import { createContext, useContext, type ReactNode } from "react";
import type { VaultAdapter } from "./vault-adapter";

const VaultContext = createContext<VaultAdapter | null>(null);

export interface VaultProviderProps {
  adapter: VaultAdapter;
  children: ReactNode;
}

export function VaultProvider({ adapter, children }: VaultProviderProps) {
  return <VaultContext.Provider value={adapter}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultAdapter {
  const adapter = useContext(VaultContext);
  if (!adapter) {
    throw new Error("useVault() must be used within a <VaultProvider>");
  }
  return adapter;
}
