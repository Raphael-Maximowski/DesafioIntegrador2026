"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, DollarSign, Box, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createProduct, listCategories } from "@/services/products";
import CategoryPicker from "@/components/products/CategoryPicker";
import type { Category } from "@/types/product";

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
  icon: Icon, hasError, isValid, prefix, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType; hasError?: boolean; isValid?: boolean; prefix?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: hasError ? "#DC2626" : isValid ? "#16A34A" : "#9CA3AF" }}>
        {prefix ? <span className="text-sm font-medium">{prefix}</span> : <Icon size={16} />}
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

export default function NovoProdutoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [apiError,   setApiError]   = useState("");
  const [loading,    setLoading]    = useState(false);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormData>({
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
    listCategories({ limit: 100 }).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    setApiError("");
    try {
      await createProduct({
        name:       data.name,
        price:      parseFloat(data.price),
        stock:      parseInt(data.stock, 10),
        categoryId: data.categoryId || undefined,
      });
      router.push("/produtos");
    } catch (e: unknown) {
      setApiError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Erro ao cadastrar produto. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Novo produto</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Preencha os dados para cadastrar um novo produto.</p>
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
              icon={DollarSign}
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
          <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>Categoria (opcional)</label>
          <Controller
            name="categoryId"
            control={control}
            defaultValue=""
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

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-white rounded-xl"
            style={{
              padding: "12px 20px",
              background: loading ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #4F46E5)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 1px 2px rgba(29,78,216,0.2), 0 6px 20px rgba(29,78,216,0.25)",
            }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" />Cadastrando...</> : "Cadastrar produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
