"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, ShoppingCart, User, Package, AlertTriangle } from "lucide-react";
import SearchCombobox from "@/components/ui/SearchCombobox";
import { listCustomers } from "@/services/customers";
import { listProducts } from "@/services/products";
import { createOrder } from "@/services/orders";
import { sanitizeInteger, onNumericKeyDown } from "@/lib/formUtils";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";

interface LineItem {
  product: Product;
  quantity: number;
}

function fmtPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function NovoPedidoPage() {
  const router = useRouter();

  const [customer,    setCustomer]    = useState<Customer | null>(null);
  const [items,       setItems]       = useState<LineItem[]>([]);
  const [selectedPrd, setSelectedPrd] = useState<Product | null>(null);
  const [qty,         setQty]         = useState("1");
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState("");
  const [formError,   setFormError]   = useState("");

  const orderTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  function addItem() {
    if (!selectedPrd) return;
    const q = parseInt(qty, 10);
    if (!qty || isNaN(q) || q < 1) { setFormError("Quantidade deve ser pelo menos 1."); return; }
    if (q > selectedPrd.stock) { setFormError(`Estoque insuficiente. Disponível: ${selectedPrd.stock} unidade(s).`); return; }
    setFormError("");
    setItems(prev => {
      const existing = prev.findIndex(i => i.product.id === selectedPrd.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity: next[existing].quantity + q };
        return next;
      }
      return [...prev, { product: selectedPrd, quantity: q }];
    });
    setSelectedPrd(null);
    setQty("1");
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }

  function updateItemQty(productId: string, raw: string) {
    const sanitized = sanitizeInteger(raw, 5);
    if (!sanitized) return;
    const q = parseInt(sanitized, 10);
    if (isNaN(q) || q < 1) return;
    const clamped = Math.min(q, items.find(i => i.product.id === productId)?.product.stock ?? q);
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: clamped } : i));
  }

  async function handleSubmit() {
    setFormError("");
    setApiError("");
    if (!customer) { setFormError("Selecione um cliente."); return; }
    if (items.length === 0) { setFormError("Adicione pelo menos um item."); return; }
    setLoading(true);
    try {
      await createOrder({
        customerId: customer.id,
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      });
      router.push("/pedidos");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? "Erro ao criar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <button onClick={() => router.push("/pedidos")}
        className="flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={15} />Voltar para pedidos
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Novo pedido</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Selecione o cliente e adicione os produtos.</p>
      </div>

      <div className="space-y-6">
        {/* ── Seção 1: Cliente ── */}
        <section className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E8EEF5" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EFF6FF" }}>
              <User size={14} style={{ color: "#1D4ED8" }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: "#0F172A" }}>Cliente</h2>
          </div>
          <SearchCombobox<Customer>
            placeholder="Buscar cliente por nome..."
            onSearch={q => listCustomers({ name: q, limit: 10 }).then(r => r.data)}
            onSelect={setCustomer}
            onClear={() => setCustomer(null)}
            selected={customer}
            getKey={c => c.id}
            renderItem={c => (
              <div>
                <p className="text-sm font-medium" style={{ color: "#0F172A" }}>{c.name}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{c.email} · {c.city}/{c.state}</p>
              </div>
            )}
            renderSelected={c => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  {initials(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: "#64748B" }}>{c.email}</p>
                </div>
              </div>
            )}
          />
        </section>

        {/* ── Seção 2: Adicionar item ── */}
        <section className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E8EEF5" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F0FDF4" }}>
              <Package size={14} style={{ color: "#15803D" }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: "#0F172A" }}>Adicionar produto</h2>
          </div>

          <SearchCombobox<Product>
            placeholder="Buscar produto por nome..."
            onSearch={q => listProducts({ name: q, limit: 10 }).then(r => r.data)}
            onSelect={p => { setSelectedPrd(p); setFormError(""); }}
            onClear={() => setSelectedPrd(null)}
            selected={selectedPrd}
            getKey={p => p.id}
            renderItem={p => (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#0F172A" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{p.category?.name ?? "Sem categoria"} · {p.stock} un. disponíveis</p>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ color: "#0F172A" }}>{fmtPrice(p.price)}</span>
              </div>
            )}
            renderSelected={p => (
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>{fmtPrice(p.price)} · {p.stock} un. em estoque</p>
                </div>
              </div>
            )}
          />

          {selectedPrd && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", height: "38px" }}>
                <span className="text-xs font-medium" style={{ color: "#64748B" }}>Qtd:</span>
                <input
                  type="text" inputMode="numeric" value={qty}
                  onChange={e => setQty(sanitizeInteger(e.target.value, 5) || "1")}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); addItem(); return; }
                    onNumericKeyDown(e);
                  }}
                  className="w-16 text-sm outline-none text-center"
                  style={{ background: "transparent", border: "none", color: "#0F172A" }}
                />
              </div>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #1D4ED8, #4F46E5)", border: "none", cursor: "pointer" }}>
                <Plus size={14} />Adicionar
              </button>
            </div>
          )}

          {formError && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#DC2626" }}>
              <AlertTriangle size={12} />{formError}
            </p>
          )}
        </section>

        {/* ── Seção 3: Resumo ── */}
        {items.length > 0 && (
          <section className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E8EEF5" }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FDF4FF" }}>
                <ShoppingCart size={14} style={{ color: "#7C3AED" }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: "#0F172A" }}>Resumo do pedido</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>{items.length} {items.length === 1 ? "item" : "itens"}</span>
            </div>

            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Produto", "Qtd", "Preço unit.", "Subtotal", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.product.id} style={{ borderTop: "1px solid #F8FAFC" }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "#0F172A" }}>{item.product.name}</p>
                      {item.product.category && <p className="text-xs" style={{ color: "#94A3B8" }}>{item.product.category.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text" inputMode="numeric"
                        value={item.quantity}
                        onChange={e => updateItemQty(item.product.id, e.target.value)}
                        onKeyDown={onNumericKeyDown}
                        className="w-14 text-sm text-center outline-none rounded-lg"
                        style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0F172A", padding: "4px 6px" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "#1D4ED8")}
                        onBlur={e => (e.currentTarget.style.borderColor = "#E2E8F0")}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{fmtPrice(item.product.price)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#0F172A" }}>{fmtPrice(item.product.price * item.quantity)}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeItem(item.product.id)}
                        className="p-1.5 rounded-lg"
                        style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F2")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid #F1F5F9" }}>
              <span className="text-sm font-semibold" style={{ color: "#374151" }}>Total estimado</span>
              <span className="text-base font-bold" style={{ color: "#0F172A" }}>{fmtPrice(orderTotal)}</span>
            </div>
          </section>
        )}

        {apiError && (
          <div className="text-sm rounded-xl px-4 py-3 flex items-center gap-2" style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertTriangle size={14} />{apiError}
          </div>
        )}

        <button type="button" onClick={handleSubmit} disabled={loading || !customer || items.length === 0}
          className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-white rounded-xl"
          style={{
            padding: "12px 20px",
            background: loading || !customer || items.length === 0 ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #4F46E5)",
            border: "none",
            cursor: loading || !customer || items.length === 0 ? "not-allowed" : "pointer",
            boxShadow: loading || !customer || items.length === 0 ? "none" : "0 1px 2px rgba(29,78,216,0.2), 0 6px 20px rgba(29,78,216,0.25)",
            opacity: !customer || items.length === 0 ? 0.6 : 1,
          }}>
          {loading ? <><Loader2 size={16} className="animate-spin" />Criando...</> : "Criar pedido"}
        </button>
      </div>
    </div>
  );
}
