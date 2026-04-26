import { useMemo } from "react";
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrders } from "@/context/OrdersContext";
import { parseISO, isBefore, startOfDay } from "date-fns";
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
  const { orders } = useOrders();

  const notifications = useMemo(() => {
    const items: Notification[] = [];
    const today = startOfDay(new Date());

    const urgentUnassigned = orders.filter(
      (o) => o.priority === "hoch" && o.status !== "done" && !o.assignedTo
    );
    if (urgentUnassigned.length > 0) {
      items.push({
        id: "urgent-unassigned",
        icon: AlertTriangle,
        iconClass: "text-rose-500",
        title: `${urgentUnassigned.length} dringende${urgentUnassigned.length === 1 ? "r" : ""} Auftrag${urgentUnassigned.length === 1 ? "" : "aufträge"} unzugewiesen`,
        description: urgentUnassigned.map((o) => o.customerName).slice(0, 2).join(", ") + (urgentUnassigned.length > 2 ? ` +${urgentUnassigned.length - 2}` : ""),
        severity: "high",
      });
    }

    const overdue = orders.filter((o) => {
      if (o.status === "done" || !o.scheduledAt) return false;
      try { return isBefore(parseISO(o.scheduledAt), today); } catch { return false; }
    });
    if (overdue.length > 0) {
      items.push({
        id: "overdue",
        icon: Clock,
        iconClass: "text-amber-500",
        title: `${overdue.length} überfällige${overdue.length === 1 ? "r" : ""} Auftrag${overdue.length === 1 ? "" : "aufträge"}`,
        description: overdue.map((o) => o.customerName).slice(0, 2).join(", ") + (overdue.length > 2 ? ` +${overdue.length - 2}` : ""),
        severity: "medium",
      });
    }

    const noDate = orders.filter((o) => !o.scheduledAt && o.status !== "done");
    if (noDate.length > 0) {
      items.push({
        id: "no-date",
        icon: Calendar,
        iconClass: "text-blue-500",
        title: `${noDate.length} Auftrag${noDate.length === 1 ? "" : "aufträge"} ohne Termin`,
        description: "Noch kein Termin vergeben",
        severity: "info",
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
  }, [orders]);

  const highCount = notifications.filter((n) => n.severity === "high").length;
  const mediumCount = notifications.filter((n) => n.severity === "medium").length;
  const badgeCount = highCount + mediumCount;

  const severityBg: Record<string, string> = {
    high: "bg-rose-50 dark:bg-rose-950/30",
    medium: "bg-amber-50 dark:bg-amber-950/30",
    info: "bg-muted/40",
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
