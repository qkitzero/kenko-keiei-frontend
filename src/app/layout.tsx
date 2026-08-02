import AppShell from "@/components/AppShell";
import { TenantsProvider } from "@/context/TenantsContext";
import { UserProvider } from "@/context/UserContext";
import { APP_NAME } from "@/lib/app";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "健康経営ポータル",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <UserProvider>
          <TenantsProvider>
            <AppShell>{children}</AppShell>
          </TenantsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
