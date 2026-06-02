"use client";

import { useEffect, useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, Tag, Wallet, Calendar, X,
} from "lucide-react";
import { getOverview, getProductsDashboard, getClientsDashboard } from "@/services/dashboard";
import { listProducts } from "@/services/products";
import type {
  DashboardOverview, ProductsDashboard, ClientsDashboard, DashboardDateRange,
} from "@/types/dashboard";
import type { Product } from "@/types/product";

/* ── Month translation ── */
const MONTH_PT: Record<string, string> = {
  January: "Jan", February: "Fev", March: "Mar", April: "Abr",
  May: "Mai", June: "Jun", July: "Jul", August: "Ago",
  September: "Set", October: "Out", November: "Nov", December: "Dez",
};

/* ── Formatters ── */
function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmtCurrencyFull(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtNumber(v: number) {
  return v.toLocaleString("pt-BR");
}
function fmtShort(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ── Pie colors ── */
const PIE_COLORS = ["#1D4ED8", "#7C3AED", "#0E7490", "#15803D", "#B45309", "#94A3B8"];

/* ── KPI Card ── */
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}
function KpiCard({ label, value, sub, icon: Icon, iconBg, iconColor, loading }: KpiCardProps) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4"
      style={{ background: "#fff", border: "1px solid #E8EEF5", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>{label}</p>
        {loading
          ? <div className="skeleton-shimmer h-6 w-24 rounded mb-1" />
          : <p className="text-xl font-bold" style={{ color: "#0F172A" }}>{value}</p>
        }
        {sub && !loading && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Section card ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E8EEF5", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
      <p className="text-sm font-semibold mb-4" style={{ color: "#0F172A" }}>{title}</p>
      {children}
    </div>
  );
}

/* ── Range pill ── */
function RangePill({ label, active, onClick }: { label: string; active: boolean; onClick(): void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: active ? "#1D4ED8" : "#F1F5F9",
        color: active ? "#fff" : "#64748B",
        border: "none",
        cursor: "pointer",
        boxShadow: active ? "0 2px 8px rgba(29,78,216,0.25)" : "none",
      }}>
      {label}
    </button>
  );
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={{ background: "#0F172A", color: "#fff" }}>
      <p style={{ color: "#94A3B8", marginBottom: 2 }}>{label}</p>
      <p className="font-semibold">{fmtCurrencyFull(payload[0].value)}</p>
    </div>
  );
}

