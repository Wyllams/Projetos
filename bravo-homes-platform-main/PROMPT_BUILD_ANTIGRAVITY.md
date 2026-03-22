# PROMPT MESTRE — Como construir o Projeto Bravo Homes Group no Antigravity
# Cole esse prompt no chat do Antigravity (workspace bravo-platform) e execute

---

Você é um engenheiro sênior fullstack responsável por construir a plataforma
completa da Bravo Homes Group. Você tem acesso ao editor de código, terminal
e navegador. Use tudo isso ativamente.

Abaixo estão todos os arquivos que já existem no projeto, o que falta construir,
e a ordem exata de execução. Siga essa ordem sem pular etapas.

---

## CONTEXTO DO PROJETO

**Empresa:** Bravo Homes Group — home project management em Atlanta Metro, GA
**Stack:** HTML puro + Supabase JS SDK (frontend) · Supabase (banco de dados)
**Supabase projeto:** tyeaqluofishcvhvpwrg
**URL:** https://tyeaqluofishcvhvpwrg.supabase.co
**Dois admins:** Severino Bione · Wyllams Bione

---

## O QUE JÁ EXISTE (não reescrever, apenas usar como referência)

```
bravo-login.html       ← login, cadastro de parceiros, recuperação de senha
bravo-cliente.html     ← portal do cliente: timeline, pagamentos, chat AI
bravo-parceiro.html    ← portal do parceiro: projetos atribuídos
bravo-lp-bathroom.html ← landing page Bathroom Remodel (template base)
bravo-migration.sql    ← schema oficial do banco de dados
```

Antes de começar qualquer coisa, abra e leia esses arquivos para entender
o padrão visual e o estilo de código. Todo novo arquivo deve ser idêntico
visualmente a esses.

---

## DESIGN SYSTEM — REGRAS ABSOLUTAS

```css
--bg-base:       #050608;
--bg-card:       #0A0D12;
--bg-input:      #12161D;
--border-light:  rgba(255, 255, 255, 0.08);
--gold-primary:  #C9943A;
--gold-light:    #E8B55A;
--gold-glow:     rgba(201, 148, 58, 0.15);
--text-main:     #FFFFFF;
--text-muted:    #9A9690;
--quente:        #E74C3C;
--morno:         #F39C12;
--frio:          #3498DB;
--success:       #2ECC71;
```

- Dark theme SEMPRE. Nunca modo claro.
- Fontes: Inter + DM Sans + Syne (Google Fonts)
- Efeito de fundo: grid 40x40px + radial gold glow (igual aos arquivos existentes)
- NÃO incluir GHL Sync em lugar nenhum

---

## PASSO 1 — Corrigir o banco de dados (fazer primeiro, antes de qualquer HTML)

Abra o arquivo bravo-migration.sql no editor.
Encontre o bloco de seed de usuários admins e certifique-se que os dois
estão presentes. Se Wyllams Bione estiver faltando, adicione:

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

Depois use o browser para acessar o painel do Supabase:
https://supabase.com/dashboard/project/tyeaqluofishcvhvpwrg/editor

Execute o bravo-migration.sql completo no SQL Editor.
Confirme no terminal de logs do Supabase que todas as 12 tabelas foram criadas.

✅ Critério de sucesso: tabelas users, clients, leads, projects visíveis no Supabase.

---

## PASSO 2 — Construir o bravo-admin.html

Este é o arquivo mais importante do projeto e ainda não existe.
Construir em um único arquivo HTML standalone (funciona com duplo clique).

### Estrutura base do arquivo:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bravo Homes Group — Admin</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Copiar exatamente o :root e os efeitos de fundo do bravo-login.html */
    /* Adicionar variáveis do kanban, sidebar e componentes do admin */
  </style>
