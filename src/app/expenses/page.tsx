"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, Search, RotateCcw } from "lucide-react";

const ALLOWED_CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Other"];

export default function ExpensesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    expenses,
    summary,
    categoryFilter,
    starredFilter,
    searchQuery,
    setCategoryFilter,
    setStarredFilter,
    setSearchQuery,
    clearFilters,
    addExpense,
    toggleStar,
    deleteExpense,
  } = useExpenses();

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  // Validation error states
  const [titleError, setTitleError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [categoryError, setCategoryError] = useState("");
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
    valAmount: string,
    valCat: string,
    valDate: string
  ) => {
    let isValid = true;

    // Title validation
    const trimmedTitle = valTitle.trim();
    if (!trimmedTitle) {
      setTitleError("Title is required");
      isValid = false;
    } else if (trimmedTitle.length > 80) {
      setTitleError("Title must be at most 80 characters");
      isValid = false;
    } else {
      setTitleError("");
    }

    // Amount validation
    if (!valAmount || valAmount.trim() === "" || isNaN(Number(valAmount))) {
      setAmountError("Amount is required");
      isValid = false;
    } else if (Number(valAmount) <= 0) {
      setAmountError("Amount must be a positive number");
      isValid = false;
    } else {
      setAmountError("");
    }

    // Category validation
    if (!valCat) {
      setCategoryError("Please choose a category");
      isValid = false;
    } else if (!ALLOWED_CATEGORIES.includes(valCat)) {
      setCategoryError("Invalid category");
      isValid = false;
    } else {
      setCategoryError("");
    }

    // Date validation
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
    setTitle(val);
    if (hasSubmitted) validateForm(val, amount, category, date);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    if (hasSubmitted) validateForm(title, val, category, date);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    if (hasSubmitted) validateForm(title, amount, val, date);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDate(val);
    if (hasSubmitted) validateForm(title, amount, category, val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setApiError("");
    setSuccessMessage("");

    const isValid = validateForm(title, amount, category, date);
    if (!isValid) return;

    setIsSubmitting(true);
    const result = await addExpense({
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      note: note.trim(),
      spentAt: date,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Expense added");
      setTitle("");
      setAmount("");
      setCategory("");
      setNote("");
      setDate("");
      setHasSubmitted(false);
    } else {
      setApiError(result.error || "Failed to add expense");
    }
  };

  return (
    <div data-testid="expenses-page" className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Expense Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Add an Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                data-testid="expense-form"
                noValidate
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {apiError && (
                  <div
                    data-testid="error-expense"
                    className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium"
                  >
                    {apiError}
                  </div>
                )}

                {successMessage && (
                  <div
                    data-testid="expense-success"
                    className="p-3 text-sm rounded bg-green-50 text-green-700 border border-green-200 font-medium"
                  >
                    {successMessage}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label htmlFor="input-title" className="text-sm font-medium">
                    Title *
                  </label>
                  <Input
                    id="input-title"
                    data-testid="input-title"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Grab to campus"
                  />
                  {titleError && (
                    <p data-testid="error-title" className="text-xs text-destructive font-medium mt-1">
                      {titleError}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label htmlFor="input-amount" className="text-sm font-medium">
                    Amount *
                  </label>
                  <Input
                    id="input-amount"
                    type="number"
                    step="0.01"
                    data-testid="input-amount"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                  />
                  {amountError && (
                    <p data-testid="error-amount" className="text-xs text-destructive font-medium mt-1">
                      {amountError}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label htmlFor="input-category" className="text-sm font-medium">
                    Category *
                  </label>
                  <select
                    id="input-category"
                    data-testid="input-category"
                    value={category}
                    onChange={handleCategoryChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Choose category</option>
                    {ALLOWED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {categoryError && (
                    <p data-testid="error-category" className="text-xs text-destructive font-medium mt-1">
                      {categoryError}
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
                    placeholder="Optional details"
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
                  data-testid="btn-add-expense"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Expense..." : "Add Expense"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Spending Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-muted/50 border">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Total Items</div>
                  <div data-testid="expense-count" className="text-2xl font-bold mt-1">
                    {summary.count}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Starred</div>
                  <div data-testid="starred-count" className="text-2xl font-bold mt-1 text-yellow-600">
                    {summary.starredCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Total Spent</div>
                  <div data-testid="total-amount" className="text-2xl font-bold mt-1 text-primary">
                    {summary.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Category Breakdown</h4>
                <div data-testid="category-breakdown" className="space-y-2">
                  {summary.breakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No data to display</p>
                  ) : (
                    summary.breakdown.map((row) => (
                      <div
                        key={row.category}
                        data-testid="breakdown-row"
                        className="flex items-center justify-between p-2 rounded-md bg-card border text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span data-testid="breakdown-name" className="font-medium">
                            {row.category}
                          </span>
                          <Badge variant="secondary" data-testid="breakdown-count" className="text-xs">
                            {row.count}
                          </Badge>
                        </div>
                        <span data-testid="breakdown-total" className="font-semibold text-foreground">
                          {row.total.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Filters & Expense List */}
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
                    placeholder="Search title or note..."
                    className="pl-9"
                  />
                </div>

                {/* Category Filter */}
                <div className="sm:col-span-4">
                  <select
                    data-testid="filter-category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">All Categories</option>
                    {ALLOWED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starred Checkbox & Reset */}
                <div className="sm:col-span-3 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="filter-starred"
                      checked={starredFilter}
                      onChange={(e) => setStarredFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Starred
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

          {/* Expense List */}
          <div data-testid="expense-list" className="space-y-3">
            {expenses.length === 0 ? (
              <div
                data-testid="expenses-empty"
                className="p-8 text-center border-2 border-dashed rounded-lg bg-card text-muted-foreground font-medium"
              >
                No expenses found
              </div>
            ) : (
              expenses.map((item) => (
                <div
                  key={item.id}
                  data-testid="expense-item"
                  className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-primary/40"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span data-testid="expense-title" className="font-semibold text-base">
                        {item.title}
                      </span>
                      <Badge variant="outline" data-testid="expense-category">
                        {item.category}
                      </Badge>
                      <span data-testid="expense-date" className="text-xs text-muted-foreground">
                        {item.spentAt}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span data-testid="expense-amount" className="text-lg font-bold text-primary">
                      {item.amount.toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-testid="btn-toggle-star"
                        aria-pressed={item.starred ? "true" : "false"}
                        onClick={() => toggleStar(item.id)}
                        className={item.starred ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-foreground"}
                        title={item.starred ? "Unstar" : "Star"}
                      >
                        <Star className={`h-5 w-5 ${item.starred ? "fill-current" : ""}`} />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-testid="btn-delete-expense"
                        onClick={() => deleteExpense(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete expense"
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

