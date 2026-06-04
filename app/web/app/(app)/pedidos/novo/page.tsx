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

/* Título de seção interna */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9da3b4", marginBottom: 16 }}>
      {children}
    </p>
  );
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
    setFormError(""); setApiError("");
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
    <div style={{ background: "#f8f9fc", minHeight: "100%", padding: "32px 28px 48px" }}>

      <button type="button" className="form-back-link" onClick={() => router.push("/pedidos")}>
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para pedidos
      </button>

      <div className="form-card">
        {/* Header */}
        <div className="form-card__header">
          <h1 className="form-card__title">Novo pedido</h1>
          <p className="form-card__subtitle">Selecione o cliente e adicione os produtos.</p>
        </div>

        <div className="form-card__body" style={{ gap: 0 }}>

          {/* ── Cliente ── */}
          <div style={{ marginBottom: 24 }}>
            <SectionTitle>Cliente <span aria-hidden="true" style={{ color: "#fa5252" }}>*</span></SectionTitle>
            <SearchCombobox<Customer>
              placeholder="Buscar cliente por nome..."
              onSearch={q => listCustomers({ name: q, limit: 10 }).then(r => r.data)}
              onSelect={setCustomer}
              onClear={() => setCustomer(null)}
              selected={customer}
              getKey={c => c.id}
              renderItem={c => (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1d2e" }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: "#9da3b4" }}>{c.email} · {c.city}/{c.state}</p>
                </div>
              )}
              renderSelected={c => (
                <div className="flex items-center gap-3">
                  <div
                    style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: "#dbeafe", color: "#3b5bdb" }}
                    aria-hidden="true"
                  >
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1d2e" }} className="truncate">{c.name}</p>
                    <p style={{ fontSize: 11, color: "#5c6278" }} className="truncate">{c.email}</p>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Separador */}
          <div style={{ borderTop: "1px solid #f0f2f7", marginBottom: 24 }} />

          {/* ── Produto ── */}
          <div style={{ marginBottom: 24 }}>
            <SectionTitle>Adicionar produto</SectionTitle>
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
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1d2e" }} className="truncate">{p.name}</p>
                    <p style={{ fontSize: 11, color: "#9da3b4" }}>{p.category?.name ?? "Sem categoria"} · {p.stock} un.</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1d2e", flexShrink: 0 }}>{fmtPrice(p.price)}</span>
                </div>
              )}
              renderSelected={p => (
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1d2e" }} className="truncate">{p.name}</p>
                    <p style={{ fontSize: 11, color: "#5c6278" }}>{fmtPrice(p.price)} · {p.stock} un. em estoque</p>
                  </div>
                </div>
              )}
            />

            {selectedPrd && (
              <div className="flex items-center gap-3 mt-3">
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 44, background: "#f8f9fc", border: "1.5px solid #e2e6ef", borderRadius: 8 }}
                >
                  <label htmlFor="qty-add" style={{ fontSize: 12, fontWeight: 500, color: "#5c6278", whiteSpace: "nowrap" }}>Qtd:</label>
                  <input
                    id="qty-add"
                    type="text"
                    inputMode="numeric"
                    value={qty}
                    aria-label="Quantidade a adicionar"
                    onChange={e => setQty(sanitizeInteger(e.target.value, 5) || "1")}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); addItem(); return; }
                      onNumericKeyDown(e);
                    }}
                    style={{ width: 52, fontSize: 14, textAlign: "center", background: "transparent", border: "none", outline: "none", color: "#1a1d2e" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px", height: 44, fontSize: 13, fontWeight: 600, color: "#fff", background: "#3b5bdb", border: "none", borderRadius: 8, cursor: "pointer" }}
                >
                  <Plus size={14} aria-hidden="true" />Adicionar
                </button>
              </div>
            )}

            {formError && (
              <p role="alert" className="flex items-center gap-1.5 mt-2" style={{ fontSize: 12, color: "#fa5252" }}>
                <AlertTriangle size={12} aria-hidden="true" />{formError}
              </p>
            )}
          </div>

          {/* ── Resumo ── */}
          {items.length > 0 && (
            <>
              <div style={{ borderTop: "1px solid #f0f2f7", marginBottom: 24 }} />
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <SectionTitle>Resumo do pedido</SectionTitle>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#5c6278", background: "#f1f3f8", padding: "2px 8px", borderRadius: 20, marginBottom: 16 }}>
                    {items.length} {items.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div style={{ overflowX: "auto", border: "1.5px solid #e2e6ef", borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
                    <thead>
                      <tr style={{ background: "#f8f9fc", borderBottom: "1px solid #e2e6ef" }}>
                        {["Produto", "Qtd", "Preço unit.", "Subtotal", ""].map(h => (
                          <th key={h} scope="col"
                            style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9da3b4", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.product.id} style={{ borderTop: idx > 0 ? "1px solid #f0f2f7" : "none" }}>
                          <td style={{ padding: "12px 14px" }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1d2e" }}>{item.product.name}</p>
                            {item.product.category && <p style={{ fontSize: 11, color: "#9da3b4" }}>{item.product.category.name}</p>}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <input
                              type="text" inputMode="numeric" value={item.quantity}
                              aria-label={`Quantidade de ${item.product.name}`}
                              onChange={e => updateItemQty(item.product.id, e.target.value)}
                              onKeyDown={onNumericKeyDown}
                              style={{ width: 52, fontSize: 13, textAlign: "center", background: "#f8f9fc", border: "1.5px solid #e2e6ef", borderRadius: 6, padding: "4px 6px", color: "#1a1d2e", outline: "none" }}
                              onFocus={e => (e.currentTarget.style.borderColor = "#3b5bdb")}
                              onBlur={e => (e.currentTarget.style.borderColor = "#e2e6ef")}
                            />
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#5c6278" }}>{fmtPrice(item.product.price)}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#1a1d2e" }}>{fmtPrice(item.product.price * item.quantity)}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <button
                              type="button" onClick={() => removeItem(item.product.id)}
                              aria-label={`Remover ${item.product.name}`}
                              style={{ padding: 6, borderRadius: 6, border: "none", cursor: "pointer", color: "#fa5252", background: "none", display: "flex" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#fff1f2")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 12, padding: "12px 14px", background: "#f8f9fc", borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#5c6278" }}>Total estimado</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1d2e" }}>{fmtPrice(orderTotal)}</span>
                </div>
              </div>
            </>
          )}

          {apiError && (
            <div style={{ marginTop: 16 }}>
              <div role="alert" className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertTriangle size={14} aria-hidden="true" />{apiError}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="form-card__footer">
          <button type="button" className="btn-secondary" onClick={() => router.push("/pedidos")}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !customer || items.length === 0}
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />Criando...</>
              : "Criar pedido"}
          </button>
        </div>
      </div>

    </div>
  );
}
