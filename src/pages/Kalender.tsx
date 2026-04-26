import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDetailSheet } from "@/components/OrderDetailSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrders } from "@/context/OrdersContext";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  format,
  isToday,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react";

import type { Order } from "@/data/mockOrders";
import { cn } from "@/lib/utils";
import { validateOrder } from "@/lib/orderValidation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Modifier } from "@dnd-kit/core";

const priorityDot: Record<string, string> = {
  hoch: "bg-rose-500",
  mittel: "bg-amber-400",
  niedrig: "bg-emerald-400",
};

const statusClass: Record<string, string> = {
  open: "border-l-amber-400",
  in_progress: "border-l-blue-400",
  done: "border-l-emerald-400",
};

// --- Sub-components ---

function MiniOrderCard({ order }: { order: Order }) {
  const time = order.scheduledAt
    ? (() => { try { const d = parseISO(order.scheduledAt); return format(d, "HH:mm"); } catch { return null; } })()
    : null;
  return (
    <div className={cn(
      "w-full text-left rounded border-l-2 bg-card px-2.5 py-2 shadow-sm",
      statusClass[order.status] ?? "border-l-border"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", priorityDot[order.priority])} />
        <span className="text-xs font-medium tabular-nums text-foreground/80">{time ?? "–"}</span>
      </div>
      <p className="text-xs font-semibold leading-tight truncate mb-0.5">{order.customerName}</p>
      <p className="text-[10px] text-muted-foreground truncate">{order.category}</p>
    </div>
  );
}

function DraggableCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const canDrag = validateOrder(order).valid;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    disabled: !canDrag,
  });
  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "outline-none focus:outline-none focus-visible:outline-none",
        canDrag ? "touch-none cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging && "opacity-30"
      )}
    >
      <MiniOrderCard order={order} />
    </div>
  );
}

// Unscheduled orders are never draggable — they lack a time component.
// The user must open the detail sheet and set date + time manually.
function UnscheduledCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const { missing } = validateOrder(order);
  const hasIssues = missing.length > 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm hover:shadow-md transition-shadow border-l-2",
        statusClass[order.status] ?? "border-l-border",
        hasIssues && "border-destructive/40 bg-destructive/5"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot[order.priority])} />
      <div className="text-left">
        <p className="text-xs font-medium">{order.customerName}</p>
        <p className="text-[11px] text-muted-foreground">
          {hasIssues ? (
            <span className="text-destructive">⚠ {missing.join(", ")}</span>
          ) : (
            order.category
          )}
        </p>
      </div>
    </button>
  );
}

function DroppableDay({ day, children, today }: { day: Date; children: React.ReactNode; today: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: format(day, "yyyy-MM-dd") });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "self-start rounded-b-lg transition-colors duration-150",
        isOver && "bg-primary/5 ring-2 ring-primary/30 ring-inset"
      )}
    >
      <div className={cn(
        "rounded-t-lg px-2 py-1.5 text-center border-b mb-1",
        today ? "bg-primary text-primary-foreground" : "bg-muted/40",
        isOver && !today && "bg-primary/10"
      )}>
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
          {format(day, "EEE", { locale: de })}
        </p>
        <p className={cn("text-sm font-bold", today ? "" : "text-foreground")}>
          {format(day, "d")}
        </p>
      </div>
      <div className="space-y-1 px-0.5 min-h-[160px]">{children}</div>
    </div>
  );
}

// --- Main component ---

