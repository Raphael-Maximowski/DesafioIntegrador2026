"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  ShoppingCart, Loader2, AlertTriangle, Eye, X, Calendar,
  User, Package, Clock,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { listOrders, deleteOrder } from "@/services/orders";
import type { Order, OrderQuery, OrderStatus } from "@/types/order";

const PAGE_LIMIT = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* ── Formatters ── */
function fmtPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}
function fmtShort(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/* ── Status config ── */
const STATUS_CFG: Record<OrderStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
  PENDING:   { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B", label: "Pendente" },
  PAID:      { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", dot: "#22C55E", label: "Pago" },
  SHIPPED:   { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", dot: "#3B82F6", label: "Enviado" },
  CANCELLED: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0", dot: "#94A3B8", label: "Cancelado" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

/* ── Skeleton ── */
function SkeletonRow({ delay }: { delay: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #F8FAFC" }}>
      {[16, 40, 20, 20, 24, 20, 16].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton-shimmer h-3.5 rounded" style={{ width: `${w * 2}px`, maxWidth: "100%", animationDelay: `${delay + i * 30}ms` }} />
        </td>
      ))}
    </tr>
  );
}

/* ── DateRangePicker ── */
function DateRangePicker({ value, onChange }: { value: DateRange | undefined; onChange: (r: DateRange | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const label = value?.from
    ? value.to ? `${fmtShort(value.from)} → ${fmtShort(value.to)}` : fmtShort(value.from)
    : "Período";
  const active = !!value?.from;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 rounded-xl text-xs font-medium transition-all"
        style={{ height: "36px", background: active ? "#EFF6FF" : "#fff", border: `1.5px solid ${open || active ? "#1D4ED8" : "#E2E8F0"}`, color: active ? "#1D4ED8" : "#64748B", cursor: "pointer", whiteSpace: "nowrap", boxShadow: open ? "0 0 0 3px rgba(29,78,216,0.1)" : "none" }}>
        <Calendar size={13} />
        {label}
        {active && (
          <span role="button" onClick={e => { e.stopPropagation(); onChange(undefined); }} className="flex items-center" style={{ color: "#94A3B8", cursor: "pointer" }}>
            <X size={12} />
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, background: "#fff", border: "1px solid #E2E8F0", borderRadius: "16px", boxShadow: "0 8px 32px rgba(15,23,42,0.14)", padding: "12px" }}>
          <DayPicker mode="range" selected={value} onSelect={r => { onChange(r); if (r?.from && r?.to) setOpen(false); }} />
          {value?.from && (
            <div style={{ textAlign: "right", paddingTop: "8px", borderTop: "1px solid #F1F5F9" }}>
              <button type="button" onClick={() => { onChange(undefined); setOpen(false); }} style={{ fontSize: "12px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}>Limpar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ViewModal ── */
function ViewModal({ order, onClose, onEdit }: { order: Order; onClose(): void; onEdit(): void }) {
  const s = STATUS_CFG[order.status];
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: "480px", background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 24px 64px rgba(15,23,42,0.2)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Pedido #{shortId(order.id)}</p>
            <div className="mt-1"><StatusBadge status={order.status} /></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "#F1F5F9", border: "none", cursor: "pointer", color: "#64748B" }}>
            <X size={15} />
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-4 space-y-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
            <User size={13} style={{ color: "#94A3B8" }} />
            <span className="font-medium">{order.customer.name}</span>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>{order.customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
            <Clock size={12} />
            {fmtDateTime(order.createdAt)}
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4" style={{ maxHeight: "240px", overflowY: "auto" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>ITENS ({order.items.length})</p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F8FAFC" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Package size={12} style={{ color: "#CBD5E1", flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: "#374151" }}>{item.product?.name ?? "Produto removido"}</span>
                  <span className="text-xs shrink-0" style={{ color: "#94A3B8" }}>× {item.quantity}</span>
                </div>
                <span className="text-sm font-semibold ml-3 shrink-0" style={{ color: "#0F172A" }}>{fmtPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total + Footer */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid #F1F5F9" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: "#374151" }}>Total</span>
            <span className="text-base font-bold" style={{ color: "#0F172A" }}>{fmtPrice(order.totalPrice)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: "#F1F5F9", color: "#374151", border: "none", cursor: "pointer" }}>Fechar</button>
            <button onClick={onEdit} className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1D4ED8, #4F46E5)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(29,78,216,0.28)" }}>
              <Pencil size={13} />Gerenciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ── */
function ConfirmDialog({ onConfirm, onCancel, loading }: { onConfirm(): void; onCancel(): void; loading: boolean }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
          <AlertTriangle size={20} style={{ color: "#DC2626" }} />
        </div>
        <h3 className="font-semibold text-base mb-1" style={{ color: "#0F172A" }}>Excluir pedido</h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "#64748B" }}>Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: "#F1F5F9", color: "#374151", border: "none", cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            style={{ background: loading ? "#FCA5A5" : "#DC2626", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function PedidosPage() {
  const router = useRouter();
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter,  setStatusFilter]  = useState<OrderStatus | "">("");
  const [dateRange,     setDateRange]     = useState<DateRange | undefined>();
  const [viewTarget,    setViewTarget]    = useState<Order | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Order | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState("");
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const buildQuery = useCallback((): OrderQuery => {
    const q: OrderQuery = { page, limit: PAGE_LIMIT };
    if (statusFilter) q.status = statusFilter;
    if (dateRange?.from) q.createdAtFrom = dateRange.from.toISOString();
    if (dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      q.createdAtTo = end.toISOString();
    }
    return q;
  }, [page, statusFilter, dateRange]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listOrders(buildQuery());
      setOrders(result.data);
      setTotal(result.total);
    } catch {
      setError("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, dateRange]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrder(deleteTarget.id);
      setDeleteTarget(null);
      fetchOrders();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setDateRange(undefined);
    setPage(1);
  }

  /* client-side name filter (API não tem campo name) */
  const displayOrders = debouncedSearch
    ? orders.filter(o => o.customer.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : orders;

  const hasFilters = !!(search || statusFilter || dateRange?.from);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to   = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F172A" }}>Pedidos</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            {loading ? "Carregando..." : `${total} pedido${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => router.push("/pedidos/novo")}
          className="shrink-0 flex items-center gap-2 text-sm font-semibold text-white rounded-xl"
          style={{ padding: "10px 18px", background: "linear-gradient(135deg, #1D4ED8, #4F46E5)", border: "none", cursor: "pointer", boxShadow: "0 1px 2px rgba(29,78,216,0.2), 0 4px 16px rgba(29,78,216,0.25)" }}>
          <Plus size={15} />
          <span className="hidden sm:inline">Novo pedido</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 rounded-xl px-3.5 mb-3 transition-all"
        style={{ background: "#fff", border: `1.5px solid ${searchFocused ? "#1D4ED8" : "#E2E8F0"}`, height: "46px", boxShadow: searchFocused ? "0 0 0 3px rgba(29,78,216,0.1)" : "0 1px 3px rgba(15,23,42,0.06)" }}>
        <Search size={16} style={{ color: searchFocused ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }} />
        <input type="text" placeholder="Filtrar por nome do cliente..." value={search}
          onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          className="flex-1 text-sm outline-none" style={{ background: "transparent", color: "#0F172A", border: "none" }} />
        {search && <button onClick={() => setSearch("")} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Status */}
        <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: statusFilter ? "#EFF6FF" : "#fff", border: `1.5px solid ${statusFilter ? "#1D4ED8" : "#E2E8F0"}`, height: "36px", minWidth: "180px" }}>
          <ShoppingCart size={13} style={{ color: statusFilter ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OrderStatus | "")}
            className="flex-1 text-xs outline-none font-medium"
            style={{ background: "transparent", border: "none", color: statusFilter ? "#1D4ED8" : "#64748B", cursor: "pointer" }}>
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="SHIPPED">Enviado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="h-6 w-px shrink-0" style={{ background: "#E2E8F0" }} />
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {hasFilters && (
          <>
            <div className="h-6 w-px shrink-0" style={{ background: "#E2E8F0" }} />
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium"
              style={{ height: "36px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
              <X size={12} />Limpar
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
          <AlertTriangle size={14} />{error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E8EEF5", boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: "680px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #EEF2F7" }}>
                {["Pedido", "Cliente", "Itens", "Total", "Status", "Data", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} delay={i * 60} />)
              ) : displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F1F5F9" }}>
                      <ShoppingCart size={26} style={{ color: "#CBD5E1" }} />
                    </div>
                    <p className="font-medium text-sm mb-1" style={{ color: "#374151" }}>{hasFilters ? "Nenhum resultado" : "Nenhum pedido ainda"}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{hasFilters ? "Ajuste os filtros." : "Clique em \"Novo pedido\" para começar."}</p>
                  </td>
                </tr>
              ) : (
                displayOrders.map((o, idx) => {
                  const hovered = hoveredRow === o.id;
                  return (
                    <tr key={o.id} className="row-enter"
                      onMouseEnter={() => setHoveredRow(o.id)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: idx < displayOrders.length - 1 ? "1px solid #F8FAFC" : "none", background: hovered ? "#FAFBFF" : "#fff", borderLeft: `3px solid ${hovered ? "#93C5FD" : "transparent"}`, transition: "background 0.1s ease, border-left-color 0.12s ease", animationDelay: `${idx * 35}ms` }}>

                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded" style={{ background: "#F1F5F9", color: "#475569" }}>#{shortId(o.id)}</span>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium truncate" style={{ color: "#0F172A", maxWidth: "160px" }}>{o.customer.name}</p>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>{o.customer.city} · {o.customer.state}</p>
                      </td>

                      {/* Itens */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm" style={{ color: "#64748B" }}>{o.items.length} {o.items.length === 1 ? "item" : "itens"}</span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{fmtPrice(o.totalPrice)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "#64748B" }}>{fmtDate(o.createdAt)}</td>

                      {/* Ações */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1" style={{ opacity: hovered ? 1 : 0.25, transition: "opacity 0.15s ease" }}>
                          <button onClick={() => setViewTarget(o)} title="Visualizar" className="p-2 rounded-lg"
                            style={{ color: "#1D4ED8", background: hovered ? "#EFF6FF" : "none", border: "none", cursor: "pointer" }}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => router.push(`/pedidos/${o.id}`)} title="Gerenciar" className="p-2 rounded-lg"
                            style={{ color: "#64748B", background: hovered ? "#F1F5F9" : "none", border: "none", cursor: "pointer" }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(o)} title="Excluir" className="p-2 rounded-lg"
                            style={{ color: "#EF4444", background: hovered ? "#FFF1F2" : "none", border: "none", cursor: "pointer" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3" style={{ borderTop: "1px solid #EEF2F7" }}>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              Exibindo <strong style={{ color: "#475569" }}>{from}–{to}</strong> de <strong style={{ color: "#475569" }}>{total}</strong> registros
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pg = i + 1; const active = pg === page;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium"
                    style={{ background: active ? "#1D4ED8" : "#F8FAFC", border: `1px solid ${active ? "#1D4ED8" : "#E2E8F0"}`, color: active ? "#fff" : "#475569", cursor: "pointer", boxShadow: active ? "0 2px 8px rgba(29,78,216,0.25)" : "none" }}>
                    {pg}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-xs px-1" style={{ color: "#94A3B8" }}>…</span>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {viewTarget && <ViewModal order={viewTarget} onClose={() => setViewTarget(null)} onEdit={() => { setViewTarget(null); router.push(`/pedidos/${viewTarget.id}`); }} />}
      {deleteTarget && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
    </div>
  );
}
