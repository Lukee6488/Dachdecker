import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useOrders } from "@/context/OrdersContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Users, Plus, X, Eye, EyeOff, Trash2, UserPlus } from "lucide-react";
import { ORDER_CATEGORIES } from "@/data/mockOrders";
import { cn } from "@/lib/utils";

interface PMProfile {
  id: string;
  display_name: string;
  categories: string[];
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const statusLabel: Record<string, string> = {
  open:        "Offen",
  in_progress: "In Bearbeitung",
  done:        "Erledigt",
};
const statusClass: Record<string, string> = {
  open:        "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  done:        "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const priorityClass: Record<string, string> = {
  hoch:    "bg-rose-50 text-rose-700 border-rose-200",
  mittel:  "bg-amber-50 text-amber-700 border-amber-200",
  niedrig: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const priorityLabel: Record<string, string> = {
  hoch: "Hoch", mittel: "Mittel", niedrig: "Niedrig",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Projektleiter() {
  const { orders, assignToPM } = useOrders();

  const [pms, setPms]               = useState<PMProfile[]>([]);
  const [loadingPMs, setLoadingPMs] = useState(true);
  const [addOpen, setAddOpen]       = useState(false);
  const [assignTarget, setAssignTarget] = useState<PMProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PMProfile | null>(null);

  // Add-form state
  const [email,        setEmail]        = useState("");
  const [name,         setName]         = useState("");
  const [password,     setPassword]     = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [busy,         setBusy]         = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);

  const adminReady = true;

  const loadPMs = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, categories")
      .eq("role", "project_manager");
    setPms((data ?? []) as PMProfile[]);
    setLoadingPMs(false);
  };

  useEffect(() => { loadPMs(); }, []);

  const unassignedOrders = useMemo(
    () => orders.filter((o) => !o.pmUserId && o.status !== "done"),
    [orders]
  );

  const ordersForPM = (pmId: string) =>
    orders.filter((o) => o.pmUserId === pmId && o.status !== "done");

  // ── Add PM ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setEmail(""); setName(""); setPassword("");
    setShowPw(false); setSelectedCats([]); setFormError(null);
  };

  const handleAdd = async () => {
    if (!email.trim() || !name.trim() || !password) return;
    setBusy(true);
    setFormError(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "POST",
        body: {
          email:        email.trim().toLowerCase(),
          password,
          display_name: name.trim(),
          categories:   selectedCats,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAddOpen(false);
      resetForm();
      await loadPMs();
    } catch (e: any) {
      setFormError(e?.message ?? "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  };

  // ── Delete PM ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "DELETE",
        body: { userId: deleteTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDeleteTarget(null);
      await loadPMs();
    } catch (e) {
      console.error("Delete PM error:", e);
    } finally {
      setBusy(false);
    }
  };

  const toggleCat = (cat: string) =>
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projektleiter</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Auftragsübersicht und Verwaltung
            </p>
          </div>
          {adminReady ? (
            <Button size="sm" className="h-8 gap-1.5" onClick={() => { resetForm(); setAddOpen(true); }}>
              <UserPlus className="h-4 w-4" />
              Projektleiter hinzufügen
            </Button>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 max-w-xs text-center">
              Service Role Key in <code>.env</code> fehlt
            </p>
          )}
        </div>

        {/* PM list */}
        {loadingPMs ? (
          <div className="rounded-xl border bg-card p-10 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : pms.length === 0 ? (
          <div className="rounded-xl border bg-card p-16 text-center shadow-sm">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">Keine Projektleiter</p>
            <p className="text-sm text-muted-foreground mt-1">
              Lege deinen ersten Projektleiter an.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pms.map((pm, idx) => {
              const pmOrders = ordersForPM(pm.id);
              const color    = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const cats     = pm.categories ?? [];

              return (
                <div key={pm.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  {/* PM header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
                    <div className={`h-9 w-9 rounded-full ${color} flex items-center justify-center text-sm font-bold shrink-0 select-none`}>
                      {initials(pm.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{pm.display_name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {cats.length === 0 ? (
                          <span className="text-xs text-muted-foreground/50 italic">Keine Kategorien</span>
                        ) : cats.map((cat) => (
                          <span key={cat} className="inline-flex items-center rounded-md border px-1.5 py-0 text-[10px] font-medium text-muted-foreground bg-muted/40">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground mr-1">
                        {pmOrders.length} aktiv
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setAssignTarget(pm)}
                        disabled={unassignedOrders.length === 0}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Auftrag zuweisen
                      </Button>
                      {adminReady && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(pm)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Assigned orders */}
                  {pmOrders.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground/60 italic">
                      Keine aktiven Aufträge zugewiesen.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {pmOrders.map((order) => (
                        <div key={order.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {order.address} · {order.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className={`text-[11px] ${priorityClass[order.priority]}`}>
                              {priorityLabel[order.priority]}
                            </Badge>
                            <Badge variant="outline" className={`text-[11px] ${statusClass[order.status]}`}>
                              {statusLabel[order.status]}
                            </Badge>
                            <button
                              onClick={() => assignToPM(order.id, null)}
                              className="ml-1 h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Zuweisung entfernen"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Unassigned hint */}
        {unassignedOrders.length > 0 && (
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {unassignedOrders.length} nicht zugewiesene{" "}
              {unassignedOrders.length === 1 ? "Auftrag" : "Aufträge"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Klicke auf „Auftrag zuweisen" um sie einem Projektleiter zuzuteilen.
            </p>
          </div>
        )}
      </div>

      {/* ── Add PM Dialog ─────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { resetForm(); } setAddOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Projektleiter hinzufügen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pm-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name (Anzeigename)
              </Label>
              <Input
                id="pm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                disabled={busy}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="pm-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-Mail
              </Label>
              <Input
                id="pm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@beispiel.de"
                disabled={busy}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="pm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="pm-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy}
                  className="pr-9"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kategorien
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {ORDER_CATEGORIES.map((cat) => {
                  const checked = selectedCats.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleCat(cat)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                        checked
                          ? "bg-primary/10 border-primary/40 text-primary font-medium"
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      <div className={cn(
                        "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                        checked ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {checked && (
                          <svg viewBox="0 0 10 8" fill="none" className="h-2 w-2">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="truncate text-xs">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formError && (
              <p className="text-xs text-rose-500 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setAddOpen(false); }} disabled={busy}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAdd}
              disabled={busy || !name.trim() || !email.trim() || !password}
            >
              {busy ? "Wird angelegt…" : "Anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign order Dialog ───────────────────────────────────────── */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Auftrag zuweisen an {assignTarget?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {unassignedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Keine nicht zugewiesenen Aufträge vorhanden.
              </p>
            ) : (
              unassignedOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => { assignToPM(order.id, assignTarget!.id); setAssignTarget(null); }}
                  className="w-full text-left rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{order.address}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{order.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={`text-[11px] ${priorityClass[order.priority]}`}>
                        {priorityLabel[order.priority]}
                      </Badge>
                      <Badge variant="outline" className={`text-[11px] ${statusClass[order.status]}`}>
                        {statusLabel[order.status]}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projektleiter entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.display_name}</strong> wird dauerhaft gelöscht. Der Benutzer
              kann sich danach nicht mehr anmelden. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? "Wird gelöscht…" : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
