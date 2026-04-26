import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  MapPin, Phone, Calendar as CalendarIcon, FileText,
  MessageSquare, Tag, CalendarClock, Pencil, X, Check, History, Trash2, Building2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { Order, OrderStatus, OrderPriority, OrderCategory } from "@/data/mockOrders";
import { ORDER_CATEGORIES } from "@/data/mockOrders";
import type { OrderLog } from "@/context/OrdersContext";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

interface PMProfile { id: string; display_name: string; }

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (orderId: string, updates: Partial<Order>) => void;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  onAssignPM?: (orderId: string, pmUserId: string | null) => void;
  onDeleteRequest?: (orderId: string) => void;
  logs?: OrderLog[];
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  hoch: { label: "Hoch", className: "bg-rose-50 text-rose-700 border-rose-200" },
  mittel: { label: "Mittel", className: "bg-amber-50 text-amber-700 border-amber-200" },
  niedrig: { label: "Niedrig", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Offen", className: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { label: "In Bearbeitung", className: "bg-blue-50 text-blue-700 border-blue-200" },
  done: { label: "Erledigt", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function Field({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}


export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onAssignPM,
  onDeleteRequest,
  logs = [],
}: OrderDetailSheetProps) {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Order>>({});
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pmProfiles, setPmProfiles] = useState<PMProfile[]>([]);

  useEffect(() => {
    if (profile?.role !== "secretary") return;
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("role", "project_manager")
      .neq("display_name", "Projektleiter 2")
      .then(({ data }) => { if (data) setPmProfiles(data as PMProfile[]); });
  }, [profile?.role]);

  useEffect(() => {
    if (order) {
      setDraft({
        customerName: order.customerName,
        firma: order.firma,
        address: order.address,
        phone: order.phone,
        priority: order.priority,
        category: order.category,
        description: order.description,
        notes: order.notes,
        scheduledAt: order.scheduledAt,
      });
      setScheduledDate(order.scheduledAt ? parseISO(order.scheduledAt) : undefined);
      setScheduledTime(order.scheduledAt ? format(parseISO(order.scheduledAt), "HH:mm") : "");
    }
    setEditing(false);
  }, [order?.id]);

  if (!order) return null;

  const prio = priorityConfig[order.priority];
  const status = statusConfig[order.status];
  const handleSave = () => {
    if (!onUpdate) return;
    let scheduledAt: string | null = null;
    if (scheduledDate) {
      const combined = new Date(scheduledDate);
      if (scheduledTime) {
        const [h, m] = scheduledTime.split(":").map(Number);
        combined.setHours(h, m, 0, 0);
      }
      scheduledAt = combined.toISOString();
    }
    onUpdate(order.id, { ...draft, scheduledAt });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({
      customerName: order.customerName,
      firma: order.firma,
      address: order.address,
      phone: order.phone,
      priority: order.priority,
      category: order.category,
      description: order.description,
      notes: order.notes,
      scheduledAt: order.scheduledAt,
    });
    setScheduledDate(order.scheduledAt ? parseISO(order.scheduledAt) : undefined);
    setScheduledTime(order.scheduledAt ? format(parseISO(order.scheduledAt), "HH:mm") : "");
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        {/* Header — pr-14 clears the built-in Sheet close button */}
        <div className="border-b px-6 py-4 pr-14 shrink-0">
          <SheetHeader className="space-y-2 text-left">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {order.id}
              </span>
              {prio && (
                <Badge variant="outline" className={cn("text-[11px] font-medium", prio.className)}>
                  {prio.label}
                </Badge>
              )}
              {status && (
                <Badge variant="outline" className={cn("text-[11px] font-medium", status.className)}>
                  {status.label}
                </Badge>
              )}
            </div>

            {/* Title row — edit button sits here, well below the X */}
            <div className="flex items-center gap-2">
              {editing ? (
                <Input
                  value={draft.customerName ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, customerName: e.target.value }))}
                  className="h-8 text-sm font-semibold flex-1"
                />
              ) : (
                <SheetTitle className="text-base font-semibold leading-tight flex-1">
                  {order.customerName}
                </SheetTitle>
              )}
              <div className="flex gap-1 shrink-0">
                {onUpdate && (
                  editing ? (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={handleCancel}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" className="h-7 w-7" onClick={handleSave}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )
                )}
                {onDeleteRequest && !editing && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { onDeleteRequest(order.id); onOpenChange(false); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Status */}
          {onStatusChange && (
            <div className="space-y-1 pb-3 border-b">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</p>
              <Select value={order.status} onValueChange={(v) => onStatusChange(order.id, v as OrderStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="done">Erledigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* PM assignment (secretary only) */}
          {onAssignPM && profile?.role === "secretary" && (
            <div className="space-y-1.5 pb-3 border-b">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Projektleiter</p>
              {pmProfiles.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Keine Projektleiter angelegt</p>
              ) : (
                <div className="space-y-0.5">
                  <button
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2 py-1.5 rounded hover:bg-muted text-sm transition-colors",
                    )}
                    onClick={() => onAssignPM(order.id, null)}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      !order.pmUserId ? "bg-primary border-primary" : "border-input"
                    )}>
                      {!order.pmUserId && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <span className="text-muted-foreground italic truncate">Kein Projektleiter</span>
                  </button>
                  {pmProfiles.map((pm) => (
                    <button
                      key={pm.id}
                      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded hover:bg-muted text-sm transition-colors"
                      onClick={() => onAssignPM(order.id, pm.id)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        order.pmUserId === pm.id ? "bg-primary border-primary" : "border-input"
                      )}>
                        {order.pmUserId === pm.id && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className="truncate">{pm.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fields */}
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  Firma
                </Label>
                <Input value={draft.firma ?? ""} onChange={(e) => setDraft((d) => ({ ...d, firma: e.target.value || null }))} placeholder="Firmenname (optional)" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />Adresse
                </Label>
                <Input value={draft.address ?? ""} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />Telefon
                </Label>
                <Input value={draft.phone ?? ""} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dringlichkeit</Label>
                  <Select value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as OrderPriority }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="hoch">Hoch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Kategorie</Label>
                  <Select value={draft.category} onValueChange={(v) => setDraft((d) => ({ ...d, category: v as OrderCategory }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />Termin
                </Label>
                <div className="flex gap-2">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 h-8 justify-start text-sm font-normal", !scheduledDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                        {scheduledDate ? format(scheduledDate, "dd.MM.yyyy", { locale: de }) : "Kein Termin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={scheduledDate} onSelect={(d) => { setScheduledDate(d); setDatePickerOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="h-8 w-28 text-sm"
                    disabled={!scheduledDate}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-muted-foreground" />Problembeschreibung
                </Label>
                <Textarea value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={3} className="text-sm resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />Notizen
                </Label>
                <Textarea value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} rows={2} className="text-sm resize-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {order.firma && <Field icon={Building2} label="Firma">{order.firma}</Field>}
              <Field icon={MapPin} label="Adresse">{order.address}</Field>
              {order.phone && <Field icon={Phone} label="Telefon">{order.phone}</Field>}
              <Field icon={Tag} label="Kategorie">
                <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-muted/40 text-muted-foreground">
                  {order.category}
                </span>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field icon={CalendarIcon} label="Termin">
                  {order.scheduledAt
                    ? <span className="font-medium">{formatDate(order.scheduledAt)}</span>
                    : <span className="text-muted-foreground italic">Kein Termin</span>}
                </Field>
                <Field icon={CalendarClock} label="Eingang">
                  {formatDate(order.receivedAt)}
                </Field>
              </div>
              <div className="border-t pt-3">
                <Field icon={FileText} label="Problembeschreibung">
                  <p className="leading-relaxed text-sm text-foreground/80 whitespace-pre-line">{order.description}</p>
                </Field>
              </div>
              {order.notes && (
                <Field icon={MessageSquare} label="Notizen">
                  <p className="leading-relaxed text-sm text-muted-foreground italic">{order.notes}</p>
                </Field>
              )}
            </div>
          )}

          {/* Verlauf */}
          {logs.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Verlauf</p>
              </div>
              <div className="space-y-2">
                {[...logs].reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-foreground/80">{entry.action}</span>
                      <span className="text-muted-foreground ml-2">
                        {format(parseISO(entry.time), "dd.MM. HH:mm", { locale: de })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
