import { createClient } from "@supabase/supabase-js";
import type { Category } from "./gemini";

export interface Lead {
  name: string;
  kontakt: string;
  kategorie: Category;
  nachricht: string;
  quelle: "Mail";
  datum: string;
  status: string;
}

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function logLead(lead: Lead): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase.from("leads").insert(lead);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

export async function isEmailAlreadyProcessed(emailId: string): Promise<boolean> {
  const supabase = getClient();

  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("quelle", "Mail")
    // Store gmail message id in nachricht prefix to detect duplicates
    .like("nachricht", `[gmid:${emailId}]%`)
    .maybeSingle();

  return data !== null;
}
