import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Eye, MousePointer, Clock, TrendingUp, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const db = supabase as any;

interface DayStats {
  date: string;
  views: number;
  clicks: number;
  read_time_avg: number;
}

interface ArticleStats {
  article_id: string;
  title: string;
  total_views: number;
  total_clicks: number;
  avg_read_time: number;
}

type Range = "7" | "30" | "90";

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-caption text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { blog, loading: blogLoading } = useBlog();
  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(true);
  const [timeSeries, setTimeSeries] = useState<DayStats[]>([]);
  const [topArticles, setTopArticles] = useState<ArticleStats[]>([]);

  const load = useCallback(async () => {
    if (!blog) return;
    setLoading(true);

    const since = new Date();
    since.setDate(since.getDate() - parseInt(range));
    const sinceStr = since.toISOString().split("T")[0];

    // Time series aggregated by day
    const { data: ts } = await db
      .from("article_analytics")
      .select("date, views, clicks, read_time_avg")
      .eq("blog_id", blog.id)
      .gte("date", sinceStr)
      .order("date", { ascending: true });

    // aggregate by date
    const byDate: Record<string, { views: number; clicks: number; rtSum: number; count: number }> = {};
    for (const row of ts ?? []) {
      const d = row.date.slice(0, 10);
      if (!byDate[d]) byDate[d] = { views: 0, clicks: 0, rtSum: 0, count: 0 };
      byDate[d].views  += row.views  ?? 0;
      byDate[d].clicks += row.clicks ?? 0;
      byDate[d].rtSum  += row.read_time_avg ?? 0;
      byDate[d].count  += 1;
    }
    const tsSeries: DayStats[] = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        views: v.views,
        clicks: v.clicks,
        read_time_avg: v.count ? Math.round(v.rtSum / v.count) : 0,
      }));
    setTimeSeries(tsSeries);

    // Top articles by views
    const { data: artData } = await db
      .from("article_analytics")
      .select("article_id, views, clicks, read_time_avg")
      .eq("blog_id", blog.id)
      .gte("date", sinceStr);

    const artAgg: Record<string, { views: number; clicks: number; rtSum: number; n: number }> = {};
    for (const row of artData ?? []) {
      if (!artAgg[row.article_id]) artAgg[row.article_id] = { views: 0, clicks: 0, rtSum: 0, n: 0 };
      artAgg[row.article_id].views  += row.views  ?? 0;
      artAgg[row.article_id].clicks += row.clicks ?? 0;
      artAgg[row.article_id].rtSum  += row.read_time_avg ?? 0;
      artAgg[row.article_id].n      += 1;
    }

    const topIds = Object.entries(artAgg)
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, 10)
      .map(([id]) => id);

    if (topIds.length > 0) {
      const { data: arts } = await supabase
        .from("articles")
        .select("id, title")
        .in("id", topIds);

      const titleMap: Record<string, string> = {};
      for (const a of arts ?? []) titleMap[a.id] = a.title;

      setTopArticles(topIds.map((id) => ({
        article_id: id,
        title: titleMap[id] ?? id.slice(0, 12) + "...",
        total_views:  artAgg[id].views,
        total_clicks: artAgg[id].clicks,
        avg_read_time: artAgg[id].n ? Math.round(artAgg[id].rtSum / artAgg[id].n) : 0,
      })));
    } else {
      setTopArticles([]);
    }

    setLoading(false);
  }, [blog, range]);

  useEffect(() => { if (!blogLoading) load(); }, [blogLoading, load]);

  const totalViews  = timeSeries.reduce((s, d) => s + d.views,  0);
  const totalClicks = timeSeries.reduce((s, d) => s + d.clicks, 0);
  const avgReadTime = timeSeries.length ? Math.round(timeSeries.reduce((s, d) => s + d.read_time_avg, 0) / timeSeries.length) : 0;
  const ctr = totalViews ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  if (blogLoading || (loading && timeSeries.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics de Artigos</h1>
          <p className="text-muted-foreground text-sm mt-1">Métricas de visualizações, cliques e tempo médio de leitura.</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Eye}          label="Visualizações"     value={totalViews.toLocaleString("pt-BR")} color="bg-primary/10 text-primary" />
        <KpiCard icon={MousePointer} label="Cliques"           value={totalClicks.toLocaleString("pt-BR")} color="bg-blue-500/10 text-blue-500" />
        <KpiCard icon={TrendingUp}   label="CTR"               value={`${ctr}%`}                          color="bg-green-500/10 text-green-500" sub="Cliques / Visualizações" />
        <KpiCard icon={Clock}        label="Tempo Médio (seg)" value={avgReadTime}                         color="bg-orange-500/10 text-orange-500" sub="Tempo médio de leitura" />
      </div>

      {/* Charts */}
      {timeSeries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum dado de analytics ainda.</p>
            <p className="text-caption text-muted-foreground mt-1">Os dados aparecerão aqui conforme seus artigos receberem visitas.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Line chart — views over time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visualizações ao longo do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeSeries} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="views"  dot={false} stroke="#6366f1" strokeWidth={2} name="Visualizações" />
                  <Line type="monotone" dataKey="clicks" dot={false} stroke="#22c55e" strokeWidth={2} name="Cliques" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar chart — top articles */}
          {topArticles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Artigos por Visualizações</CardTitle>
                <CardDescription>Top 10 artigos no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topArticles} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Bar dataKey="total_views" fill="#6366f1" radius={[0, 4, 4, 0]} name="Visualizações" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detalhes por Artigo</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-semibold text-foreground">Artigo</th>
                      <th className="py-2 pr-4 font-semibold text-foreground text-right">Views</th>
                      <th className="py-2 pr-4 font-semibold text-foreground text-right">Cliques</th>
                      <th className="py-2 font-semibold text-foreground text-right">Tempo Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topArticles.map((a) => (
                      <tr key={a.article_id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="py-2.5 pr-4 text-foreground">{a.title}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{a.total_views.toLocaleString("pt-BR")}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{a.total_clicks.toLocaleString("pt-BR")}</td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">{a.avg_read_time}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
