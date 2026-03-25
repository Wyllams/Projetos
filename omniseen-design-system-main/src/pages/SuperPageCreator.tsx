import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sparkles, ChevronDown, ChevronUp, Loader2, Check, AlertCircle, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBlog } from "@/hooks/useBlog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ── Pipeline Step Labels ──────────────────────────────────────────────────────
const STEPS = [
  "Analisando SERP e concorrentes",
  "Planejando estrutura e outline",
  "Escrevendo introdução e sumário",
  "Gerando seções principais",
  "Adicionando FAQ e Key Takeaways",
  "Otimizando meta-dados SEO",
  "Calculando quality score",
  "Finalizando Super Page",
];

type PipelineStatus = "idle" | "running" | "done" | "error";

interface PipelineState {
  status: PipelineStatus;
  step: number;       // 0-based index of current STEPS
  progress: number;   // 0-100
  pageId: string | null;
  error: string | null;
}

const INITIAL: PipelineState = { status: "idle", step: 0, progress: 0, pageId: null, error: null };

type PageMode = "pillar" | "hub" | "landing";

export default function SuperPageCreator() {
  const navigate = useNavigate();
  const { blog } = useBlog();
  const { user } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("pt-br");
  const [tone, setTone] = useState("profissional e próximo");
  const [mode, setMode] = useState<PageMode>("pillar");
  const [includeFaq, setIncludeFaq] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  // Removed showOptions state

  const [pipeline, setPipeline] = useState<PipelineState>(INITIAL);

  const isRunning = pipeline.status === "running";
  const isDone = pipeline.status === "done";
  const hasError = pipeline.status === "error";

  // Simulated step-ticker while the edge function runs
  const tickProgress = useCallback(() => {
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 2);
      const progress = Math.min(Math.round((stepIdx / (STEPS.length - 1)) * 92), 92);
      setPipeline((prev) =>
        prev.status === "running" ? { ...prev, step: stepIdx, progress } : prev
      );
    }, 3800);
    return interval;
  }, []);

  const generate = async () => {
    if (!keyword.trim() || !blog || !user) return;
    setPipeline({ status: "running", step: 0, progress: 4, pageId: null, error: null });

    const ticker = tickProgress();

    try {
      const { data, error } = await supabase.functions.invoke("generate-super-page", {
        body: {
          blog_id: blog.id,
          user_id: user.id,
          keyword: keyword.trim(),
          title: title.trim() || undefined,
          language,
          tone,
          mode,
          include_faq: includeFaq,
          include_cta: includeCta,
        },
      });

      clearInterval(ticker);

      if (error || !data?.page_id) {
        setPipeline({ status: "error", step: 0, progress: 0, pageId: null, error: error?.message ?? "Erro desconhecido" });
        return;
      }

      setPipeline({ status: "done", step: STEPS.length - 1, progress: 100, pageId: data.page_id, error: null });
      toast.success("Super Page gerada com sucesso!");
      setTimeout(() => navigate(`/client/super-pages/${data.page_id}`), 700);
    } catch (err: any) {
      clearInterval(ticker);
      setPipeline({ status: "error", step: 0, progress: 0, pageId: null, error: err?.message ?? "Erro inesperado" });
    }
  };

  return (
    <div className="p-space-6">
      {/* Page header */}
      <div className="flex items-center gap-space-4 mb-space-7">
        <button onClick={() => navigate("/client/super-pages")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-h1 text-foreground">Nova Super Page</h1>
      </div>

      <div className="max-w-content-generator mx-auto bg-card border border-border rounded-xl shadow-md p-space-7">

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        {!isRunning && !isDone && !hasError && (
          <>
            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-3 mb-space-7">
              {([
                { key: "pillar", label: "Pillar Page", desc: "Hub de conteúdo profundo" },
                { key: "hub", label: "Hub de Conteúdo", desc: "Reúne artigos relacionados" },
                { key: "landing", label: "Landing Evergreen", desc: "Captura + conversão" },
              ] as const).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    mode === m.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <p className="text-body-sm font-semibold">{m.label}</p>
                  <p className="text-caption mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Keyword */}
            <div className="mb-space-5">
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                Palavra-chave foco <span className="text-destructive">*</span>
              </label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="Ex: marketing de conteúdo para startups B2B"
                className="h-12"
                autoFocus
              />
              <p className="text-caption text-muted-foreground mt-space-2 italic">
                ✨ A IA analisa o SERP, escreve +3.000 palavras em paralelo, gera FAQ, TOC e structured data automaticamente.
              </p>
            </div>

            {/* Optional title */}
            <div className="mb-space-5">
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                Título (opcional — deixe em branco para a IA sugerir)
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: O Guia Definitivo de Marketing de Conteúdo para Startups"
              />
            </div>

            {/* Advanced options (always visible) */}
            <div className="grid grid-cols-2 gap-space-5 mb-space-6 mt-space-4 pt-space-4 border-t border-border">
              <div>
                <label className="text-caption text-muted-foreground mb-space-1 block">Idioma</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-br">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-caption text-muted-foreground mb-space-1 block">Tom de voz</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional e próximo">Profissional</SelectItem>
                    <SelectItem value="técnico e especializado">Técnico</SelectItem>
                    <SelectItem value="didático e educacional">Didático</SelectItem>
                    <SelectItem value="persuasivo e comercial">Persuasivo</SelectItem>
                    <SelectItem value="casual e descontraído">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-space-4 col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-caption text-muted-foreground">Incluir FAQ com Schema</label>
                  <Switch checked={includeFaq} onCheckedChange={setIncludeFaq} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-caption text-muted-foreground">Incluir CTA de conversão</label>
                  <Switch checked={includeCta} onCheckedChange={setIncludeCta} />
                </div>
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={!keyword.trim() || !blog}
              className="w-full h-[52px] text-body-lg gap-2"
            >
              <Zap className="h-5 w-5" />
              Gerar Super Page com IA
            </Button>
          </>
        )}

        {/* ── Pipeline progress ─────────────────────────────────────────────── */}
        {(isRunning || isDone) && (
          <div>
            <h3 className="text-h3 text-foreground mb-2 text-center">
              {isDone ? "Super Page gerada!" : "Gerando Super Page..."}
            </h3>
            {!isDone && (
              <p className="text-body-sm text-muted-foreground text-center mb-space-5">
                {STEPS[pipeline.step]}
              </p>
            )}

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full mb-space-6 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${pipeline.progress}%` }}
              />
            </div>

            {/* Steps list */}
            <div className="space-y-space-3">
              {STEPS.map((label, i) => {
                const isCompleted = i < pipeline.step || isDone;
                const isActive = i === pipeline.step && !isDone;
                return (
                  <div key={i} className="flex items-center gap-space-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : isActive ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="text-tiny">{i + 1}</span>}
                    </div>
                    <span className={`text-body ${isCompleted || isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {hasError && (
          <div className="text-center">
            <div className="flex justify-center mb-space-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-h3 text-foreground mb-space-3">Erro na geração</h3>
            <p className="text-body-sm text-muted-foreground mb-space-6">{pipeline.error}</p>
            <Button onClick={() => setPipeline(INITIAL)} className="w-full">
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
