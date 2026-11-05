import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ExpenseTrail",
  description: "Track and manage your expenses easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ExpenseProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </ExpenseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


