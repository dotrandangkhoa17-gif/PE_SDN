"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          ExpenseTrail
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/expenses"
                data-testid="link-expenses"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Expenses
              </Link>
              <span data-testid="user-email" className="text-sm text-muted-foreground font-medium">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                data-testid="btn-logout"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="btn-login">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" data-testid="btn-register">
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

