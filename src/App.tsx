import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrdersProvider } from "@/context/OrdersContext";
import { EmployeesProvider } from "@/context/EmployeesContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Secretary pages
import Index          from "./pages/Index.tsx";
import Projektleiter  from "./pages/Projektleiter.tsx";
import Einstellungen  from "./pages/Einstellungen.tsx";
import Kalender       from "./pages/Kalender.tsx";
import Historie       from "./pages/Historie.tsx";
import Analytics      from "./pages/Analytics.tsx";
import NotFound       from "./pages/NotFound.tsx";
import Login          from "./pages/Login.tsx";

// Project manager pages
import PLDashboard   from "./pages/projektleiter/PLDashboard.tsx";
import PLKalender    from "./pages/projektleiter/PLKalender.tsx";
import PLHistorie    from "./pages/projektleiter/PLHistorie.tsx";
import PLAnalytics   from "./pages/projektleiter/PLAnalytics.tsx";

const queryClient = new QueryClient();

function RoleRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "project_manager") return <Navigate to="/pl" replace />;
  return <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <OrdersProvider>
      <EmployeesProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Secretary routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/kalender" element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <Kalender />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/projektleiter" element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <Projektleiter />
            </ProtectedRoute>
          } />
          <Route path="/historie" element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <Historie />
            </ProtectedRoute>
          } />
          <Route path="/einstellungen" element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <Einstellungen />
            </ProtectedRoute>
          } />

          {/* Project manager routes */}
          <Route path="/pl" element={
            <ProtectedRoute allowedRoles={["project_manager"]}>
              <PLDashboard />
            </ProtectedRoute>
          } />
          <Route path="/pl/kalender" element={
            <ProtectedRoute allowedRoles={["project_manager"]}>
              <PLKalender />
            </ProtectedRoute>
          } />
          <Route path="/pl/historie" element={
            <ProtectedRoute allowedRoles={["project_manager"]}>
              <PLHistorie />
            </ProtectedRoute>
          } />
          <Route path="/pl/statistiken" element={
            <ProtectedRoute allowedRoles={["project_manager"]}>
              <PLAnalytics />
            </ProtectedRoute>
          } />

          {/* Role-based root redirect for logged-in users hitting wrong path */}
          <Route path="/redirect" element={<RoleRedirect />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </EmployeesProvider>
    </OrdersProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
