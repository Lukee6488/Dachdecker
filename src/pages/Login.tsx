import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/context/AuthContext";

const TEST_ACCOUNTS = {
  secretary:       { username: "sekretaerin@test.de",   password: "Test123" },
  project_manager: { username: "projektleiter@test.de", password: "Test123" },
};

function roleToPath(role?: UserRole) {
  return role === "project_manager" ? "/pl" : "/";
}

export default function Login() {
  const { signIn, user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Bereits eingeloggt? Weiterleiten.
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(roleToPath(profile.role), { replace: true });
    }
  }, [loading, user, profile]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [busy,     setBusy]     = useState(false);

  const doLogin = async (u: string, pw: string) => {
    setError(null);
    setBusy(true);
    try {
      const result = await signIn(u, pw, remember);
      if (result.error) {
        setError(result.error);
      } else {
        navigate(roleToPath(result.role), { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    doLogin(username.trim(), password);
  };

  const loginAs = (type: keyof typeof TEST_ACCOUNTS) => {
    const acc = TEST_ACCOUNTS[type];
    setUsername(acc.username);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(222 47% 8%)" }}
    >
      <div className="w-full max-w-sm space-y-6">

        {/* Logo & headline */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
            <img
              src="/logo.png"
              alt="Elektro Heikes"
              className="h-10 w-10 object-contain rounded-xl"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = "flex";
              }}
            />
            <div className="hidden h-10 w-10 items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">Elektro Heikes</h1>
            <p className="text-sm text-slate-400 mt-0.5">Bitte melden Sie sich an</p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl border p-6 shadow-2xl space-y-5"
          style={{
            background:  "hsl(222 28% 13%)",
            borderColor: "hsl(222 35% 20%)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Benutzername
              </Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@beispiel.de"
                disabled={busy}
                className="h-9 bg-[hsl(222_22%_10%)] border-[hsl(222_20%_22%)] text-white placeholder:text-slate-600 focus-visible:ring-primary/50"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy}
                  className="h-9 pr-9 bg-[hsl(222_22%_10%)] border-[hsl(222_20%_22%)] text-white placeholder:text-slate-600 focus-visible:ring-primary/50"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">
                Angemeldet bleiben
              </Label>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-9 gap-2 font-semibold"
              disabled={busy || !username.trim() || !password}
            >
              <LogIn className="h-4 w-4" />
              {busy ? "Anmelden…" : "Anmelden"}
            </Button>
          </form>

          {/* Test accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Separator className="flex-1 bg-[hsl(222_20%_20%)]" />
              <span className="text-[11px] text-slate-600 uppercase tracking-wider shrink-0">Test-Accounts</span>
              <Separator className="flex-1 bg-[hsl(222_20%_20%)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-[hsl(222_20%_22%)] bg-transparent text-slate-300 hover:bg-[hsl(222_22%_18%)] hover:text-white"
                onClick={() => loginAs("secretary")}
                disabled={busy}
              >
                Als Sekretärin anmelden
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-[hsl(222_20%_22%)] bg-transparent text-slate-300 hover:bg-[hsl(222_22%_18%)] hover:text-white"
                onClick={() => loginAs("project_manager")}
                disabled={busy}
              >
                Als Projektleiter anmelden
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600">
          Elektro Heikes · Internes Dashboard
        </p>
      </div>
    </div>
  );
}
