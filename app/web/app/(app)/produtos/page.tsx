"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  Package, Loader2, AlertTriangle, Eye, X, Tag, Box,
  Mail, Clock,
} from "lucide-react";
import { listProducts, deleteProduct, listCategories } from "@/services/products";
import type { Product, Category, ProductQuery } from "@/types/product";

const PAGE_LIMIT = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* ── Sample data ── */
const SAMPLE: Product[] = [
  { id: "p1", name: "iPhone 15 Pro",        price: 7999.90, stock: 42,  category: { id: "c1", name: "Eletrônicos",    description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }, createdAt: "2024-11-10T10:00:00Z", updatedAt: "2024-11-10T10:00:00Z" },
  { id: "p2", name: "MacBook Air M3",       price: 11999.00, stock: 15, category: { id: "c1", name: "Eletrônicos",    description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }, createdAt: "2024-10-20T10:00:00Z", updatedAt: "2024-10-20T10:00:00Z" },
  { id: "p3", name: "Cadeira Gamer X500",   price: 1299.90, stock: 8,   category: { id: "c2", name: "Móveis",         description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }, createdAt: "2024-09-15T10:00:00Z", updatedAt: "2024-09-15T10:00:00Z" },
  { id: "p4", name: "Mesa de Escritório",   price: 899.00,  stock: 0,   category: { id: "c2", name: "Móveis",         description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }, createdAt: "2024-08-01T10:00:00Z", updatedAt: "2024-08-01T10:00:00Z" },
  { id: "p5", name: "Teclado Mecânico",     price: 459.90,  stock: 3,   category: { id: "c1", name: "Eletrônicos",    description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }, createdAt: "2025-01-05T10:00:00Z", updatedAt: "2025-01-05T10:00:00Z" },
  { id: "p6", name: "Caneta Esferográfica", price: 4.90,    stock: 500,  category: { id: "c3", name: "Papelaria",     description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }, createdAt: "2024-07-20T10:00:00Z", updatedAt: "2024-07-20T10:00:00Z" },
  { id: "p7", name: "Monitor 27\" 4K",     price: 3299.00, stock: 2,   category: null, createdAt: "2025-02-01T10:00:00Z", updatedAt: "2025-02-01T10:00:00Z" },
];

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

/* ── Stock badge ── */
type StockLevel = "out" | "low" | "ok";
function stockLevel(stock: number): StockLevel {
  if (stock === 0) return "out";
  if (stock <= 5)  return "low";
  return "ok";
}
function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock);
  const cfg = {
    out: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", dot: "#EF4444", label: "Sem estoque" },
    low: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B", label: "Estoque baixo" },
    ok:  { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", dot: "#22C55E", label: "Em estoque" },
  }[level];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

/* ── Category badge ── */
const CAT_COLORS = [
  { bg: "#EFF6FF", text: "#1D4ED8" }, { bg: "#FDF4FF", text: "#9333EA" },
  { bg: "#ECFEFF", text: "#0E7490" }, { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#F0FDF4", text: "#15803D" }, { bg: "#FEFCE8", text: "#A16207" },
];
function catColor(name: string) {
  return CAT_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % CAT_COLORS.length];
}

/* ── Skeleton ── */
function SkeletonRow({ delay }: { delay: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #F8FAFC" }}>
      {[40, 24, 20, 24, 24, 16].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton-shimmer h-3.5 rounded" style={{ width: `${w * 2}px`, maxWidth: "100%", animationDelay: `${delay + i * 30}ms` }} />
        </td>
      ))}
    </tr>
  );
}

