"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users, LayoutDashboard, LogOut,
  Package, ShoppingCart, PanelLeftClose, PanelLeftOpen,
  BarChart3, Menu, X, Brain,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/clientes",   label: "Clientes",   icon: Users },
  { href: "/produtos",   label: "Produtos",   icon: Package },
  { href: "/pedidos",    label: "Pedidos",    icon: ShoppingCart },
  { href: "/analytics",  label: "Analytics",  icon: Brain },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const T = "220ms cubic-bezier(0.4, 0, 0.2, 1)";

interface SidebarProps {
  collapsed:     boolean;
  onToggle():    void;
  mobileOpen:    boolean;
  onMobileClose(): void;
}

function LogoutConfirmDialog({ onConfirm, onCancel }: { onConfirm(): void; onCancel(): void }) {
  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, padding: "28px 28px 24px",
          width: "100%", maxWidth: 360,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          border: "1px solid #e2e6ef",
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <LogOut size={18} style={{ color: "#fa5252" }} aria-hidden="true" />
        </div>
        <h3 id="logout-dialog-title" style={{ fontSize: 15, fontWeight: 600, color: "#1a1d2e", margin: "0 0 6px" }}>
          Sair da conta?
        </h3>
        <p style={{ fontSize: 13, color: "#5c6278", margin: "0 0 20px", lineHeight: 1.5 }}>
          Sua sessão será encerrada. Você precisará fazer login novamente para acessar o sistema.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 38, borderRadius: 8, border: "1.5px solid #e2e6ef",
              background: "#fff", color: "#5c6278", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, height: 38, borderRadius: 8, border: "none",
              background: "#fa5252", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout, user } = useAuthStore();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
    : "";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const iconZoneW = collapsed ? 48 : 40;

  const sidebarContent = (
    <aside
      style={{
        width:      collapsed ? 64 : 220,
        minWidth:   collapsed ? 64 : 220,
        background: "#1e2139",
        display:    "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow:   "hidden",
        height:     "100%",
        transition: `width ${T}, min-width ${T}`,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {/* Logo — fades out when collapsed */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            flex: collapsed ? "0 0 0px" : "1 1 auto",
            overflow: "hidden",
            opacity: collapsed ? 0 : 1,
            transition: `flex ${T}, opacity 0.15s ease`,
          }}
        >
          <div
            style={{
              width: 28, height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #3b5bdb, #6366f1)",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart3 size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#fff", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
            DataNexus
          </span>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{
            marginLeft: "auto",
            width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 7, border: "none", cursor: "pointer",
            background: "none", color: "#8b92b3", flexShrink: 0,
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#8b92b3"; }}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav
        aria-label="Navegação principal"
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              onClick={onMobileClose}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 14,
                color: active ? "#fff" : "#8b92b3",
                background: active ? "#3b5bdb" : "transparent",
                transition: "background 150ms, color 150ms",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = "#c4c9e0";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#8b92b3";
                }
              }}
            >
              <span
                style={{
                  width: iconZoneW,
                  height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: `width ${T}`,
                }}
              >
                <Icon
                  size={17}
                  style={{
                    color: active ? "#fff" : "#8b92b3",
                    flexShrink: 0,
                    transition: "color 150ms",
                  }}
                />
              </span>
              <span
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  maxWidth: collapsed ? 0 : 160,
                  opacity: collapsed ? 0 : 1,
                  paddingRight: 8,
                  transition: `max-width ${T}, opacity 0.15s ease`,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 8px",
          flexShrink: 0,
        }}
      >
        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", overflow: "hidden", marginBottom: 2 }}>
          <span
            style={{
              width: iconZoneW,
              height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: `width ${T}`,
            }}
          >
            <div
              title={displayName || "Usuário"}
              style={{
                width: 28, height: 28,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                background: "#3b5bdb",
                color: "#fff",
              }}
            >
              {displayName ? getInitials(displayName) : "?"}
            </div>
          </span>
          <div
            style={{
              flex: collapsed ? "0 0 0px" : "1 1 auto",
              overflow: "hidden",
              opacity: collapsed ? 0 : 1,
              transition: `flex ${T}, opacity 0.15s ease`,
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e6f0", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName || "Usuário"}
            </p>
            <p style={{ fontSize: 11, color: "#8b92b3", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setConfirmLogout(true)}
          title={collapsed ? "Sair" : undefined}
          aria-label="Sair da conta"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            border: "none",
            cursor: "pointer",
            background: "none",
            color: "#f87171",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            overflow: "hidden",
            transition: "background 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <span
            style={{
              width: iconZoneW,
              height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: `width ${T}`,
            }}
          >
            <LogOut size={15} />
          </span>
          <span
            style={{
              overflow: "hidden",
              whiteSpace: "nowrap",
              maxWidth: collapsed ? 0 : 120,
              opacity: collapsed ? 0 : 1,
              paddingRight: 8,
              transition: `max-width ${T}, opacity 0.15s ease`,
            }}
          >
            Sair
          </span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {sidebarContent}
      {confirmLogout && (
        <LogoutConfirmDialog
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const pathname = usePathname();

  /* Close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Close on Esc */
  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === "Escape") setMobileOpen(false); }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: "#f8f9fc" }}>

        {/* ── Desktop sidebar ── */}
        <div className="hidden md:flex">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
            mobileOpen={false}
            onMobileClose={() => {}}
          />
        </div>

        {/* ── Mobile drawer overlay ── */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Mobile drawer ── */}
        <div
          className="md:hidden fixed inset-y-0 left-0 z-50 flex"
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: `transform ${T}`,
          }}
        >
          <Sidebar
            collapsed={false}
            onToggle={() => setCollapsed(c => !c)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          {/* Close button on drawer edge */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              style={{
                position: "absolute", top: 14, right: -40,
                width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.15)", borderRadius: 8,
                border: "none", cursor: "pointer", color: "#fff",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          {/* Mobile top bar */}
          <div
            className="md:hidden flex items-center h-14 px-4 shrink-0"
            style={{
              background: "#1e2139",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu de navegação"
              style={{
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: "rgba(255,255,255,0.08)", color: "#8b92b3",
              }}
            >
              <Menu size={18} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
              <div
                style={{
                  width: 24, height: 24,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #3b5bdb, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <BarChart3 size={12} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>DataNexus</span>
            </div>
          </div>

          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
