import { useMemo } from "react";
import { History } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useOrders } from "@/context/OrdersContext";

export function ActivityFeed() {
  const { orders, logs } = useOrders();

  const customerName = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.customerName ?? orderId;

  const feed = useMemo(() => {
    const entries: { time: string; action: string; orderId: string; customer: string }[] = [];
    Object.entries(logs).forEach(([orderId, orderLogs]) => {
      orderLogs.forEach((log) => {
        entries.push({ time: log.time, action: log.action, orderId, customer: customerName(orderId) });
      });
    });
    return entries
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 15);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, orders]);

  if (feed.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Letzte Aktivitäten</p>
      </div>
      <div className="space-y-2">
        {feed.map((entry, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground/80 truncate">{entry.customer}</span>
              <span className="text-muted-foreground mx-1.5">·</span>
              <span className="text-foreground/70">{entry.action}</span>
            </div>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {format(parseISO(entry.time), "dd.MM. HH:mm", { locale: de })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
