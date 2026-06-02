"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { requestOtp, verifyOtp } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

const emailSchema = z.object({
  email: z.string().email({ message: "Informe um e-mail válido" }),
});
const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "O código deve ter 6 dígitos"),
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm   = z.infer<typeof otpSchema>;

/* ── Shared field wrapper ── */
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

/* ── Input with icon ── */
function InputIcon({
  icon: Icon,
  hasError,
  isValid,
  right,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  hasError?: boolean;
  isValid?: boolean;
  right?: React.ReactNode;
}) {
  const borderColor = hasError ? "#FCA5A5" : isValid ? "#86EFAC" : undefined;
  const bg          = hasError ? "#FFF5F5" : isValid ? "#F0FDF4" : undefined;
  const iconColor   = hasError ? "#DC2626" : isValid ? "#16A34A" : "#9CA3AF";
  const hasRight    = right || isValid;

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
          paddingRight: hasRight ? "44px" : undefined,
          borderColor,
          background: bg,
        }}
        {...props}
      />
      {right && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>
      )}
      {isValid && !right && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <CheckCircle2 size={15} style={{ color: "#16A34A" }} />
        </span>
      )}
    </div>
  );
}

/* ── Primary button ── */
function PrimaryButton({
  loading, label, loadingLabel,
}: { loading: boolean; label: string; loadingLabel: string }) {
  return (
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
        <><Loader2 size={16} className="animate-spin" />{loadingLabel}</>
      ) : (
        <>{label}<ArrowRight size={16} /></>
      )}
    </button>
  );
}

/* ── Error banner ── */
function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
      style={{
        color: "#991B1B",
        background: "#FEF2F2",
        border: "1px solid #FECACA",
      }}
    >
      <span className="text-base">⚠</span>
      {message}
    </div>
  );
}

/* ── Divider ── */
function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
      <span className="text-xs" style={{ color: "#9CA3AF" }}>ou</span>
      <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
    </div>
  );
}

/* ── Step dots ── */
function StepDots({ current }: { current: "email" | "otp" }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {(["email", "otp"] as const).map((s) => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width:  current === s ? "20px" : "8px",
            height: "8px",
            background: current === s ? "#1D4ED8" : "#E5E7EB",
          }}
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const router    = useRouter();
  const params    = useSearchParams();
  const { login } = useAuthStore();

  const [step,     setStep]     = useState<"email" | "otp">("email");
  const [email,    setEmail]    = useState(params.get("email") ?? "");
  const [showCode, setShowCode] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email },
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  async function onEmailSubmit(data: EmailForm) {
    setLoading(true); setApiError("");
    try {
      await requestOtp(data.email);
      setEmail(data.email);
      setStep("otp");
    } catch (e: unknown) {
      setApiError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Não foi possível enviar o código. Tente novamente."
      );
    } finally { setLoading(false); }
  }

  async function onOtpSubmit(data: OtpForm) {
    setLoading(true); setApiError("");
    try {
      const tokens = await verifyOtp(email, data.code);
      login(tokens);
      router.replace("/dashboard");
    } catch (e: unknown) {
      setApiError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Código inválido ou expirado."
      );
    } finally { setLoading(false); }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <StepDots current={step} />
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#0F172A" }}>
          {step === "email" ? "Bem-vindo de volta" : "Verificar identidade"}
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          {step === "email"
            ? "Faça login para acessar o painel."
            : <>Código enviado para <strong style={{ color: "#334155" }}>{email}</strong></>}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} noValidate className="space-y-4">
          <Field label="E-mail" error={emailForm.formState.errors.email?.message}>
            <InputIcon
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              hasError={!!emailForm.formState.errors.email}
              isValid={!!emailForm.formState.touchedFields.email && !emailForm.formState.errors.email}
              {...emailForm.register("email")}
            />
          </Field>

          <ErrorBanner message={apiError} />

          <PrimaryButton loading={loading} label="Continuar" loadingLabel="Enviando..." />

          <Divider />

          <p className="text-sm text-center" style={{ color: "#64748B" }}>
            Não tem conta?{" "}
            <a href="/cadastro" className="font-semibold" style={{ color: "#1D4ED8" }}>
              Criar conta
            </a>
          </p>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} noValidate className="space-y-4">
          {/* Info box */}
          <div
            className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              color: "#1E40AF",
            }}
          >
            <span>📧</span>
            <span>Verifique sua caixa de entrada e insira o código de 6 dígitos.</span>
          </div>

          <Field label="Código de verificação" error={otpForm.formState.errors.code?.message}>
            <InputIcon
              icon={showCode ? EyeOff : Eye}
              type={showCode ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="••••••"
              hasError={!!otpForm.formState.errors.code}
              style={{
                textAlign: "center",
                fontSize: "1.2rem",
                letterSpacing: "0.3em",
              }}
              right={
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  aria-label={showCode ? "Ocultar" : "Mostrar"}
                >
                  {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              {...otpForm.register("code")}
            />
          </Field>

          <ErrorBanner message={apiError} />

          <PrimaryButton loading={loading} label="Entrar" loadingLabel="Verificando..." />

          <button
            type="button"
            onClick={() => { setStep("email"); setApiError(""); otpForm.reset(); }}
            className="w-full text-sm py-1"
            style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer" }}
          >
            ← Usar outro e-mail
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
