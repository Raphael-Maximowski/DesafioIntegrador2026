import { Inter } from "next/font/google";
import {
  CheckCircle2,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  Users,
  ArrowUpRight,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const features = [
  { icon: BarChart3, text: "Relatórios em tempo real" },
  { icon: Zap,       text: "Automação de processos" },
  { icon: Shield,    text: "Segurança avançada" },
  { icon: TrendingUp,text: "Controle financeiro" },
];

const stats = [
  { value: "5.000+", label: "Empresas ativas" },
  { value: "99.9%",  label: "Disponibilidade" },
  { value: "2×",     label: "Mais produtividade" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} min-h-screen flex`}
      style={{ fontFamily: "var(--font-inter, sans-serif)" }}
    >
      {/* ── Left: form ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: "#F8F9FB" }}
      >
        <div className="w-full" style={{ maxWidth: "420px" }}>
          {children}
        </div>
      </div>

      {/* ── Right: institutional (desktop only) ── */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F2150 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-80px", right: "-80px", width: "320px", height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "80px", left: "-60px", width: "280px", height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-40px", right: "20%", width: "200px", height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)",
            filter: "blur(35px)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}
            >
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm tracking-wide">
              DataNexus
            </span>
          </div>

          {/* Hero content */}
          <div className="py-12">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-6 text-xs font-medium"
              style={{
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "#93C5FD",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#3B82F6" }}
              />
              Plataforma de gestão inteligente
            </div>

            <h2
              className="font-bold mb-4 leading-tight"
              style={{ color: "#F1F5F9", fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
            >
              Gerencie seu negócio
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #60A5FA, #818CF8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                de forma inteligente
              </span>
            </h2>

            <p className="text-sm leading-relaxed mb-8" style={{ color: "#94A3B8" }}>
              Tome decisões estratégicas baseadas em dados precisos.
              Dashboard completo, relatórios automáticos e análise preditiva.
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-10">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}
                  >
                    <Icon size={14} style={{ color: "#60A5FA" }} />
                  </div>
                  <span className="text-sm" style={{ color: "#CBD5E1" }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Stats glass card */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                {stats.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div
                      className="font-bold text-xl mb-0.5"
                      style={{ color: "#F1F5F9" }}
                    >
                      {value}
                    </div>
                    <div className="text-xs" style={{ color: "#64748B" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom testimonial */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff" }}
            >
              CL
            </div>
            <div>
              <p className="text-xs leading-relaxed mb-1" style={{ color: "#94A3B8" }}>
                &ldquo;O DataNexus transformou a forma como gerenciamos nossos dados.
                Decisões 3× mais rápidas.&rdquo;
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium" style={{ color: "#CBD5E1" }}>
                  Carlos Lima
                </span>
                <span className="text-xs" style={{ color: "#475569" }}>
                  · CEO, TechCorp
                </span>
                <ArrowUpRight size={11} style={{ color: "#475569" }} className="ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
