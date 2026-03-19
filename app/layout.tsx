import type { Metadata } from "next";
import { Gilda_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const gildaDisplay = Gilda_Display({
  variable: "--font-gilda-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets:["latin"],
});

export const metadata: Metadata = {
  title: "Soko",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${gildaDisplay.variable} ${inter.variable} antialiased bg-background`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
} 