/* ── ViewModal ── */
function InfoRow({ label, value, icon: Icon, muted }: { label: string; value: string; icon?: React.ElementType; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid #F8FAFC" }}>
      {Icon && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F8FAFC" }}>
          <Icon size={13} style={{ color: "#94A3B8" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: muted ? "#94A3B8" : "#0F172A", fontStyle: muted ? "italic" : "normal" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function ViewModal({ product, onClose, onEdit }: { product: Product; onClose(): void; onEdit(): void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: "440px", background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 24px 64px rgba(15,23,42,0.2)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Detalhes do produto</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "#F1F5F9", border: "none", cursor: "pointer", color: "#64748B" }}>
            <X size={15} />
          </button>
        </div>

        {/* Icon + name */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F1F5F9" }}>
              <Package size={24} style={{ color: "#94A3B8" }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: "#0F172A" }}>{product.name}</p>
              <div className="mt-1.5">
                <StockBadge stock={product.stock} />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-2">
          <InfoRow label="Preço"         value={fmtPrice(product.price)}                                              icon={Box}   />
          <InfoRow label="Estoque"       value={`${product.stock} unidade${product.stock !== 1 ? "s" : ""}`}          icon={Box}   />
          <InfoRow label="Categoria"     value={product.category?.name ?? "Sem categoria"}                            icon={Tag}   muted={!product.category} />
          <InfoRow label="Cadastrado em" value={fmtDateTime(product.createdAt)}                                       icon={Clock} />
          <InfoRow
            label="Atualizado em"
            value={product.updatedAt !== product.createdAt ? fmtDateTime(product.updatedAt) : "Nenhuma alteração registrada"}
            icon={Clock}
            muted={product.updatedAt === product.createdAt}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4" style={{ borderTop: "1px solid #F1F5F9" }}>
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: "#F1F5F9", color: "#374151", border: "none", cursor: "pointer" }}>
            Fechar
          </button>
          <button onClick={onEdit} className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #1D4ED8, #4F46E5)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(29,78,216,0.28)" }}>
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
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
          <AlertTriangle size={20} style={{ color: "#DC2626" }} />
        </div>
        <h3 className="font-semibold text-base mb-1" style={{ color: "#0F172A" }}>Excluir produto</h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "#64748B" }}>
          Tem certeza que deseja excluir <span className="font-semibold" style={{ color: "#0F172A" }}>{name}</span>? Esta ação não pode ser desfeita.
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
export default function ProdutosPage() {
  const router = useRouter();
  const [products,      setProducts]      = useState<Product[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryFilter,setCategoryFilter]= useState("");
  const [stockFilter,   setStockFilter]   = useState<"" | "out" | "low" | "ok">("");
  const [deleteTarget,  setDeleteTarget]  = useState<Product | null>(null);
  const [viewTarget,    setViewTarget]    = useState<Product | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState("");
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);
  const [usingSample,   setUsingSample]   = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = useCallback(async (q: ProductQuery) => {
    setLoading(true);
    setError("");
    try {
      const result = await listProducts(q);
      if (result.data.length === 0 && q.page === 1 && !q.name && !q.categoryId) {
        setProducts(SAMPLE);
        setTotal(SAMPLE.length);
        setUsingSample(true);
      } else {
        setProducts(result.data);
        setTotal(result.total);
        setUsingSample(false);
      }
    } catch {
      setError("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listCategories({ limit: 100 })
      .then(r => setCategories(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts({ page, limit: PAGE_LIMIT, name: debouncedSearch || undefined, categoryId: categoryFilter || undefined });
  }, [page, debouncedSearch, categoryFilter, fetchProducts]);

  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  async function handleDelete() {
    if (!deleteTarget || usingSample) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      fetchProducts({ page, limit: PAGE_LIMIT, name: debouncedSearch || undefined, categoryId: categoryFilter || undefined });
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setStockFilter("");
    setPage(1);
  }

  /* Client-side stock filter */
  const displayProducts = stockFilter
    ? products.filter(p => stockLevel(p.stock) === stockFilter)
    : products;

  const hasFilters = !!(search || categoryFilter || stockFilter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to   = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full" style={{ background: "#F8FAFC" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F172A" }}>Produtos</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            {loading ? "Carregando..." : `${usingSample ? SAMPLE.length : total} produto${total !== 1 ? "s" : ""} cadastrado${total !== 1 ? "s" : ""}`}
            {usingSample && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "#FEF9C3", color: "#A16207" }}>demo</span>}
          </p>
        </div>
        <button
          onClick={() => router.push("/produtos/novo")}
          className="shrink-0 flex items-center gap-2 text-sm font-semibold text-white rounded-xl"
          style={{ padding: "10px 18px", background: "linear-gradient(135deg, #1D4ED8, #4F46E5)", border: "none", cursor: "pointer", boxShadow: "0 1px 2px rgba(29,78,216,0.2), 0 4px 16px rgba(29,78,216,0.25)" }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Novo produto</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* ── Search ── */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-3.5 mb-3 transition-all"
        style={{ background: "#fff", border: `1.5px solid ${searchFocused ? "#1D4ED8" : "#E2E8F0"}`, height: "46px", boxShadow: searchFocused ? "0 0 0 3px rgba(29,78,216,0.1)" : "0 1px 3px rgba(15,23,42,0.06)" }}
      >
        <Search size={16} style={{ color: searchFocused ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 text-sm outline-none"
          style={{ background: "transparent", color: "#0F172A", border: "none" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="p-0.5 rounded" style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Categoria */}
        <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: categoryFilter ? "#EFF6FF" : "#fff", border: `1.5px solid ${categoryFilter ? "#1D4ED8" : "#E2E8F0"}`, height: "36px", minWidth: "180px" }}>
          <Tag size={13} style={{ color: categoryFilter ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }} />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 text-xs outline-none font-medium"
            style={{ background: "transparent", border: "none", color: categoryFilter ? "#1D4ED8" : "#64748B", cursor: "pointer" }}
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Estoque */}
        <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: stockFilter ? "#EFF6FF" : "#fff", border: `1.5px solid ${stockFilter ? "#1D4ED8" : "#E2E8F0"}`, height: "36px", minWidth: "160px" }}>
          <Box size={13} style={{ color: stockFilter ? "#1D4ED8" : "#94A3B8", flexShrink: 0 }} />
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as "" | "out" | "low" | "ok")}
            className="flex-1 text-xs outline-none font-medium"
            style={{ background: "transparent", border: "none", color: stockFilter ? "#1D4ED8" : "#64748B", cursor: "pointer" }}
          >
            <option value="">Todos os estoques</option>
            <option value="ok">Em estoque</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Sem estoque</option>
          </select>
        </div>

        {hasFilters && (
          <>
            <div className="h-6 w-px shrink-0" style={{ background: "#E2E8F0" }} />
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium"
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
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E8EEF5", boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: "640px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #EEF2F7" }}>
                {["Produto", "Categoria", "Preço", "Estoque", "Status", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} delay={i * 60} />)
              ) : displayProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F1F5F9" }}>
                      <Package size={26} style={{ color: "#CBD5E1" }} />
                    </div>
                    <p className="font-medium text-sm mb-1" style={{ color: "#374151" }}>
                      {hasFilters ? "Nenhum resultado" : "Nenhum produto ainda"}
                    </p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>
                      {hasFilters ? "Ajuste os filtros ou limpe a busca." : "Clique em \"Novo produto\" para começar."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayProducts.map((p, idx) => {
                  const hovered = hoveredRow === p.id;
                  const cc = p.category ? catColor(p.category.name) : null;
                  return (
                    <tr
                      key={p.id}
                      className="row-enter"
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: idx < displayProducts.length - 1 ? "1px solid #F8FAFC" : "none",
                        background: hovered ? "#FAFBFF" : "#fff",
                        borderLeft: `3px solid ${hovered ? "#93C5FD" : "transparent"}`,
                        transition: "background 0.1s ease, border-left-color 0.12s ease",
                        animationDelay: `${idx * 35}ms`,
                      }}
                    >
                      {/* Nome */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F1F5F9" }}>
                            <Package size={14} style={{ color: "#94A3B8" }} />
                          </div>
                          <p className="font-medium text-sm truncate" style={{ color: "#0F172A", maxWidth: "180px" }}>{p.name}</p>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5">
                        {p.category && cc ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium" style={{ background: cc.bg, color: cc.text }}>
                            {p.category.name}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </td>

                      {/* Preço */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{fmtPrice(p.price)}</span>
                      </td>

                      {/* Estoque */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium" style={{ color: p.stock === 0 ? "#DC2626" : p.stock <= 5 ? "#B45309" : "#374151" }}>
                          {p.stock} un.
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StockBadge stock={p.stock} />
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1" style={{ opacity: hovered ? 1 : 0.25, transition: "opacity 0.15s ease" }}>
                          <button
                            onClick={() => setViewTarget(p)}
                            title="Visualizar"
                            className="p-2 rounded-lg transition-all"
                            style={{ color: "#1D4ED8", background: hovered ? "#EFF6FF" : "none", border: "none", cursor: "pointer" }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => router.push(`/produtos/${p.id}`)}
                            title="Editar"
                            className="p-2 rounded-lg transition-all"
                            style={{ color: "#64748B", background: hovered ? "#F1F5F9" : "none", border: "none", cursor: "pointer" }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => !usingSample && setDeleteTarget(p)}
                            title="Excluir"
                            className="p-2 rounded-lg transition-all"
                            style={{ color: "#EF4444", background: hovered ? "#FFF1F2" : "none", border: "none", cursor: usingSample ? "default" : "pointer" }}
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
          <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3" style={{ borderTop: "1px solid #EEF2F7" }}>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              Exibindo <strong style={{ color: "#475569" }}>{from}–{to}</strong> de{" "}
              <strong style={{ color: "#475569" }}>{usingSample ? SAMPLE.length : total}</strong> registros
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pg = i + 1;
                const active = pg === page;
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

      {/* ── Modals ── */}
      {viewTarget && (
        <ViewModal
          product={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setViewTarget(null); router.push(`/produtos/${viewTarget.id}`); }}
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
