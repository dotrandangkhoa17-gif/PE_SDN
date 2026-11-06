import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, BookmarkCheck, BarChart3, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center space-y-4 mb-16">
        <h1 data-testid="home-title" className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          ReadLog
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A personal reading session tracker: keep track of what books you read, how many minutes you spent, what genre, and your favorite sessions.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Log every session</CardTitle>
            <CardDescription>
              Record each reading session with the book title, minutes read, date, and notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Never lose track of your reading habits and daily progress.
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <BookmarkCheck className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Sort by genre</CardTitle>
            <CardDescription>
              Categorize sessions into Fiction, Non-Fiction, Sci-Fi, Biography, and Other.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Instant filtering by genre or book title with quick search controls.
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>See minutes read</CardTitle>
            <CardDescription>
              Live summary breakdown calculating total minutes read per genre.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Mark your favorite reading sessions and see detailed reading metrics.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