export default function Kalender() {
  const { orders, updateStatus, updateOrder, deleteOrder, logs, scheduleOrder } = useOrders();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { locale: de, weekStartsOn: 1 })
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<Order | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<"prev" | "next" | null>(null);
  const [gridKey, setGridKey] = useState(0); // bumped on each week change to retrigger animation

  const calendarRef = useRef<HTMLDivElement>(null);
  // Cached once at drag-start — avoids getBoundingClientRect() on every pointermove (layout reflow)
  const calendarRectRef = useRef<DOMRect | null>(null);

  const restrictToCalendar = useCallback<Modifier>(({ transform, draggingNodeRect }) => {
    const rect = calendarRectRef.current;
    if (!rect || !draggingNodeRect) return transform;
    const minX = rect.left - draggingNodeRect.left;
    const maxX = rect.right - draggingNodeRect.right;
    return {
      ...transform,
      x: Math.min(Math.max(transform.x, minX), maxX),
    };
  }, []);

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollDirectionRef = useRef<"prev" | "next" | null>(null);
  const mouseXRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Track mouse position globally
  useEffect(() => {
    const handler = (e: PointerEvent) => { mouseXRef.current = e.clientX; };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  const clearScrollTimer = useCallback(() => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
    scrollDirectionRef.current = null;
  }, []);

  const scheduleScroll = useCallback((dir: "prev" | "next") => {
    if (scrollDirectionRef.current === dir) return; // already scheduled
    clearScrollTimer();
    scrollDirectionRef.current = dir;
    scrollTimerRef.current = setTimeout(() => {
      setSlideDir(dir);
      setGridKey((k) => k + 1);
      setWeekStart((w) => dir === "prev" ? subWeeks(w, 1) : addWeeks(w, 1));
      scrollDirectionRef.current = null;
      scrollTimerRef.current = null;
    }, 600);
  }, [clearScrollTimer]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = endOfWeek(weekStart, { locale: de, weekStartsOn: 1 });

  const scheduledOrders = orders.filter((o) => o.scheduledAt);
  const unscheduled = orders.filter((o) => !o.scheduledAt && o.status !== "done");

  const ordersForDay = (day: Date) =>
    scheduledOrders
      .filter((o) => {
        try { return isSameDay(parseISO(o.scheduledAt!), day); } catch { return false; }
      })
      .sort((a, b) => {
        try { return parseISO(a.scheduledAt!).getTime() - parseISO(b.scheduledAt!).getTime(); } catch { return 0; }
      });

  const isCurrentWeek = isSameDay(
    weekStart,
    startOfWeek(new Date(), { locale: de, weekStartsOn: 1 })
  );

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    // Cache rect once so the modifier never triggers layout reflows
    calendarRectRef.current = calendarRef.current?.getBoundingClientRect() ?? null;
  }

  function handleDragMove(_event: DragMoveEvent) {
    const x = mouseXRef.current;
    const rect = calendarRectRef.current;
    if (!rect) return;
    const EDGE = 60;
    if (x < rect.left + EDGE) {
      scheduleScroll("prev");
    } else if (x > rect.right - EDGE) {
      scheduleScroll("next");
    } else {
      clearScrollTimer();
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    clearScrollTimer();

    const { active, over } = event;
    if (!over) return;

    const orderId = String(active.id);
    const targetId = String(over.id);

    // Skip nav zones
    if (targetId === "__nav_prev__" || targetId === "__nav_next__") return;

    // targetId is "yyyy-MM-dd"
    const [y, m, d] = targetId.split("-").map(Number);
    if (!y || !m || !d) return;
    const date = new Date(y, m - 1, d);
    scheduleOrder(orderId, date);
  }

  function handleDragCancel() {
    setActiveId(null);
    clearScrollTimer();
    calendarRectRef.current = null;
  }

  function goToPrevWeek() {
    setSlideDir("prev");
    setGridKey((k) => k + 1);
    setWeekStart((w) => subWeeks(w, 1));
  }

  function goToNextWeek() {
    setSlideDir("next");
    setGridKey((k) => k + 1);
    setWeekStart((w) => addWeeks(w, 1));
  }

  function goToCurrentWeek() {
    setSlideDir(null);
    setGridKey((k) => k + 1);
    setWeekStart(startOfWeek(new Date(), { locale: de, weekStartsOn: 1 }));
  }

  return (
    <DashboardLayout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(weekStart, "d. MMMM", { locale: de })} –{" "}
                {format(weekEnd, "d. MMMM yyyy", { locale: de })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={goToCurrentWeek}>
                  Heute
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week grid */}
          <div
            ref={calendarRef}
            key={gridKey}
            className={cn(
              "grid grid-cols-7 gap-2 overflow-visible",
              slideDir === "next" && "animate-slide-from-right",
              slideDir === "prev" && "animate-slide-from-left",
            )}
          >
            {days.map((day) => {
              const dayOrders = ordersForDay(day);
              return (
                <DroppableDay key={format(day, "yyyy-MM-dd")} day={day} today={isToday(day)}>
                  {dayOrders.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/40 text-center py-3">–</p>
                  ) : (
                    dayOrders.map((order) => (
                      <DraggableCard
                        key={order.id}
                        order={order}
                        onClick={() => setSelectedOrder(order)}
                      />
                    ))
                  )}
                </DroppableDay>
              );
            })}
          </div>

          {/* Unscheduled */}
          {unscheduled.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarX className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Ohne Termin</h2>
                <Badge variant="secondary" className="text-xs">{unscheduled.length}</Badge>
                <span className="text-xs text-muted-foreground ml-1">– auf einen Tag ziehen zum Einplanen</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Auftrag anklicken → Termin &amp; Uhrzeit im Detail-Panel setzen
              </p>
              <div className="flex flex-wrap gap-2">
                {unscheduled.map((order) => (
                  <UnscheduledCard
                    key={order.id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay
          modifiers={[restrictToCalendar]}
          dropAnimation={{
            duration: 250,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {activeOrder && (
            <div
              style={{ transition: "none", willChange: "transform" }}
              className={cn(
                "w-36 rounded border-l-2 bg-card px-2.5 py-2 shadow-lg opacity-95",
                statusClass[activeOrder.status] ?? "border-l-border"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", priorityDot[activeOrder.priority])} />
                <span className="text-xs font-medium tabular-nums text-foreground/80">
                  {activeOrder.scheduledAt ? (() => { try { return format(parseISO(activeOrder.scheduledAt), "HH:mm"); } catch { return "–"; } })() : "–"}
                </span>
              </div>
              <p className="text-xs font-semibold leading-tight truncate mb-0.5">{activeOrder.customerName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{activeOrder.category}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <OrderDetailSheet
        order={selectedOrder ? (orders.find((o) => o.id === selectedOrder.id) ?? null) : null}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onUpdate={updateOrder}
        onStatusChange={updateStatus}
        onDeleteRequest={(orderId) => {
          const order = orders.find((o) => o.id === orderId) ?? null;
          setSelectedOrder(null);
          setPendingDeleteOrder(order);
        }}
        logs={selectedOrder ? (logs[selectedOrder.id] ?? []) : []}
      />

      <AlertDialog open={!!pendingDeleteOrder} onOpenChange={(open) => !open && setPendingDeleteOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDeleteOrder?.customerName}</strong> wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteOrder) deleteOrder(pendingDeleteOrder.id);
                setPendingDeleteOrder(null);
              }}
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
