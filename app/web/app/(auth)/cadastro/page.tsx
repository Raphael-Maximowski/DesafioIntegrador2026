"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { register as apiRegister } from "@/services/auth";

const schema = z.object({
  firstName: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(30, "Nome deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: "Nome deve conter apenas letras" }),
  lastName: z.string()
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
    .max(30, "Sobrenome deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: "Sobrenome deve conter apenas letras" }),
  email: z.string()
    .min(1, "E-mail obrigatório")
    .email({ message: "Formato de e-mail inválido (ex: nome@domínio.com)" }),
});

type FormData = z.infer<typeof schema>;

/* ── Field wrapper ── */
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: "#DC2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Input with icon + validation state ── */
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
  const borderColor = hasError ? "#FCA5A5" : isValid ? "#86EFAC" : undefined;
  const bg          = hasError ? "#FFF5F5" : isValid ? "#F0FDF4" : undefined;
  const iconColor   = hasError ? "#DC2626" : isValid ? "#16A34A" : "#9CA3AF";

  return (
    <div className="relative">
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: iconColor }}
      >
        <Icon size={16} />
      </span>
      <input
        className="saas-input has-icon-left"
        style={{
          borderColor,
          background: bg,
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

/* ── Progress steps ── */
const STEPS = ["Dados pessoais", "E-mail", "Confirmação"];

function ProgressBar({ filled }: { filled: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  background: i < filled ? "#1D4ED8" : i === filled ? "#EFF6FF" : "#F1F5F9",
                  border: i === filled ? "2px solid #1D4ED8" : "none",
                  color: i < filled ? "#fff" : i === filled ? "#1D4ED8" : "#94A3B8",
                }}
              >
                {i < filled ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span
                className="text-xs hidden sm:block"
                style={{ color: i <= filled ? "#1D4ED8" : "#94A3B8" }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px transition-all"
                style={{ background: i < filled ? "#BFDBFE" : "#E5E7EB" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CadastroPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const firstName  = watch("firstName");
  const lastName   = watch("lastName");
  const emailValue = watch("email");

  // All fields validate onChange — same behavior across the form
  const firstNameValid = !errors.firstName && !!firstName && firstName.length >= 2;
  const lastNameValid  = !errors.lastName  && !!lastName  && lastName.length  >= 2;
  const emailValid     = !errors.email     && !!emailValue;

  // Progress: step 2 complete when email is valid
  const filled = firstName && lastName ? (emailValid ? 2 : 1) : 0;

  async function onSubmit(data: FormData) {
    setLoading(true);
    setApiError("");
    try {
      await apiRegister(data.firstName, data.lastName, data.email);
      router.push(`/login?email=${encodeURIComponent(data.email)}`);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setApiError("Este e-mail já está sendo utilizado em outra conta.");
      } else {
        setApiError(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? "Erro ao cadastrar. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#0F172A" }}>
          Criar sua conta
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Preencha seus dados e acesse o painel em instantes.
        </p>
      </div>

      <ProgressBar filled={filled} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Names — validate onChange (real-time) */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" error={errors.firstName?.message}>
            <InputIcon
              icon={User}
              type="text"
              autoComplete="given-name"
              placeholder="Felipe"
              hasError={!!errors.firstName}
              isValid={firstNameValid}
              {...register("firstName")}
            />
          </Field>
          <Field label="Sobrenome" error={errors.lastName?.message}>
            <InputIcon
              icon={User}
              type="text"
              autoComplete="family-name"
              placeholder="Ismael"
              hasError={!!errors.lastName}
              isValid={lastNameValid}
              {...register("lastName")}
            />
          </Field>
        </div>

        {/* Email — validates onChange like name fields */}
        <Field label="E-mail" error={errors.email?.message}>
          <InputIcon
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="exemplo@email.com"
            hasError={!!errors.email}
            isValid={emailValid}
            {...register("email")}
          />
        </Field>

        {apiError && (
          <div
            className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <span>⚠</span>
            {apiError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-white rounded-xl transition-all"
          style={{
            padding: "12px 20px",
            background: loading
              ? "#93C5FD"
              : "linear-gradient(135deg, #1D4ED8 0%, #4F46E5 100%)",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading
              ? "none"
              : "0 1px 2px rgba(29,78,216,0.2), 0 6px 20px rgba(29,78,216,0.25)",
          }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" />Criando conta...</>
          ) : (
            <>Criar conta<ArrowRight size={16} /></>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs" style={{ color: "#9CA3AF" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        <p className="text-sm text-center" style={{ color: "#64748B" }}>
          Já tem conta?{" "}
          <a href="/login" className="font-semibold" style={{ color: "#1D4ED8" }}>
            Fazer login
          </a>
        </p>
      </form>
    </div>
  );
}
