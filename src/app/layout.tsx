import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/query-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESPN Fantasy Football Dashboard",
  description: "A dashboard for your ESPN fantasy football league.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-950 to-purple-950 min-h-screen`}
      >
        <QueryProvider>
          <Header />
          <main className="container mx-auto mt-6 px-2 sm:px-6">
            {children}
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
