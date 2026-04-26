import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCharts } from "@/components/DashboardCharts";
import { useOrders } from "@/context/OrdersContext";
import { useEmployees } from "@/context/EmployeesContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeRange, TimeRangeUnit } from "@/pages/Analytics";

const MODES: { value: TimeRange["mode"]; label: string }[] = [
  { value: "day",    label: "Tag"    },
  { value: "week",   label: "Woche"  },
  { value: "month",  label: "Monat"  },
  { value: "year",   label: "Jahr"   },
  { value: "custom", label: "Custom" },
];

export default function PLAnalytics() {
  const { orders } = useOrders();
  const { employees } = useEmployees();
  const { user } = useAuth();

  const [timeRange, setTimeRange] = useState<TimeRange>({ mode: "week" });
  const [customAmount, setCustomAmount] = useState(2);
  const [customUnit, setCustomUnit] = useState<TimeRangeUnit>("weeks");

  const myOrders = useMemo(
    () => orders.filter((o) => o.pmUserId === user?.id),
    [orders, user?.id]
  );

  const effectiveRange: TimeRange =
    timeRange.mode === "custom"
      ? { mode: "custom", customAmount, customUnit }
      : timeRange;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Auswertungen meiner Aufträge</p>
        </div>

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

        {myOrders.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Keine Aufträge für Auswertungen vorhanden.</p>
          </div>
        ) : (
          <DashboardCharts
            orders={myOrders}
            employees={employees}
            timeRange={effectiveRange}
            hideEmployeeUtilization
          />
        )}
      </div>
    </DashboardLayout>
  );
}
