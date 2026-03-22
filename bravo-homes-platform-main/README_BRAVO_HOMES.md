# Bravo Homes Group - Portal do Cliente & CRM

Este diretório contém a primeira versão funcional e validada do sistema da **Bravo Homes Group**.

## Arquivos Desenvolvidos

1. **`bravo-login.html`**: Tela de Login, Cadastro de novos parceiros e Recuperação de Senha.
2. **`bravo-admin.html`**: Painel Administrativo do Dono e dos Parceiros (Empreiteiros/Vendedores). Visão de Leads, Projetos, Financeiro, Times e Relatórios avançados com gráficos reais.
3. **`bravo-cliente.html`**: Painel exclusivo do Cliente para acompanhamento de obras (Timeline do projeto), visualização de pagamentos/faturas e chat com o **Assistente AI**.
4. **`supabase_schema.sql`**: O script oficial de Banco de Dados para colar no Supabase.

---

## 🚀 Passo a Passo para Ativar o Sistema

### Passo 1: Configurar o Supabase (Banco de Dados + Autenticação)
1. Crie uma conta no [Supabase](https://supabase.com).
2. Crie um novo projeto chamado "Bravo Homes".
3. No painel, vá em **SQL Editor**, crie uma "New Query", copie todo o texto de `supabase_schema.sql` e clique em **RUN**.
4. Vá em **Authentication > Providers** e certifique-se de que "Email" está ativado.
5. Vá em **Project Settings > API** e copie o seu `Project URL` e `anon public key`.

### Passo 2: Conectar o Front-End ao seu Supabase
Em todos os arquivos `.html` (`bravo-login.html`, `bravo-admin.html` e `bravo-cliente.html`), na linha inferior dentro de `<script>`, existem duas constantes:
```javascript
const SUPABASE_URL = 'https://SUA_URL.supabase.co'
const SUPABASE_KEY = 'SUA_CHAVE_ANON'
```
**Substitua** essas variáveis pelos valores que você copiou do seu Supabase.

### Passo 3: Testar o Sistema
1. Abra `bravo-login.html` no seu navegador (basta dar um clique duplo).
2. Tente fazer um "Sign Up" com um e-mail de teste.
3. Acesse o seu painel Supabase (Authentication -> Users) e veja se o usuário foi criado.
4. Para as telas (`bravo-admin.html` e `bravo-cliente.html`), as integrei com "Mock Data" (dados falsos de exemplo) para você já conseguir visualizar como o sistema fica antes mesmo de ter dados reais no banco.

### Passo 4: Conectar com N8N (Assistente IA e Automações)
- **Leads:** O N8N pode inserir dados direto no banco executando INSERT na tabela `leads`.
- **Assistente IA:** O usuário digita no chat em `bravo-cliente.html` -> O front-end envia para o webhook do N8N -> O N8N fala com a OpenAI (que pesquisa a tabela `projects` e `transactions` do Supabase) -> N8N retorna a resposta via API pro Front-End. Essa chamada pode ser feita via uma Edge Function do próprio Supabase ou diretamente chamando a rota do N8N usando `fetch()`.

---
Feito com ☕ e Código por Antigravity (IA).
