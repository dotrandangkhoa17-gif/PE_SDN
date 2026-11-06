import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, BookmarkCheck, BarChart3, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-sky-50/60 via-white to-sky-50/40">
      {/* Background soft ambient blur blobs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-sky-200/50 via-cyan-100/40 to-blue-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl">
        <div className="text-center space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <span>Smart Personal Reading Journal</span>
          </div>

          <h1
            data-testid="home-title"
            className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-sky-800 via-sky-600 to-cyan-600 bg-clip-text text-transparent"
          >
            ReadLog
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A tranquil personal space to record your daily reading sessions, track minutes read by genre, and highlight your favorite literary journeys.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-lg shadow-sky-500/25 px-8 rounded-xl font-medium"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-sky-200 bg-white/80 hover:bg-sky-50 text-sky-800 px-8 rounded-xl font-medium"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <Card className="border-sky-100/80 bg-white/90 backdrop-blur shadow-sm hover:shadow-md hover:border-sky-300 transition-all rounded-2xl group">
            <CardHeader className="pb-3">
              <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 mb-3 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-slate-800">Log every session</CardTitle>
              <CardDescription className="text-slate-500 leading-normal">
                Record each reading session with the book title, minutes read, date, and key notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-sky-700 font-medium">
              Real-time update without full page reloads.
            </CardContent>
          </Card>

          <Card className="border-sky-100/80 bg-white/90 backdrop-blur shadow-sm hover:shadow-md hover:border-sky-300 transition-all rounded-2xl group">
            <CardHeader className="pb-3">
              <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 mb-3 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-sm">
                <BookmarkCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-slate-800">Sort by genre</CardTitle>
              <CardDescription className="text-slate-500 leading-normal">
                Categorize your library into Fiction, Non-Fiction, Sci-Fi, Biography, and Other.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-cyan-700 font-medium">
              Instant multi-filter search and favorites toggle.
            </CardContent>
          </Card>

          <Card className="border-sky-100/80 bg-white/90 backdrop-blur shadow-sm hover:shadow-md hover:border-sky-300 transition-all rounded-2xl group">
            <CardHeader className="pb-3">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-slate-800">See minutes read</CardTitle>
              <CardDescription className="text-slate-500 leading-normal">
                Live summary breakdown computing total reading time and favorite session counts.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-blue-700 font-medium">
              Dynamic genre-based time allocation metrics.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
