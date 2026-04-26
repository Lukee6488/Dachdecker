import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, KeyRound, Pencil, Check, X, LogOut } from "lucide-react";

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
  const { user, profile, signOut } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const roleLabel = profile?.role === "secretary" ? "Sekretariat" : "Projektleitung";

  async function handleSaveName() {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === profile?.display_name) { setEditingName(false); return; }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", user?.id);
    setSavingName(false);
    if (error) { toast.error("Name konnte nicht gespeichert werden"); return; }
    toast.success("Name gespeichert");
    setEditingName(false);
  }

  function cancelName() {
    setDisplayName(profile?.display_name ?? "");
    setEditingName(false);
  }

  async function handleSavePassword() {
    if (!currentPassword) {
      toast.error("Bitte aktuelles Passwort eingeben");
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    setSavingPassword(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (verifyError) {
      toast.error("Aktuelles Passwort ist falsch");
      setSavingPassword(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { toast.error("Passwort konnte nicht geändert werden"); return; }
    toast.success("Passwort geändert");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditingPassword(false);
  }

  function cancelPassword() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditingPassword(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm p-0 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary uppercase">
                  {profile?.display_name.charAt(0)}
                </span>
              </div>
              <div>
                <SheetTitle className="text-base font-semibold leading-tight">
                  {profile?.display_name}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 px-6 py-4 space-y-6">
          {/* E-Mail (read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">E-Mail</p>
            </div>
            <p className="text-sm text-foreground/80">{user?.email ?? "–"}</p>
          </div>

          <Separator />

          {/* Anzeigename */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Anzeigename</p>
              </div>
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {editingName ? (
              <div className="space-y-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") cancelName(); }}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSaveName} disabled={savingName}>
                    <Check className="h-3 w-3 mr-1" />Speichern
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelName}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80">{profile?.display_name}</p>
            )}
          </div>

          <Separator />

          {/* Passwort */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Passwort</p>
              </div>
              {!editingPassword && (
                <button
                  onClick={() => setEditingPassword(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {editingPassword ? (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Neues Passwort</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Passwort bestätigen</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSavePassword(); if (e.key === "Escape") cancelPassword(); }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSavePassword} disabled={savingPassword}>
                    <Check className="h-3 w-3 mr-1" />Speichern
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelPassword}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80">••••••••</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