</head>
<body>
  <!-- Sidebar 200px fixa -->
  <!-- Header com badge "Plataforma ao vivo" + data + sino -->
  <!-- Conteúdo principal (muda conforme seção ativa) -->
  <script>
    const SUPABASE_URL = 'https://tyeaqluofishcvhvpwrg.supabase.co';
    const SUPABASE_KEY = 'SUA_ANON_KEY_AQUI';
    /* Todo o JavaScript aqui */
  </script>
</body>
</html>
```

### Construir as seções nessa ordem:

**2.1 — Layout base (sidebar + header)**
- Sidebar: logo "Grupo Bravo Homes" + "Plataforma de Operações"
- Navegação com seções: Painel, Gasoduto, Todas as Pistas, Páginas de Destino,
  Projetos Ativos, Visitas e Orçamentos, Parceiros, Clientes, Configurações
- Badge count nos itens de menu (leads ativos, landing pages)
- Avatar com iniciais no rodapé da sidebar (SB ou WB conforme logado)
- Header: título da seção + badge verde pulsante + data + sino de notificações
- Abrir no browser e confirmar que o layout está correto antes de continuar

**2.2 — Dashboard (seção inicial)**
- 2 banners de alerta fecháveis no topo (vermelho e amarelo)
- 4 metric cards: Revenue YTD · Active Leads · Projects Active · LP Conversion %
- Lista Recent Leads com indicador quente/morno/frio
- Gráfico de barras Revenue 2026 (usar Chart.js via CDN)
- Landing Pages quick stats
- Partner Status em tempo real
- Carregar dados reais do Supabase

✅ Critério de sucesso: dashboard carrega dados do banco, gráfico renderiza.

**2.3 — Pipeline Kanban (Gasoduto)**
- 5 colunas: NOVO · QUALIFICADO · AGENDAMENTO DE VISTORIA · PROPOSTA · FECHADO
- Cards com: nome · serviço · valor (gold) · cidade (badge) · ponto de cor
- Drag and drop entre colunas (usar SortableJS via CDN — mais simples que DnD)
- Contador de leads e valor total no header
- Legenda: Quente (vermelho) · Morno (laranja) · Frio (azul)
- Clicar no card abre modal de detalhes
- Atualizar status no Supabase ao mover card

```javascript
// Drag and drop com SortableJS
// CDN: https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js

document.querySelectorAll('.kanban-column').forEach(column => {
  new Sortable(column, {
    group: 'kanban',
    animation: 150,
    onEnd: async (evt) => {
      const leadId = evt.item.dataset.id;
      const novoStage = evt.to.dataset.stage;
      await sb.from('leads')
        .update({ status: novoStage, updated_at: new Date().toISOString() })
        .eq('id', leadId);
    }
  });
});
```

✅ Critério de sucesso: arrastar card muda status no Supabase.

**2.4 — Modal de Detalhes do Lead**
- Nome · telefone · email · cidade · serviço · valor · timeline
- Histórico de conversa (campo notes do banco)
- Botão mover na pipeline (dropdown com os 5 stages)
- Botão alterar temperatura (Quente/Morno/Frio)
- Campo de notas internas (salva no banco)
- Botão atribuir parceiro (lista de partners do banco)
- Botão agendar vistoria
- Botão descartar lead

**2.5 — Parceiros e Contratados**
- Tabela com dados reais do Supabase (tabela users onde role = 'partner')
- Colunas: Nome+Cidade · Especialidade · Status · Avaliação · Projetos · Pago · Contato · Ações
- Status badges: Ativo (verde) · Ocupado (laranja) · Disponível (azul)
- Botões: Visualizar · Chamar (tel: link) · Atribuir
- Modal para adicionar novo parceiro
- Bloco de Regras de Proteção no rodapé

**2.6 — Demais seções**
Construir em sequência após validar as anteriores:
- Todas as Pistas (tabela filtrada com busca e paginação)
- Projetos Ativos (cards com barra de progresso)
- Visitas e Orçamentos (calendário + lista)
- Clientes (tabela com histórico)
- Páginas de Destino (tabela com CVR%)
- Configurações (formulários de edição)

**2.7 — Notificações em tempo real**
Ativar subscription do Supabase para novos leads:

```javascript
const channel = sb.channel('realtime-leads')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'leads' },
    (payload) => {
      atualizarBadgeNotificacoes();
      adicionarCardNoKanban(payload.new);
      mostrarToastNotificacao(payload.new);
    }
  )
  .subscribe();
