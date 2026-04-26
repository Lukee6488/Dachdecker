import { AlertTriangle, Clock, Wrench } from "lucide-react";
import type { Order } from "@/data/mockOrders";

interface KpiCardsProps {
  orders: Order[];
}

const cards = (orders: Order[]) => [
  {
    label: "Notfälle offen",
    value: orders.filter((o) => o.priority === "hoch" && o.status !== "done").length,
    icon: AlertTriangle,
    iconClass: "text-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
    valueClass: (v: number) => v > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground",
  },
  {
    label: "Offen",
    value: orders.filter((o) => o.status === "open").length,
    icon: Clock,
    iconClass: "text-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    valueClass: () => "text-foreground",
  },
  {
    label: "In Bearbeitung",
    value: orders.filter((o) => o.status === "in_progress").length,
    icon: Wrench,
    iconClass: "text-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    valueClass: () => "text-foreground",
  },
];

export function KpiCards({ orders }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards(orders).map((card) => (
        <div
          key={card.label}
          className="rounded-xl border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-3"
        >
          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg} shrink-0`}>
            <card.icon className={`h-4 w-4 ${card.iconClass}`} />
          </div>
          <div>
            <p className={`text-xl font-bold tracking-tight leading-none ${card.valueClass(card.value)}`}>
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
