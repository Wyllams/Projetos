"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DadosGrafico {
  data: string;
  score: number;
}

interface PropsGrafico {
  dados: DadosGrafico[];
}

export function GraficoEvolucao({ dados }: PropsGrafico) {
  if (!dados || dados.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
        Sem dados suficientes para gerar o gráfico.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={dados}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="corScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(217, 33%, 25%)" opacity={0.5} />
          <XAxis 
            dataKey="data" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(215, 20.2%, 65.1%)" }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(215, 20.2%, 65.1%)" }}
            domain={[0, 100]}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 11%)",
              border: "1px solid hsl(217, 33%, 17%)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              color: "hsl(210, 40%, 98%)",
            }}
            itemStyle={{ color: "hsl(217, 91%, 60%)" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#corScore)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
