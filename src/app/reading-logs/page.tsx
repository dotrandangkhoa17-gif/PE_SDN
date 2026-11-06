"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useReadingLogs } from "@/context/ReadingLogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Trash2, Search, RotateCcw } from "lucide-react";
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
    toggleFavorite,
    deleteReadingLog,
  } = useReadingLogs();

  // Form states
  const [bookTitle, setBookTitle] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [genre, setGenre] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  // Validation error states
  const [titleError, setTitleError] = useState("");
  const [minutesError, setMinutesError] = useState("");
  const [genreError, setGenreError] = useState("");
  const [dateError, setDateError] = useState("");
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div data-testid="reading-logs-page" className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Reading Session Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Add Reading Session</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                data-testid="reading-log-form"
                noValidate
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {apiError && (
                  <div
                    data-testid="error-reading-log"
                    className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium"
                  >
                    {apiError}
                  </div>
                )}

                {successMessage && (
                  <div
                    data-testid="reading-log-success"
                    className="p-3 text-sm rounded bg-green-50 text-green-700 border border-green-200 font-medium"
                  >
                    {successMessage}
                  </div>
                )}

                {/* Book Title */}
                <div className="space-y-1">
                  <label htmlFor="input-book-title" className="text-sm font-medium">
                    Book Title *
                  </label>
                  <Input
                    id="input-book-title"
                    data-testid="input-book-title"
                    value={bookTitle}
                    onChange={handleTitleChange}
                    placeholder="e.g. Atomic Habits"
                  />
                  {titleError && (
                    <p data-testid="error-book-title" className="text-xs text-destructive font-medium mt-1">
                      {titleError}
                    </p>
                  )}
                </div>

                {/* Minutes Read */}
                <div className="space-y-1">
                  <label htmlFor="input-minutes" className="text-sm font-medium">
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
                  />
                  {minutesError && (
                    <p data-testid="error-minutes" className="text-xs text-destructive font-medium mt-1">
                      {minutesError}
                    </p>
                  )}
                </div>

                {/* Genre */}
                <div className="space-y-1">
                  <label htmlFor="input-genre" className="text-sm font-medium">
                    Genre *
                  </label>
                  <select
                    id="input-genre"
                    data-testid="input-genre"
                    value={genre}
                    onChange={handleGenreChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Choose genre</option>
                    {ALLOWED_GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {genreError && (
                    <p data-testid="error-genre" className="text-xs text-destructive font-medium mt-1">
                      {genreError}
                    </p>
                  )}
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <label htmlFor="input-note" className="text-sm font-medium">
                    Note (Optional)
                  </label>
                  <Input
                    id="input-note"
                    data-testid="input-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Chapter 3"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label htmlFor="input-date" className="text-sm font-medium">
                    Date *
                  </label>
                  <Input
                    id="input-date"
                    type="date"
                    data-testid="input-date"
                    value={date}
                    onChange={handleDateChange}
                  />
                  {dateError && (
                    <p data-testid="error-date" className="text-xs text-destructive font-medium mt-1">
                      {dateError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  data-testid="btn-add-reading-log"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Session..." : "Add Reading Session"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Reading Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-muted/50 border">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Sessions</div>
                  <div data-testid="reading-log-count" className="text-2xl font-bold mt-1">
                    {summary.count}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Favorites</div>
                  <div data-testid="favorite-count" className="text-2xl font-bold mt-1 text-yellow-600">
                    {summary.favoriteCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Total Minutes</div>
                  <div data-testid="total-minutes" className="text-2xl font-bold mt-1 text-primary">
                    {summary.totalMinutes}
                  </div>
                </div>
              </div>

              {/* Genre Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Genre Breakdown</h4>
                <div data-testid="genre-breakdown" className="space-y-2">
                  {summary.breakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No data to display</p>
                  ) : (
                    summary.breakdown.map((row) => (
                      <div
                        key={row.genre}
                        data-testid="breakdown-row"
                        className="flex items-center justify-between p-2 rounded-md bg-card border text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span data-testid="breakdown-name" className="font-medium">
                            {row.genre}
                          </span>
                          <Badge variant="secondary" data-testid="breakdown-count" className="text-xs">
                            {row.count}
                          </Badge>
                        </div>
                        <span data-testid="breakdown-total" className="font-semibold text-foreground">
                          {row.total}
                        </span>
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
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Search input */}
                <div className="sm:col-span-5 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search book title or note..."
                    className="pl-9"
                  />
                </div>

                {/* Genre Filter */}
                <div className="sm:col-span-4">
                  <select
                    data-testid="filter-genre"
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="filter-favorite"
                      checked={favoriteFilter}
                      onChange={(e) => setFavoriteFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Favorites only
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="btn-clear-filters"
                    onClick={clearFilters}
                    title="Clear filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reading Log List */}
          <div data-testid="reading-log-list" className="space-y-3">
            {logs.length === 0 ? (
              <div
                data-testid="reading-logs-empty"
                className="p-8 text-center border-2 border-dashed rounded-lg bg-card text-muted-foreground font-medium"
              >
                No reading sessions found
              </div>
            ) : (
              logs.map((item) => (
                <div
                  key={item.id}
                  data-testid="reading-log-item"
                  className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-primary/40"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span data-testid="reading-log-title" className="font-semibold text-base">
                        {item.bookTitle}
                      </span>
                      <Badge variant="outline" data-testid="reading-log-genre">
                        {item.genre}
                      </Badge>
                      <span data-testid="reading-log-date" className="text-xs text-muted-foreground">
                        {item.readOn}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span data-testid="reading-log-minutes" className="text-lg font-bold text-primary">
                      {item.minutesRead} mins
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-testid="btn-toggle-favorite"
                        aria-pressed={item.favorite ? "true" : "false"}
                        onClick={() => toggleFavorite(item.id)}
                        className={item.favorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-foreground"}
                        title={item.favorite ? "Unmark favorite" : "Mark favorite"}
                      >
                        <Bookmark className={`h-5 w-5 ${item.favorite ? "fill-current" : ""}`} />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-testid="btn-delete-reading-log"
                        onClick={() => deleteReadingLog(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete reading log"
                      >
                        <Trash2 className="h-5 w-5" />
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
  );
}
