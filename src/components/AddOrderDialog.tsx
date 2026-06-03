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
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, LeadKategorie, LeadQuelle } from "@/data/mockOrders";
import { LEAD_KATEGORIEN } from "@/data/mockOrders";

interface AddLeadDialogProps {
  onAdd: (lead: Omit<Lead, "id" | "datum">) => Promise<void>;
}

const REQUIRED = <span className="text-destructive ml-0.5">*</span>;

export function AddOrderDialog({ onAdd }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [kategorie, setKategorie] = useState<LeadKategorie>("Neueindeckung");
  const [quelle, setQuelle] = useState<LeadQuelle>("Voice");
  const [nachricht, setNachricht] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName(""); setKontakt(""); setKategorie("Neueindeckung");
    setQuelle("Voice"); setNachricht(""); setSubmitted(false);
  };

  const err = (condition: boolean) =>
    submitted && condition ? "border-destructive focus-visible:ring-destructive" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;

    setBusy(true);
    try {
      await onAdd({
        name: name.trim(),
        kontakt: kontakt.trim() || null,
        kategorie,
        quelle,
        nachricht: nachricht.trim() || null,
        status: "Neu",
      });
      reset();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          Neuer Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Neuen Lead anlegen</DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Felder mit <span className="text-destructive font-medium">*</span> sind Pflichtfelder.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">Name {REQUIRED}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vor- und Nachname"
              required
              disabled={busy}
              className={cn("h-9 text-sm", err(!name.trim()))}
            />
          </div>

          {/* Kontakt */}
          <div className="space-y-1.5">
            <Label htmlFor="kontakt" className="text-xs font-medium">
              Kontakt <span className="text-muted-foreground font-normal">(Telefon / E-Mail, optional)</span>
            </Label>
            <Input
              id="kontakt"
              value={kontakt}
              onChange={(e) => setKontakt(e.target.value)}
              placeholder="+49 … oder name@beispiel.de"
              disabled={busy}
              className="h-9 text-sm"
            />
          </div>

          {/* Kategorie + Quelle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kategorie {REQUIRED}</Label>
              <Select value={kategorie} onValueChange={(v) => setKategorie(v as LeadKategorie)} disabled={busy}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_KATEGORIEN.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Eingangskanal {REQUIRED}</Label>
              <Select value={quelle} onValueChange={(v) => setQuelle(v as LeadQuelle)} disabled={busy}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Voice">Voice</SelectItem>
                  <SelectItem value="Mail">Mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nachricht */}
          <div className="space-y-1.5">
            <Label htmlFor="nachricht" className="text-xs font-medium">
              Nachricht <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="nachricht"
              value={nachricht}
              onChange={(e) => setNachricht(e.target.value)}
              rows={3}
              placeholder="Kundenanfrage oder Gesprächsnotiz …"
              disabled={busy}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              Abbrechen
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Speichert…" : "Lead anlegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
