import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog";
import { useEmployees } from "@/context/EmployeesContext";
import { useOrders } from "@/context/OrdersContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Phone, Users, Pencil, Check, X } from "lucide-react";
import type { Employee } from "@/data/types";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-amber-100 text-amber-700",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

type SortMode = "name-asc" | "name-desc" | "most-orders" | "least-orders";

interface EditState {
  name: string;
  role: string;
  phone: string;
}

const Mitarbeiter = () => {
  const { employees, addEmployee, removeEmployee, updateEmployee } = useEmployees();
  const { orders } = useOrders();
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", role: "", phone: "" });

  const assignedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.assignedTo && o.status !== "done") {
        counts[o.assignedTo] = (counts[o.assignedTo] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  const sorted = useMemo(() => {
    return [...employees].sort((a, b) => {
      if (sortMode === "name-asc") return a.name.localeCompare(b.name, "de");
      if (sortMode === "name-desc") return b.name.localeCompare(a.name, "de");
      if (sortMode === "most-orders") return (assignedCounts[b.name] || 0) - (assignedCounts[a.name] || 0);
      if (sortMode === "least-orders") return (assignedCounts[a.name] || 0) - (assignedCounts[b.name] || 0);
      return 0;
    });
  }, [employees, sortMode, assignedCounts]);

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employees.length} {employees.length === 1 ? "Person" : "Personen"} im Team
            </p>
          </div>
          <AddEmployeeDialog onAdd={addEmployee} />
        </div>

        {employees.length === 0 ? (
          <div className="rounded-xl border bg-card p-16 text-center shadow-sm">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">Noch keine Mitarbeiter</p>
            <p className="text-sm text-muted-foreground mt-1">Füge deinen ersten Mitarbeiter hinzu.</p>
          </div>
        ) : (
          <>
            {/* Sort control */}
            <div className="flex justify-end">
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="h-8 w-44 text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                  <SelectItem value="name-desc">Name Z–A</SelectItem>
                  <SelectItem value="most-orders">Meiste Aufträge</SelectItem>
                  <SelectItem value="least-orders">Wenigste Aufträge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {sorted.map((emp) => {
                const originalIdx = employees.findIndex((e) => e.id === emp.id);
                const count = assignedCounts[emp.name] || 0;
                const color = AVATAR_COLORS[originalIdx % AVATAR_COLORS.length];
                const isEditing = editingId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-sm font-bold shrink-0 select-none`}>
                      {initials(isEditing ? editState.name || emp.name : emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5">
                          <Input
                            value={editState.name}
                            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Name"
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <div className="flex gap-1.5">
                            <Input
                              value={editState.role}
                              onChange={(e) => setEditState((s) => ({ ...s, role: e.target.value }))}
                              placeholder="Rolle"
                              className="h-7 text-xs flex-1"
                            />
                            <Input
                              value={editState.phone}
                              onChange={(e) => setEditState((s) => ({ ...s, phone: e.target.value }))}
                              placeholder="Telefon"
                              className="h-7 text-xs flex-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-sm">{emp.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {emp.role || "Elektriker"}
                            </span>
                            {emp.phone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {emp.phone}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isEditing && (
                        <>
                          {count > 0 ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium mr-1.5">
                              {count} {count === 1 ? "Auftrag" : "Aufträge"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 mr-1.5">Frei</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/50 hover:text-foreground hover:bg-muted rounded-lg"
                            onClick={() => {
                              setEditingId(emp.id);
                              setEditState({ name: emp.name, role: emp.role || "", phone: emp.phone || "" });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => setPendingDelete(emp)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {isEditing && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            onClick={() => {
                              if (editState.name.trim()) {
                                updateEmployee(emp.id, {
                                  name: editState.name.trim(),
                                  role: editState.role.trim(),
                                  phone: editState.phone.trim(),
                                });
                              }
                              setEditingId(null);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/50 hover:text-foreground hover:bg-muted rounded-lg"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDelete?.name}</strong> wird dauerhaft aus dem Team entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (pendingDelete) removeEmployee(pendingDelete.id); setPendingDelete(null); }}
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Mitarbeiter;
