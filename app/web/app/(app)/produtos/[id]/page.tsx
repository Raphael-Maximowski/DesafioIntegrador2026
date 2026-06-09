"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Box, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getProduct, updateProduct, listCategories, listProducts } from "@/services/products";
import CategoryPicker from "@/components/products/CategoryPicker";
import { sanitizeDecimal, sanitizeInteger, onDecimalKeyDown, onNumericKeyDown } from "@/lib/formUtils";
import type { Product, Category } from "@/types/product";

const schema = z.object({
  name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  price: z.string()
    .min(1, "Preço obrigatório")
    .refine(v => /^\d+(\.\d{1,2})?$/.test(v.trim()) && parseFloat(v) > 0, "Preço deve ser maior que 0")
    .refine(v => parseFloat(v) < 999999, "Preço deve ser menor que 999.999"),
  stock: z.string()
    .min(1, "Estoque obrigatório")
    .refine(v => /^\d+$/.test(v.trim()), "Deve ser número inteiro")
    .refine(v => parseInt(v, 10) >= 0 && parseInt(v, 10) <= 99999, "Estoque deve ser entre 0 e 99.999"),
  categoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function Field({
  id, label, error, required, children,
}: {
  id: string; label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
        {label}
        {required && <span aria-hidden="true" style={{ color: "#fa5252", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      <p
        id={`${id}-error`}
        role={error ? "alert" : undefined}
        style={{
          minHeight: 18, marginTop: 5, fontSize: 12, fontWeight: 500,
          color: error ? "#fa5252" : "transparent",
          display: "flex", alignItems: "center", gap: 4,
        }}
      >
        {error && <AlertCircle size={12} aria-hidden="true" />}
        {error ?? " "}
      </p>
    </div>
  );
}

function InputIcon({
  id, icon: Icon, hasError, isValid,
  onFocus: onFocusProp, onBlur: onBlurProp,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string; icon: React.ElementType; hasError?: boolean; isValid?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const iconColor = hasError ? "#fa5252" : isValid ? "#12b886" : focused ? "#3b5bdb" : "#9da3b4";

  return (
    <div className="relative">
      <span
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: iconColor, transition: "color 0.15s" }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <input
        id={id}
        className="saas-input has-icon-left"
        style={{
          borderColor: hasError ? "#fa5252" : isValid ? "#12b886" : undefined,
          background:  hasError ? "#fff8f8"  : isValid ? "#f0fdf4" : undefined,
          paddingRight: isValid ? 36 : undefined,
        }}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={hasError ? `${id}-error` : undefined}
        onFocus={e => { setFocused(true);  onFocusProp?.(e); }}
        onBlur={e  => { setFocused(false); onBlurProp?.(e);  }}
        {...props}
      />
      {isValid && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} aria-hidden="true">
          <CheckCircle2 size={15} style={{ color: "#12b886" }} />
        </span>
      )}
    </div>
  );
}

export default function EditarProdutoPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const id      = params.id;

  const [product,    setProduct]    = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching,   setFetching]   = useState(true);
  const [fetchErr,   setFetchErr]   = useState("");
  const [apiError,   setApiError]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [saved,      setSaved]      = useState(false);

  const { register, handleSubmit, watch, reset, control, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const name  = watch("name");
  const price = watch("price");
  const stock = watch("stock");

  const nameValid  = !errors.name  && !!name  && name.length >= 3;
  const priceValid = !errors.price && !!price;
  const stockValid = !errors.stock && !!stock;

  const priceReg = register("price");
  const stockReg = register("stock");

  useEffect(() => {
    Promise.all([getProduct(id), listCategories({ limit: 100 })])
      .then(([p, cats]) => {
        setProduct(p);
        setCategories(cats.data);
        reset({ name: p.name, price: String(p.price), stock: String(p.stock), categoryId: p.category?.id ?? "" });
      })
      .catch(() => setFetchErr("Produto não encontrado ou erro ao carregar."))
      .finally(() => setFetching(false));
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    setLoading(true); setApiError(""); setSaved(false);
    try {
      const existing = await listProducts({ name: data.name.trim(), limit: 10 });
      const duplicate = existing.data.some(
        p => p.name.toLowerCase() === data.name.trim().toLowerCase() && p.id !== id
      );
      if (duplicate) {
        setApiError("Já existe um produto com este nome.");
        return;
      }
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
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#9da3b4" }} />
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div style={{ padding: "32px 28px" }}>
        <div className="text-sm rounded-lg px-4 py-3" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", maxWidth: 680, margin: "0 auto" }}>
          {fetchErr}
        </div>
        <button type="button" className="form-back-link" style={{ marginTop: 16 }} onClick={() => router.push("/produtos")}>
          <ArrowLeft size={15} /> Voltar para produtos
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100%", padding: "32px 28px 48px" }}>

      <button type="button" className="form-back-link" onClick={() => router.push("/produtos")}>
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para produtos
      </button>

      <div className="form-card">
        <div className="form-card__header">
          <h1 className="form-card__title">Editar produto</h1>
          <p className="form-card__subtitle">{product?.name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-card__body">

            <Field id="name" label="Nome do produto" error={errors.name?.message} required>
              <InputIcon
                id="name" icon={Package} type="text"
                placeholder="Nome do produto" maxLength={100}
                hasError={!!errors.name} isValid={nameValid}
                aria-required="true"
                {...register("name")}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field id="price" label="Preço (R$)" error={errors.price?.message} required>
                <InputIcon
                  id="price" icon={Package} type="text" inputMode="decimal"
                  placeholder="0,00"
                  hasError={!!errors.price} isValid={priceValid}
                  aria-required="true"
                  {...priceReg}
                  onChange={e => { e.target.value = sanitizeDecimal(e.target.value, 6, 2); priceReg.onChange(e); }}
                  onKeyDown={onDecimalKeyDown}
                />
              </Field>

              <Field id="stock" label="Estoque (unidades)" error={errors.stock?.message} required>
                <InputIcon
                  id="stock" icon={Box} type="text" inputMode="numeric"
                  placeholder="0"
                  hasError={!!errors.stock} isValid={stockValid}
                  aria-required="true"
                  {...stockReg}
                  onChange={e => { e.target.value = sanitizeInteger(e.target.value, 5); stockReg.onChange(e); }}
                  onKeyDown={onNumericKeyDown}
                />
              </Field>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Categoria
              </label>
              <Controller
                name="categoryId" control={control}
                render={({ field }) => (
                  <CategoryPicker
                    categories={categories} value={field.value} onChange={field.onChange}
                    onCategoryCreated={cat => setCategories(prev => [...prev, cat])}
                    onCategoryDeleted={id  => setCategories(prev => prev.filter(c => c.id !== id))}
                  />
                )}
              />
            </div>

            {apiError && (
              <div role="alert" className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertCircle size={14} aria-hidden="true" />{apiError}
              </div>
            )}

            {saved && (
              <div role="status" className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ color: "#0d6c4c", background: "#f0fdf4", border: "1px solid #86efac" }}>
                <CheckCircle2 size={14} aria-hidden="true" />Produto atualizado com sucesso.
              </div>
            )}

          </div>

          <div className="form-card__footer">
            <button type="button" className="btn-secondary" onClick={() => router.push("/produtos")}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !isDirty}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />Salvando...</>
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
