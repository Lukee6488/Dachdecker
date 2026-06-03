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

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const SPACING = 22;
    const zones = [
      { x: 0.18, y: 0.42, r: 0.32 },
      { x: 0.72, y: 0.58, r: 0.26 },
      { x: 0.48, y: 0.18, r: 0.20 },
    ];

    const smooth = (x: number) => {
      const c = Math.max(0, Math.min(1, x));
      return c * c * c * (c * (c * 6 - 15) + 10);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * SPACING;
          const y = row * SPACING;
          let glow = 0;

          for (const z of zones) {
            const cx = z.x + 0.07 * Math.sin(t * 0.38 + z.r * 4.7);
            const cy = z.y + 0.05 * Math.cos(t * 0.28 + z.r * 3.1);
            const dx = x / canvas.width - cx;
            const dy = y / canvas.height - cy;
            glow += smooth(1 - Math.sqrt(dx * dx + dy * dy) / z.r);
          }

          const alpha = Math.min(1, 0.055 + glow * 0.30);
          const radius = 0.55 + glow * 1.5;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(13, 148, 136, ${alpha})`;
          ctx.fill();
        }
      }

      t += 0.007;
      animId = requestAnimationFrame(draw);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      t = 2;
      draw();
      cancelAnimationFrame(animId!);
    } else {
      draw();
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
