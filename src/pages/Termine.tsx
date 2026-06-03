import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTermine, type TerminStatus, type Termin } from "@/context/TermineContext";
import { useLeads } from "@/context/LeadsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  ChevronLeft, ChevronRight, Plus, Clock, Phone, Trash2, Pencil, Check, X, CalendarDays,
} from "lucide-react";
import {
  format, addWeeks, subWeeks, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, parseISO, isToday, addHours,
} from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LEAD_KATEGORIEN } from "@/data/mockOrders";

const STATUS_COLORS: Record<TerminStatus, string> = {
  "Angefragt":  "bg-amber-100 border-amber-300 text-amber-800",
  "Bestätigt":  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "Abgesagt":   "bg-rose-100 border-rose-300 text-rose-700 line-through opacity-70",
  "Erledigt":   "bg-slate-100 border-slate-300 text-slate-600 opacity-80",
};

const HOURS = Array.from({ length: 10 }, (_, i) => i + 7); // 07:00–16:00
const SLOT_H = 64; // px per hour

function parseHM(timeStr: string): { h: number; m: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

function durationToHours(dauer: string): number {
  const parts = dauer.split(":").map(Number);
  return (parts[0] ?? 1) + (parts[1] ?? 0) / 60;
}

interface TerminFormData {
  name: string;
  kontakt: string;
  kategorie: string;
  datum: string;
  uhrzeit: string;
  dauer: string;
  notiz: string;
  status: TerminStatus;
}

const DEFAULT_FORM: TerminFormData = {
  name: "", kontakt: "", kategorie: "", datum: "", uhrzeit: "08:00",
  dauer: "01:00:00", notiz: "", status: "Angefragt",
};

function TerminForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: TerminFormData;
  onSave: (d: TerminFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof TerminFormData) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs font-medium">Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Vor- und Nachname" className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Kontakt</Label>
          <Input value={form.kontakt} onChange={(e) => set("kontakt")(e.target.value)} placeholder="+49 …" className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Kategorie</Label>
          <Select value={form.kategorie} onValueChange={set("kategorie")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Wählen…" /></SelectTrigger>
            <SelectContent>
              {LEAD_KATEGORIEN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Datum *</Label>
          <Input type="date" value={form.datum} onChange={(e) => set("datum")(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Uhrzeit *</Label>
          <Input type="time" value={form.uhrzeit} onChange={(e) => set("uhrzeit")(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Dauer</Label>
          <Select value={form.dauer} onValueChange={set("dauer")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="00:30:00">30 min</SelectItem>
              <SelectItem value="01:00:00">1 Stunde</SelectItem>
              <SelectItem value="01:30:00">1,5 Stunden</SelectItem>
              <SelectItem value="02:00:00">2 Stunden</SelectItem>
              <SelectItem value="03:00:00">3 Stunden</SelectItem>
              <SelectItem value="04:00:00">4 Stunden</SelectItem>
              <SelectItem value="08:00:00">Ganztag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status")(v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Angefragt">Angefragt</SelectItem>
              <SelectItem value="Bestätigt">Bestätigt</SelectItem>
              <SelectItem value="Abgesagt">Abgesagt</SelectItem>
              <SelectItem value="Erledigt">Erledigt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs font-medium">Notiz</Label>
          <Textarea value={form.notiz} onChange={(e) => set("notiz")(e.target.value)} rows={2} className="text-sm resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Abbrechen</Button>
        <Button type="button" size="sm" onClick={() => { if (form.name && form.datum && form.uhrzeit) onSave(form); }}>Speichern</Button>
      </div>
    </div>
  );
}

export default function Termine() {
  const { termine, addTermin, updateTermin, deleteTermin } = useTermine();
  const { leads } = useLeads();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<Partial<TerminFormData>>({});
  const [editTermin, setEditTermin] = useState<Termin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Termin | null>(null);

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }),
    [weekStart]
  );

  const weekLabel = useMemo(() =>
    `${format(weekStart, "d. MMM", { locale: de })} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d. MMM yyyy", { locale: de })}`,
    [weekStart]
  );

  const terminsByDay = useMemo(() => {
    const map = new Map<string, Termin[]>();
    for (const t of termine) {
      if (!map.has(t.datum)) map.set(t.datum, []);
      map.get(t.datum)!.push(t);
    }
    return map;
  }, [termine]);

  const openAddOnDay = (day: Date) => {
    setAddPreset({ datum: format(day, "yyyy-MM-dd") });
    setAddOpen(true);
  };

  const handleAdd = async (form: TerminFormData) => {
    await addTermin({
      lead_id: null,
      name: form.name,
      kontakt: form.kontakt || null,
      kategorie: form.kategorie || null,
      datum: form.datum,
      uhrzeit: form.uhrzeit,
      dauer: form.dauer,
      notiz: form.notiz || null,
      status: form.status,
    });
    setAddOpen(false);
  };

  const handleEdit = async (form: TerminFormData) => {
    if (!editTermin) return;
    await updateTermin(editTermin.id, {
      name: form.name,
      kontakt: form.kontakt || null,
      kategorie: form.kategorie || null,
      datum: form.datum,
      uhrzeit: form.uhrzeit,
      dauer: form.dauer,
      notiz: form.notiz || null,
      status: form.status,
    });
    setEditTermin(null);
  };

  // Quick status cycling
  const cycleStatus = (t: Termin) => {
    const order: TerminStatus[] = ["Angefragt", "Bestätigt", "Erledigt", "Abgesagt"];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    updateTermin(t.id, { status: next });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Termine</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Wochenkalender · {weekLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Heute
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => { setAddPreset({}); setAddOpen(true); }}>
              <Plus className="h-3.5 w-3.5" />
              Termin
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid border-b" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
            <div className="border-r bg-muted/30" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "px-2 py-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/30 transition-colors",
                  isToday(day) && "bg-primary/5"
                )}
                onClick={() => openAddOnDay(day)}
              >
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {format(day, "EEE", { locale: de })}
                </p>
                <p className={cn(
                  "text-sm font-semibold mt-0.5",
                  isToday(day) ? "text-primary" : "text-foreground"
                )}>
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
            <div className="grid relative" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
              {/* Hour labels */}
              <div className="border-r">
                {HOURS.map((h) => (
                  <div key={h} style={{ height: SLOT_H }} className="border-b border-border/40 flex items-start justify-end pr-2 pt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{h}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayTermine = terminsByDay.get(dayKey) ?? [];
                const isSunday = day.getDay() === 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-r last:border-r-0 relative cursor-pointer",
                      isSunday && "bg-muted/20"
                    )}
                    style={{ minHeight: HOURS.length * SLOT_H }}
                    onClick={() => openAddOnDay(day)}
                  >
                    {/* Hour lines */}
                    {HOURS.map((h) => (
                      <div key={h} style={{ height: SLOT_H }} className="border-b border-border/40" />
                    ))}

                    {/* Termine */}
                    {dayTermine.map((t) => {
                      const { h, m } = parseHM(t.uhrzeit);
                      const top = (h - HOURS[0] + m / 60) * SLOT_H;
                      const height = Math.max(durationToHours(t.dauer) * SLOT_H - 2, 20);
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-md border px-1.5 py-1 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow",
                            STATUS_COLORS[t.status]
                          )}
                          style={{ top: top + 1, height }}
                          onClick={(e) => { e.stopPropagation(); setEditTermin(t); }}
                        >
                          <p className="text-[11px] font-semibold leading-tight truncate">{t.name}</p>
                          <p className="text-[10px] leading-tight opacity-70">{t.uhrzeit.slice(0, 5)}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-1">
          {(Object.entries(STATUS_COLORS) as [TerminStatus, string][]).map(([status, cls]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded border", cls.split(" ").slice(0, 2).join(" "))} />
              <span className="text-xs text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>

        {/* Upcoming list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Nächste Termine</h2>
          <div className="space-y-1">
            {termine
              .filter((t) => {
                const d = parseISO(t.datum);
                return d >= new Date(new Date().setHours(0, 0, 0, 0));
              })
              .slice(0, 8)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 hover:bg-muted/20 transition-colors"
                >
                  <div className={cn("w-1 self-stretch rounded-full", t.status === "Bestätigt" ? "bg-emerald-500" : t.status === "Abgesagt" ? "bg-rose-400" : t.status === "Erledigt" ? "bg-slate-300" : "bg-amber-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3 inline mr-0.5" />
                        {format(parseISO(t.datum), "EEE d. MMM", { locale: de })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-0.5" />
                        {t.uhrzeit.slice(0, 5)} Uhr
                      </span>
                      {t.kontakt && (
                        <span className="text-xs text-muted-foreground truncate">
                          <Phone className="h-3 w-3 inline mr-0.5" />{t.kontakt}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] cursor-pointer select-none shrink-0", STATUS_COLORS[t.status])}
                    onClick={() => cycleStatus(t)}
                    title="Klicken um Status zu ändern"
                  >
                    {t.status}
                  </Badge>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setEditTermin(t)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            {termine.filter((t) => parseISO(t.datum) >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && (
              <div className="rounded-xl border bg-card p-10 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Keine bevorstehenden Termine</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Neuen Termin anlegen</DialogTitle>
          </DialogHeader>
          <TerminForm
            initial={{ ...DEFAULT_FORM, ...addPreset }}
            onSave={handleAdd}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTermin} onOpenChange={(o) => !o && setEditTermin(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Termin bearbeiten</DialogTitle>
          </DialogHeader>
          {editTermin && (
            <TerminForm
              initial={{
                name: editTermin.name,
                kontakt: editTermin.kontakt ?? "",
                kategorie: editTermin.kategorie ?? "",
                datum: editTermin.datum,
                uhrzeit: editTermin.uhrzeit,
                dauer: editTermin.dauer,
                notiz: editTermin.notiz ?? "",
                status: editTermin.status,
              }}
              onSave={handleEdit}
              onCancel={() => setEditTermin(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> am {deleteTarget ? format(parseISO(deleteTarget.datum), "d. MMMM yyyy", { locale: de }) : ""} wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteTarget) deleteTermin(deleteTarget.id); setDeleteTarget(null); }}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
