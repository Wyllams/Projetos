import { Settings, Lock } from "lucide-react";
import { FormularioGmb } from "./form-gmb";

export default function PaginaConfiguracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações e Integração</h1>
        <p className="text-muted-foreground mt-1">
          Habilite os canos de conexão direta com o Google.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card p-8 flex flex-col items-start border border-emerald-500/20">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.64 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Conexão Google Meu Negócio</h2>
          
          <div className="w-full mt-4">
            <FormularioGmb />
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col items-center justify-center text-center opacity-50 relative pointer-events-none">
          <div className="absolute top-4 right-4"><Lock className="w-4 h-4" /></div>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Assinatura Asaas</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Gerenciamento de faturas e planos será liberado na Fase 8.
          </p>
        </div>
      </div>
    </div>
  );
}
