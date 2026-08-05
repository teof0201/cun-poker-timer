import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CUN Poker Timer | Đồng hồ giải đấu Poker miễn phí",
  description:
    "Đồng hồ blind và công cụ tổ chức giải đấu Texas Hold'em miễn phí, không quảng cáo, không cần tài khoản.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const auth = await getAuthContext();
  const user = auth ? await prisma.user.findUnique({ where: { id: auth.userId } }) : null;

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <NavBar user={user ? { email: user.email, name: user.name } : null} />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
