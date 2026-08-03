import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/app/api/_lib/cookies";
import { TenantsProvider } from "@/context/TenantsContext";
import { UserProvider } from "@/context/UserContext";
import { APP_NAME } from "@/lib/app";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.has(ACCESS_TOKEN_COOKIE) ||
    cookieStore.has(REFRESH_TOKEN_COOKIE);

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <UserProvider initialStatus={hasSession ? "loading" : "signedOut"}>
          <TenantsProvider>{children}</TenantsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
