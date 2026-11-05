import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wallet, PieChart, Tag, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center space-y-4 mb-16">
        <h1 data-testid="home-title" className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          ExpenseTrail
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A smart, simple way to track your personal spending, categorize expenses, and see where your money goes.
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
            <Wallet className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Track spending</CardTitle>
            <CardDescription>
              Log each expense with its title, amount, date, and custom notes in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Never lose track of where your hard-earned money went with immediate updates.
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <Tag className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Sort into categories</CardTitle>
            <CardDescription>
              Organize purchases into Food, Transport, Bills, Shopping, and Other.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Filter instantly by category or search through notes with flexible controls.
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <PieChart className="h-8 w-8 text-primary mb-2" />
            <CardTitle>See where it goes</CardTitle>
            <CardDescription>
              Real-time summary breakdown showing totals and counts by category.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Star important expenses and monitor total spending at a glance.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

