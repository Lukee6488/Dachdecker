import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KpiCards } from "@/components/KpiCards";
import { OrdersTable } from "@/components/OrdersTable";
import { useOrders } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";

export default function PLDashboard() {
  const { orders, updateStatus, updateOrder } = useOrders();
  const { employees } = useEmployees();
  const { user, profile } = useAuth();

  const myOrders = useMemo(
    () => orders.filter((o) => o.pmUserId === user?.id),
    [orders, user?.id]
  );

  const activeOrders = useMemo(
    () => myOrders.filter((o) => o.status !== "done"),
    [myOrders]
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
            <h1 className="text-2xl font-bold tracking-tight">
              Willkommen, {profile?.display_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
          </div>
        </div>

        <KpiCards orders={myOrders} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Meine Aufträge</h2>
            {activeOrders.length > 0 && (
              <span className="text-xs text-muted-foreground">{activeOrders.length} aktiv</span>
            )}
          </div>
          {myOrders.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Ihnen wurden noch keine Aufträge zugewiesen.
              </p>
            </div>
          ) : (
            <OrdersTable
              orders={myOrders}
              onStatusChange={updateStatus}
              onUpdate={updateOrder}
              employees={employees}
              hiddenColumns={["pm"]}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
