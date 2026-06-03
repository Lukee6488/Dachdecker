import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KpiCards } from "@/components/KpiCards";
import { OrdersTable } from "@/components/OrdersTable";
import { AddOrderDialog } from "@/components/AddOrderDialog";
import { useLeads } from "@/context/LeadsContext";

const Index = () => {
  const { leads, addLead, updateStatus, updateLead, deleteLead } = useLeads();

  const activeLeads = useMemo(
    () => leads.filter((l) => l.status !== "Abgeschlossen"),
    [leads]
  );

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
          </div>
          <AddOrderDialog onAdd={addLead} />
        </div>

        <KpiCards leads={leads} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Aktive Leads</h2>
            {activeLeads.length > 0 && (
              <span className="text-xs text-muted-foreground">{activeLeads.length} offen</span>
            )}
          </div>
          <OrdersTable
            orders={activeLeads}
            onStatusChange={updateStatus}
            onUpdate={updateLead}
            onDelete={deleteLead}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
