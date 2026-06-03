import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lead, LeadStatus } from "@/data/mockOrders";

interface LeadsContextType {
  leads: Lead[];
  loading: boolean;
  addLead: (lead: Omit<Lead, "id" | "datum">) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  updateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("datum", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      setLoading(false);
      return;
    }

    setLeads(
      (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        kontakt: row.kontakt ?? null,
        kategorie: row.kategorie,
        nachricht: row.nachricht ?? null,
        quelle: row.quelle ?? null,
        datum: row.datum,
        status: row.status,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeads)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const addLead = async (lead: Omit<Lead, "id" | "datum">) => {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: lead.name,
        kontakt: lead.kontakt,
        kategorie: lead.kategorie,
        nachricht: lead.nachricht,
        quelle: lead.quelle,
        status: lead.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding lead:", error);
      toast.error(`Fehler: ${error.message}`);
      return;
    }

    setLeads((prev) => [
      {
        id: data.id,
        name: data.name,
        kontakt: data.kontakt ?? null,
        kategorie: data.kategorie,
        nachricht: data.nachricht ?? null,
        quelle: data.quelle ?? null,
        datum: data.datum,
        status: data.status,
      },
      ...prev,
    ]);
    toast.success("Lead angelegt");
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updates } : l)));

    const db: Record<string, unknown> = {};
    if (updates.name !== undefined)      db.name      = updates.name;
    if (updates.kontakt !== undefined)   db.kontakt   = updates.kontakt;
    if (updates.kategorie !== undefined) db.kategorie = updates.kategorie;
    if (updates.nachricht !== undefined) db.nachricht = updates.nachricht;
    if (updates.quelle !== undefined)    db.quelle    = updates.quelle;
    if (updates.status !== undefined)    db.status    = updates.status;

    if (Object.keys(db).length > 0) {
      const { error } = await supabase.from("leads").update(db).eq("id", leadId);
      if (error) {
        console.error("Error updating lead:", error);
        toast.error("Änderungen konnten nicht gespeichert werden");
      } else {
        toast.success("Änderungen gespeichert");
      }
    }
  };

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
    if (error) {
      console.error("Error updating status:", error);
      toast.error("Status konnte nicht gespeichert werden");
    } else {
      toast.success(`Status: ${status}`);
    }
  };

  const deleteLead = async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) {
      console.error("Error deleting lead:", error);
      toast.error("Lead konnte nicht gelöscht werden");
    } else {
      toast.success("Lead gelöscht");
    }
  };

  return (
    <LeadsContext.Provider value={{ leads, loading, addLead, updateLead, updateStatus, deleteLead }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
