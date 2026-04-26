import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { Order } from "@/data/mockOrders";
import { ORDER_CATEGORIES } from "@/data/mockOrders";
import type { Employee } from "@/data/types";
import {
  subDays,
  subWeeks,
  subMonths,
  subYears,
  parseISO,
  isAfter,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { de } from "date-fns/locale";
import type { TimeRange } from "@/pages/Analytics";

interface DashboardChartsProps {
  orders: Order[];
  employees: Employee[];
  timeRange: TimeRange;
  hideEmployeeUtilization?: boolean;
}

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#f97316",
];

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#3b82f6",
  done: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

function getRangeStart(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange.mode) {
    case "day":
      return startOfDay(now);
    case "week":
      return startOfWeek(now, { weekStartsOn: 1 }); // Monday
    case "month":
      return startOfMonth(now);
    case "year":
      return startOfYear(now);
    case "custom": {
      const amount = timeRange.customAmount ?? 1;
      switch (timeRange.customUnit) {
        case "days":    return subDays(now, amount);
        case "weeks":   return subWeeks(now, amount);
        case "months":  return subMonths(now, amount);
        case "years":   return subYears(now, amount);
        default:        return subDays(now, amount);
      }
    }
  }
}

function isInRange(dateStr: string, rangeStart: Date): boolean {
  try {
    const d = parseISO(dateStr);
    return isAfter(d, rangeStart) || d >= rangeStart;
  } catch {
    return false;
  }
}

function buildTrendData(orders: Order[], timeRange: TimeRange) {
  const now = new Date();
  const rangeStart = getRangeStart(timeRange);

  if (timeRange.mode === "day") {
    // Hours 0–23
    return Array.from({ length: 24 }, (_, h) => {
      const count = orders.filter((o) => {
        try {
          const d = parseISO(o.receivedAt);
          return d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate() &&
            d.getHours() === h;
        } catch { return false; }
      }).length;
      return { label: `${h}h`, count };
    });
  }

  if (timeRange.mode === "week") {
    const days = eachDayOfInterval({ start: rangeStart, end: endOfDay(now) });
    return days.map((day) => {
      const count = orders.filter((o) => {
        try {
          const d = parseISO(o.receivedAt);
          return d.toDateString() === day.toDateString();
        } catch { return false; }
      }).length;
      return { label: format(day, "EEE", { locale: de }), count };
    });
  }

  if (timeRange.mode === "month") {
    const days = eachDayOfInterval({ start: rangeStart, end: endOfDay(now) });
    return days.map((day) => {
      const count = orders.filter((o) => {
        try {
          const d = parseISO(o.receivedAt);
          return d.toDateString() === day.toDateString();
        } catch { return false; }
      }).length;
      return { label: format(day, "d.M."), count };
    });
  }

  if (timeRange.mode === "year") {
    const months = eachMonthOfInterval({ start: rangeStart, end: now });
    return months.map((month) => {
      const count = orders.filter((o) => {
        try {
          const d = parseISO(o.receivedAt);
          return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
        } catch { return false; }
      }).length;
      return { label: format(month, "MMM", { locale: de }), count };
    });
  }

  // Custom
  const amount = timeRange.customAmount ?? 1;
  const unit = timeRange.customUnit ?? "days";

  if (unit === "days" || unit === "weeks") {
    // Show per day
    const totalDays = unit === "days" ? amount : amount * 7;
    return Array.from({ length: Math.min(totalDays, 60) }, (_, i) => {
      const day = subDays(now, totalDays - 1 - i);
      const count = orders.filter((o) => {
        try {
          const d = parseISO(o.receivedAt);
          return d.toDateString() === day.toDateString();
        } catch { return false; }
      }).length;
      return { label: format(day, "d.M."), count };
    });
  }

  // months / years → show per month
  const totalMonths = unit === "months" ? amount : amount * 12;
  const months = eachMonthOfInterval({ start: subMonths(now, totalMonths - 1), end: now });
  return months.map((month) => {
    const count = orders.filter((o) => {
      try {
        const d = parseISO(o.receivedAt);
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
      } catch { return false; }
    }).length;
    return { label: format(month, "MMM yy", { locale: de }), count };
  });
}

function trendLabel(timeRange: TimeRange): string {
  switch (timeRange.mode) {
    case "day":    return "Neue Aufträge – Heute (nach Stunde)";
    case "week":   return "Neue Aufträge – Diese Woche";
    case "month":  return "Neue Aufträge – Dieser Monat";
    case "year":   return "Neue Aufträge – Dieses Jahr (nach Monat)";
    case "custom": return `Neue Aufträge – Letzte ${timeRange.customAmount} ${
      timeRange.customUnit === "days" ? "Tage" :
      timeRange.customUnit === "weeks" ? "Wochen" :
      timeRange.customUnit === "months" ? "Monate" : "Jahre"
    }`;
  }
}

export function DashboardCharts({ orders, employees, timeRange, hideEmployeeUtilization = false }: DashboardChartsProps) {
  const rangeStart = useMemo(() => getRangeStart(timeRange), [timeRange]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => isInRange(o.receivedAt, rangeStart)),
    [orders, rangeStart]
  );

  // Kategorie-Verteilung (filtered, open only)
  const categoryData = useMemo(() =>
    ORDER_CATEGORIES.map((cat) => ({
      name: cat.length > 14 ? cat.slice(0, 14) + "…" : cat,
      fullName: cat,
      count: filteredOrders.filter((o) => o.category === cat && o.status !== "done").length,
    })).filter((d) => d.count > 0),
    [filteredOrders]
  );

  // Status-Verteilung (filtered)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { open: 0, in_progress: 0, done: 0 };
    filteredOrders.forEach((o) => { counts[o.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ name: STATUS_LABELS[key], value, key }));
  }, [filteredOrders]);

  // Mitarbeiter-Auslastung (filtered, active only)
  const employeeData = useMemo(() =>
    employees
      .map((emp) => ({
        name: emp.name.split(" ")[0],
        fullName: emp.name,
        aktiv: filteredOrders.filter(
          (o) => o.assignedTo?.includes(emp.name) && o.status !== "done"
        ).length,
      }))
      .filter((d) => d.aktiv > 0),
    [filteredOrders, employees]
  );

  // Trend chart
  const trendData = useMemo(() => buildTrendData(orders, timeRange), [orders, timeRange]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Kategorie-Verteilung */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Offene Aufträge nach Kategorie</p>
        {categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Daten im Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
              <Tooltip
                formatter={(val, _, props) => [val, props.payload.fullName]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status-Donut */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Aufträge nach Status</p>
        {statusData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Daten im Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={0}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trend */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{trendLabel(timeRange)}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" name="Aufträge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mitarbeiter-Auslastung */}
      {!hideEmployeeUtilization && <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mitarbeiter-Auslastung</p>
        {employeeData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine aktiven Zuweisungen im Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={employeeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
              <Tooltip
                formatter={(val, name) => [val, name === "aktiv" ? "Aktiv" : "Erledigt"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="aktiv" name="Aktive Aufträge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>}
    </div>
  );
}
