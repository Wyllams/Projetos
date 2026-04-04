import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Button
} from "@react-email/components";
import * as React from "react";

interface RelatorioSemanalProps {
  nomeNegocio: string;
  pontuacaoAtual: number;
  novasAvaliacoes: number;
  postsGerados: number;
  artigosGerados: number;
  dicaSemana: string;
}

const urlSaaS = process.env.NEXT_PUBLIC_APP_URL || "https://localseo.com.br";

export const RelatorioSemanalEmail = ({
  nomeNegocio = "Seu Negócio",
  pontuacaoAtual = 85,
  novasAvaliacoes = 3,
  postsGerados = 2,
  artigosGerados = 1,
  dicaSemana = "Responda às avaliações assim que recebê-las para aumentar seu engajamento no Google Maps.",
}: RelatorioSemanalProps) => {
  return (
    <Html>
      <Head />
      <Preview>Seu relatório de SEO Local desta semana chegou! 🚀</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔥 Relatório Semanal LocalSEO</Heading>
          
          <Text style={text}>
            Olá, <strong>{nomeNegocio}</strong>! Aqui está o resumo do seu desempenho em buscas locais e atualizações do Google Meu Negócio nesta semana.
          </Text>

          {/* Cards de Métricas */}
          <Section style={metricsCard}>
            <Row>
              <Column>
                <Text style={metricTitle}>Health Score SEO</Text>
                <Text style={metricValue}>{pontuacaoAtual}/100</Text>
              </Column>
              <Column>
                <Text style={metricTitle}>Novas Avaliações</Text>
                <Text style={metricValue}>+{novasAvaliacoes}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={metricsCardSecundary}>
            <Row>
              <Column>
                <Text style={metricTitleDark}>Posts no GMB (IA)</Text>
                <Text style={metricValueDark}>+{postsGerados}</Text>
              </Column>
              <Column>
                <Text style={metricTitleDark}>Artigos Longos (SEO)</Text>
                <Text style={metricValueDark}>+{artigosGerados}</Text>
              </Column>
            </Row>
          </Section>

          {/* Dica do Especialista */}
          <Section style={tipBox}>
            <Text style={tipTitle}>💡 Dica de Ranqueamento</Text>
            <Text style={tipText}>{dicaSemana}</Text>
          </Section>

          <Text style={text}>
            Para ver o relatório completo e interagir com seus novos leads, acesse seu painel.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={`${urlSaaS}/painel`}>
              Acessar meu Painel
            </Button>
          </Section>

          <Text style={footer}>
            Enviado automaticamente pelo seu Agente LocalSEO.<br />
            Para pausar alertas, acesse suas configurações no painel.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default RelatorioSemanalEmail;

// --- Dicas de Estilo Tailwind/CSS Inline ---
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "40px",
  marginTop: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const h1 = {
  color: "#1e3a8a", // blue-900
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  marginBottom: "24px",
};

const metricsCard = {
  backgroundColor: "#1e40af", // blue-800
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "16px",
  textAlign: "center" as const,
};

const metricsCardSecundary = {
  backgroundColor: "#f1f5f9", // slate-100
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const metricTitle = { color: "#bfdbfe", fontSize: "14px", margin: "0" };
const metricValue = { color: "#ffffff", fontSize: "32px", fontWeight: "bold", margin: "8px 0 0" };

const metricTitleDark = { color: "#64748b", fontSize: "14px", margin: "0" };
const metricValueDark = { color: "#0f172a", fontSize: "28px", fontWeight: "bold", margin: "8px 0 0" };

const tipBox = {
  borderLeft: "4px solid #10b981", // emerald-500
  backgroundColor: "#ecfdf5", // emerald-50
  padding: "20px",
  borderRadius: "0 8px 8px 0",
  marginBottom: "24px",
};

const tipTitle = { color: "#047857", fontWeight: "bold", margin: "0 0 8px", fontSize: "16px" };
const tipText = { color: "#065f46", margin: "0", fontSize: "15px", lineHeight: "1.4" };

const btnContainer = { textAlign: "center" as const, margin: "32px 0 24px" };

const button = {
  backgroundColor: "#1e40af",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  fontWeight: "bold",
  boxShadow: "0 4px 6px rgba(30, 64, 175, 0.2)",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "32px",
  lineHeight: "16px",
};
