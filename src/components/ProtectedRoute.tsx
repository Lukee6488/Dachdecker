import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // Auth noch nicht initialisiert
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "hsl(222 47% 8%)" }}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login";
          }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2"
        >
          Abmelden
        </button>
      </div>
    );
  }

  // Nicht eingeloggt
  if (!user) return <Navigate to="/login" replace />;

  // Profil noch nicht geladen (kurzer Übergangszustand)
  if (!profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(222 47% 8%)" }}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Falsche Rolle → zur richtigen Seite umleiten
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={profile.role === "project_manager" ? "/pl" : "/"} replace />;
  }

  return <>{children}</>;
}
