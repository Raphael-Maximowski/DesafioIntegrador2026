"use client";

import { useState } from "react";
import { Ban, Plus, Loader2, X, Check, Trash2 } from "lucide-react";
import { createCategory, deleteCategory } from "@/services/products";
import type { Category } from "@/types/product";

const CAT_COLORS = [
  { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", dot: "#3B82F6" },
  { bg: "#FDF4FF", border: "#E9D5FF", text: "#7C3AED", dot: "#8B5CF6" },
  { bg: "#ECFEFF", border: "#A5F3FC", text: "#0E7490", dot: "#06B6D4" },
  { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C", dot: "#F97316" },
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D", dot: "#22C55E" },
  { bg: "#FEFCE8", border: "#FDE68A", text: "#A16207", dot: "#EAB308" },
  { bg: "#FFF1F2", border: "#FECDD3", text: "#BE123C", dot: "#F43F5E" },
];

function catColor(name: string) {
  return CAT_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % CAT_COLORS.length];
}

interface Props {
  categories: Category[];
  value: string | undefined;
  onChange: (id: string) => void;
  onCategoryCreated?: (cat: Category) => void;
  onCategoryDeleted?: (id: string) => void;
}

export default function CategoryPicker({ categories, value, onChange, onCategoryCreated, onCategoryDeleted }: Props) {
  const [creating,     setCreating]     = useState(false);
  const [newName,      setNewName]      = useState("");
  const [saving,       setSaving]       = useState(false);
  const [createError,  setCreateError]  = useState("");
  const [hoveredChip,  setHoveredChip]  = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [deleteError,  setDeleteError]  = useState<{ id: string; msg: string } | null>(null);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) { setCreateError("Nome obrigatório."); return; }
    if (name.length < 2) { setCreateError("Nome deve ter pelo menos 2 caracteres."); return; }
    if (name.length > 50) { setCreateError("Nome deve ter no máximo 50 caracteres."); return; }
    const duplicate = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) { setCreateError("Já existe uma categoria com esse nome."); return; }
    setSaving(true);
    setCreateError("");
    try {
      const cat = await createCategory({ name, description: name });
      onCategoryCreated?.(cat);
      onChange(cat.id);
      setCreating(false);
      setNewName("");
    } catch {
      setCreateError("Erro ao criar categoria.");
    } finally {
      setSaving(false);
    }
  }

  function cancelCreate() {
    setCreating(false);
    setNewName("");
    setCreateError("");
  }

  async function handleDelete(cat: Category) {
    setDeletingId(cat.id);
    setDeleteError(null);
    try {
      await deleteCategory(cat.id);
      if (value === cat.id) onChange("");
      onCategoryDeleted?.(cat.id);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = status === 409
        ? "Categoria possui produtos vinculados."
        : "Erro ao excluir categoria.";
      setDeleteError({ id: cat.id, msg });
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Sem categoria */}
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            background: value === "" ? "#F1F5F9" : "#fff",
            border:     `1.5px solid ${value === "" ? "#64748B" : "#E2E8F0"}`,
            color:      value === "" ? "#374151" : "#94A3B8",
            cursor:     "pointer",
            boxShadow:  value === "" ? "0 0 0 3px rgba(100,116,139,0.12)" : "none",
          }}
        >
          <Ban size={12} style={{ color: value === "" ? "#64748B" : "#CBD5E1" }} />
          Sem categoria
        </button>

        {/* Category chips */}
        {categories.map(cat => {
          const cc       = catColor(cat.name);
          const active   = value === cat.id;
          const hovered  = hoveredChip === cat.id;
          const deleting = deletingId === cat.id;
          const errThis  = deleteError?.id === cat.id;

          return (
            <div
              key={cat.id}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: errThis ? "#FEF2F2" : active ? cc.bg : "#fff",
                border:     `1.5px solid ${errThis ? "#FECACA" : active ? cc.border : hovered ? "#CBD5E1" : "#E2E8F0"}`,
                color:      errThis ? "#DC2626" : active ? cc.text : "#64748B",
                boxShadow:  active && !errThis ? `0 0 0 3px ${cc.bg}` : "none",
              }}
              onMouseEnter={() => setHoveredChip(cat.id)}
              onMouseLeave={() => setHoveredChip(null)}
            >
              {/* Select area */}
              <button
                type="button"
                onClick={() => onChange(cat.id)}
                className="flex items-center gap-1.5"
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
              >
                {deleting
                  ? <Loader2 size={10} className="animate-spin" />
                  : <span className="w-2 h-2 rounded-full shrink-0" style={{ background: errThis ? "#EF4444" : active ? cc.dot : "#CBD5E1" }} />
                }
                {cat.name}
              </button>

              {/* Delete button — visible on hover */}
              {hovered && !deleting && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleDelete(cat); }}
                  title="Excluir categoria"
                  className="flex items-center justify-center w-4 h-4 rounded transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer", color: errThis ? "#DC2626" : "#94A3B8", marginLeft: "2px" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#DC2626")}
                  onMouseLeave={e => (e.currentTarget.style.color = errThis ? "#DC2626" : "#94A3B8")}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}

        {/* Nova categoria trigger */}
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: "#fff", border: "1.5px dashed #CBD5E1", color: "#94A3B8", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1D4ED8"; e.currentTarget.style.color = "#1D4ED8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#94A3B8"; }}
          >
            <Plus size={12} />
            Nova categoria
          </button>
        )}
      </div>

      {/* Delete error toast */}
      {deleteError && (
        <p className="text-xs" style={{ color: "#DC2626" }}>{deleteError.msg}</p>
      )}

      {/* Inline create form */}
      {creating && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "#374151" }}>Nova categoria</p>
            <button
              type="button"
              onClick={cancelCreate}
              className="w-5 h-5 flex items-center justify-center rounded"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
            >
              <X size={13} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Nome da categoria"
            value={newName}
            maxLength={50}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
            className="w-full text-xs outline-none rounded-lg px-3 py-2"
            style={{ background: "#fff", border: "1.5px solid #E2E8F0", color: "#0F172A" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#1D4ED8")}
            onBlur={e => (e.currentTarget.style.borderColor = "#E2E8F0")}
          />

          {createError && <p className="text-xs" style={{ color: "#DC2626" }}>{createError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelCreate}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg"
              style={{ background: "#fff", border: "1px solid #E2E8F0", color: "#64748B", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
              style={{
                background: saving ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #4F46E5)",
                border: "none", color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              {saving ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