/* ── Page ── */
export default function DashboardPage() {
  const [overview,   setOverview]   = useState<DashboardOverview | null>(null);
  const [products,   setProducts]   = useState<ProductsDashboard | null>(null);
  const [clients,    setClients]    = useState<ClientsDashboard | null>(null);
  const [range,      setRange]      = useState<DashboardDateRange>("30d");
  const [customRange,setCustomRange]= useState<DateRange | undefined>();
  const [showPicker, setShowPicker] = useState(false);
  const [loadingOv,  setLoadingOv]  = useState(true);
  const [loadingPr,  setLoadingPr]  = useState(true);
  const [error,      setError]      = useState("");
  const [lowStockOpen,   setLowStockOpen]   = useState(false);
  const [lowStockItems,  setLowStockItems]  = useState<Product[]>([]);
  const [loadingLowStock,setLoadingLowStock]= useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  /* Close picker on outside click */
  useEffect(() => {
    function h(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Fetch overview on range change */
  useEffect(() => {
    setLoadingOv(true);
    const q: Parameters<typeof getOverview>[0] = { range };
    if (range === "custom" && customRange?.from) {
      q.startedAt  = customRange.from.toISOString();
      q.finishedAt = (customRange.to ?? customRange.from).toISOString();
    }
    getOverview(q)
      .then(setOverview)
      .catch(() => setError("Erro ao carregar overview."))
      .finally(() => setLoadingOv(false));
  }, [range, customRange]);

  /* Fetch products + clients once */
  useEffect(() => {
    setLoadingPr(true);
    Promise.all([getProductsDashboard(), getClientsDashboard()])
      .then(([p, c]) => { setProducts(p); setClients(c); })
      .catch(() => setError("Erro ao carregar dados de produtos/clientes."))
      .finally(() => setLoadingPr(false));
  }, []);

  async function toggleLowStock() {
    if (lowStockOpen) { setLowStockOpen(false); return; }
    setLowStockOpen(true);
    if (lowStockItems.length > 0) return;
    setLoadingLowStock(true);
    try {
      const threshold = products?.lowStockThreshold ?? 30;
      const result = await listProducts({ stockMax: threshold - 1, limit: 50 });
      setLowStockItems(result.data);
    } catch {
      /* silently fail — list stays empty */
    } finally {
      setLoadingLowStock(false);
    }
  }

  const monthlySalesData = (overview?.monthlySales ?? []).map(m => ({
    name: MONTH_PT[m.label] ?? m.label,
    total: m.total,
  }));

  const pieData = (overview?.categories ?? []).map((c, i) => ({
    name: c.label,
    value: c.amount,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const customLabel = customRange?.from
    ? customRange.to
      ? `${fmtShort(customRange.from)} → ${fmtShort(customRange.to)}`
      : fmtShort(customRange.from)
    : "Personalizado";

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full" style={{ background: "#F8FAFC" }}>

      {/* ── Header + Range ── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F172A" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Visão geral do negócio</p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["30d", "6m", "year"] as DashboardDateRange[]).map(r => (
            <RangePill
              key={r}
              label={r === "30d" ? "30 dias" : r === "6m" ? "6 meses" : "Este ano"}
              active={range === r}
              onClick={() => { setRange(r); setCustomRange(undefined); }}
            />
          ))}

          {/* Custom range */}
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button type="button"
              onClick={() => { setRange("custom"); setShowPicker(p => !p); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: range === "custom" ? "#1D4ED8" : "#F1F5F9",
                color: range === "custom" ? "#fff" : "#64748B",
                border: "none", cursor: "pointer",
                boxShadow: range === "custom" ? "0 2px 8px rgba(29,78,216,0.25)" : "none",
              }}>
              <Calendar size={12} />
              {range === "custom" ? customLabel : "Personalizado"}
              {range === "custom" && customRange?.from && (
                <span onClick={e => { e.stopPropagation(); setCustomRange(undefined); setRange("30d"); }}
                  className="flex items-center" style={{ cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
                  <X size={11} />
                </span>
              )}
            </button>
            {showPicker && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#fff", border: "1px solid #E2E8F0", borderRadius: "16px", boxShadow: "0 8px 32px rgba(15,23,42,0.14)", padding: "12px" }}>
                <DayPicker mode="range" selected={customRange}
                  onSelect={r => {
                    setCustomRange(r);
                    if (r?.from && r?.to) setShowPicker(false);
                  }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
          <AlertTriangle size={14} />{error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Vendas totais"   value={fmtCurrency(overview?.kpis.totalSales ?? 0)}   icon={TrendingUp}   iconBg="#EFF6FF" iconColor="#1D4ED8" loading={loadingOv} />
        <KpiCard label="Pedidos"         value={fmtNumber(overview?.kpis.orderCount ?? 0)}      icon={ShoppingCart} iconBg="#F0FDF4" iconColor="#15803D" loading={loadingOv} />
        <KpiCard label="Ticket médio"    value={fmtCurrencyFull(overview?.kpis.averageTicket ?? 0)} icon={Wallet}  iconBg="#FDF4FF" iconColor="#7C3AED" loading={loadingOv} />
        <KpiCard label="Clientes ativos" value={fmtNumber(overview?.kpis.totalClients ?? 0)}   icon={Users}        iconBg="#FFF7ED" iconColor="#C2410C" loading={loadingOv} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Valor em estoque"     value={fmtCurrency(products?.totalStockValue ?? 0)}    icon={Package}       iconBg="#ECFEFF" iconColor="#0E7490" loading={loadingPr} />
        <KpiCard label="Unidades em estoque"  value={fmtNumber(products?.totalStock ?? 0)}            icon={Package}       iconBg="#F8FAFC" iconColor="#64748B" loading={loadingPr} />
        <KpiCard label="Itens estoque baixo"  value={fmtNumber(products?.lowStockCount ?? 0)}         icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#DC2626" loading={loadingPr}
          sub={`Limiar: ${products?.lowStockThreshold ?? 30} un.`} />
        <KpiCard label="LTV mediano"          value={fmtCurrencyFull(clients?.medianLtv ?? 0)}        icon={Wallet}        iconBg="#FEFCE8" iconColor="#A16207" loading={loadingPr}
          sub={`${fmtNumber(clients?.totalClients ?? 0)} clientes`} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

        {/* Monthly Sales bar chart (60%) */}
        <div className="lg:col-span-3">
          <Section title="Vendas mensais (ano atual)">
            {loadingOv ? (
              <div className="skeleton-shimmer rounded-xl" style={{ height: "220px" }} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySalesData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(29,78,216,0.04)" }} />
                  <Bar dataKey="total" fill="#1D4ED8" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* Categories donut (40%) */}
        <div className="lg:col-span-2">
          <Section title="Receita por categoria">
            {loadingOv ? (
              <div className="skeleton-shimmer rounded-xl" style={{ height: "220px" }} />
            ) : pieData.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: "220px" }}>
                <p className="text-xs" style={{ color: "#CBD5E1" }}>Sem dados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtCurrencyFull(Number(v))} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize: "11px", color: "#64748B" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Products */}
        <Section title="Top 5 produtos por receita">
          {loadingOv ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton-shimmer h-10 rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />)}
            </div>
          ) : overview?.topProducts.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: "#CBD5E1" }}>Sem dados</p>
          ) : (
            <div className="space-y-2">
              {overview?.topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 py-2" style={{ borderBottom: i < (overview.topProducts.length - 1) ? "1px solid #F8FAFC" : "none" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#0F172A" }}>{p.name}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{p.category}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0" style={{ color: "#0F172A" }}>{fmtCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Top Regions */}
        <Section title="Top regiões por receita">
          {loadingOv ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton-shimmer h-10 rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />)}
            </div>
          ) : overview?.topRegions.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: "#CBD5E1" }}>Sem dados</p>
          ) : (
            <div className="space-y-3">
              {overview?.topRegions.map((r, i) => (
                <div key={r.state}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "#F0FDF4", color: "#15803D" }}>{i + 1}</span>
                      <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{r.state}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{fmtCurrency(r.amount)}</span>
                      <span className="text-xs ml-2" style={{ color: "#94A3B8" }}>{r.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.percentage}%`, background: "linear-gradient(90deg, #1D4ED8, #4F46E5)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Inventory footer ── */}
      <div className="mt-5 rounded-2xl p-4 flex items-center gap-6 flex-wrap" style={{ background: "#fff", border: "1px solid #E8EEF5" }}>
        <div className="flex items-center gap-2">
          <Tag size={14} style={{ color: "#94A3B8" }} />
          <span className="text-xs" style={{ color: "#64748B" }}>Categorias ativas:</span>
          {loadingPr
            ? <div className="skeleton-shimmer h-4 w-8 rounded" />
            : <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{products?.activeCategories ?? 0}</span>
          }
        </div>
        <div className="h-4 w-px" style={{ background: "#E2E8F0" }} />
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: "#94A3B8" }} />
          <span className="text-xs" style={{ color: "#64748B" }}>Total de clientes:</span>
          {loadingPr
            ? <div className="skeleton-shimmer h-4 w-8 rounded" />
            : <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{fmtNumber(clients?.totalClients ?? 0)}</span>
          }
        </div>
      </div>

    </div>
  );
}
