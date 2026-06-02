"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

function Sidebar() {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-56 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <span className="font-semibold text-zinc-900 dark:text-white">
          DataNexus
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <a
          href="/dashboard"
          className="block px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Dashboard
        </a>
      </nav>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        {user && (
          <p className="text-xs text-zinc-500 mb-2 truncate">
            {user.firstName} {user.lastName}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
