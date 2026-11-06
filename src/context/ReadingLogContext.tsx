"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface ReadingLogItem {
  id: string;
  bookTitle: string;
  minutesRead: number;
  genre: string;
  note: string;
  favorite: boolean;
  readOn: string;
  createdAt: string;
}

export interface GenreBreakdown {
  genre: string;
  count: number;
  total: number;
}

export interface ReadingLogSummary {
  count: number;
  favoriteCount: number;
  totalMinutes: number;
  breakdown: GenreBreakdown[];
}

interface ReadingLogContextType {
  logs: ReadingLogItem[];
  summary: ReadingLogSummary;
  loading: boolean;
  genreFilter: string;
  favoriteFilter: boolean;
  searchQuery: string;
  setGenreFilter: (genre: string) => void;
  setFavoriteFilter: (val: boolean) => void;
  setSearchQuery: (q: string) => void;
  clearFilters: () => void;
  fetchData: () => Promise<void>;
  addReadingLog: (data: {
    bookTitle: string;
    minutesRead: number;
    genre: string;
    note?: string;
    readOn: string;
  }) => Promise<{ success: boolean; error?: string }>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteReadingLog: (id: string) => Promise<void>;
}

const initialSummary: ReadingLogSummary = {
  count: 0,
  favoriteCount: 0,
  totalMinutes: 0,
  breakdown: [],
};

const ReadingLogContext = createContext<ReadingLogContextType | undefined>(undefined);

export function ReadingLogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ReadingLogItem[]>([]);
  const [summary, setSummary] = useState<ReadingLogSummary>(initialSummary);
  const [loading, setLoading] = useState(false);

  const [genreFilter, setGenreFilter] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setSummary(initialSummary);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (genreFilter) params.append("genre", genreFilter);
      if (favoriteFilter) params.append("favorite", "true");
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const qs = params.toString() ? `?${params.toString()}` : "";

      const [resLogs, resSum] = await Promise.all([
        fetch(`/api/reading-logs${qs}`),
        fetch(`/api/reading-logs/summary${qs}`),
      ]);

      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogs(dataLogs);
      }
      if (resSum.ok) {
        const dataSum = await resSum.json();
        setSummary(dataSum);
      }
    } catch (err) {
      console.error("Failed to fetch reading logs:", err);
    } finally {
      setLoading(false);
    }
  }, [user, genreFilter, favoriteFilter, searchQuery]);

  // Purge state if user logs out or switches
  useEffect(() => {
    if (!user) {
      setLogs([]);
      setSummary(initialSummary);
      setGenreFilter("");
      setFavoriteFilter(false);
      setSearchQuery("");
    } else {
      fetchData();
    }
  }, [user, fetchData]);

  const clearFilters = () => {
    setGenreFilter("");
    setFavoriteFilter(false);
    setSearchQuery("");
  };

  const addReadingLog = async (data: {
    bookTitle: string;
    minutesRead: number;
    genre: string;
    note?: string;
    readOn: string;
  }) => {
    try {
      const res = await fetch("/api/reading-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Failed to add reading log" };
      }

      await fetchData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Network error" };
    }
  };

  const toggleFavorite = async (id: string) => {
    const item = logs.find((e) => e.id === id);
    if (!item) return;

    const newFavorite = !item.favorite;

    // Optimistic update
    setLogs((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, favorite: newFavorite } : e))
        .filter((e) => !(favoriteFilter && !e.favorite))
    );

    try {
      await fetch(`/api/reading-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: newFavorite }),
      });
      await fetchData();
    } catch (err) {
      console.error("Toggle favorite failed:", err);
      fetchData();
    }
  };

  const deleteReadingLog = async (id: string) => {
    // Optimistic delete
    setLogs((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/reading-logs/${id}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (err) {
      console.error("Delete reading log failed:", err);
      fetchData();
    }
  };

  return (
    <ReadingLogContext.Provider
      value={{
        logs,
        summary,
        loading,
        genreFilter,
        favoriteFilter,
        searchQuery,
        setGenreFilter,
        setFavoriteFilter,
        setSearchQuery,
        clearFilters,
        fetchData,
        addReadingLog,
        toggleFavorite,
        deleteReadingLog,
      }}
    >
      {children}
    </ReadingLogContext.Provider>
  );
}

export function useReadingLogs() {
  const context = useContext(ReadingLogContext);
  if (!context) {
    throw new Error("useReadingLogs must be used within a ReadingLogProvider");
  }
  return context;
}
