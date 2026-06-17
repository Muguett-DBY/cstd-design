import { useState } from "react";

const APP_NAME = "工作台";

export function LoginPage({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <main className="login-page">
      <section className="login-card">
        <img src="/brand/mascot.png" alt="" className="login-mascot" />
        <h1>{APP_NAME}</h1>
        <p>私人访问</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError("");
            try {
              await onLogin(password);
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : "登录失败。");
            } finally {
              setLoading(false);
            }
          }}
        >
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入访问密码" autoFocus />
          <button type="submit" disabled={loading || !password}>
            {loading ? "进入中..." : "进入"}
          </button>
        </form>
        {error && <div className="form-error">{error}</div>}
      </section>
    </main>
  );
}
