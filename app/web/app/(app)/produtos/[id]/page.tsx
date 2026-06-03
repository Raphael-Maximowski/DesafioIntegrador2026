"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Box, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { getProduct, updateProduct, listCategories } from "@/services/products";
import CategoryPicker from "@/components/products/CategoryPicker";
import type { Product, Category } from "@/types/product";

const schema = z.object({
  name:       z.string().min(1, "Nome obrigatório"),
  price:      z.string().min(1, "Preço obrigatório").refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Preço deve ser ≥ 0"),
  stock:      z.string().min(1, "Estoque obrigatório").refine(v => /^\d+$/.test(v.trim()) && parseInt(v) >= 0, "Deve ser número inteiro ≥ 0"),
  categoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>{label}</label>
      {children}
      <p className="text-xs mt-1.5 font-medium" style={{ color: error ? "#DC2626" : "transparent", minHeight: "16px", lineHeight: "16px" }}>
        {error ?? " "}
      </p>
    </div>
  );
}

function InputIcon({
  icon: Icon, hasError, isValid, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType; hasError?: boolean; isValid?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: hasError ? "#DC2626" : isValid ? "#16A34A" : "#9CA3AF" }}>
        <Icon size={16} />
      </span>
      <input
        className="saas-input has-icon-left"
        style={{
          borderColor: hasError ? "#FCA5A5" : isValid ? "#86EFAC" : undefined,
          background:  hasError ? "#FFF5F5" : isValid ? "#F0FDF4" : undefined,
          paddingRight: isValid ? "36px" : undefined,
        }}
        {...props}
      />
      {isValid && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <CheckCircle2 size={15} style={{ color: "#16A34A" }} />
        </span>
      )}
    </div>
  );
}

export default function EditarProdutoPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const id      = params.id;

  const [product,  setProduct]  = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);

  const { register, handleSubmit, watch, reset, control, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const name  = watch("name");
  const price = watch("price");
  const stock = watch("stock");

  const nameValid  = !errors.name  && !!name;
  const priceValid = !errors.price && !!price;
  const stockValid = !errors.stock && !!stock;

  useEffect(() => {
    Promise.all([getProduct(id), listCategories({ limit: 100 })])
      .then(([p, cats]) => {
        setProduct(p);
        setCategories(cats.data);
        reset({
          name:       p.name,
          price:      String(p.price),
          stock:      String(p.stock),
          categoryId: p.category?.id ?? "",
        });
      })
      .catch(() => setFetchErr("Produto não encontrado ou erro ao carregar."))
      .finally(() => setFetching(false));
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    setApiError("");
    setSaved(false);
    try {
      await updateProduct(id, {
        name:       data.name,
        price:      parseFloat(data.price),
        stock:      parseInt(data.stock, 10),
        categoryId: data.categoryId || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setApiError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Erro ao atualizar produto. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center" style={{ minHeight: "200px" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} />
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="p-6 lg:p-8 max-w-xl">
        <div className="text-sm rounded-xl px-4 py-3" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
          {fetchErr}
        </div>
        <button
          onClick={() => router.push("/produtos")}
          className="mt-4 flex items-center gap-1.5 text-sm"
          style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={15} /> Voltar para produtos
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <button
        onClick={() => router.push("/produtos")}
        className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <ArrowLeft size={15} />
        Voltar para produtos
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Editar produto</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{product?.name}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-1">
        <Field label="Nome do produto" error={errors.name?.message}>
          <InputIcon
            icon={Package}
            type="text"
            placeholder="Nome do produto"
            hasError={!!errors.name}
            isValid={nameValid}
            {...register("name")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço (R$)" error={errors.price?.message}>
            <InputIcon
              icon={Package}
              type="text" inputMode="numeric"
              step="0.01"
              min="0"
              placeholder="0,00"
              hasError={!!errors.price}
              isValid={priceValid}
              {...register("price")}
            />
          </Field>

          <Field label="Estoque (unidades)" error={errors.stock?.message}>
            <InputIcon
              icon={Box}
              type="text" inputMode="numeric"
              step="1"
              min="0"
              placeholder="0"
              hasError={!!errors.stock}
              isValid={stockValid}
              {...register("stock")}
            />
          </Field>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>Categoria</label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategoryPicker
                categories={categories}
                value={field.value}
                onChange={field.onChange}
                onCategoryCreated={cat => setCategories(prev => [...prev, cat])}
                onCategoryDeleted={id => setCategories(prev => prev.filter(c => c.id !== id))}
              />
            )}
          />
        </div>

        {apiError && (
          <div className="text-sm rounded-xl px-4 py-3 flex items-center gap-2" style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <span>⚠</span>
            {apiError}
          </div>
        )}

        {saved && (
          <div className="text-sm rounded-xl px-4 py-3 flex items-center gap-2" style={{ color: "#166534", background: "#F0FDF4", border: "1px solid #86EFAC" }}>
            <CheckCircle2 size={15} />
            Produto atualizado com sucesso.
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-white rounded-xl"
            style={{
              padding: "12px 20px",
              background: loading || !isDirty ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #4F46E5)",
              border: "none",
              cursor: loading || !isDirty ? "not-allowed" : "pointer",
              boxShadow: loading || !isDirty ? "none" : "0 1px 2px rgba(29,78,216,0.2), 0 6px 20px rgba(29,78,216,0.25)",
              opacity: !isDirty && !loading ? 0.6 : 1,
            }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" />Salvando...</> : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
