import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, User, Calendar, FileText, MessageSquare, Tag, CalendarClock } from "lucide-react";
import type { Order } from "@/data/mockOrders";
import { formatDate } from "@/lib/formatDate";

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityLabel: Record<string, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

const priorityStyle: Record<string, string> = {
  hoch: "bg-urgent/15 text-urgent border-urgent/30",
  mittel: "bg-warning/15 text-warning border-warning/30",
  niedrig: "bg-success/15 text-success border-success/30",
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0">
      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="text-sm mt-0.5 text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm text-muted-foreground">{order.id}</span>
            <Badge
              variant="outline"
              className={`text-xs ${priorityStyle[order.priority] ?? ""}`}
            >
              {priorityLabel[order.priority] ?? order.priority}
            </Badge>
          </div>
          <DialogTitle className="text-base mt-1">{order.customerName}</DialogTitle>
        </DialogHeader>

        <div className="-mx-1 px-1 divide-y divide-border">
          <DetailRow icon={MapPin} label="Adresse" value={order.address} />
          {order.phone && <DetailRow icon={Phone} label="Telefon" value={order.phone} />}
          <DetailRow icon={Tag} label="Kategorie" value={order.category} />
          <DetailRow
            icon={Calendar}
            label="Termin"
            value={order.scheduledAt ? formatDate(order.scheduledAt) : <span className="text-muted-foreground">Kein Termin</span>}
          />
          <DetailRow icon={CalendarClock} label="Eingang" value={formatDate(order.receivedAt)} />
          <DetailRow icon={FileText} label="Problembeschreibung" value={
            <p className="leading-relaxed text-sm">{order.description}</p>
          } />
          {order.assignedTo && (
            <DetailRow icon={User} label="Zugewiesen an" value={order.assignedTo} />
          )}
          {order.notes && (
            <DetailRow icon={MessageSquare} label="Notizen" value={
              <p className="leading-relaxed text-sm text-muted-foreground italic">{order.notes}</p>
            } />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