```

✅ Critério de sucesso final do admin: abrir dois navegadores, inserir um lead
no Supabase, confirmar que aparece no kanban em tempo real sem recarregar.

---

## PASSO 3 — Landing pages por cidade

Usando o bravo-lp-bathroom.html como template, criar variações por cidade.
Para cada cidade, substituir:
- Headline: "Bathroom Remodel [CIDADE] GA — Free Estimate"
- H1: "Home Remodeling in [CIDADE], GA"
- Menções à cidade no copy (mínimo 5 vezes para SEO)
- Preço referencial (usar range do plano estratégico)
- Formulário conectado ao Supabase — INSERT na tabela leads com source = 'lp-[cidade]'

**Ordem de criação (por prioridade de SEO):**

```
1. bravo-lp-bathroom-milton.html      ← concorrência MÍNIMA, dominar em 30 dias
2. bravo-lp-bathroom-canton.html      ← concorrência MÍNIMA, dominar em 30 dias
3. bravo-lp-bathroom-holly-springs.html
4. bravo-lp-bathroom-woodstock.html
5. bravo-lp-bathroom-acworth.html
6. bravo-lp-bathroom-alpharetta.html
7. bravo-lp-bathroom-roswell.html
8. bravo-lp-bathroom-kennesaw.html
9. bravo-lp-bathroom-marietta.html
```

Depois repetir o processo para Kitchen Remodel.

✅ Critério de sucesso: abrir cada LP no browser, preencher o formulário,
confirmar que o lead aparece na tabela leads do Supabase.

---

## PASSO 4 — Validação final do sistema completo

Executar esse checklist no browser antes de declarar o projeto pronto:

```
[ ] bravo-login.html  — login funciona com Severino e Wyllams
[ ] bravo-admin.html  — todas as seções carregam dados reais
[ ] Kanban           — drag and drop salva no banco
[ ] Tempo real       — novo lead aparece sem recarregar
[ ] bravo-cliente.html — timeline do projeto carrega
[ ] bravo-parceiro.html — projetos atribuídos aparecem
[ ] LPs de bathroom  — formulário envia lead para o banco
[ ] Admin mostra lead da LP no kanban em tempo real
```

---

## REGRAS DE EXECUÇÃO NO ANTIGRAVITY

1. Use o terminal para checar erros JavaScript: abra o console do browser
   (F12) após cada arquivo e confirme que não há erros antes de avançar

2. Use o browser tool para testar cada página depois de salvar

3. Construa um arquivo por vez — nunca trabalhe em múltiplos arquivos
   simultaneamente sem validar o anterior

4. Quando encontrar um erro, corrija imediatamente antes de continuar

5. Após cada arquivo concluído, faça um commit com mensagem descritiva:
   git commit -m "feat: bravo-admin.html — kanban e dashboard completos"

6. Se um trecho de código ultrapassar 200 linhas sem ser testado,
   pare e teste antes de continuar

7. Nunca altere bravo-login.html, bravo-cliente.html ou bravo-parceiro.html
   sem instrução explícita — esses arquivos já funcionam

---

## COMO USAR ESSE PROMPT NO ANTIGRAVITY

Cole esse prompt inteiro no chat do Antigravity (workspace bravo-platform)
e envie. O agente vai ler os arquivos existentes, planejar a execução e
começar pelo Passo 1. Você acompanha o progresso e aprova cada etapa
antes de o agente avançar para a próxima.

Se quiser executar apenas uma parte, especifique:
- "Execute apenas o Passo 2.2 — Dashboard"
- "Execute apenas o Passo 3 começando por Milton"
- "Execute o checklist do Passo 4"
