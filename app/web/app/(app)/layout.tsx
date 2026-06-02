"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Users, LayoutDashboard, LogOut,
  Package, ShoppingCart, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes",  label: "Clientes",  icon: Users },
  { href: "/produtos",  label: "Produtos",  icon: Package },
  { href: "/pedidos",   label: "Pedidos",   icon: ShoppingCart },
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

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle(): void }) {
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
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: collapsed ? "64px" : "232px",
        background: "#fff",
        borderRight: "1px solid #EEF2F7",
        boxShadow: "1px 0 0 #EEF2F7",
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ── Logo + toggle ── */}
      <div
        className="flex items-center px-3 py-4"
        style={{
          borderBottom: "1px solid #EEF2F7",
          height: "60px",
          justifyContent: collapsed ? "center" : "space-between",
          gap: "8px",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94A3B8"; }}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-4 space-y-0.5" style={{ padding: collapsed ? "16px 8px" : "16px 12px" }}>
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase" style={{ color: "#CBD5E1" }}>
            Menu
          </p>
        )}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <a
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="flex items-center rounded-xl text-sm font-medium transition-all"
              style={{
                gap: collapsed ? 0 : "12px",
                padding: collapsed ? "10px" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#1D4ED8" : "#64748B",
                textDecoration: "none",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} style={{ color: active ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }} />
              {!collapsed && <span className="flex-1 whitespace-nowrap">{label}</span>}
            </a>
          );
        })}
      </nav>

      {/* ── User + logout ── */}
      <div
        className="py-4"
        style={{ borderTop: "1px solid #EEF2F7", padding: collapsed ? "16px 8px" : "16px 12px" }}
      >
        {collapsed ? (
          /* Avatar only when collapsed */
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: av.bg, color: av.text }}
              title={displayName || "Usuário"}
            >
              {displayName ? getInitials(displayName) : "?"}
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F2")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          /* Full user card when expanded */
          <>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{ background: "#F8FAFC" }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: av.bg, color: av.text }}
              >
                {displayName ? getInitials(displayName) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>
                  {displayName || "Usuário"}
                </p>
                <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
                  {user?.email ?? ""}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F2")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={14} />
              Sair
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
