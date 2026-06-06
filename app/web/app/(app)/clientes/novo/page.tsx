"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, MapPin, Map, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createCustomer, listStates } from "@/services/customers";
import type { CustomerState } from "@/types/customer";

const schema = z.object({
  name:  z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().min(1, "E-mail obrigatório").email({ message: "Formato de e-mail inválido" }),
  city:  z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").max(100, "Nome da cidade muito longo"),
  state: z.string().min(1, "Estado obrigatório"),
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

  const [stateFocused, setStateFocused] = useState(false);
  const stateIconColor = errors.state ? "#fa5252" : stateValid ? "#12b886" : stateFocused ? "#3b5bdb" : "#9da3b4";
  const { onBlur: stateOnBlur, ...stateReg } = register("state");

  useEffect(() => {
    listStates().then(setStates).catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true); setApiError("");
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
    <div style={{ background: "#f8f9fc", minHeight: "100%", padding: "32px 28px 48px" }}>

      <button type="button" className="form-back-link" onClick={() => router.push("/clientes")}>
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para clientes
      </button>

      <div className="form-card">
        <div className="form-card__header">
          <h1 className="form-card__title">Novo cliente</h1>
          <p className="form-card__subtitle">Preencha os dados para cadastrar um novo cliente.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-card__body">

            <Field id="name" label="Nome completo" error={errors.name?.message} required>
              <InputIcon
                id="name" icon={User} type="text"
                placeholder="Nome completo" maxLength={100}
                hasError={!!errors.name} isValid={nameValid}
                aria-required="true"
                {...register("name")}
              />
            </Field>

            <Field id="email" label="E-mail" error={errors.email?.message} required>
              <InputIcon
                id="email" icon={Mail} type="email" autoComplete="email"
                placeholder="cliente@empresa.com"
                hasError={!!errors.email} isValid={emailValid}
                aria-required="true"
                {...register("email")}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field id="city" label="Cidade" error={errors.city?.message} required>
                <InputIcon
                  id="city" icon={MapPin} type="text"
                  placeholder="São Paulo" maxLength={100}
                  hasError={!!errors.city} isValid={cityValid}
                  aria-required="true"
                  {...register("city")}
                />
              </Field>

              <Field id="state" label="Estado" error={errors.state?.message} required>
                <div className="relative">
                  <span
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: stateIconColor, transition: "color 0.15s" }}
                    aria-hidden="true"
                  >
                    <Map size={16} />
                  </span>
                  <select
                    id="state"
                    className="saas-input has-icon-left"
                    style={{
                      borderColor: errors.state ? "#fa5252" : stateValid ? "#12b886" : undefined,
                      background:  errors.state ? "#fff8f8"  : stateValid ? "#f0fdf4" : undefined,
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.state ? "true" : undefined}
                    aria-describedby={errors.state ? "state-error" : undefined}
                    onFocus={() => setStateFocused(true)}
                    onBlur={e => { setStateFocused(false); stateOnBlur(e); }}
                    {...stateReg}
                  >
                    <option value="">Selecione</option>
                    {states.map(s => (
                      <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            {apiError && (
              <div role="alert" className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertCircle size={14} aria-hidden="true" />{apiError}
              </div>
            )}

          </div>

          <div className="form-card__footer">
            <button type="button" className="btn-secondary" onClick={() => router.push("/clientes")}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />Cadastrando...</>
                : "Cadastrar cliente"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
