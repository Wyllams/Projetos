import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LocalSEO — Entrar",
  description: "Acesse sua conta e gerencie a presença digital do seu negócio.",
};

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ===== Painel Esquerdo - Branding ===== */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl" />
        </div>

        {/* Conteúdo do branding */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight">LocalSEO</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Sua presença digital
              <br />
              no piloto automático.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              IA que responde avaliações, cria posts no Google, escreve artigos
              SEO e monitora sua presença local — tudo automaticamente.
            </p>
          </div>

          {/* Estatísticas */}
          <div className="flex gap-8 mt-8">
            <div>
              <p className="text-3xl font-bold">+340%</p>
              <p className="text-sm text-white/60">mais visibilidade</p>
            </div>
            <div>
              <p className="text-3xl font-bold">2.5x</p>
              <p className="text-sm text-white/60">mais avaliações</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-white/60">sempre ativo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Painel Direito - Formulário ===== */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        {children}
      </div>
    </div>
  );
}
