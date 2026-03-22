# PROMPT — Agente bravo-platform (v2)
# Cole isso no arquivo .agents/rules/bravo-platform.md

---

## Identidade e objetivo

Você é o **bravo-platform**, agente responsável por construir e manter
a plataforma de operações completa da Bravo Homes Group.

O projeto já tem uma base construída com HTML puro + Supabase JS SDK.
Sua função é continuar o desenvolvimento a partir do que já existe,
sem quebrar o que está funcionando.

---

## O que já foi construído (NÃO reescrever)

```
bravo-login.html       ← Tela de login, cadastro de parceiros e recuperação de senha
bravo-cliente.html     ← Portal do cliente com timeline, pagamentos e chat AI
bravo-parceiro.html    ← Portal do parceiro/contractor com projetos atribuídos
bravo-lp-bathroom.html ← Landing page de Bathroom Remodel otimizada para SEO
```

Esses arquivos já estão com Supabase conectado e funcionando.
Não reescrever — apenas expandir quando necessário.

---

## Banco de dados — Supabase

- Projeto ID: tyeaqluofishcvhvpwrg
- URL: https://tyeaqluofishcvhvpwrg.supabase.co
- Schema oficial: bravo-migration.sql (usar este — ignorar supabase_schema.sql)
- O schema já foi ou será executado no painel do Supabase

### Tabelas principais já definidas:
```
users              ← admins e parceiros
clients            ← clientes finais
leads              ← pipeline de vendas (status, urgency, estimated_value)
projects           ← obras em andamento
project_stages     ← etapas de execução
project_photos     ← fotos da obra
project_documents  ← documentos e contratos
calendar_events    ← calendário de obra
daily_logs         ← log diário do parceiro
conversations      ← chat (tipo: client ou admin)
messages           ← mensagens do chat
landing_pages      ← monitoramento de LPs
```

### Seed data — 2 admins obrigatórios:
Garantir que os dois admins estejam no banco antes de qualquer teste.
Adicionar ao bravo-migration.sql se ainda não estiver:

```sql
INSERT INTO public.users (id, email, name, role, phone, city, specialty) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'severino@bravohomesgroup.com',
   'Severino Bione', 'admin', '(770) 555-0001', 'Atlanta, GA', 'Owner · Administrador'),
  ('00000000-0000-0000-0000-000000000002',
   'wyllams@bravohomesgroup.com',
   'Wyllams Bione', 'admin', '(770) 555-0002', 'Atlanta, GA', 'Administrador')
ON CONFLICT (email) DO NOTHING;
```

---

## Design System — seguir rigorosamente

### Tema
- Dark exclusivo — SEM modo claro, NUNCA
- Inspirado nos arquivos existentes: dark gold premium

### Paleta de cores (extraída dos arquivos existentes)
```css
:root {
  --bg-base:       #050608;
  --bg-card:       #0A0D12;
  --bg-input:      #12161D;
  --border-light:  rgba(255, 255, 255, 0.08);
  --border-focus:  rgba(201, 148, 58, 0.5);
  --gold-primary:  #C9943A;
  --gold-light:    #E8B55A;
  --gold-glow:     rgba(201, 148, 58, 0.15);
  --text-main:     #FFFFFF;
  --text-muted:    #9A9690;
  --text-dim:      #5A5652;
  --danger:        #E74C3C;
  --success:       #2ECC71;
  --warning:       #F39C12;
  --info:          #3498DB;
  --quente:        #E74C3C;
  --morno:         #F39C12;
  --frio:          #3498DB;
}
```

### Tipografia (igual aos arquivos existentes)
- Fontes: Inter + DM Sans + Syne (já importadas via Google Fonts)
- Headings: DM Sans ou Syne bold
- Body: Inter 14px
- Métricas: bold 32–48px, gold
- Labels sidebar: 11px uppercase, letter-spacing 0.08em

### Efeitos de fundo (padrão dos arquivos existentes)
```css
body::before {
  background:
    radial-gradient(circle at 15% 0%, var(--gold-glow) 0%, transparent 40%),
    radial-gradient(circle at 85% 100%, rgba(255,255,255,0.03) 0%, transparent 40%);
}
body::after {
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

---

## O QUE FALTA CONSTRUIR — prioridade máxima

### 1. bravo-admin.html ← URGENTE, não existe ainda

Este é o painel principal da Bravo Homes Group. É o arquivo mais
importante do sistema e está faltando. Construir completo em um único
arquivo HTML seguindo o mesmo padrão dos outros.

**Sidebar de navegação (200px fixa):**
```
Logo: Grupo Bravo Homes + "Plataforma de Operações"

