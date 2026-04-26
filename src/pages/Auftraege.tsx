import { DashboardLayout } from "@/components/DashboardLayout";
import { OrdersTable } from "@/components/OrdersTable";
import { AddOrderDialog } from "@/components/AddOrderDialog";
import { useOrders } from "@/context/OrdersContext";

const Auftraege = () => {
  const { orders, addOrder, updateStatus, updateOrder, deleteOrder } = useOrders();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Aufträge</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Alle Aufträge verwalten und bearbeiten
            </p>
          </div>
          <AddOrderDialog onAdd={addOrder} />
        </div>

        <OrdersTable
          orders={orders.filter((o) => o.status !== "done")}
          onStatusChange={updateStatus}
          onUpdate={updateOrder}
          onDelete={deleteOrder}
        />
      </div>
    </DashboardLayout>
  );
};

export default Auftraege;
