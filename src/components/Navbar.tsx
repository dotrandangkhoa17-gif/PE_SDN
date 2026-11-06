"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sky-100 bg-white/80 backdrop-blur-md transition-all shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 bg-clip-text text-transparent">
            ReadLog
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              <Link
                href="/reading-logs"
                data-testid="link-reading-logs"
                className="text-sm font-medium text-sky-800 hover:text-sky-600 bg-sky-50/80 hover:bg-sky-100 px-3.5 py-1.5 rounded-lg border border-sky-100 transition-colors"
              >
                Reading Logs
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <User className="h-3.5 w-3.5 text-sky-500" />
                <span data-testid="user-email">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                data-testid="btn-logout"
                onClick={logout}
                className="border-sky-200 text-sky-800 hover:bg-sky-50 hover:text-sky-900 gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="btn-login"
                  className="text-sky-800 hover:bg-sky-50 hover:text-sky-900 font-medium"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  data-testid="btn-register"
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sm shadow-sky-500/25 font-medium"
                >
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
