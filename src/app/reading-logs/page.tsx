"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useReadingLogs, ReadingLogItem } from "@/context/ReadingLogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  Trash2,
  Search,
  RotateCcw,
  BookOpen,
  Clock,
  Sparkles,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { ALLOWED_GENRES } from "@/lib/constants";

export default function ReadingLogsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    logs,
    summary,
    genreFilter,
    favoriteFilter,
    searchQuery,
    setGenreFilter,
    setFavoriteFilter,
    setSearchQuery,
    clearFilters,
    addReadingLog,
    updateReadingLog,
    toggleFavorite,
    deleteReadingLog,
  } = useReadingLogs();

  // Add Form states
  const [bookTitle, setBookTitle] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [genre, setGenre] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  // Add Form Validation error states
  const [titleError, setTitleError] = useState("");
  const [minutesError, setMinutesError] = useState("");
  const [genreError, setGenreError] = useState("");
  const [dateError, setDateError] = useState("");
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal states
  const [editingItem, setEditingItem] = useState<ReadingLogItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");

  const [editTitleError, setEditTitleError] = useState("");
  const [editMinutesError, setEditMinutesError] = useState("");
  const [editGenreError, setEditGenreError] = useState("");
  const [editDateError, setEditDateError] = useState("");
  const [editApiError, setEditApiError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Authentication check: redirect to /login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return null; // Prevents flash of unauthenticated content
  }

  const validateForm = (
    valTitle: string,
    valMinutes: string,
    valGenre: string,
    valDate: string
  ) => {
    let isValid = true;

    // 1. Book Title
    const trimmedTitle = valTitle.trim();
    if (!trimmedTitle) {
      setTitleError("Book title is required");
      isValid = false;
    } else if (trimmedTitle.length > 80) {
      setTitleError("Book title must be at most 80 characters");
      isValid = false;
    } else {
      setTitleError("");
    }

    // 2. Minutes Read
    if (!valMinutes || valMinutes.trim() === "" || isNaN(Number(valMinutes))) {
      setMinutesError("Minutes read is required");
      isValid = false;
    } else {
      const numMin = Number(valMinutes);
      if (!Number.isInteger(numMin) || numMin <= 0) {
        setMinutesError("Minutes read must be a positive number");
        isValid = false;
      } else {
        setMinutesError("");
      }
    }

    // 3. Genre
    if (!valGenre) {
      setGenreError("Please choose a genre");
      isValid = false;
    } else if (!ALLOWED_GENRES.includes(valGenre as any)) {
      setGenreError("Invalid genre");
      isValid = false;
    } else {
      setGenreError("");
    }

    // 4. Date
    if (!valDate) {
      setDateError("Date is required");
      isValid = false;
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      if (valDate > todayStr) {
        setDateError("Date cannot be in the future");
        isValid = false;
      } else {
        setDateError("");
      }
    }

    return isValid;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBookTitle(val);
    if (hasSubmitted) validateForm(val, minutesRead, genre, date);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinutesRead(val);
    if (hasSubmitted) validateForm(bookTitle, val, genre, date);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGenre(val);
    if (hasSubmitted) validateForm(bookTitle, minutesRead, val, date);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDate(val);
    if (hasSubmitted) validateForm(bookTitle, minutesRead, genre, val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setApiError("");
    setSuccessMessage("");

    const isValid = validateForm(bookTitle, minutesRead, genre, date);
    if (!isValid) return;

    setIsSubmitting(true);
    const result = await addReadingLog({
      bookTitle: bookTitle.trim(),
      minutesRead: parseInt(minutesRead, 10),
      genre,
      note: note.trim(),
      readOn: date,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Reading session added");
      setBookTitle("");
      setMinutesRead("");
      setGenre("");
      setNote("");
      setDate("");
      setHasSubmitted(false);
    } else {
      setApiError(result.error || "Failed to add reading log");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: ReadingLogItem) => {
    setEditingItem(item);
    setEditTitle(item.bookTitle);
    setEditMinutes(String(item.minutesRead));
    setEditGenre(item.genre);
    setEditNote(item.note);
    setEditDate(item.readOn);

    setEditTitleError("");
    setEditMinutesError("");
    setEditGenreError("");
    setEditDateError("");
    setEditApiError("");
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingItem(null);
    setEditApiError("");
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditApiError("");
    let isValid = true;

    // Validate Edit fields
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitleError("Book title is required");
      isValid = false;
    } else if (trimmedTitle.length > 80) {
      setEditTitleError("Book title must be at most 80 characters");
      isValid = false;
    } else {
      setEditTitleError("");
    }

    if (!editMinutes || editMinutes.trim() === "" || isNaN(Number(editMinutes))) {
      setEditMinutesError("Minutes read is required");
      isValid = false;
    } else {
      const numMin = Number(editMinutes);
      if (!Number.isInteger(numMin) || numMin <= 0) {
        setEditMinutesError("Minutes read must be a positive number");
        isValid = false;
      } else {
        setEditMinutesError("");
      }
    }

    if (!editGenre) {
      setEditGenreError("Please choose a genre");
      isValid = false;
    } else if (!ALLOWED_GENRES.includes(editGenre as any)) {
      setEditGenreError("Invalid genre");
      isValid = false;
    } else {
      setEditGenreError("");
    }

    if (!editDate) {
      setEditDateError("Date is required");
      isValid = false;
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      if (editDate > todayStr) {
        setEditDateError("Date cannot be in the future");
        isValid = false;
      } else {
        setEditDateError("");
      }
    }

    if (!isValid) return;

    setIsUpdating(true);
    const result = await updateReadingLog(editingItem.id, {
      bookTitle: trimmedTitle,
      minutesRead: parseInt(editMinutes, 10),
      genre: editGenre,
      note: editNote.trim(),
      readOn: editDate,
    });
    setIsUpdating(false);

    if (result.success) {
      handleCloseEdit();
    } else {
      setEditApiError(result.error || "Failed to update reading log");
    }
  };

  const getGenreColor = (g: string) => {
    switch (g) {
      case "Fiction":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Non-Fiction":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Sci-Fi":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Biography":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      data-testid="reading-logs-page"
      className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30 py-8 px-4 sm:px-6 relative"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Add Reading Session Form */}
            <Card className="border-sky-100 shadow-sm rounded-2xl bg-white/95 backdrop-blur">
              <CardHeader className="pb-4 border-b border-sky-50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800">Add Reading Session</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <form
                  data-testid="reading-log-form"
                  noValidate
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {apiError && (
                    <div
                      data-testid="error-reading-log"
                      className="p-3 text-sm rounded-xl bg-red-50 text-red-600 border border-red-200 font-medium"
                    >
                      {apiError}
                    </div>
                  )}

                  {successMessage && (
                    <div
                      data-testid="reading-log-success"
                      className="p-3 text-sm rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-medium flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-sky-500" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Book Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-book-title" className="text-sm font-medium text-slate-700">
                      Book Title *
                    </label>
                    <Input
                      id="input-book-title"
                      data-testid="input-book-title"
                      value={bookTitle}
                      onChange={handleTitleChange}
                      placeholder="e.g. Atomic Habits"
                      className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                    {titleError && (
                      <p data-testid="error-book-title" className="text-xs text-red-600 font-medium mt-1">
                        {titleError}
                      </p>
                    )}
                  </div>

                  {/* Minutes Read */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-minutes" className="text-sm font-medium text-slate-700">
                      Minutes Read *
                    </label>
                    <Input
                      id="input-minutes"
                      type="number"
                      step="1"
                      data-testid="input-minutes"
                      value={minutesRead}
                      onChange={handleMinutesChange}
                      placeholder="e.g. 40"
                      className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                    {minutesError && (
                      <p data-testid="error-minutes" className="text-xs text-red-600 font-medium mt-1">
                        {minutesError}
                      </p>
                    )}
                  </div>

                  {/* Genre */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-genre" className="text-sm font-medium text-slate-700">
                      Genre *
                    </label>
                    <select
                      id="input-genre"
                      data-testid="input-genre"
                      value={genre}
                      onChange={handleGenreChange}
                      className="flex h-10 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/20"
                    >
                      <option value="">Choose genre</option>
                      {ALLOWED_GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {genreError && (
                      <p data-testid="error-genre" className="text-xs text-red-600 font-medium mt-1">
                        {genreError}
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-note" className="text-sm font-medium text-slate-700">
                      Note (Optional)
                    </label>
                    <Input
                      id="input-note"
                      data-testid="input-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Chapter 3 takeaways"
                      className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-date" className="text-sm font-medium text-slate-700">
                      Date *
                    </label>
                    <Input
                      id="input-date"
                      type="date"
                      data-testid="input-date"
                      value={date}
                      onChange={handleDateChange}
                      className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                    {dateError && (
                      <p data-testid="error-date" className="text-xs text-red-600 font-medium mt-1">
                        {dateError}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    data-testid="btn-add-reading-log"
                    className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-xl h-11 font-medium transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding Session..." : "Add Reading Session"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="border-sky-100 shadow-sm rounded-2xl bg-white/95 backdrop-blur">
              <CardHeader className="pb-3 border-b border-sky-50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-lg font-bold text-slate-800">Reading Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* 3 Metric cards in pastel tones */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/60 border border-sky-100 shadow-xs">
                    <div className="text-[11px] text-sky-700 uppercase font-semibold tracking-wider">Sessions</div>
                    <div data-testid="reading-log-count" className="text-2xl font-extrabold text-sky-900 mt-0.5">
                      {summary.count}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-100 shadow-xs">
                    <div className="text-[11px] text-amber-700 uppercase font-semibold tracking-wider">Favorites</div>
                    <div data-testid="favorite-count" className="text-2xl font-extrabold text-amber-900 mt-0.5">
                      {summary.favoriteCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/60 border border-cyan-100 shadow-xs">
                    <div className="text-[11px] text-cyan-700 uppercase font-semibold tracking-wider">Total Min</div>
                    <div data-testid="total-minutes" className="text-2xl font-extrabold text-cyan-900 mt-0.5">
                      {summary.totalMinutes}
                    </div>
                  </div>
                </div>

                {/* Genre Breakdown */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Minutes by Genre</h4>
                  <div data-testid="genre-breakdown" className="space-y-2">
                    {summary.breakdown.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No matching sessions</p>
                    ) : (
                      summary.breakdown.map((row) => (
                        <div
                          key={row.genre}
                          data-testid="breakdown-row"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/40 border border-sky-100 text-sm hover:bg-sky-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span data-testid="breakdown-name" className="font-semibold text-slate-700">
                              {row.genre}
                            </span>
                            <Badge variant="secondary" data-testid="breakdown-count" className="text-[11px] px-2 py-0 bg-sky-100 text-sky-800 border-sky-200">
                              {row.count} {row.count === 1 ? "log" : "logs"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span data-testid="breakdown-total" className="font-bold text-sky-700">
                              {row.total}
                            </span>
                            <span className="text-xs text-slate-400">mins</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Filters & Reading Log List */}
          <div className="lg:col-span-7 space-y-6">
            {/* Filter Bar */}
            <Card className="border-sky-100 shadow-sm rounded-2xl bg-white/95 backdrop-blur">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Search input */}
                  <div className="sm:col-span-5 relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-sky-400" />
                    <Input
                      data-testid="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title or note..."
                      className="pl-9 rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20 text-sm"
                    />
                  </div>

                  {/* Genre Filter */}
                  <div className="sm:col-span-4">
                    <select
                      data-testid="filter-genre"
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/20"
                    >
                      <option value="">All Genres</option>
                      {ALLOWED_GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Favorites Checkbox & Reset */}
                  <div className="sm:col-span-3 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        data-testid="filter-favorite"
                        checked={favoriteFilter}
                        onChange={(e) => setFavoriteFilter(e.target.checked)}
                        className="h-4 w-4 rounded border-sky-200 text-sky-500 focus:ring-sky-400 cursor-pointer"
                      />
                      Favorites
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="btn-clear-filters"
                      onClick={clearFilters}
                      className="border-sky-200 text-sky-700 hover:bg-sky-50 h-9 w-9 p-0 rounded-xl"
                      title="Clear filters"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reading Log List */}
            <div data-testid="reading-log-list" className="space-y-3.5">
              {logs.length === 0 ? (
                <div
                  data-testid="reading-logs-empty"
                  className="p-12 text-center border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/20 text-slate-500 font-medium"
                >
                  <BookOpen className="h-10 w-10 text-sky-300 mx-auto mb-3" />
                  <span>No reading sessions found</span>
                </div>
              ) : (
                logs.map((item) => (
                  <div
                    key={item.id}
                    data-testid="reading-log-item"
                    className="p-4 sm:p-5 rounded-2xl border border-sky-100 bg-white/95 backdrop-blur shadow-xs hover:shadow-md hover:border-sky-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span data-testid="reading-log-title" className="font-bold text-base text-slate-800 break-words">
                          {item.bookTitle}
                        </span>
                        <span
                          data-testid="reading-log-genre"
                          className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getGenreColor(item.genre)}`}
                        >
                          {item.genre}
                        </span>
                        <span data-testid="reading-log-date" className="text-xs text-slate-500 font-medium">
                          {item.readOn}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-500 break-words italic">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-sky-50">
                      <div className="flex items-baseline gap-1 bg-sky-50/80 px-3 py-1.5 rounded-xl border border-sky-100">
                        <span data-testid="reading-log-minutes" className="text-base font-extrabold text-sky-700">
                          {item.minutesRead}
                        </span>
                        <span className="text-xs font-medium text-sky-600">min</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Edit reading session"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Favorite Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-testid="btn-toggle-favorite"
                          aria-pressed={item.favorite ? "true" : "false"}
                          onClick={() => toggleFavorite(item.id)}
                          className={`h-9 w-9 rounded-xl transition-all ${
                            item.favorite
                              ? "bg-amber-50 text-amber-500 border border-amber-200 hover:bg-amber-100 hover:text-amber-600"
                              : "text-slate-400 hover:text-amber-500 hover:bg-amber-50/50"
                          }`}
                          title={item.favorite ? "Unmark favorite" : "Mark favorite"}
                        >
                          <Bookmark className={`h-4 w-4 ${item.favorite ? "fill-current" : ""}`} />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-testid="btn-delete-reading-log"
                          onClick={() => deleteReadingLog(item.id)}
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete reading log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Reading Session Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-sky-100 shadow-2xl rounded-2xl bg-white p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sky-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Edit Reading Session</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCloseEdit}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {editApiError && (
              <div className="p-3 text-sm rounded-xl bg-red-50 text-red-600 border border-red-200 font-medium">
                {editApiError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Edit Book Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Book Title *</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Atomic Habits"
                  className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                />
                {editTitleError && (
                  <p className="text-xs text-red-600 font-medium">{editTitleError}</p>
                )}
              </div>

              {/* Edit Minutes Read */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Minutes Read *</label>
                <Input
                  type="number"
                  step="1"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  placeholder="e.g. 40"
                  className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                />
                {editMinutesError && (
                  <p className="text-xs text-red-600 font-medium">{editMinutesError}</p>
                )}
              </div>

              {/* Edit Genre */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Genre *</label>
                <select
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/20"
                >
                  <option value="">Choose genre</option>
                  {ALLOWED_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {editGenreError && (
                  <p className="text-xs text-red-600 font-medium">{editGenreError}</p>
                )}
              </div>

              {/* Edit Note */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Note (Optional)</label>
                <Input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Chapter 3 takeaways"
                  className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                />
              </div>

              {/* Edit Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Date *</label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
                />
                {editDateError && (
                  <p className="text-xs text-red-600 font-medium">{editDateError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEdit}
                  className="border-sky-200 text-slate-700 hover:bg-sky-50 rounded-xl"
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-xl gap-1.5"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                  <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
