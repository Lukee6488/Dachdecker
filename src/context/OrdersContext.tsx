import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import type { Order, OrderStatus, OrderPriority, OrderCategory } from "@/data/mockOrders";

export interface OrderLog {
  time: string;
  action: string;
}

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  logs: Record<string, OrderLog[]>;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  assignOrder: (orderId: string, employeeNames: string[]) => void;
  assignToPM: (orderId: string, pmUserId: string | null) => void;
  deleteOrder: (orderId: string) => void;
  scheduleOrder: (orderId: string, date: Date | null) => void;
}

const statusLabels: Record<OrderStatus, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Record<string, OrderLog[]>>({});

  const addLog = (orderId: string, action: string) => {
    const time = new Date().toISOString();
    setLogs((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), { time, action }],
    }));
    supabase.from("order_logs")
      .insert({ order_id: orderId, action, created_at: time })
      .then(({ error }) => { if (error) console.error("Log save error:", error); });
  };

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("order_logs")
      .select("order_id, action, created_at")
      .order("created_at", { ascending: true });
    if (error) { console.error("Error fetching logs:", error); return; }
    const map: Record<string, OrderLog[]> = {};
    for (const row of (data ?? [])) {
      if (!map[row.order_id]) map[row.order_id] = [];
      map[row.order_id].push({ time: row.created_at, action: row.action });
    }
    setLogs(map);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("received_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return;
    }

    // Rows with no id can't be updated — assign a UUID immediately in the DB
    const repairs: Promise<void>[] = [];
    for (const row of data || []) {
      if (!row.id?.trim()) {
        const newId = crypto.randomUUID();
        row.id = newId;
        repairs.push(
          supabase
            .from("orders")
            .update({ id: newId })
            .eq("created_at", row.created_at)
            .then(({ error }) => {
              if (error) console.error("Failed to repair order id:", error);
            })
        );
      }
    }
    if (repairs.length > 0) await Promise.all(repairs);

    const mapped: Order[] = (data || []).map((row: any) => ({
      id: row.id.trim(),
      customerName: row.name,
      firma: row.firma ?? null,
      address: row.addresse,
      phone: row.telefon || "",
      priority: row.dringlichkeit as OrderPriority,
      status: row.status as OrderStatus,
      receivedAt: row.received_at,
      scheduledAt: row.termin,
      description: row.problem || "",
      assignedTo: row.assigned_to,
      pmUserId: row.pm_user_id ?? null,
      notes: row.notes || "",
      category: (row.kategorie || "Starkstrom") as OrderCategory,
    }));

    setOrders(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const addOrder = async (order: Order) => {
    const id = crypto.randomUUID();
    const insertData: Record<string, unknown> = {
      id,
      name: order.customerName,
      firma: order.firma ?? null,
      addresse: order.address,
      telefon: order.phone,
      dringlichkeit: order.priority,
      status: order.status,
      received_at: order.receivedAt,
      termin: order.scheduledAt,
      problem: order.description,
      notes: order.notes,
      kategorie: order.category,
    };
    if (order.assignedTo !== undefined) insertData.assigned_to = order.assignedTo;
    if (order.pmUserId   !== undefined) insertData.pm_user_id  = order.pmUserId;

    const { error } = await supabase.from("orders").insert(insertData);

    if (error) {
      console.error("Error adding order:", error);
      toast.error(`Fehler: ${error.message}`);
      return;
    }
    const savedOrder = { ...order, id };
    setOrders((prev) => [savedOrder, ...prev]);
    addLog(id, "Auftrag angelegt");
    toast.success("Auftrag angelegt");
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));

    const dbUpdates: Record<string, unknown> = {};
    if (updates.customerName !== undefined) dbUpdates.name = updates.customerName;
    if (updates.firma !== undefined) dbUpdates.firma = updates.firma;
    if (updates.address !== undefined) dbUpdates.addresse = updates.address;
    if (updates.phone !== undefined) dbUpdates.telefon = updates.phone;
    if (updates.priority !== undefined) dbUpdates.dringlichkeit = updates.priority;
    if (updates.scheduledAt !== undefined) dbUpdates.termin = updates.scheduledAt;
    if (updates.description !== undefined) dbUpdates.problem = updates.description;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.category !== undefined) dbUpdates.kategorie = updates.category;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from("orders").update(dbUpdates).eq("id", orderId);
      if (error) console.error("Error updating order:", error);
    }

    addLog(orderId, "Auftrag bearbeitet");
    toast.success("Änderungen gespeichert");
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    addLog(orderId, `Status → ${statusLabels[status]}`);
    toast.success(`Status: ${statusLabels[status]}`);
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { console.error("Error updating status:", error); toast.error("Status konnte nicht gespeichert werden"); }
  };

  const assignOrder = async (orderId: string, employeeNames: string[]) => {
    const unique = [...new Set(employeeNames)];
    const assignedTo = unique.length > 0 ? unique.join(", ") : null;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, assignedTo } : o)));
    addLog(orderId, assignedTo ? `Zugewiesen an ${assignedTo}` : "Zuweisung entfernt");
    const { error } = await supabase.from("orders").update({ assigned_to: assignedTo }).eq("id", orderId);
    if (error) {
      console.error("Error assigning order:", error);
      toast.error("Zuweisung konnte nicht gespeichert werden");
    } else {
      toast.success(assignedTo ? `Zugewiesen an ${assignedTo}` : "Zuweisung entfernt");
    }
  };

  const assignToPM = async (orderId: string, pmUserId: string | null) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, pmUserId } : o)));
    const { error } = await supabase.from("orders").update({ pm_user_id: pmUserId }).eq("id", orderId);
    if (error) {
      console.error("Error assigning PM:", error);
      toast.error("PM-Zuweisung konnte nicht gespeichert werden");
    } else {
      toast.success(pmUserId ? "Projektleiter zugewiesen" : "PM-Zuweisung entfernt");
    }
  };

  const scheduleOrder = async (orderId: string, date: Date | null) => {
    const existing = orders.find((o) => o.id === orderId);
    let scheduledAt: string | null = null;
    if (date) {
      // Preserve existing time, only replace the date
      const existingTime = existing?.scheduledAt ? parseISO(existing.scheduledAt) : null;
      scheduledAt = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        existingTime?.getHours() ?? 0,
        existingTime?.getMinutes() ?? 0,
        existingTime?.getSeconds() ?? 0,
      ).toISOString();
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, scheduledAt } : o)));
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ termin: scheduledAt })
      .eq("id", orderId)
      .select();
    if (error || !updated || updated.length === 0) {
      console.error("Error scheduling order:", error ?? `0 rows matched for id="${orderId}"`);
      toast.error("Termin konnte nicht gespeichert werden");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, scheduledAt: existing?.scheduledAt ?? null } : o)));
      return;
    }
    toast.success(date ? `Termin: ${format(date, "dd.MM.yyyy")}` : "Termin entfernt");
    addLog(orderId, date ? `Termin verschoben: ${format(date, "dd.MM.yyyy")}` : "Termin entfernt");
  };

  const deleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) { console.error("Error deleting order:", error); toast.error("Auftrag konnte nicht gelöscht werden"); return; }
    toast.success("Auftrag gelöscht");
  };

  return (
    <OrdersContext.Provider value={{ orders, loading, logs, addOrder, updateOrder, updateStatus, assignOrder, assignToPM, deleteOrder, scheduleOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
