"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  note: string;
  starred: boolean;
  spentAt: string;
  createdAt: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  total: number;
}

export interface ExpenseSummary {
  count: number;
  starredCount: number;
  totalAmount: number;
  breakdown: CategoryBreakdown[];
}

interface ExpenseContextType {
  expenses: ExpenseItem[];
  summary: ExpenseSummary;
  loading: boolean;
  categoryFilter: string;
  starredFilter: boolean;
  searchQuery: string;
  setCategoryFilter: (cat: string) => void;
  setStarredFilter: (val: boolean) => void;
  setSearchQuery: (q: string) => void;
  clearFilters: () => void;
  fetchData: () => Promise<void>;
  addExpense: (data: { title: string; amount: number; category: string; note?: string; spentAt: string }) => Promise<{ success: boolean; error?: string }>;
  toggleStar: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const initialSummary: ExpenseSummary = {
  count: 0,
  starredCount: 0,
  totalAmount: 0,
  breakdown: [],
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>(initialSummary);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [starredFilter, setStarredFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setSummary(initialSummary);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (starredFilter) params.append("starred", "true");
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const qs = params.toString() ? `?${params.toString()}` : "";

      const [resExp, resSum] = await Promise.all([
        fetch(`/api/expenses${qs}`),
        fetch(`/api/expenses/summary${qs}`),
      ]);

      if (resExp.ok) {
        const dataExp = await resExp.json();
        setExpenses(dataExp);
      }
      if (resSum.ok) {
        const dataSum = await resSum.json();
        setSummary(dataSum);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, starredFilter, searchQuery]);

  // Purge state if user logs out or switches
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setSummary(initialSummary);
      setCategoryFilter("");
      setStarredFilter(false);
      setSearchQuery("");
    } else {
      fetchData();
    }
  }, [user, fetchData]);

  const clearFilters = () => {
    setCategoryFilter("");
    setStarredFilter(false);
    setSearchQuery("");
  };

  const addExpense = async (data: {
    title: string;
    amount: number;
    category: string;
    note?: string;
    spentAt: string;
  }) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Failed to add expense" };
      }

      // Re-fetch to guarantee exact sorting and summary sync
      await fetchData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Network error" };
    }
  };

  const toggleStar = async (id: string) => {
    const item = expenses.find((e) => e.id === id);
    if (!item) return;

    const newStarred = !item.starred;

    // Optimistic update
    setExpenses((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, starred: newStarred } : e))
        .filter((e) => !(starredFilter && !e.starred)) // If filter is active and unstarred, remove immediately
    );

    try {
      await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarred }),
      });
      await fetchData();
    } catch (err) {
      console.error("Toggle star failed:", err);
      fetchData();
    }
  };

  const deleteExpense = async (id: string) => {
    // Optimistic delete
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (err) {
      console.error("Delete expense failed:", err);
      fetchData();
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        summary,
        loading,
        categoryFilter,
        starredFilter,
        searchQuery,
        setCategoryFilter,
        setStarredFilter,
        setSearchQuery,
        clearFilters,
        fetchData,
        addExpense,
        toggleStar,
        deleteExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
}

