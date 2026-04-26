import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Order, OrderPriority, OrderCategory } from "@/data/mockOrders";
import { ORDER_CATEGORIES } from "@/data/mockOrders";

interface AddOrderDialogProps {
  onAdd: (order: Order) => void;
}

const REQUIRED = <span className="text-destructive ml-0.5">*</span>;

export function AddOrderDialog({ onAdd }: AddOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [firma, setFirma] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("mittel");
  const [category, setCategory] = useState<OrderCategory>("Starkstrom");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setCustomerName(""); setFirma(""); setAddress(""); setPhone("");
    setPriority("mittel"); setCategory("Starkstrom");
    setDescription(""); setNotes("");
    setScheduledDate(undefined); setScheduledTime("");
    setSubmitted(false);
  };

  // Field-level error helpers (only shown after first submit attempt)
  const err = (condition: boolean) =>
    submitted && condition ? "border-destructive focus-visible:ring-destructive" : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Manual validation for fields not covered by HTML `required`
    if (!scheduledDate || !scheduledTime) return;

    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduledAt = new Date(
      scheduledDate.getFullYear(),
      scheduledDate.getMonth(),
      scheduledDate.getDate(),
      hours,
      minutes,
      0,
    ).toISOString();

    const id = `A-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    onAdd({
      id,
      customerName: customerName.trim(),
      firma: firma.trim() || null,
      address: address.trim(),
      phone: phone.trim(),
      priority,
      status: "open",
      receivedAt: new Date().toISOString(),
      scheduledAt,
      description: description.trim(),
      assignedTo: null,
      notes: notes.trim(),
      category,
    });
    reset();
    setOpen(false);
  };

  const dateError = submitted && !scheduledDate;
  const timeError = submitted && !scheduledTime;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          Neuer Auftrag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Neuen Auftrag anlegen</DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Felder mit <span className="text-destructive font-medium">*</span> sind Pflichtfelder.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>

          {/* Kundenname + Telefon */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerName" className="text-xs font-medium">
                Kundenname {REQUIRED}
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Max Mustermann"
                required
                className={cn("h-9 text-sm", err(!customerName.trim()))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Telefon {REQUIRED}
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 …"
                required
                className={cn("h-9 text-sm", err(!phone.trim()))}
              />
            </div>
          </div>

          {/* Firma */}
          <div className="space-y-1.5">
            <Label htmlFor="firma" className="text-xs font-medium">
              Firma <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="firma"
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              placeholder="Firmenname"
              className="h-9 text-sm"
            />
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-medium">
              Adresse {REQUIRED}
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Musterstraße 1, 12345 Musterstadt"
              required
              className={cn("h-9 text-sm", err(!address.trim()))}
            />
          </div>

          {/* Dringlichkeit + Kategorie */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Dringlichkeit {REQUIRED}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as OrderPriority)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="niedrig">Niedrig</SelectItem>
                  <SelectItem value="mittel">Mittel</SelectItem>
                  <SelectItem value="hoch">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kategorie {REQUIRED}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as OrderCategory)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Termin + Uhrzeit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Termin {REQUIRED}
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal text-sm",
                      !scheduledDate && "text-muted-foreground",
                      dateError && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                    {scheduledDate ? format(scheduledDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(d) => { setScheduledDate(d); setDatePickerOpen(false); }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {dateError && <p className="text-[11px] text-destructive">Bitte Datum wählen</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduledTime" className="text-xs font-medium">
                Uhrzeit {REQUIRED}
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className={cn("h-9 text-sm", timeError && "border-destructive")}
              />
              {timeError && <p className="text-[11px] text-destructive">Bitte Uhrzeit eingeben</p>}
            </div>
          </div>

          {/* Problembeschreibung (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Problembeschreibung{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Was ist das Problem?"
              className="text-sm resize-none"
            />
          </div>

          {/* Notizen (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Notizen{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Interne Hinweise …"
              className="text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" size="sm">Auftrag anlegen</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
