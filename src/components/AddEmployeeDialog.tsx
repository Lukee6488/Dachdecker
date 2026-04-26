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
import { UserPlus } from "lucide-react";
import type { Employee } from "@/data/types";

interface AddEmployeeDialogProps {
  onAdd: (employee: Employee) => void;
}

export function AddEmployeeDialog({ onAdd }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  const reset = () => { setName(""); setPhone(""); setRole(""); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ id: crypto.randomUUID(), name, phone, role: role || "Elektriker" });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <UserPlus className="h-3.5 w-3.5" />
          Mitarbeiter hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Neuer Mitarbeiter</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="empName" className="text-xs font-medium">
              Name <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="empName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              required
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empRole" className="text-xs font-medium">Rolle</Label>
            <Input
              id="empRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Elektriker"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empPhone" className="text-xs font-medium">
              Telefon <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="empPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 …"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" size="sm">Hinzufügen</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