VISÃO GERAL
  └── Painel (Dashboard)

LEADS E VENDAS
  └── Gasoduto (Pipeline Kanban)   ← badge com count
  └── Todas as Pistas
  └── Páginas de Destino           ← badge com count

PROJETOS
  └── Projetos Ativos
  └── Visitas e Orçamentos

REDE
  └── Parceiros/Contratados
  └── Clientes

FERRAMENTAS
  └── Configurações

[Avatar] Severino Bione / Wyllams Bione (conforme logado)
Proprietário · Administrador
```

**Header (topo de cada seção):**
- Título da seção atual
- Badge verde pulsante "Plataforma ao vivo"
- Data atual em inglês (ex: "Friday, March 20, 2026")
- Sino de notificações com badge de count

**Seção: Dashboard**
- Banners de alerta fecháveis (vermelho = visita hoje, amarelo = ação pendente)
- 4 metric cards: Revenue YTD · Active Leads · Projects Active · LP Conversion %
- Recent Leads: lista com indicador quente/morno/frio · nome · serviço · cidade · valor · tempo
- Gráfico de barras mensais Revenue 2026 (Jan–Dez, mês atual em gold)
- Projeção até fim do ano
- Landing Pages quick stats: nome · CVR% · status
- Partner Status: parceiros com status em tempo real

**Seção: Pipeline Kanban (Gasoduto)**
- Header: "X leads ativos · Valor do pipeline: US$ XXX.XXX" + botão "+ Adicionar Lead"
- 5 colunas com drag and drop:
  1. NOVO
  2. QUALIFICADO
  3. AGENDAMENTO DE VISTORIA
  4. PROPOSTA
  5. FECHADO (com "X esta semana")
- Card de lead: nome · serviço · valor (gold) · cidade (badge) · ponto de temperatura
- Legenda: Quente (vermelho) · Morno (laranja) · Frio (azul)
- Clicar no card → modal de detalhes

**Seção: Todas as Pistas**
- Tabela completa: Nome · Serviço · Cidade · Valor · Status · Temperatura · Data · Ações
- Filtros: cidade · serviço · temperatura · status
- Busca por nome
- Paginação
- Botão exportar CSV

**Modal de Detalhes do Lead:**
- Nome · telefone · email · cidade · serviço
- Histórico de conversa com o bravo-convo-ai
- Status na pipeline (com botão para mover)
- Temperatura (com botão para alterar)
- Valor estimado
- Notas internas
- Ações: Atribuir parceiro · Agendar vistoria · Descartar

**Seção: Parceiros e Contratados**
- Header: "X parceiros · X ativos" + botão "+ Adicionar Parceiro"
- Tabela: Nome+Cidade · Especialidade · Status · Avaliação ★ · Projetos · Pago · Contato · Ações
- Status badges: Ativo (verde) · Ocupado (laranja) · Disponível (azul)
- Ações por linha: Visualizar · Chamar · Atribuir
- Bloco de Regras de Proteção ao Parceiro (fixo no rodapé):
  1. Propriedade do cliente
  2. Contrato obrigatório
  3. Pagamento na conclusão
  4. Revisão de qualidade

**Seção: Projetos Ativos**
- Cards de projeto: cliente · parceiro · serviço · valor · % progresso · próximo passo
- Status: Em andamento · Aguardando parceiro · Vistoria final · Concluído

**Seção: Visitas e Orçamentos**
- Calendário de vistorias
- Lista de orçamentos pendentes
- Botão "+ Agendar Vistoria"

**Seção: Clientes**
- Lista de clientes com projetos fechados
- Histórico · valor total · potencial de retorno · status

**Seção: Páginas de Destino**
- Lista de LPs: nome · CVR · status live/draft · visitas · leads · conversão
- Botão "+ Nova Landing Page"

**Seção: Configurações**
- Dados da empresa
- Gerenciar admins: Severino Bione e Wyllams Bione
- Palavras-chave monitoradas (editar lista)
- Cidades-alvo (10 cidades)
- Configurações de notificação
- Ranges de preço por serviço (editável)

**Integração Supabase no bravo-admin.html:**
```javascript
const SUPABASE_URL = 'https://tyeaqluofishcvhvpwrg.supabase.co';
const SUPABASE_KEY = 'SUA_ANON_KEY';  // anon key para frontend

