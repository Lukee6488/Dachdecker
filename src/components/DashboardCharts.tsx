import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import type { Lead } from "@/data/mockOrders";
import { LEAD_KATEGORIEN } from "@/data/mockOrders";
import {
  subDays, subWeeks, subMonths, subYears,
  parseISO, isAfter, startOfDay, startOfWeek, startOfMonth, startOfYear,
  endOfDay, format, eachDayOfInterval, eachMonthOfInterval,
} from "date-fns";
import { de } from "date-fns/locale";
import type { TimeRange } from "@/pages/Analytics";

interface DashboardChartsProps {
  orders: Lead[];
  employees?: never[];
  timeRange: TimeRange;
  hideEmployeeUtilization?: boolean;
}

const CATEGORY_COLORS = [
  "#e53e3e", "#dd6b20", "#d69e2e", "#38a169", "#3182ce", "#805ad5", "#d53f8c",
];

const STATUS_COLORS: Record<string, string> = {
  "Neu":            "#f59e0b",
  "In Bearbeitung": "#3b82f6",
  "Kontaktiert":    "#8b5cf6",
  "Abgeschlossen":  "#10b981",
};

function getRangeStart(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange.mode) {
    case "day":    return startOfDay(now);
    case "week":   return startOfWeek(now, { weekStartsOn: 1 });
    case "month":  return startOfMonth(now);
    case "year":   return startOfYear(now);
    case "custom": {
      const amount = timeRange.customAmount ?? 1;
      switch (timeRange.customUnit) {
        case "days":   return subDays(now, amount);
        case "weeks":  return subWeeks(now, amount);
        case "months": return subMonths(now, amount);
        case "years":  return subYears(now, amount);
        default:       return subDays(now, amount);
      }
    }
  }
}

function isInRange(dateStr: string, rangeStart: Date): boolean {
  try {
    const d = parseISO(dateStr);
    return isAfter(d, rangeStart) || d >= rangeStart;
  } catch { return false; }
}

function buildTrendData(leads: Lead[], timeRange: TimeRange) {
  const now = new Date();
  const rangeStart = getRangeStart(timeRange);

  if (timeRange.mode === "day") {
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}h`,
      count: leads.filter((l) => {
        try {
          const d = parseISO(l.datum);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate() && d.getHours() === h;
        } catch { return false; }
      }).length,
    }));
  }

  if (timeRange.mode === "week") {
    const days = eachDayOfInterval({ start: rangeStart, end: endOfDay(now) });
    return days.map((day) => ({
      label: format(day, "EEE", { locale: de }),
      count: leads.filter((l) => { try { return parseISO(l.datum).toDateString() === day.toDateString(); } catch { return false; } }).length,
    }));
  }

  if (timeRange.mode === "month") {
    const days = eachDayOfInterval({ start: rangeStart, end: endOfDay(now) });
    return days.map((day) => ({
      label: format(day, "d.M."),
      count: leads.filter((l) => { try { return parseISO(l.datum).toDateString() === day.toDateString(); } catch { return false; } }).length,
    }));
  }

  if (timeRange.mode === "year") {
    const months = eachMonthOfInterval({ start: rangeStart, end: now });
    return months.map((month) => ({
      label: format(month, "MMM", { locale: de }),
      count: leads.filter((l) => {
        try { const d = parseISO(l.datum); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }
        catch { return false; }
      }).length,
    }));
  }

  const amount = timeRange.customAmount ?? 1;
  const unit = timeRange.customUnit ?? "days";
  if (unit === "days" || unit === "weeks") {
    const totalDays = unit === "days" ? amount : amount * 7;
    return Array.from({ length: Math.min(totalDays, 60) }, (_, i) => {
      const day = subDays(now, totalDays - 1 - i);
      return {
        label: format(day, "d.M."),
        count: leads.filter((l) => { try { return parseISO(l.datum).toDateString() === day.toDateString(); } catch { return false; } }).length,
      };
    });
  }
  const totalMonths = unit === "months" ? amount : amount * 12;
  return eachMonthOfInterval({ start: subMonths(now, totalMonths - 1), end: now }).map((month) => ({
    label: format(month, "MMM yy", { locale: de }),
    count: leads.filter((l) => {
      try { const d = parseISO(l.datum); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }
      catch { return false; }
    }).length,
  }));
}

function trendLabel(timeRange: TimeRange): string {
  switch (timeRange.mode) {
    case "day":    return "Neue Leads – Heute (nach Stunde)";
    case "week":   return "Neue Leads – Diese Woche";
    case "month":  return "Neue Leads – Dieser Monat";
    case "year":   return "Neue Leads – Dieses Jahr (nach Monat)";
    case "custom": return `Neue Leads – Letzte ${timeRange.customAmount} ${
      timeRange.customUnit === "days" ? "Tage" :
      timeRange.customUnit === "weeks" ? "Wochen" :
      timeRange.customUnit === "months" ? "Monate" : "Jahre"
    }`;
  }
}

export function DashboardCharts({ orders: leads, timeRange }: DashboardChartsProps) {
  const rangeStart = useMemo(() => getRangeStart(timeRange), [timeRange]);
  const filteredLeads = useMemo(() => leads.filter((l) => isInRange(l.datum, rangeStart)), [leads, rangeStart]);

  const categoryData = useMemo(() =>
    LEAD_KATEGORIEN.map((cat) => ({
      name: cat.length > 16 ? cat.slice(0, 16) + "…" : cat,
      fullName: cat,
      count: filteredLeads.filter((l) => l.kategorie === cat && l.status !== "Abgeschlossen").length,
    })).filter((d) => d.count > 0),
    [filteredLeads]
  );

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { "Neu": 0, "In Bearbeitung": 0, "Kontaktiert": 0, "Abgeschlossen": 0 };
    filteredLeads.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([key, value]) => ({ name: key, value, key }));
  }, [filteredLeads]);

  const quelleData = useMemo(() => {
    const voice = filteredLeads.filter((l) => l.quelle === "Voice").length;
    const mail  = filteredLeads.filter((l) => l.quelle === "Mail").length;
    return [
      ...(voice > 0 ? [{ name: "Voice", value: voice }] : []),
      ...(mail  > 0 ? [{ name: "Mail",  value: mail  }] : []),
    ];
  }, [filteredLeads]);

  const trendData = useMemo(() => buildTrendData(leads, timeRange), [leads, timeRange]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Kategorie */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Offene Leads nach Kategorie</p>
        {categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Daten im Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
              <Tooltip formatter={(val, _, props) => [val, props.payload.fullName]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status-Donut */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Leads nach Status</p>
        {statusData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Daten im Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={0} dataKey="value">
                {statusData.map((entry) => <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />)}
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
            <Bar dataKey="count" name="Leads" fill="#e53e3e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Voice vs Mail */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Leads nach Eingangskanal</p>
        {quelleData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Daten im Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={quelleData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                <Cell fill="#f97316" />
                <Cell fill="#0ea5e9" />
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
