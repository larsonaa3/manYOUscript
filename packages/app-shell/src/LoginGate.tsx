import type { ReactNode } from "react";
import { useAuth } from "@manyouscript/auth-client";
import { LoginForm } from "./LoginForm";

export interface LoginGateProps {
  children: ReactNode;
}

/** Blocks children behind a login form until the session check resolves to authenticated. */
export function LoginGate({ children }: LoginGateProps) {
  const { status } = useAuth();

  if (status === "loading") {
    return <div className="myc-login-gate myc-login-gate--loading">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="myc-login-gate">
        <LoginForm />
      </div>
    );
  }

  return <>{children}</>;
}
