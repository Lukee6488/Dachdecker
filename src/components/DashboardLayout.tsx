import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Übersicht" },
  "/kalender": { title: "Kalender", description: "Terminplanung" },
  "/projektleiter": { title: "Projektleiter", description: "Teamverwaltung" },
  "/analytics": { title: "Statistiken", description: "Auswertungen" },
  "/historie": { title: "Historie", description: "Archiv" },
  "/einstellungen": { title: "Einstellungen", description: "System" },
  "/pl": { title: "Dashboard", description: "Meine Aufträge" },
  "/pl/kalender": { title: "Kalender", description: "Termine" },
  "/pl/historie": { title: "Historie", description: "Archiv" },
  "/pl/statistiken": { title: "Statistiken", description: "Auswertungen" },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const page = pageTitles[location.pathname];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 flex items-center border-b bg-card/60 backdrop-blur-sm px-4 shrink-0 gap-3 sticky top-0 z-10">
            <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" />
            <Separator orientation="vertical" className="h-4" />
            {page && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{page.description}</span>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <span className="text-xs font-medium text-foreground">{page.title}</span>
              </div>
            )}
            <div className="ml-auto">
              <NotificationsPanel />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="p-6 w-full min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
