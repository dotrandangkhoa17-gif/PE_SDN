import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ReadingLogProvider } from "@/context/ReadingLogContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ReadLog",
  description: "Track and manage your reading sessions easily",
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
          <ReadingLogProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </ReadingLogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


