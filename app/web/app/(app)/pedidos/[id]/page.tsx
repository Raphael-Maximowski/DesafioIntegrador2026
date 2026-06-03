"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
  Trash2, Save, Package, User, Clock,
} from "lucide-react";
import { getOrder, updateOrderStatus, deleteOrder, updateOrderItem, deleteOrderItem } from "@/services/orders";
import type { Order, OrderStatus } from "@/types/order";

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

function fmtPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}
function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }

export default function GerenciarPedidoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [order,       setOrder]       = useState<Order | null>(null);
  const [fetching,    setFetching]    = useState(true);
  const [fetchErr,    setFetchErr]    = useState("");
  const [statusVal,   setStatusVal]   = useState<OrderStatus>("PENDING");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
  const [statusErr,   setStatusErr]   = useState("");
  const [itemQtys,    setItemQtys]    = useState<Record<string, string>>({});
  const [itemSaving,  setItemSaving]  = useState<Record<string, boolean>>({});
  const [itemSaved,   setItemSaved]   = useState<Record<string, boolean>>({});
  const [itemErr,     setItemErr]     = useState<Record<string, string>>({});
  const [deleting,    setDeleting]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);

  useEffect(() => {
    getOrder(id)
      .then(o => {
        setOrder(o);
        setStatusVal(o.status);
        const qtys: Record<string, string> = {};
        o.items.forEach(item => { qtys[item.id] = String(item.quantity); });
        setItemQtys(qtys);
      })
      .catch(() => setFetchErr("Pedido não encontrado ou erro ao carregar."))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleStatusUpdate() {
    if (!order || statusVal === order.status) return;
    setStatusLoading(true);
    setStatusErr("");
    setStatusSaved(false);
    try {
      const updated = await updateOrderStatus(id, { status: statusVal });
      setOrder(updated);
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 3000);
    } catch (e: unknown) {
      setStatusErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erro ao atualizar status.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleItemQty(itemId: string) {
    const q = parseInt(itemQtys[itemId] ?? "0", 10);
    if (!q || q < 1) { setItemErr(p => ({ ...p, [itemId]: "Quantidade deve ser ≥ 1." })); return; }
    setItemSaving(p => ({ ...p, [itemId]: true }));
    setItemErr(p => ({ ...p, [itemId]: "" }));
    setItemSaved(p => ({ ...p, [itemId]: false }));
    try {
      const updated = await updateOrderItem(id, itemId, { quantity: q });
      setOrder(updated);
      setItemSaved(p => ({ ...p, [itemId]: true }));
      setTimeout(() => setItemSaved(p => ({ ...p, [itemId]: false })), 2000);
    } catch (e: unknown) {
      setItemErr(p => ({ ...p, [itemId]: (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erro ao atualizar." }));
    } finally {
      setItemSaving(p => ({ ...p, [itemId]: false }));
    }
  }

  async function handleDeleteItem(itemId: string) {
    setItemSaving(p => ({ ...p, [itemId]: true }));
    try {
      await deleteOrderItem(id, itemId);
      const updated = await getOrder(id);
      setOrder(updated);
      setItemQtys(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch {
      setItemErr(p => ({ ...p, [itemId]: "Erro ao remover item." }));
    } finally {
      setItemSaving(p => ({ ...p, [itemId]: false }));
    }
  }

  async function handleDeleteOrder() {
    setDeleting(true);
    try {
      await deleteOrder(id);
      router.push("/pedidos");
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  if (fetching) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center" style={{ minHeight: "200px" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} />
      </div>
    );
  }

  if (fetchErr || !order) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="text-sm rounded-xl px-4 py-3" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
          {fetchErr || "Pedido não encontrado."}
        </div>
        <button onClick={() => router.push("/pedidos")} className="mt-4 flex items-center gap-1.5 text-sm"
          style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={15} />Voltar para pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <button onClick={() => router.push("/pedidos")} className="flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={15} />Voltar para pedidos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Pedido #{shortId(order.id)}</h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#94A3B8" }}>
            <span className="flex items-center gap-1"><User size={11} />{order.customer.name}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{fmtDateTime(order.createdAt)}</span>
          </div>
        </div>
        {!confirmDel ? (
          <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
            <Trash2 size={13} />Excluir pedido
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs" style={{ color: "#DC2626" }}>Confirmar exclusão?</span>
            <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#F1F5F9", color: "#64748B", border: "none", cursor: "pointer" }}>Não</button>
            <button onClick={handleDeleteOrder} disabled={deleting} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
              style={{ background: "#DC2626", color: "#fff", border: "none", cursor: deleting ? "not-allowed" : "pointer" }}>
              {deleting && <Loader2 size={11} className="animate-spin" />}Sim, excluir
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* ── Status ── */}
        <section className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E8EEF5" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#0F172A" }}>Status do pedido</h2>
          <div className="flex items-center gap-3">
            <select value={statusVal} onChange={e => setStatusVal(e.target.value as OrderStatus)}
              className="saas-input flex-1" style={{ cursor: "pointer", fontSize: "14px" }}>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="SHIPPED">Enviado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <button onClick={handleStatusUpdate} disabled={statusLoading || statusVal === order.status}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
              style={{
                background: statusLoading || statusVal === order.status ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #4F46E5)",
                border: "none", cursor: statusLoading || statusVal === order.status ? "not-allowed" : "pointer",
                opacity: statusVal === order.status ? 0.6 : 1,
              }}>
              {statusLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </button>
          </div>
          {statusSaved && (
            <div className="mt-2 text-xs flex items-center gap-1" style={{ color: "#15803D" }}>
              <CheckCircle2 size={12} />Status atualizado.
            </div>
          )}
          {statusErr && <p className="mt-2 text-xs" style={{ color: "#DC2626" }}>{statusErr}</p>}
        </section>

        {/* ── Itens ── */}
        <section className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E8EEF5" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#0F172A" }}>Itens do pedido</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>{order.items.length} {order.items.length === 1 ? "item" : "itens"}</span>
          </div>

          {order.items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Package size={24} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>Nenhum item neste pedido.</p>
            </div>
          ) : (
            <div>
              {order.items.map((item, idx) => (
                <div key={item.id} className="px-5 py-4" style={{ borderBottom: idx < order.items.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F1F5F9" }}>
                      <Package size={14} style={{ color: "#94A3B8" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "#0F172A" }}>{item.product?.name ?? "Produto removido"}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>Preço unit.: {fmtPrice(item.unitPrice)} · Subtotal: {fmtPrice(item.lineTotal)}</p>
                    </div>

                    {/* Qty input */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 px-2 rounded-lg" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", height: "34px" }}>
                        <span className="text-xs" style={{ color: "#94A3B8" }}>Qtd:</span>
                        <input
                          type="text" inputMode="numeric" min="1" value={itemQtys[item.id] ?? item.quantity}
                          onChange={e => setItemQtys(p => ({ ...p, [item.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") handleItemQty(item.id); }}
                          className="w-12 text-sm outline-none text-center"
                          style={{ background: "transparent", border: "none", color: "#0F172A" }}
                        />
                      </div>
                      <button onClick={() => handleItemQty(item.id)} disabled={itemSaving[item.id]}
                        title="Salvar quantidade" className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: itemSaved[item.id] ? "#F0FDF4" : "#EFF6FF", border: "none", cursor: "pointer", color: itemSaved[item.id] ? "#15803D" : "#1D4ED8" }}>
                        {itemSaving[item.id] ? <Loader2 size={13} className="animate-spin" /> : itemSaved[item.id] ? <CheckCircle2 size={13} /> : <Save size={13} />}
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} disabled={itemSaving[item.id]}
                        title="Remover item" className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "#FFF1F2", border: "none", cursor: "pointer", color: "#EF4444" }}>
                        {itemSaving[item.id] ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                  {itemErr[item.id] && (
                    <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#DC2626" }}>
                      <AlertTriangle size={11} />{itemErr[item.id]}
                    </p>
                  )}
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid #F1F5F9" }}>
                <span className="text-sm font-semibold" style={{ color: "#374151" }}>Total</span>
                <span className="text-base font-bold" style={{ color: "#0F172A" }}>{fmtPrice(order.totalPrice)}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
