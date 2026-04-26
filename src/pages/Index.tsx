import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KpiCards } from "@/components/KpiCards";
import { OrdersTable } from "@/components/OrdersTable";
import { AddOrderDialog } from "@/components/AddOrderDialog";
import { useOrders } from "@/context/OrdersContext";

const Index = () => {
  const { orders, addOrder, updateStatus, updateOrder, assignToPM, deleteOrder } = useOrders();

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "done"),
    [orders]
  );

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
          </div>
          <AddOrderDialog onAdd={addOrder} />
        </div>

        {/* KPIs */}
        <KpiCards orders={orders} />

        {/* Active orders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Aktive Aufträge
            </h2>
            {activeOrders.length > 0 && (
              <span className="text-xs text-muted-foreground">{activeOrders.length} offen</span>
            )}
          </div>
          <OrdersTable
            orders={activeOrders}
            onStatusChange={updateStatus}
            onUpdate={updateOrder}
            onAssignPM={assignToPM}
            onDelete={deleteOrder}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
