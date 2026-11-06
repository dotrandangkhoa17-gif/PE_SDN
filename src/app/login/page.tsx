"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (valEmail: string, valPass: string) => {
    let isValid = true;
    const emailTrimmed = valEmail.trim();

    if (!emailTrimmed) {
      setEmailError("Email is required");
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setEmailError("Please enter a valid email address");
        isValid = false;
      } else {
        setEmailError("");
      }
    }

    if (!valPass) {
      setPasswordError("Password is required");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (hasSubmitted) {
      validate(val, password);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (hasSubmitted) {
      validate(email, val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setServerError("");

    const isValid = validate(email, password);
    if (!isValid) return;

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      router.push("/reading-logs");
    } else {
      setServerError(result.error || "Invalid email or password");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-sky-50/60 via-white to-sky-50/40">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[250px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <Card className="w-full max-w-md border-sky-100 shadow-xl shadow-sky-500/5 rounded-2xl bg-white/95 backdrop-blur">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/20 mb-1">
            <BookOpen className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Sign In to ReadLog</CardTitle>
          <CardDescription className="text-slate-500">Access your personal reading sessions and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            data-testid="login-form"
            noValidate
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {serverError && (
              <div
                data-testid="error-auth"
                className="p-3 text-sm rounded-xl bg-red-50 text-red-600 border border-red-200 font-medium"
              >
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                data-testid="login-email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
              />
              {emailError && (
                <p data-testid="error-email" className="text-xs text-red-600 mt-1 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                data-testid="login-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="rounded-xl border-sky-100 focus:border-sky-400 focus:ring-sky-400/20"
              />
              {passwordError && (
                <p data-testid="error-password" className="text-xs text-red-600 mt-1 font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              data-testid="login-submit"
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-xl h-11 font-medium transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-slate-500 pt-2">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-sky-600 hover:text-sky-700 font-semibold hover:underline">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
