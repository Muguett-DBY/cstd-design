import { useRef, useState } from "react";

const APP_NAME = "工作台";
const PASSWORD_INPUT_ID = "login-password";
const LOGIN_ERROR_ID = "login-error";

export function LoginPage({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(password);
  return (
    <main className="login-page">
      <section className="login-card">
        <img src="/brand/mascot.png" alt="" className="login-mascot" />
        <h1>{APP_NAME}</h1>
        <p>私人访问</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const submittedPassword = password;
            setLoading(true);
            setError("");
            try {
              await onLogin(submittedPassword);
            } catch (loginError) {
              if (passwordRef.current === submittedPassword) {
                setError(loginError instanceof Error ? loginError.message : "登录失败。");
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <label htmlFor={PASSWORD_INPUT_ID}>访问密码</label>
          <input
            id={PASSWORD_INPUT_ID}
            name="password"
            type="password"
            value={password}
            onChange={(event) => {
              const nextPassword = event.target.value;
              passwordRef.current = nextPassword;
              setPassword(nextPassword);
              if (error) setError("");
            }}
            placeholder="输入访问密码"
            autoComplete="current-password"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? LOGIN_ERROR_ID : undefined}
            required
            autoFocus
          />
          <button type="submit" disabled={loading || !password}>
            {loading ? "进入中..." : "进入"}
          </button>
        </form>
        {error && (
          <div id={LOGIN_ERROR_ID} className="form-error" role="alert">
            {error}
          </div>
        )}
      </section>
    </main>
  );
}
