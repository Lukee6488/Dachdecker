import { useState, useMemo } from "react";
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
import type { Lead, LeadStatus } from "@/data/mockOrders";
import { LEAD_KATEGORIEN } from "@/data/mockOrders";
import { OrderDetailSheet } from "@/components/OrderDetailSheet";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface LeadsTableProps {
  orders: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onUpdate?: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onDelete?: (leadId: string) => void;
  onAssignPM?: never;
  hiddenColumns?: string[];
  isArchive?: boolean;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  "Neu":            { label: "Neu",            className: "bg-amber-50 text-amber-700 border-amber-200" },
  "In Bearbeitung": { label: "In Bearbeitung", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "Kontaktiert":    { label: "Kontaktiert",    className: "bg-violet-50 text-violet-700 border-violet-200" },
  "Abgeschlossen":  { label: "Abgeschlossen",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const quelleConfig: Record<string, { label: string; className: string }> = {
  Voice: { label: "🎙 Voice", className: "bg-orange-50 text-orange-700 border-orange-200" },
  Mail:  { label: "✉ Mail",  className: "bg-sky-50 text-sky-700 border-sky-200" },
};

export function OrdersTable({
  orders,
  onStatusChange,
  onUpdate,
  onDelete,
  isArchive = false,
}: LeadsTableProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [quelleFilter, setQuelleFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(q) || (l.kontakt ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all")   result = result.filter((l) => l.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((l) => l.kategorie === categoryFilter);
    if (quelleFilter !== "all")   result = result.filter((l) => l.quelle === quelleFilter);
    if (sortMode === "oldest") result.sort((a, b) => +new Date(a.datum) - +new Date(b.datum));
    else                       result.sort((a, b) => +new Date(b.datum) - +new Date(a.datum));
    return result;
  }, [orders, statusFilter, categoryFilter, quelleFilter, sortMode, search]);

  const hasFilters = search || statusFilter !== "all" || categoryFilter !== "all" || quelleFilter !== "all";

  return (
    <>
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Name, Kontakt …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm bg-card"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40 text-sm bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="Neu">Neu</SelectItem>
              <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="Kontaktiert">Kontaktiert</SelectItem>
              {isArchive && <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-44 text-sm bg-card">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {LEAD_KATEGORIEN.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={quelleFilter} onValueChange={setQuelleFilter}>
            <SelectTrigger className="h-9 w-32 text-sm bg-card">
              <SelectValue placeholder="Kanal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kanäle</SelectItem>
              <SelectItem value="Voice">Voice</SelectItem>
              <SelectItem value="Mail">Mail</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={setSortMode}>
            <SelectTrigger className="h-9 w-40 text-sm bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Neueste zuerst</SelectItem>
              <SelectItem value="oldest">Älteste zuerst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontakt</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorie</TableHead>
                <TableHead className="hidden md:table-cell text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kanal</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eingang</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-40">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const sc = statusConfig[lead.status];
                const qc = lead.quelle ? quelleConfig[lead.quelle] : null;
                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-medium text-sm">
                      {lead.name || <span className="text-muted-foreground italic">Kein Name</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[140px] truncate">
                      {lead.kontakt ?? <span className="italic opacity-40">–</span>}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-muted/40">
                        {lead.kategorie}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {qc ? (
                        <Badge variant="outline" className={cn("text-[10px] font-medium", qc.className)}>
                          {qc.label}
                        </Badge>
                      ) : <span className="text-muted-foreground/40">–</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(lead.datum), "dd.MM.yy HH:mm", { locale: de })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={lead.status} onValueChange={(v) => onStatusChange(lead.id, v as LeadStatus)}>
                        <SelectTrigger className={cn("h-7 text-xs w-40 border", sc.className)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Neu">Neu</SelectItem>
                          <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                          <SelectItem value="Kontaktiert">Kontaktiert</SelectItem>
                          <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                        <PackageOpen className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Keine Leads gefunden</p>
                      {hasFilters && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 mt-1"
                          onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setQuelleFilter("all"); }}>
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
            {filtered.length} {filtered.length === 1 ? "Lead" : "Leads"}
            {orders.length !== filtered.length && ` von ${orders.length}`}
          </p>
        )}
      </div>

      <OrderDetailSheet
        order={selectedLead ? (orders.find((l) => l.id === selectedLead.id) ?? null) : null}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdate={onUpdate}
        onStatusChange={onStatusChange}
        onDeleteRequest={(leadId) => {
          const lead = orders.find((l) => l.id === leadId) ?? null;
          setPendingDelete(lead);
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lead löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDelete?.name}</strong> wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) onDelete?.(pendingDelete.id);
                setPendingDelete(null);
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