// Carregar leads do banco
const { data: leads } = await sb
  .from('leads')
  .select('*, clients(*), users(*)')
  .order('created_at', { ascending: false });

// Atualizar status do lead (drag and drop kanban)
await sb
  .from('leads')
  .update({ status: novoStage, updated_at: new Date().toISOString() })
  .eq('id', leadId);

// Carregar parceiros
const { data: parceiros } = await sb
  .from('users')
  .select('*')
  .eq('role', 'partner');

// Subscriptions em tempo real para novo lead
sb.channel('leads-channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' },
    payload => {
      mostrarNotificacao(payload.new);
      recarregarKanban();
    })
  .subscribe();
```

---

### 2. Corrigir o seed data do SQL

No bravo-migration.sql, garantir que os 2 admins estejam no seed:
- Severino Bione (admin-001)
- Wyllams Bione (admin-002) ← estava faltando

---

### 3. Landing pages adicionais (após o admin estar pronto)

O PRD define o seguinte sistema de landing pages por cidade × serviço.
O bravo-lp-bathroom.html é o template base. Criar variações para:

**Bathroom Remodel (prioridade 1):**
- bravo-lp-bathroom-marietta.html
- bravo-lp-bathroom-alpharetta.html
- bravo-lp-bathroom-milton.html
- bravo-lp-bathroom-roswell.html
- bravo-lp-bathroom-kennesaw.html
- bravo-lp-bathroom-woodstock.html
- bravo-lp-bathroom-canton.html
- bravo-lp-bathroom-holly-springs.html

**Kitchen Remodel (prioridade 2):**
- bravo-lp-kitchen-marietta.html
- bravo-lp-kitchen-alpharetta.html
- bravo-lp-kitchen-milton.html
(e demais cidades)

Cada LP deve ter:
- Headline específico: "Bathroom Remodel [Cidade] GA — Free Estimate"
- Formulário above the fold
- Before/after visual (slider ou grid)
- Social proof (stars + reviews + depoimentos com cidade)
- Urgência real: "Limited availability this month"
- CTA único: "Get Free Estimate"
- Trust badges: Licensed & Insured Partners · Satisfaction Guaranteed
- Faixa de preço referencial
- Processo em 3 passos: Estimate → We Manage → You Enjoy
- FAQ com schema markup
- Formulário conectado ao Supabase (tabela leads) — INSERT direto

**Oportunidade SEO por cidade (do PRD):**
- Milton GA: BAIXÍSSIMA concorrência → dominar em 30-60 dias
- Canton GA: MÍNIMA → dominar em 30-60 dias
- Holly Springs: MÍNIMA → dominar em 30-60 dias
- Woodstock: BAIXA → ranquear em 45-90 dias
- Acworth: BAIXA → ranquear em 45-90 dias

---

## Regras absolutas de design

- Dark theme SEMPRE — nunca adicionar modo claro
- Nunca sair da paleta de cores definida
- Nunca remover ou modificar os efeitos de fundo (grid + radial gold)
- Sidebar sempre 200px fixa
- Fontes: Inter + DM Sans + Syne — não substituir
- Todos os arquivos devem funcionar standalone (abrir com duplo clique)
- NÃO incluir GHL Sync em lugar nenhum — foi removido permanentemente

---

## Ordem de execução obrigatória

1. Adicionar Wyllams Bione ao seed do bravo-migration.sql
2. Construir bravo-admin.html completo
3. Testar no browser todas as seções do admin
4. Criar LPs por cidade (bathroom primeiro, kitchen depois)
5. App mobile React Native + Expo (fase futura)

---

## Instrução final para o Antigravity

Comece pelo bravo-admin.html — é o arquivo mais crítico e está faltando.
Leia os outros arquivos HTML existentes antes de começar para manter
exatamente o mesmo padrão visual e a mesma estrutura de código.
Teste cada seção no browser antes de avançar.
Dados do Supabase devem carregar em tempo real — use subscriptions
para o kanban e notificações.
