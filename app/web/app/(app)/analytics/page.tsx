"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Brain, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, CheckCircle2,
} from "lucide-react";
import { listCustomerAnalytics, trainModel } from "@/services/analytics";
import { listCustomers } from "@/services/customers";
import type { CustomerAnalytics, RiskLevel } from "@/types/analytics";

const PER_PAGE = 20;

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  "Baixo": { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", dot: "#22C55E" },
  "Médio": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
  "Alto":  { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3", dot: "#F43F5E" },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const s = RISK_STYLES[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {level}
    </span>
  );
}

function ProbBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "#f1f5f9" }}>
        <div
          style={{
            width: `${pct}%`, height: "100%", borderRadius: 4,
            background: color, transition: "width 0.3s",
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", minWidth: 32, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #f8f9fc" }}>
      {[36, 16, 24, 24, 12, 20].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="skeleton-shimmer h-3.5 rounded"
            style={{ width: `${w * 3}px`, maxWidth: "100%", animationDelay: `${delay + i * 30}ms` }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function AnalyticsPage() {
  const [items,    setItems]    = useState<CustomerAnalytics[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [nameMap,  setNameMap]  = useState<Map<string, string>>(new Map());
  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const loadCustomerNames = useCallback(async () => {
    try {
      const first = await listCustomers({ limit: 100, page: 1 });
      const map = new Map<string, string>();
      first.data.forEach(c => map.set(c.id, c.name));
      setNameMap(new Map(map));

      const totalCustPages = Math.ceil(first.total / 100);
      if (totalCustPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalCustPages - 1 }, (_, i) =>
            listCustomers({ limit: 100, page: i + 2 })
          )
        );
        rest.forEach(r => r.data.forEach(c => map.set(c.id, c.name)));
        setNameMap(new Map(map));
      }
    } catch (_err) {
      // names are optional — analytics still works without them
    }
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const analytics = await listCustomerAnalytics(p, PER_PAGE);
      setItems(analytics.items);
      setTotal(analytics.total);
      loadCustomerNames();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        setError("Sessão expirada. Faça login novamente.");
      } else if (msg.includes("Network Error") || msg.includes("ERR_CONNECTION")) {
        setError("API do Flask offline. Verifique se o container está rodando na porta 8001.");
      } else {
        setError(`Erro ao carregar analytics: ${msg || "erro desconhecido"}`);
      }
    } finally {
      setLoading(false);
    }
  }, [loadCustomerNames]);

  useEffect(() => { load(page); }, [page, load]);

  async function handleTrain() {
    setTraining(true);
    setTrainMsg(null);
    try {
      const result = await trainModel();
      setTrainMsg({ ok: result.status === "success", text: result.message });
      load(page);
    } catch {
      setTrainMsg({ ok: false, text: "Erro ao treinar modelo. Verifique se a API do Flask está online." });
    } finally {
      setTraining(false);
    }
  }

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100%", padding: "32px 28px 48px" }}>

      {/* Header */}
      <div
        className="flex items-start justify-between gap-4 flex-wrap"
        style={{ marginBottom: 28 }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1d2e", margin: 0 }}>
            Analytics de Clientes
          </h1>
          <p style={{ fontSize: 13, color: "#5c6278", marginTop: 4 }}>
            Predições de churn e probabilidade de compra geradas por ML
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => load(page)}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 38, padding: "0 14px", borderRadius: 8,
              border: "1.5px solid #e2e6ef", background: "#fff",
              color: "#374151", fontSize: 13, fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            />
            Atualizar
          </button>

          <button
            type="button"
            onClick={handleTrain}
            disabled={training || loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 38, padding: "0 16px", borderRadius: 8, border: "none",
              background: training ? "#818cf8" : "linear-gradient(135deg, #3b5bdb, #6366f1)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: training || loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          >
            {training
              ? <Loader2 size={14} className="animate-spin" />
              : <Brain size={14} />}
            {training ? "Treinando..." : "Treinar Modelo"}
          </button>
        </div>
      </div>

      {/* Train result banner */}
      {trainMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
          style={{
            marginBottom: 20,
            color:      trainMsg.ok ? "#0d6c4c" : "#991B1B",
            background: trainMsg.ok ? "#f0fdf4"  : "#FEF2F2",
            border:     `1px solid ${trainMsg.ok ? "#86efac" : "#FECACA"}`,
          }}
        >
          {trainMsg.ok
            ? <CheckCircle2 size={14} aria-hidden="true" />
            : <AlertCircle  size={14} aria-hidden="true" />}
          {trainMsg.text}
        </div>
      )}

      {/* Load error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
          style={{ marginBottom: 20, color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <AlertCircle size={14} aria-hidden="true" />{error}
        </div>
      )}

      {/* Table card */}
      <div style={{
        background: "#fff", borderRadius: 12,
        border: "1px solid #e2e6ef", overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8f9fc" }}>
                {["Cliente", "Nível de Risco", "Churn", "Prob. Compra", "Pedidos", "Total Gasto"].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3"
                    style={{
                      textAlign: h === "Pedidos" || h === "Total Gasto" ? "right" : "left",
                      fontWeight: 600, color: "#374151", whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} delay={i * 50} />
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "56px 24px", color: "#9da3b4" }}>
                    <Brain size={36} style={{ margin: "0 auto 12px", opacity: 0.35, display: "block" }} />
                    <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px", color: "#5c6278" }}>
                      Nenhum dado de analytics disponível
                    </p>
                    <p style={{ fontSize: 12, margin: 0 }}>
                      Clique em &quot;Treinar Modelo&quot; para gerar predições
                    </p>
                  </td>
                </tr>
              )}

              {!loading && items.map(item => {
                const name = nameMap.get(item.customer_id);
                const churnColor =
                  item.risk_level === "Alto"  ? "#F43F5E" :
                  item.risk_level === "Médio" ? "#F59E0B" : "#22C55E";
                return (
                  <tr
                    key={item.customer_id}
                    style={{ borderBottom: "1px solid #f8f9fc", transition: "background 120ms" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfe")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3.5">
                      <p style={{ fontWeight: 500, color: "#1a1d2e", margin: 0 }}>
                        {name ?? "—"}
                      </p>
                      <p style={{ fontSize: 11, color: "#9da3b4", margin: 0, fontFamily: "monospace" }}>
                        {item.customer_id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <RiskBadge level={item.risk_level} />
                    </td>
                    <td className="px-4 py-3.5" style={{ minWidth: 150 }}>
                      <ProbBar value={item.churn_probability} color={churnColor} />
                    </td>
                    <td className="px-4 py-3.5" style={{ minWidth: 150 }}>
                      <ProbBar value={item.purchase_probability} color="#3b5bdb" />
                    </td>
                    <td className="px-4 py-3.5" style={{ textAlign: "right", fontWeight: 500, color: "#374151" }}>
                      {item.metrics.total_orders}
                    </td>
                    <td className="px-4 py-3.5" style={{ textAlign: "right", fontWeight: 600, color: "#1a1d2e" }}>
                      {fmtBRL(item.metrics.total_spent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > PER_PAGE && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid #f1f5f9", background: "#f8f9fc" }}
          >
            <span style={{ fontSize: 12, color: "#5c6278" }}>
              {total} clientes · página {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 7, border: "1.5px solid #e2e6ef", background: "#fff",
                  color: page === 1 ? "#d1d5db" : "#374151",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 7, border: "1.5px solid #e2e6ef", background: "#fff",
                  color: page === totalPages ? "#d1d5db" : "#374151",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
