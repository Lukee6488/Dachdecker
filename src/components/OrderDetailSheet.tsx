import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Phone, FileText, MessageSquare, Tag, CalendarClock,
  Pencil, X, Check, Trash2, Radio, Mail,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { Lead, LeadStatus, LeadKategorie, LeadQuelle } from "@/data/mockOrders";
import { LEAD_KATEGORIEN } from "@/data/mockOrders";
import { cn } from "@/lib/utils";

interface LeadDetailSheetProps {
  order: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onAssignPM?: never;
  onDeleteRequest?: (leadId: string) => void;
  logs?: never[];
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  "Neu":             { label: "Neu",            className: "bg-amber-50 text-amber-700 border-amber-200" },
  "In Bearbeitung":  { label: "In Bearbeitung", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "Kontaktiert":     { label: "Kontaktiert",    className: "bg-violet-50 text-violet-700 border-violet-200" },
  "Abgeschlossen":   { label: "Abgeschlossen",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
  onDeleteRequest,
}: LeadDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (order) {
      setDraft({
        name: order.name,
        kontakt: order.kontakt,
        kategorie: order.kategorie,
        quelle: order.quelle,
        nachricht: order.nachricht,
      });
    }
    setEditing(false);
  }, [order?.id]);

  if (!order) return null;

  const status = statusConfig[order.status];

  const handleSave = async () => {
    if (!onUpdate) return;
    await onUpdate(order.id, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({
      name: order.name,
      kontakt: order.kontakt,
      kategorie: order.kategorie,
      quelle: order.quelle,
      nachricht: order.nachricht,
    });
    setEditing(false);
  };

  const quelleIcon = order.quelle === "Mail" ? Mail : Radio;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 pr-14 shrink-0">
          <SheetHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {order.id.slice(0, 8)}
              </span>
              {status && (
                <Badge variant="outline" className={cn("text-[11px] font-medium", status.className)}>
                  {status.label}
                </Badge>
              )}
              {order.quelle && (
                <Badge variant="outline" className="text-[11px] font-medium bg-slate-50 text-slate-600 border-slate-200">
                  {order.quelle === "Voice" ? "🎙 Voice" : "✉ Mail"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <Input
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="h-8 text-sm font-semibold flex-1"
                />
              ) : (
                <SheetTitle className="text-base font-semibold leading-tight flex-1">
                  {order.name}
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { onDeleteRequest(order.id); onOpenChange(false); }}
                  >
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
              <Select value={order.status} onValueChange={(v) => onStatusChange(order.id, v as LeadStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Neu">Neu</SelectItem>
                  <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="Kontaktiert">Kontaktiert</SelectItem>
                  <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fields — edit mode */}
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />Kontakt
                </Label>
                <Input
                  value={draft.kontakt ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, kontakt: e.target.value || null }))}
                  placeholder="Telefon oder E-Mail"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Kategorie</Label>
                  <Select value={draft.kategorie} onValueChange={(v) => setDraft((d) => ({ ...d, kategorie: v as LeadKategorie }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_KATEGORIEN.map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Eingangskanal</Label>
                  <Select value={draft.quelle ?? "Voice"} onValueChange={(v) => setDraft((d) => ({ ...d, quelle: v as LeadQuelle }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Voice">Voice</SelectItem>
                      <SelectItem value="Mail">Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />Nachricht
                </Label>
                <Textarea
                  value={draft.nachricht ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, nachricht: e.target.value || null }))}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {order.kontakt && <Field icon={Phone} label="Kontakt">{order.kontakt}</Field>}
              <Field icon={Tag} label="Kategorie">
                <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-muted/40 text-muted-foreground">
                  {order.kategorie}
                </span>
              </Field>
              <Field icon={quelleIcon} label="Eingangskanal">
                {order.quelle ?? <span className="text-muted-foreground italic">Unbekannt</span>}
              </Field>
              <Field icon={CalendarClock} label="Eingangsdatum">
                {format(parseISO(order.datum), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de })}
              </Field>
              {order.nachricht && (
                <div className="border-t pt-3">
                  <Field icon={FileText} label="Nachricht">
                    <p className="leading-relaxed text-sm text-foreground/80 whitespace-pre-line">{order.nachricht}</p>
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
