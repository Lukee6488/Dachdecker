import { DashboardLayout } from "@/components/DashboardLayout";
import { OrdersTable } from "@/components/OrdersTable";
import { useLeads } from "@/context/LeadsContext";
import { Archive } from "lucide-react";

const Historie = () => {
  const { leads, updateStatus, updateLead, deleteLead } = useLeads();

  const archived = leads.filter((l) => l.status === "Abgeschlossen");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Archiv</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {archived.length} abgeschlossene {archived.length === 1 ? "Anfrage" : "Anfragen"}
            </p>
          </div>
        </div>

        {archived.length === 0 ? (
          <div className="rounded-xl border bg-card p-16 text-center shadow-sm">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Archive className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">Kein Archiv</p>
            <p className="text-sm text-muted-foreground mt-1">Abgeschlossene Anfragen erscheinen hier.</p>
          </div>
        ) : (
          <OrdersTable
            orders={archived}
            onStatusChange={updateStatus}
            onUpdate={updateLead}
            onDelete={deleteLead}
            isArchive
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Historie;
