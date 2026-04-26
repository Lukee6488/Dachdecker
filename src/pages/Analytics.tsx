import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCharts } from "@/components/DashboardCharts";
import { useOrders } from "@/context/OrdersContext";
import { useEmployees } from "@/context/EmployeesContext";
import { validateOrder } from "@/lib/orderValidation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimeRangeUnit = "days" | "weeks" | "months" | "years";

export interface TimeRange {
  mode: "day" | "week" | "month" | "year" | "custom";
  customAmount?: number;
  customUnit?: TimeRangeUnit;
}

const MODES: { value: TimeRange["mode"]; label: string }[] = [
  { value: "day", label: "Tag" },
  { value: "week", label: "Woche" },
  { value: "month", label: "Monat" },
  { value: "year", label: "Jahr" },
  { value: "custom", label: "Custom" },
];

const Analytics = () => {
  const { orders } = useOrders();
  const { employees } = useEmployees();
  const [timeRange, setTimeRange] = useState<TimeRange>({ mode: "week" });
  const [customAmount, setCustomAmount] = useState(2);
  const [customUnit, setCustomUnit] = useState<TimeRangeUnit>("weeks");

  const invalidOrders = orders
    .map((o) => ({ order: o, ...validateOrder(o) }))
    .filter((r) => !r.valid);

  const effectiveRange: TimeRange =
    timeRange.mode === "custom"
      ? { mode: "custom", customAmount, customUnit }
      : timeRange;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Auswertungen und Kennzahlen</p>
        </div>

        {/* Time range selector */}
        <div className="flex flex-wrap items-center gap-2">
          {MODES.map((m) => (
            <Button
              key={m.value}
              size="sm"
              variant={timeRange.mode === m.value ? "default" : "outline"}
              className="h-7 text-xs px-3"
              onClick={() => setTimeRange({ mode: m.value })}
            >
              {m.label}
            </Button>
          ))}
          {timeRange.mode === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Input
                type="number"
                min={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(Math.max(1, Number(e.target.value)))}
                className="h-7 w-16 text-xs"
              />
              <Select value={customUnit} onValueChange={(v) => setCustomUnit(v as TimeRangeUnit)}>
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Tage</SelectItem>
                  <SelectItem value="weeks">Wochen</SelectItem>
                  <SelectItem value="months">Monate</SelectItem>
                  <SelectItem value="years">Jahre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DashboardCharts orders={orders} employees={employees} timeRange={effectiveRange} />

        {invalidOrders.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-semibold text-destructive">
                {invalidOrders.length} Auftrag{invalidOrders.length !== 1 ? "aufträge" : ""} mit fehlenden Pflichtfeldern
              </p>
            </div>
            <div className="space-y-2">
              {invalidOrders.map(({ order, missing }) => (
                <div key={order.id} className="flex items-start justify-between gap-4 rounded-lg border border-destructive/20 bg-background px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">{order.customerName || <span className="italic text-muted-foreground">Kein Name</span>}</span>
                    <span className="text-muted-foreground font-mono text-xs ml-2">{order.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {missing.map((field) => (
                      <span key={field} className="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
