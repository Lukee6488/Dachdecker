import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, PackageOpen, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Order, OrderStatus } from "@/data/mockOrders";
import { ORDER_CATEGORIES } from "@/data/mockOrders";
import { OrderDetailSheet } from "@/components/OrderDetailSheet";
import { formatDate } from "@/lib/formatDate";
import { validateOrder } from "@/lib/orderValidation";
import { cn } from "@/lib/utils";
import { useOrders } from "@/context/OrdersContext";
import { supabase } from "@/integrations/supabase/client";

interface OrdersTableProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onAssignPM?: (orderId: string, pmUserId: string | null) => void;
  onUpdate?: (orderId: string, updates: Partial<Order>) => void;
  onDelete?: (orderId: string) => void;
  hiddenColumns?: string[];
  isArchive?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  open: {
    label: "Offen",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
  },
  in_progress: {
    label: "In Bearbeitung",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
  },
  done: {
    label: "Erledigt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
  },
};

const priorityConfig: Record<string, { dot: string; label: string }> = {
  hoch: { dot: "bg-rose-500", label: "Hoch" },
  mittel: { dot: "bg-amber-400", label: "Mittel" },
  niedrig: { dot: "bg-emerald-400", label: "Niedrig" },
};

export function OrdersTable({
  orders,
  onStatusChange,
  onAssignPM,
  onUpdate,
  onDelete,
  hiddenColumns = [],
  isArchive = false,
}: OrdersTableProps) {
  const { logs } = useOrders();
  const show = (col: string) => !hiddenColumns.includes(col);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [search, setSearch] = useState("");
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pmProfiles, setPmProfiles] = useState<{ id: string; display_name: string }[]>([]);

  useEffect(() => {
    if (!onAssignPM) return;
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("role", "project_manager")
      .then(({ data }) => { if (data) setPmProfiles(data); });
  }, [!!onAssignPM]);

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((o) => o.category === categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const prio: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
    if (sortMode === "oldest") result.sort((a, b) => +new Date(a.receivedAt) - +new Date(b.receivedAt));
    else if (sortMode === "newest") result.sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
    else if (sortMode === "urgent") result.sort((a, b) => (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1));
    return result;
  }, [orders, statusFilter, categoryFilter, sortMode, search]);

  const hasFilters = search || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <>
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Kunde, Adresse, Auftragsnr. …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm bg-card"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-sm bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              {isArchive && <SelectItem value="done">Erledigt</SelectItem>}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-40 text-sm bg-card">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {ORDER_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={setSortMode}>
            <SelectTrigger className="h-9 w-40 text-sm bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Neueste zuerst</SelectItem>
              <SelectItem value="oldest">Älteste zuerst</SelectItem>
              <SelectItem value="urgent">Dringendste zuerst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                <TableHead className="w-6 pl-4"></TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</TableHead>
                <TableHead className="hidden md:table-cell text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adresse</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorie</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Termin</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eingang</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-36">Status</TableHead>
                {onAssignPM && pmProfiles.length > 0 && <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-44">Projektleiter</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const prio = priorityConfig[order.priority];
                const validation = validateOrder(order);
                return (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0",
                      !validation.valid && "bg-destructive/5 hover:bg-destructive/10"
                    )}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="pl-4">
                      <span
                        className={cn("inline-block h-3 w-3 rounded-full", prio?.dot)}
                        title={prio?.label}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <span>{order.customerName || <span className="text-muted-foreground italic">Kein Name</span>}</span>
                        {!validation.valid && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-destructive/40 text-destructive bg-destructive/10 shrink-0"
                            title={`Fehlende Felder: ${validation.missing.join(", ")}`}
                          >
                            ⚠ {validation.missing.join(", ")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[160px] truncate">
                      {order.address}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-muted/40">
                        {order.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {order.scheduledAt ? (
                        <span className="font-medium">{formatDate(order.scheduledAt)}</span>
                      ) : (
                        <span className="text-muted-foreground/50">–</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(order.receivedAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={order.status}
                        onValueChange={(val) => onStatusChange(order.id, val as OrderStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs w-36 bg-muted/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Offen</SelectItem>
                          <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                          <SelectItem value="done">Erledigt</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {onAssignPM && pmProfiles.length > 0 && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.pmUserId ?? "__none__"}
                          onValueChange={(val) =>
                            onAssignPM(order.id, val === "__none__" ? null : val)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-44 bg-muted/30 font-normal">
                            <SelectValue placeholder="Nicht zugewiesen" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[168px] overflow-y-auto">
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">Nicht zugewiesen</span>
                            </SelectItem>
                            {pmProfiles.map((pm) => (
                              <SelectItem key={pm.id} value={pm.id}>
                                {pm.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                        <PackageOpen className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Keine Aufträge gefunden
                      </p>
                      {hasFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 mt-1"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setCategoryFilter("all");
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right pr-1">
            {filtered.length} {filtered.length === 1 ? "Auftrag" : "Aufträge"}
            {orders.length !== filtered.length && ` von ${orders.length}`}
          </p>
        )}
      </div>

      <OrderDetailSheet
        order={selectedOrder ? (orders.find((o) => o.id === selectedOrder.id) ?? null) : null}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onUpdate={onUpdate}
        onStatusChange={onStatusChange}
        onAssignPM={onAssignPM}
        onDeleteRequest={(orderId) => {
          const order = orders.find((o) => o.id === orderId) ?? null;
          setPendingDeleteOrder(order);
        }}
        logs={selectedOrder ? (logs[selectedOrder.id] ?? []) : []}
      />

      <AlertDialog open={!!pendingDeleteOrder} onOpenChange={(open) => !open && setPendingDeleteOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDeleteOrder?.customerName}</strong> wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteOrder) onDelete?.(pendingDeleteOrder.id);
                setPendingDeleteOrder(null);
              }}
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
