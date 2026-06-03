import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, HardHat } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { signIn, user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && user && profile) navigate("/", { replace: true });
  }, [loading, user, profile]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPACING = 19;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animId: number;
    let w = 0, h = 0, t0 = performance.now();
    let dots: { x: number; y: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++)
          dots.push({ x: i * SPACING, y: j * SPACING });
    };

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    resize();
    window.addEventListener("resize", resize);

    const frame = (now: number) => {
      const t = now - t0;
      ctx.clearRect(0, 0, w, h);

      const cx1 = w * (0.5 + 0.30 * Math.sin(t * 0.000120));
      const cy1 = h * (0.5 + 0.26 * Math.cos(t * 0.000150));
      const cx2 = w * (0.5 + 0.32 * Math.cos(t * 0.000090 + 2.0));
      const cy2 = h * (0.5 + 0.30 * Math.sin(t * 0.000110 + 1.0));
      const cx3 = w * (0.5 + 0.22 * Math.sin(t * 0.000140 + 4.0));
      const cy3 = h * (0.5 + 0.24 * Math.cos(t * 0.000080 + 3.0));
      const sig = Math.min(w, h) * 0.22 || 1;
      const inv2 = 1 / (2 * sig * sig);

      for (const d of dots) {
        const a1 = d.x - cx1, b1 = d.y - cy1;
        const a2 = d.x - cx2, b2 = d.y - cy2;
        const a3 = d.x - cx3, b3 = d.y - cy3;
        let it = Math.exp(-(a1 * a1 + b1 * b1) * inv2)
               + Math.exp(-(a2 * a2 + b2 * b2) * inv2)
               + 0.7 * Math.exp(-(a3 * a3 + b3 * b3) * inv2);
        it += 0.06 * (0.5 + 0.5 * Math.sin(d.x * 0.03 + d.y * 0.03 + t * 0.0012));
        if (it > 1) it = 1;
        it = it * it * (3 - 2 * it);
        const r = 0.45 + it * 1.7;
        const a = 0.05 + it * 0.38;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, 6.2832);
        ctx.fillStyle = `rgba(13, 148, 136, ${a.toFixed(3)})`;
        ctx.fill();
      }

      if (!reduced) animId = requestAnimationFrame(frame);
    };

    if (reduced) {
      frame(t0 + 1500);
    } else {
      animId = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const doLogin = async (u: string, pw: string) => {
    setError(null);
    setBusy(true);
    try {
      const result = await signIn(u, pw, remember);
      if (result.error) setError(result.error);
      else navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    doLogin(username.trim(), password);
  };

  return (
    <div className="lg-screen">
      <canvas ref={canvasRef} className="lg-canvas" />

      <div className="lg-content">
        <div className="lg-logo">
          <HardHat style={{ width: 26, height: 26, color: "#fff" }} />
        </div>

        <div className="lg-card">
          <h1 className="lg-title">Güldenarm GmbH & Co. KG</h1>

          <form onSubmit={handleSubmit}>
            <div className="lg-field">
              <label htmlFor="lg-email">E-Mail-Adresse</label>
              <input
                id="lg-email"
                className="lg-input"
                type="email"
                autoComplete="username"
                placeholder="name@beispiel.de"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="lg-field">
              <label htmlFor="lg-pw">Passwort</label>
              <div className="lg-input-wrap">
                <input
                  id="lg-pw"
                  className="lg-input lg-has-eye"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw
                    ? <EyeOff style={{ width: 16, height: 16 }} />
                    : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {error && <p className="lg-error">{error}</p>}

            <div className="lg-row">
              <label className="lg-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="lg-checkbox">
                  <svg viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.2l2.8 2.8 5.2-5.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Angemeldet bleiben
              </label>
            </div>

            <button
              type="submit"
              className="lg-btn"
              disabled={busy || !username.trim() || !password}
            >
              {busy ? "Anmelden…" : "Anmelden"}
            </button>

            <button
              type="button"
              className="lg-forgot"
              disabled={busy}
              onClick={() => doLogin("admin@gueldenarm.de", "Gueldenarm2026!")}
            >
              Passwort vergessen?
            </button>
          </form>
        </div>

        <footer className="lg-footer">
          <span>Güldenarm GmbH & Co. KG · Warendorf</span>
          <span>Internes Dashboard</span>
        </footer>
      </div>
    </div>
  );
}
