import { useState, type FormEvent } from "react";
import { useAuth } from "@manyouscript/auth-client";
import { Button, Panel } from "@manyouscript/ui";

export function LoginForm() {
  const { login, register, error } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    const action = mode === "login" ? login(username, password) : register(username, password);
    action
      .catch((err: unknown) => {
        setLocalError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Panel title="manYOUscript">
      <form className="myc-login-form" onSubmit={handleSubmit}>
        <label className="myc-login-form__field">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            minLength={3}
          />
        </label>
        <label className="myc-login-form__field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
        </label>
        {(localError ?? error) ? (
          <p className="myc-login-form__error" role="alert">
            {localError ?? error}
          </p>
        ) : null}
        <div className="myc-login-form__actions">
          <Button type="submit" disabled={submitting}>
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
          <button
            type="button"
            className="myc-login-form__toggle"
            onClick={() => {
              setMode((current) => (current === "login" ? "register" : "login"));
              setLocalError(null);
            }}
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
