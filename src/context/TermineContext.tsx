import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TerminStatus = "Angefragt" | "Bestätigt" | "Abgesagt" | "Erledigt";

export interface Termin {
  id: string;
  lead_id: string | null;
  name: string;
  kontakt: string | null;
  kategorie: string | null;
  datum: string;       // date yyyy-mm-dd
  uhrzeit: string;     // time HH:mm
  dauer: string;       // e.g. "01:00:00"
  notiz: string | null;
  status: TerminStatus;
  created_at: string;
}

interface TermineContextType {
  termine: Termin[];
  loading: boolean;
  addTermin: (t: Omit<Termin, "id" | "created_at">) => Promise<void>;
  updateTermin: (id: string, updates: Partial<Termin>) => Promise<void>;
  deleteTermin: (id: string) => Promise<void>;
}

const TermineContext = createContext<TermineContextType | null>(null);

export function TermineProvider({ children }: { children: ReactNode }) {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTermine = useCallback(async () => {
    const { data, error } = await supabase
      .from("termine")
      .select("*")
      .order("datum", { ascending: true })
      .order("uhrzeit", { ascending: true });

    if (error) {
      console.error("Error fetching termine:", error);
      setLoading(false);
      return;
    }

    setTermine(
      (data || []).map((row: any) => ({
        id: row.id,
        lead_id: row.lead_id ?? null,
        name: row.name,
        kontakt: row.kontakt ?? null,
        kategorie: row.kategorie ?? null,
        datum: row.datum,
        uhrzeit: row.uhrzeit,
        dauer: row.dauer ?? "01:00:00",
        notiz: row.notiz ?? null,
        status: row.status,
        created_at: row.created_at,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTermine();
    const channel = supabase
      .channel("termine-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "termine" }, fetchTermine)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTermine]);

  const addTermin = async (t: Omit<Termin, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("termine")
      .insert({
        lead_id: t.lead_id,
        name: t.name,
        kontakt: t.kontakt,
        kategorie: t.kategorie,
        datum: t.datum,
        uhrzeit: t.uhrzeit,
        dauer: t.dauer,
        notiz: t.notiz,
        status: t.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding termin:", error);
      toast.error(`Fehler: ${error.message}`);
      return;
    }

    setTermine((prev) => [
      ...prev,
      {
        id: data.id,
        lead_id: data.lead_id ?? null,
        name: data.name,
        kontakt: data.kontakt ?? null,
        kategorie: data.kategorie ?? null,
        datum: data.datum,
        uhrzeit: data.uhrzeit,
        dauer: data.dauer ?? "01:00:00",
        notiz: data.notiz ?? null,
        status: data.status,
        created_at: data.created_at,
      },
    ].sort((a, b) => a.datum.localeCompare(b.datum) || a.uhrzeit.localeCompare(b.uhrzeit)));
    toast.success("Termin gespeichert");
  };

  const updateTermin = async (id: string, updates: Partial<Termin>) => {
    setTermine((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    const db: Record<string, unknown> = {};
    if (updates.name !== undefined)      db.name      = updates.name;
    if (updates.kontakt !== undefined)   db.kontakt   = updates.kontakt;
    if (updates.kategorie !== undefined) db.kategorie = updates.kategorie;
    if (updates.datum !== undefined)     db.datum     = updates.datum;
    if (updates.uhrzeit !== undefined)   db.uhrzeit   = updates.uhrzeit;
    if (updates.dauer !== undefined)     db.dauer     = updates.dauer;
    if (updates.notiz !== undefined)     db.notiz     = updates.notiz;
    if (updates.status !== undefined)    db.status    = updates.status;

    const { error } = await supabase.from("termine").update(db).eq("id", id);
    if (error) {
      console.error("Error updating termin:", error);
      toast.error("Termin konnte nicht gespeichert werden");
    } else {
      toast.success("Termin aktualisiert");
    }
  };

  const deleteTermin = async (id: string) => {
    setTermine((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("termine").delete().eq("id", id);
    if (error) {
      console.error("Error deleting termin:", error);
      toast.error("Termin konnte nicht gelöscht werden");
    } else {
      toast.success("Termin gelöscht");
    }
  };

  return (
    <TermineContext.Provider value={{ termine, loading, addTermin, updateTermin, deleteTermin }}>
      {children}
    </TermineContext.Provider>
  );
}

export function useTermine() {
  const ctx = useContext(TermineContext);
  if (!ctx) throw new Error("useTermine must be used within TermineProvider");
  return ctx;
}
