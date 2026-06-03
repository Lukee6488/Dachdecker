import { useMemo } from "react";
import { Bell, PhoneCall, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLeads } from "@/context/LeadsContext";
import { parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "info";
}

export function NotificationsPanel() {
  const { leads } = useLeads();

  const notifications = useMemo(() => {
    const items: Notification[] = [];
    const now = new Date();

    const newLeads = leads.filter((l) => l.status === "Neu");
    if (newLeads.length > 0) {
      items.push({
        id: "new-leads",
        icon: PhoneCall,
        iconClass: "text-primary",
        title: `${newLeads.length} neue${newLeads.length === 1 ? "r" : ""} Lead${newLeads.length === 1 ? "" : "s"} unbearbeitet`,
        description: newLeads.map((l) => l.name).slice(0, 3).join(", ") + (newLeads.length > 3 ? ` +${newLeads.length - 3}` : ""),
        severity: "high",
      });
    }

    const stale = leads.filter((l) => {
      if (l.status === "Abgeschlossen") return false;
      try { return differenceInDays(now, parseISO(l.datum)) > 7; } catch { return false; }
    });
    if (stale.length > 0) {
      items.push({
        id: "stale-leads",
        icon: Clock,
        iconClass: "text-amber-500",
        title: `${stale.length} Lead${stale.length === 1 ? "" : "s"} älter als 7 Tage`,
        description: stale.map((l) => l.name).slice(0, 2).join(", ") + (stale.length > 2 ? ` +${stale.length - 2}` : ""),
        severity: "medium",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "all-good",
        icon: CheckCircle2,
        iconClass: "text-emerald-500",
        title: "Alles im grünen Bereich",
        description: "Keine offenen Hinweise",
        severity: "info",
      });
    }

    return items;
  }, [leads]);

  const highCount   = notifications.filter((n) => n.severity === "high").length;
  const mediumCount = notifications.filter((n) => n.severity === "medium").length;
  const badgeCount  = highCount + mediumCount;

  const severityBg: Record<string, string> = {
    high:   "bg-rose-50 dark:bg-rose-950/30",
    medium: "bg-amber-50 dark:bg-amber-950/30",
    info:   "bg-muted/40",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {badgeCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
              highCount > 0 ? "bg-rose-500" : "bg-amber-500"
            )}>
              {badgeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Benachrichtigungen</p>
          <p className="text-xs text-muted-foreground">{notifications.length} {notifications.length === 1 ? "Hinweis" : "Hinweise"}</p>
        </div>
        <div className="divide-y max-h-72 overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3", severityBg[n.severity])}>
              <div className="mt-0.5 shrink-0">
                <n.icon className={cn("h-4 w-4", n.iconClass)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
