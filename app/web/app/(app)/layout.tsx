"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Users, LayoutDashboard, LogOut, ChevronRight } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/clientes",  label: "Clientes",   icon: Users },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    { bg: "#EFF6FF", text: "#1D4ED8" },
    { bg: "#F0FDF4", text: "#15803D" },
    { bg: "#FDF4FF", text: "#9333EA" },
    { bg: "#FFF7ED", text: "#C2410C" },
    { bg: "#ECFEFF", text: "#0E7490" },
  ];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % colors.length;
  return colors[idx];
}

function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout, user } = useAuthStore();

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
    : "";
  const av = displayName ? avatarColor(displayName) : { bg: "#EFF6FF", text: "#1D4ED8" };

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: "232px",
        background: "#fff",
        borderRight: "1px solid #EEF2F7",
        boxShadow: "1px 0 0 #EEF2F7",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid #EEF2F7", height: "60px" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #1D4ED8, #4F46E5)", boxShadow: "0 2px 8px rgba(29,78,216,0.35)" }}
        >
          <BarChart3 size={15} className="text-white" />
        </div>
        <span
          className="font-bold text-sm tracking-tight"
          style={{ color: "#0F172A" }}
        >
          DataNexus
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p
          className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase"
          style={{ color: "#CBD5E1" }}
        >
          Menu
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
              style={{
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#1D4ED8" : "#64748B",
                textDecoration: "none",
              }}
            >
              <Icon
                size={16}
                style={{ color: active ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={13} style={{ color: "#93C5FD" }} />
              )}
            </a>
          );
        })}
      </nav>

      {/* ── User profile + logout ── */}
      <div
        className="px-3 py-4"
        style={{ borderTop: "1px solid #EEF2F7" }}
      >
        {/* User card */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: "#F8FAFC" }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: av.bg, color: av.text }}
          >
            {displayName ? getInitials(displayName) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "#0F172A" }}
            >
              {displayName || "Usuário"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "#94A3B8" }}
            >
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            color: "#EF4444",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F2")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
