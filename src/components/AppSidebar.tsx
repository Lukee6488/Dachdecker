import { useState } from "react";
import { BarChart3, LineChart, Users, Settings, CalendarDays, Archive, LogOut, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { AccountSheet } from "@/components/AccountSheet";

const secretaryNav = [
  { title: "Dashboard",   url: "/",           icon: BarChart3,       end: true  },
  { title: "Kalender",    url: "/kalender",   icon: CalendarDays,    end: false },
  { title: "Statistiken", url: "/analytics",  icon: LineChart,       end: false },
  { title: "Projektleiter", url: "/projektleiter", icon: Users,          end: false },
  { title: "Historie",    url: "/historie",   icon: Archive,         end: false },
];

const plNav = [
  { title: "Dashboard",   url: "/pl",             icon: LayoutDashboard, end: true  },
  { title: "Kalender",    url: "/pl/kalender",    icon: CalendarDays,    end: false },
  { title: "Historie",    url: "/pl/historie",    icon: Archive,         end: false },
  { title: "Statistiken", url: "/pl/statistiken", icon: LineChart,       end: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const navItems = profile?.role === "project_manager" ? plNav : secretaryNav;
  const showSettings = profile?.role === "secretary";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Logo */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0">
            <img src="/logo.png" alt="Elektro Heikes Logo" className="h-8 w-8 object-contain rounded-lg" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold text-sidebar-accent-foreground tracking-tight whitespace-nowrap overflow-hidden">
                Elektro Heikes
              </span>
              {profile?.role === "project_manager" && (
                <span className="text-[10px] text-sidebar-foreground/50">Projektleitung</span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground transition-colors duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border/60 space-y-1">
        {showSettings && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/einstellungen"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground transition-colors duration-150"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Einstellungen</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {!collapsed && profile && (
          <div className="px-2.5 py-2 rounded-md bg-sidebar-accent/40 flex items-center gap-2.5">
            <button
              onClick={() => setAccountOpen(true)}
              className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
            >
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary uppercase">
                  {profile.display_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-sidebar-accent-foreground truncate">{profile.display_name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  {profile.role === "secretary" ? "Sekretariat" : "Projektleitung"}
                </p>
              </div>
            </button>
            <button
              onClick={signOut}
              className="h-6 w-6 flex items-center justify-center rounded text-sidebar-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              title="Abmelden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />

        {collapsed && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 w-full text-[13px] font-medium text-sidebar-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
