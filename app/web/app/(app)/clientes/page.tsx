"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  Users, Loader2, AlertTriangle, Eye, X, Calendar, Mail,
  MapPin, Globe, Clock,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { listCustomers, deleteCustomer } from "@/services/customers";
import type { Customer, CustomerQuery } from "@/types/customer";

const PAGE_LIMIT = 10;

const REGIONS = [
  { label: "Sul",          value: "sul",          states: ["PR", "RS", "SC"] },
  { label: "Sudeste",      value: "sudeste",      states: ["ES", "MG", "RJ", "SP"] },
  { label: "Nordeste",     value: "nordeste",     states: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"] },
  { label: "Norte",        value: "norte",        states: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"] },
  { label: "Centro-Oeste", value: "centro-oeste", states: ["DF", "GO", "MS", "MT"] },
];

/* ── Debounce ── */
function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* ── Sample data ── */
const SAMPLE: Customer[] = [
  { id: "d1", name: "Maria Silva Santos",          email: "maria.silva@gmail.com",            city: "São Paulo",      state: "SP", country: "Brazil", createdAt: "2024-11-15T10:00:00Z", updatedAt: "2024-11-15T10:00:00Z" },
  { id: "d2", name: "Grupo Empresarial ABC Ltda.", email: "contato@grupoabc.com.br",           city: "Rio de Janeiro", state: "RJ", country: "Brazil", createdAt: "2024-10-28T10:00:00Z", updatedAt: "2024-10-28T10:00:00Z" },
  { id: "d3", name: "João Carlos Ferreira",        email: "jcarlos.ferreira@hotmail.com",     city: "Belo Horizonte", state: "MG", country: "Brazil", createdAt: "2024-09-03T10:00:00Z", updatedAt: "2024-09-03T10:00:00Z" },
  { id: "d4", name: "Tech Solutions Nordeste S.A.",email: "vendas@techsolutions-ne.com",      city: "Recife",         state: "PE", country: "Brazil", createdAt: "2024-08-20T10:00:00Z", updatedAt: "2024-08-20T10:00:00Z" },
  { id: "d5", name: "Ana Beatriz Oliveira",        email: "ana.beatriz.oli@outlook.com",      city: "Curitiba",       state: "PR", country: "Brazil", createdAt: "2025-01-08T10:00:00Z", updatedAt: "2025-01-08T10:00:00Z" },
  { id: "d6", name: "Distribuidora Pinheiro Ltda.",email: "financeiro@distribpinheiro.com.br",city: "Joinville",      state: "SC", country: "Brazil", createdAt: "2024-07-12T10:00:00Z", updatedAt: "2024-07-12T10:00:00Z" },
  { id: "d7", name: "Carlos Eduardo Ramos",        email: "carlos.ramos@yahoo.com.br",        city: "Goiânia",        state: "GO", country: "Brazil", createdAt: "2025-02-02T10:00:00Z", updatedAt: "2025-02-02T10:00:00Z" },
];

/* ── Avatar ── */
const AV_COLORS = [
  { bg: "#EFF6FF", text: "#3b5bdb" }, { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#F0FDF4", text: "#15803D" }, { bg: "#FDF4FF", text: "#9333EA" },
  { bg: "#FFF1F2", text: "#BE123C" }, { bg: "#ECFEFF", text: "#0E7490" },
  { bg: "#FEFCE8", text: "#A16207" },
];
function avColor(name: string) {
  return AV_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % AV_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
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
function isRecent(iso: string) {
  return (Date.now() - new Date(iso).getTime()) < 60 * 24 * 3600 * 1000;
}

/* ── Skeleton ── */
function SkeletonRow({ delay }: { delay: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #f8f9fc" }}>
      {[12, 40, 40, 24, 20, 16, 20].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton-shimmer h-3.5 rounded" style={{ width: `${w * 2}px`, maxWidth: "100%", animationDelay: `${delay + i * 30}ms` }} />
        </td>
      ))}
    </tr>
  );
}

/* ── StatusBadge ── */
function StatusBadge({ createdAt }: { createdAt: string }) {
  const recent = isRecent(createdAt);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: recent ? "#F0FDF4" : "#f8f9fc", color: recent ? "#15803D" : "#5c6278", border: `1px solid ${recent ? "#BBF7D0" : "#e2e6ef"}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: recent ? "#22C55E" : "#9da3b4" }} />
      Ativo
    </span>
  );
}

/* ── DateRangePicker ── */
function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
}) {
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
    ? value.to
      ? `${fmtShort(value.from)} → ${fmtShort(value.to)}`
      : fmtShort(value.from)
    : "Período";

  const active = !!value?.from;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 rounded-xl text-xs font-medium transition-all"
        style={{
          height: "36px",
          background: active ? "#EFF6FF" : "#fff",
          border: `1.5px solid ${open || active ? "#3b5bdb" : "#e2e6ef"}`,
          color: active ? "#3b5bdb" : "#5c6278",
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: open ? "0 0 0 3px rgba(29,78,216,0.1)" : "none",
        }}
      >
        <Calendar size={13} />
        {label}
        {active && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(undefined); }}
            className="flex items-center"
            style={{ color: "#9da3b4", cursor: "pointer" }}
          >
            <X size={12} />
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            background: "#fff",
            border: "1px solid #e2e6ef",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(15,23,42,0.14)",
            padding: "12px",
          }}
        >
          <DayPicker
            mode="range"
            selected={value}
            onSelect={r => {
              onChange(r);
              if (r?.from && r?.to) setOpen(false);
            }}
          />
          {value?.from && (
            <div style={{ textAlign: "right", paddingTop: "8px", borderTop: "1px solid #F1F5F9" }}>
              <button
                onClick={() => { onChange(undefined); setOpen(false); }}
                style={{ fontSize: "12px", color: "#9da3b4", background: "none", border: "none", cursor: "pointer" }}
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ViewModal ── */
function InfoRow({ label, value, icon: Icon, muted }: { label: string; value: string; icon?: React.ElementType; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid #f8f9fc" }}>
      {Icon && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f8f9fc" }}>
          <Icon size={13} style={{ color: "#9da3b4" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-0.5" style={{ color: "#9da3b4" }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: muted ? "#9da3b4" : "#1a1d2e", fontStyle: muted ? "italic" : "normal" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function ViewModal({ customer, onClose, onEdit }: { customer: Customer; onClose(): void; onEdit(): void }) {
  const av = avColor(customer.name);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: "440px",
          background: "#fff",
          border: "1px solid #e2e6ef",
          boxShadow: "0 24px 64px rgba(15,23,42,0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <p className="text-sm font-semibold" style={{ color: "#1a1d2e" }}>Detalhes do cliente</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: "#F1F5F9", border: "none", cursor: "pointer", color: "#5c6278" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold shrink-0"
              style={{ background: av.bg, color: av.text }}
            >
              {initials(customer.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: "#1a1d2e" }}>{customer.name}</p>
              <div className="mt-1.5">
                <StatusBadge createdAt={customer.createdAt} />
              </div>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className="px-6 pb-2">
          <InfoRow label="E-mail"        value={customer.email}              icon={Mail}    />
          <InfoRow label="Cidade"        value={customer.city}               icon={MapPin}  />
          <InfoRow label="Estado"        value={customer.state}              icon={MapPin}  />
          <InfoRow label="País"          value={customer.country}            icon={Globe}   />
          <InfoRow label="Cadastrado em" value={fmtDateTime(customer.createdAt)} icon={Clock} />
          <InfoRow
            label="Atualizado em"
            value={customer.updatedAt !== customer.createdAt ? fmtDateTime(customer.updatedAt) : "Nenhuma alteração registrada"}
            icon={Clock}
            muted={customer.updatedAt === customer.createdAt}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4" style={{ borderTop: "1px solid #F1F5F9" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl"
            style={{ background: "#F1F5F9", color: "#374151", border: "none", cursor: "pointer" }}
          >
            Fechar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            style={{
              background: "#3b5bdb",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(29,78,216,0.28)",
            }}
          >
            <Pencil size={13} />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ── */
function ConfirmDialog({ name, onConfirm, onCancel, loading }: { name: string; onConfirm(): void; onCancel(): void; loading: boolean }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e6ef", boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
          <AlertTriangle size={20} style={{ color: "#DC2626" }} />
        </div>
        <h3 className="font-semibold text-base mb-1" style={{ color: "#1a1d2e" }}>Excluir cliente</h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "#5c6278" }}>
          Tem certeza que deseja excluir <span className="font-semibold" style={{ color: "#1a1d2e" }}>{name}</span>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: "#F1F5F9", color: "#374151", border: "none", cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            style={{ background: loading ? "#FCA5A5" : "#DC2626", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 12px rgba(220,38,38,0.3)" }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ClientesPage() {
  const router = useRouter();
  const [customers,     setCustomers]     = useState<Customer[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [regiaoFilter,  setRegiaoFilter]  = useState("");
  const [dateRange,     setDateRange]     = useState<DateRange | undefined>();
  const [deleteTarget,  setDeleteTarget]  = useState<Customer | null>(null);
  const [viewTarget,    setViewTarget]    = useState<Customer | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState("");
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);
  const [usingSample,   setUsingSample]   = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchCustomers = useCallback(async (q: CustomerQuery) => {
    setLoading(true);
    setError("");
    try {
      const result = await listCustomers(q);
      if (result.data.length === 0 && q.page === 1 && !q.name) {
        setCustomers(SAMPLE as unknown as Customer[]);
        setTotal(SAMPLE.length);
        setUsingSample(true);
      } else {
        setCustomers(result.data);
        setTotal(result.total);
        setUsingSample(false);
      }
    } catch {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers({ page, limit: PAGE_LIMIT, name: debouncedSearch || undefined });
  }, [page, debouncedSearch, fetchCustomers]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function handleDelete() {
    if (!deleteTarget || usingSample) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      fetchCustomers({ page, limit: PAGE_LIMIT, name: debouncedSearch || undefined });
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setRegiaoFilter("");
    setDateRange(undefined);
    setPage(1);
  }

  /* Client-side filter for region + date (API handles name) */
  const displayCustomers = customers.filter(c => {
    if (regiaoFilter) {
      const region = REGIONS.find(r => r.value === regiaoFilter);
      if (region && !region.states.includes(c.state)) return false;
    }
    if (dateRange?.from) {
      const d = new Date(c.createdAt);
      if (d < dateRange.from) return false;
    }
    if (dateRange?.to) {
      const d    = new Date(c.createdAt);
      const end  = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const hasFilters = !!(search || regiaoFilter || dateRange?.from);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to   = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full" style={{ background: "#f8f9fc" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1a1d2e" }}>Clientes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#5c6278" }}>
            {loading ? "Carregando..." : `${usingSample ? "123" : total} cliente${total !== 1 ? "s" : ""} cadastrado${total !== 1 ? "s" : ""}`}
            {usingSample && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "#FEF9C3", color: "#A16207" }}>demo</span>}
          </p>
        </div>
        <button
          onClick={() => router.push("/clientes/novo")}
          className="shrink-0 flex items-center gap-2 text-sm font-semibold text-white rounded-xl"
          style={{ padding: "10px 18px", background: "#3b5bdb", border: "none", cursor: "pointer", boxShadow: "0 1px 2px rgba(29,78,216,0.2), 0 4px 16px rgba(29,78,216,0.25)" }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Novo cliente</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* ── Search ── */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-3.5 mb-3 transition-all"
        style={{ background: "#fff", border: `1.5px solid ${searchFocused ? "#3b5bdb" : "#e2e6ef"}`, height: "46px", boxShadow: searchFocused ? "0 0 0 3px rgba(29,78,216,0.1)" : "0 1px 3px rgba(15,23,42,0.06)" }}
      >
        <Search size={16} style={{ color: searchFocused ? "#3b5bdb" : "#9da3b4", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Pesquisar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 text-sm outline-none"
          style={{ background: "transparent", color: "#1a1d2e", border: "none" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="p-0.5 rounded" style={{ color: "#9da3b4", background: "none", border: "none", cursor: "pointer" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Região */}
        <div
          className="flex items-center gap-2 px-3 rounded-xl"
          style={{ background: regiaoFilter ? "#EFF6FF" : "#fff", border: `1.5px solid ${regiaoFilter ? "#3b5bdb" : "#e2e6ef"}`, height: "36px", minWidth: "160px" }}
        >
          <MapPin size={13} style={{ color: regiaoFilter ? "#3b5bdb" : "#9da3b4", flexShrink: 0 }} />
          <select
            value={regiaoFilter}
            onChange={e => { setRegiaoFilter(e.target.value); setPage(1); }}
            className="flex-1 text-xs outline-none font-medium"
            style={{ background: "transparent", border: "none", color: regiaoFilter ? "#3b5bdb" : "#5c6278", cursor: "pointer" }}
          >
            <option value="">Todas as regiões</option>
            {REGIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="h-6 w-px shrink-0" style={{ background: "#e2e6ef" }} />

        {/* Date range */}
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* Clear */}
        {hasFilters && (
          <>
            <div className="h-6 w-px shrink-0" style={{ background: "#e2e6ef" }} />
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium transition-colors"
              style={{ height: "36px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}
            >
              <X size={12} />
              Limpar
            </button>
          </>
        )}

      </div>

      {/* ── Error ── */}
      {error && (
        <div className="text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
          <AlertTriangle size={14} />{error}
        </div>
      )}

      {/* ── Table card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e2e6ef", boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: "680px" }}>
            <thead>
              <tr style={{ background: "#f8f9fc", borderBottom: "2px solid #e2e6ef" }}>
                {["Nome Completo", "E-mail", "Localização", "Cadastro", "Status", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider" style={{ color: "#9da3b4" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} delay={i * 60} />)
              ) : displayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F1F5F9" }}>
                      <Users size={26} style={{ color: "#CBD5E1" }} />
                    </div>
                    <p className="font-medium text-sm mb-1" style={{ color: "#374151" }}>
                      {hasFilters ? "Nenhum resultado" : "Nenhum cliente ainda"}
                    </p>
                    <p className="text-xs" style={{ color: "#9da3b4" }}>
                      {hasFilters ? "Ajuste os filtros ou limpe a busca." : "Clique em \"Novo cliente\" para começar."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayCustomers.map((c, idx) => {
                  const av      = avColor(c.name);
                  const hovered = hoveredRow === c.id;
                  return (
                    <tr
                      key={c.id}
                      className="row-enter"
                      onMouseEnter={() => setHoveredRow(c.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: idx < displayCustomers.length - 1 ? "1px solid #f8f9fc" : "none",
                        background: hovered ? "#FAFBFF" : "#fff",
                        borderLeft: `3px solid ${hovered ? "#93C5FD" : "transparent"}`,
                        transition: "background 0.1s ease, border-left-color 0.12s ease",
                        animationDelay: `${idx * 35}ms`,
                      }}
                    >
                      {/* Nome */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: av.bg, color: av.text }}>
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: "#1a1d2e", maxWidth: "160px" }}>{c.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm truncate" style={{ color: "#374151", maxWidth: "180px" }}>{c.email}</p>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm" style={{ color: "#374151" }}>{c.city}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9da3b4" }}>{c.state}</p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "#5c6278" }}>
                        {fmtDate(c.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge createdAt={c.createdAt} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div
                          className="flex items-center gap-1"
                          style={{ opacity: hovered ? 1 : 0.25, transition: "opacity 0.15s ease" }}
                        >
                          {/* View — opens modal */}
                          <button
                            onClick={() => setViewTarget(c)}
                            title="Visualizar"
                            className="p-2 rounded-lg transition-all"
                            style={{
                              color: "#3b5bdb",
                              background: hovered ? "#EFF6FF" : "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit — goes to edit page */}
                          <button
                            onClick={() => router.push(`/clientes/${c.id}`)}
                            title="Editar"
                            className="p-2 rounded-lg transition-all"
                            style={{
                              color: "#5c6278",
                              background: hovered ? "#F1F5F9" : "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => !usingSample && setDeleteTarget(c)}
                            title="Excluir"
                            className="p-2 rounded-lg transition-all"
                            style={{
                              color: "#EF4444",
                              background: hovered ? "#FFF1F2" : "none",
                              border: "none",
                              cursor: usingSample ? "default" : "pointer",
                            }}
                          >
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

        {/* ── Pagination ── */}
        {!loading && total > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3"
            style={{ borderTop: "1px solid #e2e6ef" }}
          >
            <p className="text-xs" style={{ color: "#9da3b4" }}>
              Exibindo <strong style={{ color: "#475569" }}>{from}–{to}</strong> de{" "}
              <strong style={{ color: "#475569" }}>{usingSample ? "123" : total}</strong> registros
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: "#f8f9fc", border: "1px solid #e2e6ef", color: "#475569", cursor: page === 1 ? "not-allowed" : "pointer" }}
              >
                <ChevronLeft size={14} />
              </button>

              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium"
                    style={{ background: active ? "#3b5bdb" : "#f8f9fc", border: `1px solid ${active ? "#3b5bdb" : "#e2e6ef"}`, color: active ? "#fff" : "#475569", cursor: "pointer", boxShadow: active ? "0 2px 8px rgba(29,78,216,0.25)" : "none" }}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-xs px-1" style={{ color: "#9da3b4" }}>…</span>}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: "#f8f9fc", border: "1px solid #e2e6ef", color: "#475569", cursor: page === totalPages ? "not-allowed" : "pointer" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {viewTarget && (
        <ViewModal
          customer={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setViewTarget(null); router.push(`/clientes/${viewTarget.id}`); }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
