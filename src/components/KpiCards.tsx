import { PhoneCall, Clock, MessageCircle, CheckCircle2 } from "lucide-react";
import type { Lead } from "@/data/mockOrders";

interface KpiCardsProps {
  leads: Lead[];
}

export function KpiCards({ leads }: KpiCardsProps) {
  const cards = [
    {
      label: "Neue Anfragen",
      value: leads.filter((l) => l.status === "Neu").length,
      icon: PhoneCall,
      iconClass: "text-primary",
      iconBg: "bg-primary/10",
      valueClass: () => "text-foreground",
    },
    {
      label: "In Bearbeitung",
      value: leads.filter((l) => l.status === "In Bearbeitung").length,
      icon: Clock,
      iconClass: "text-amber-500",
      iconBg: "bg-amber-50",
      valueClass: () => "text-foreground",
    },
    {
      label: "Kontaktiert",
      value: leads.filter((l) => l.status === "Kontaktiert").length,
      icon: MessageCircle,
      iconClass: "text-blue-500",
      iconBg: "bg-blue-50",
      valueClass: () => "text-foreground",
    },
    {
      label: "Abgeschlossen",
      value: leads.filter((l) => l.status === "Abgeschlossen").length,
      icon: CheckCircle2,
      iconClass: "text-emerald-500",
      iconBg: "bg-emerald-50",
      valueClass: () => "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
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
