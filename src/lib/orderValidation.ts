import { parseISO } from "date-fns";
import type { Order } from "@/data/mockOrders";

export interface OrderValidation {
  valid: boolean;
  missing: string[];
}

export function validateOrder(order: Order): OrderValidation {
  const missing: string[] = [];

  if (!order.customerName?.trim()) missing.push("Kundenname");
  if (!order.address?.trim()) missing.push("Adresse");
  if (!order.phone?.trim()) missing.push("Telefon");

  if (!order.scheduledAt) {
    missing.push("Termin & Uhrzeit");
  } else {
    try {
      const d = parseISO(order.scheduledAt);
      if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
        missing.push("Uhrzeit");
      }
    } catch {
      missing.push("Termin (ungültig)");
    }
  }

  return { valid: missing.length === 0, missing };
}
