import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeadsProvider } from "@/context/LeadsContext";
import { TermineProvider } from "@/context/TermineContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index        from "./pages/Index.tsx";
import Analytics    from "./pages/Analytics.tsx";
import Historie     from "./pages/Historie.tsx";
import Einstellungen from "./pages/Einstellungen.tsx";
import Termine      from "./pages/Termine.tsx";
import NotFound     from "./pages/NotFound.tsx";
import Login        from "./pages/Login.tsx";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <LeadsProvider>
      <TermineProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute allowedRoles={["secretary"]}>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={["secretary"]}>
            <Analytics />
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
        <Route path="/termine" element={
          <ProtectedRoute allowedRoles={["secretary"]}>
            <Termine />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </TermineProvider>
    </LeadsProvider>
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
