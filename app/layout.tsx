import type { Metadata } from "next";
import { Inter, Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; 
import { TutorialProvider } from "@/components/tutorial/tutorial-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat-alternates",
  subsets: ["latin"],
  weight: "400",
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
        className={`${inter.variable} ${montserratAlternates.variable} antialiased bg-background text-[18px]`}
      >
        <TutorialProvider>
          {children}
        
        <Toaster 
          position="top-center" 
          richColors={true} 
          closeButton={true} 
        />
        
        </TutorialProvider>
      </body>
    </html>  );
}