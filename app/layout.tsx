import type { Metadata } from "next";
import { Inter, Merriweather, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Merriweather({ 
  weight: ["300", "400", "700", "900"], 
  subsets: ["latin"], 
  variable: "--font-serif" 
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XCPC Contest System",
  description: "Algorithm Contest Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${serif.variable} ${geistSans.variable} ${geistMono.variable} bg-gray-50 min-h-screen flex flex-col font-sans`}
      >
        <Navbar />

        {/* 主内容区域 */}
        <main className="flex justify-center w-full max-w-full mx-auto p-4 sm:p-6 lg:p-8 bg-zinc-100">
          {children}
        </main>

        {/* 底部 Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-6 px-4 text-center">
            <p className="text-gray-500 text-xs">
              China West Normal University<br />
              XCPC Online Judge © 2026
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
