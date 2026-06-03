"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, MapPin, Map, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createCustomer, listStates } from "@/services/customers";
import type { CustomerState } from "@/types/customer";

const schema = z.object({
  name:  z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().min(1, "E-mail obrigatório").email({ message: "Formato de e-mail inválido" }),
  city:  z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").max(100, "Nome da cidade muito longo"),
  state: z.string().min(1, "Estado obrigatório"),
});

type FormData = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
        {label}
      </label>
      {children}
      <p
        className="text-xs mt-1.5 font-medium"
        style={{ color: error ? "#DC2626" : "transparent", minHeight: "16px", lineHeight: "16px" }}
      >
        {error ?? " "}
      </p>
    </div>
  );
}

function InputIcon({
  icon: Icon,
  hasError,
  isValid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  hasError?: boolean;
  isValid?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: hasError ? "#DC2626" : isValid ? "#16A34A" : "#9CA3AF" }}
      >
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

export default function NovoClientePage() {
  const router = useRouter();
  const [states,   setStates]   = useState<CustomerState[]>([]);
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const name  = watch("name");
  const email = watch("email");
  const city  = watch("city");
  const state = watch("state");

  const nameValid  = !errors.name  && !!name  && name.length  >= 3;
  const emailValid = !errors.email && !!email;
  const cityValid  = !errors.city  && !!city  && city.length  >= 2;
  const stateValid = !errors.state && !!state;

  useEffect(() => {
    listStates().then(setStates).catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    setApiError("");
    try {
      await createCustomer(data);
      router.push("/clientes");
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setApiError("Este e-mail já está cadastrado para outro cliente.");
      } else {
        setApiError(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? "Erro ao cadastrar cliente. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      {/* Header */}
      <button
        onClick={() => router.push("/clientes")}
        className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <ArrowLeft size={15} />
        Voltar para clientes
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>
          Novo cliente
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          Preencha os dados para cadastrar um novo cliente.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-1">
        <Field label="Nome completo" error={errors.name?.message}>
          <InputIcon
            icon={User}
            type="text"
            placeholder="Nome completo"
            hasError={!!errors.name}
            isValid={nameValid}
            {...register("name")}
          />
        </Field>

        <Field label="E-mail" error={errors.email?.message}>
          <InputIcon
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="cliente@empresa.com"
            hasError={!!errors.email}
            isValid={emailValid}
            {...register("email")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" error={errors.city?.message}>
            <InputIcon
              icon={MapPin}
              type="text"
              placeholder="São Paulo"
              hasError={!!errors.city}
              isValid={cityValid}
              {...register("city")}
            />
          </Field>

          <Field label="Estado" error={errors.state?.message}>
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: errors.state ? "#DC2626" : stateValid ? "#16A34A" : "#9CA3AF" }}
              >
                <Map size={16} />
              </span>
              <select
                className="saas-input has-icon-left"
                style={{
                  borderColor: errors.state ? "#FCA5A5" : stateValid ? "#86EFAC" : undefined,
                  background:  errors.state ? "#FFF5F5" : stateValid ? "#F0FDF4" : undefined,
                  cursor: "pointer",
                }}
                {...register("state")}
              >
                <option value="">Selecione</option>
                {states.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            {/* error space already in Field */}
          </Field>
        </div>

        {apiError && (
          <div
            className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
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
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />Cadastrando...</>
            ) : (
              "Cadastrar cliente"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
