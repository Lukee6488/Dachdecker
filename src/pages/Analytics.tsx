import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCharts } from "@/components/DashboardCharts";
import { useLeads } from "@/context/LeadsContext";
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
  { value: "day",    label: "Tag"    },
  { value: "week",   label: "Woche"  },
  { value: "month",  label: "Monat"  },
  { value: "year",   label: "Jahr"   },
  { value: "custom", label: "Custom" },
];

const Analytics = () => {
  const { leads } = useLeads();
  const [timeRange, setTimeRange] = useState<TimeRange>({ mode: "week" });
  const [customAmount, setCustomAmount] = useState(2);
  const [customUnit, setCustomUnit] = useState<TimeRangeUnit>("weeks");

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
                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
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

        <DashboardCharts orders={leads} timeRange={effectiveRange} />
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
