import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ClientLayoutWrapper } from "@/components/client-layout-wrapper";
import { ClientChatWrapper } from "@/components/ChatBot/client-chat-wrapper";
import { QueryProvider } from "@/components/query-provider";
import { ChatProvider } from "@/components/ChatBot/context/ChatContext";

const inter = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FlowSphere",
  description: "FlowSphere - Hệ thống quản lý công việc và dự án trực tuyến",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(inter.className, "antialiased min-h-screen")}
      >
        <QueryProvider>
          <ChatProvider>
            <Toaster />
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
            <ClientChatWrapper />
          </ChatProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
