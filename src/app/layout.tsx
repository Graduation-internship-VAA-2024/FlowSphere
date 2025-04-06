import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "sonner";
import { ClientLayoutWrapper } from "@/components/client-layout-wrapper";

const inter = Inter({
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={cn(inter.className, "antialiased min-h-screen")}>
        <Toaster />
        <QueryProvider>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
