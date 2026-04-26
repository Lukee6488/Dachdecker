import { DashboardLayout } from "@/components/DashboardLayout";
import { OrdersTable } from "@/components/OrdersTable";
import { useOrders } from "@/context/OrdersContext";
import { Archive } from "lucide-react";

const Historie = () => {
  const { orders, updateStatus, updateOrder, deleteOrder } = useOrders();

  const doneOrders = orders.filter((o) => o.status === "done");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historie</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {doneOrders.length} erledigte {doneOrders.length === 1 ? "Auftrag" : "Aufträge"}
            </p>
          </div>
        </div>

        {doneOrders.length === 0 ? (
          <div className="rounded-xl border bg-card p-16 text-center shadow-sm">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Archive className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">Keine erledigten Aufträge</p>
            <p className="text-sm text-muted-foreground mt-1">Erledigte Aufträge erscheinen hier.</p>
          </div>
        ) : (
          <OrdersTable
            orders={doneOrders}
            onStatusChange={updateStatus}
            onUpdate={updateOrder}
            onDelete={deleteOrder}
            isArchive
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Historie;
