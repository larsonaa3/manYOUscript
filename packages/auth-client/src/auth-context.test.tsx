import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";
import type { PublicUser } from "@manyouscript/auth-schemas";

function Probe() {
  const { status, user } = useAuth();
  return <div data-testid="probe">{`${status}:${user?.username ?? "none"}`}</div>;
}

describe("AuthProvider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("transitions loading -> authenticated when /api/me returns a user", async () => {
    const fakeUser: PublicUser = { id: 1, username: "alice", email: null };
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => fakeUser,
    } as Response);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe("authenticated:alice");
    });
  });

  it("transitions loading -> unauthenticated when /api/me returns 401", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ error: "Not authenticated" }),
    } as Response);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe("unauthenticated:none");
    });
  });

  it("throws when useAuth() is called outside an AuthProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useAuth() must be used within an <AuthProvider>");
    consoleError.mockRestore();
  });
});
