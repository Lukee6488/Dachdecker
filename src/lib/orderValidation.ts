import type { Lead } from "@/data/mockOrders";

export interface OrderValidation {
  valid: boolean;
  missing: string[];
}

export function validateLead(lead: Lead): OrderValidation {
  const missing: string[] = [];
  if (!lead.name?.trim()) missing.push("Name");
  if (!lead.kategorie) missing.push("Kategorie");
  return { valid: missing.length === 0, missing };
}

export function validateOrder(lead: Lead): OrderValidation {
  return validateLead(lead);
}
