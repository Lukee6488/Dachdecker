import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/data/types";

interface EmployeesContextType {
  employees: Employee[];
  loading: boolean;
  addEmployee: (employee: Employee) => void;
  removeEmployee: (id: string) => void;
  updateEmployee: (id: string, updates: Partial<Omit<Employee, "id">>) => void;
}

const EmployeesContext = createContext<EmployeesContextType | null>(null);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching employees:", error);
      return;
    }

    const mapped: Employee[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone || "",
      role: row.role,
    }));

    setEmployees(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();

    const channel = supabase
      .channel("employees-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEmployees]);

  const addEmployee = async (employee: Employee) => {
    setEmployees((prev) => [...prev, employee]);
    const { error } = await supabase.from("employees").insert({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
    });
    if (error) console.error("Error adding employee:", error);
  };

  const removeEmployee = async (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) console.error("Error removing employee:", error);
  };

  const updateEmployee = async (id: string, updates: Partial<Omit<Employee, "id">>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    const { error } = await supabase.from("employees").update(updates).eq("id", id);
    if (error) console.error("Error updating employee:", error);
  };

  return (
    <EmployeesContext.Provider value={{ employees, loading, addEmployee, removeEmployee, updateEmployee }}>
      {children}
    </EmployeesContext.Provider>
  );
}

export function useEmployees() {
  const ctx = useContext(EmployeesContext);
  if (!ctx) throw new Error("useEmployees must be used within EmployeesProvider");
  return ctx;
}
