"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavBar({ user }: { user: { email: string; name?: string | null } | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          CUN <span className="text-emerald-500">Poker</span> Timer
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/tournaments" className="hover:underline">
            Giải đấu
          </Link>
          {user ? (
            <>
              <span className="text-zinc-500">{user.name || user.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 px-3 py-1.5 font-medium text-black hover:bg-emerald-400"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
