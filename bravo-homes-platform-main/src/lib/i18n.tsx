import { createContext, useContext, useState, type ReactNode } from 'react';

// ── TYPES ──
export type Lang = 'pt-BR' | 'en-US' | 'es';

type Translations = Record<string, Record<Lang, string>>;

// ── TRANSLATION DICTIONARY ──
// Keys are used in code; values are per-language strings
const T: Translations = {
  // ─── GENERAL / SHARED ───
  save: { 'pt-BR': 'Salvar', 'en-US': 'Save', es: 'Guardar' },
  cancel: { 'pt-BR': 'Cancelar', 'en-US': 'Cancel', es: 'Cancelar' },
  delete: { 'pt-BR': 'Excluir', 'en-US': 'Delete', es: 'Eliminar' },
  edit: { 'pt-BR': 'Editar', 'en-US': 'Edit', es: 'Editar' },
  close: { 'pt-BR': 'Fechar', 'en-US': 'Close', es: 'Cerrar' },
  search: { 'pt-BR': 'Buscar...', 'en-US': 'Search...', es: 'Buscar...' },
  loading: { 'pt-BR': 'Carregando...', 'en-US': 'Loading...', es: 'Cargando...' },
  confirm: { 'pt-BR': 'Confirmar', 'en-US': 'Confirm', es: 'Confirmar' },
  back: { 'pt-BR': 'Voltar', 'en-US': 'Back', es: 'Volver' },
  actions: { 'pt-BR': 'Ações', 'en-US': 'Actions', es: 'Acciones' },
  name: { 'pt-BR': 'Nome', 'en-US': 'Name', es: 'Nombre' },
  email: { 'pt-BR': 'Email', 'en-US': 'Email', es: 'Correo' },
  phone: { 'pt-BR': 'Telefone', 'en-US': 'Phone', es: 'Teléfono' },
  status: { 'pt-BR': 'Status', 'en-US': 'Status', es: 'Estado' },
  date: { 'pt-BR': 'Data', 'en-US': 'Date', es: 'Fecha' },
  yes: { 'pt-BR': 'Sim', 'en-US': 'Yes', es: 'Sí' },
  no: { 'pt-BR': 'Não', 'en-US': 'No', es: 'No' },
  all: { 'pt-BR': 'Todos', 'en-US': 'All', es: 'Todos' },
  none: { 'pt-BR': 'Nenhum', 'en-US': 'None', es: 'Ninguno' },
  add: { 'pt-BR': 'Adicionar', 'en-US': 'Add', es: 'Agregar' },
  link: { 'pt-BR': 'Link', 'en-US': 'Link', es: 'Enlace' },
  type: { 'pt-BR': 'Tipo', 'en-US': 'Type', es: 'Tipo' },
  value: { 'pt-BR': 'Valor', 'en-US': 'Value', es: 'Valor' },
  total: { 'pt-BR': 'Total', 'en-US': 'Total', es: 'Total' },
  filter: { 'pt-BR': 'Filtrar', 'en-US': 'Filter', es: 'Filtrar' },
  export: { 'pt-BR': 'Exportar', 'en-US': 'Export', es: 'Exportar' },

  // ─── SIDEBAR NAV ───
  logout: { 'pt-BR': 'Sair da conta', 'en-US': 'Log out', es: 'Cerrar sesión' },
  overview: { 'pt-BR': 'VISÃO GERAL', 'en-US': 'OVERVIEW', es: 'GENERAL' },
  dashboard: { 'pt-BR': 'Dashboard', 'en-US': 'Dashboard', es: 'Panel' },
  sales: { 'pt-BR': 'VENDAS', 'en-US': 'SALES', es: 'VENTAS' },
  pipeline: { 'pt-BR': 'Pipeline de Leads', 'en-US': 'Lead Pipeline', es: 'Pipeline de Leads' },
  allLeads: { 'pt-BR': 'Todos os Leads', 'en-US': 'All Leads', es: 'Todos los Leads' },
  landingPages: { 'pt-BR': 'Landing Pages', 'en-US': 'Landing Pages', es: 'Landing Pages' },
  operations: { 'pt-BR': 'OPERAÇÕES', 'en-US': 'OPERATIONS', es: 'OPERACIONES' },
  activeProjects: { 'pt-BR': 'Projetos Ativos', 'en-US': 'Active Projects', es: 'Proyectos Activos' },
  calendar: { 'pt-BR': 'Calendário', 'en-US': 'Calendar', es: 'Calendario' },
  clients: { 'pt-BR': 'Clientes', 'en-US': 'Clients', es: 'Clientes' },
  partners: { 'pt-BR': 'Parceiros', 'en-US': 'Partners', es: 'Socios' },
  financial: { 'pt-BR': 'FINANCEIRO', 'en-US': 'FINANCIAL', es: 'FINANCIERO' },
  finances: { 'pt-BR': 'Finanças', 'en-US': 'Finances', es: 'Finanzas' },
  settings: { 'pt-BR': 'Configurações', 'en-US': 'Settings', es: 'Configuración' },
  adminChat: { 'pt-BR': 'Chat Admin', 'en-US': 'Admin Chat', es: 'Chat Admin' },

  // ─── TOPBAR TITLES (uppercase) ───
  topbarDashboard: { 'pt-BR': 'DASHBOARD', 'en-US': 'DASHBOARD', es: 'PANEL' },
  topbarPipeline: { 'pt-BR': 'PIPELINE', 'en-US': 'PIPELINE', es: 'PIPELINE' },
  topbarAllLeads: { 'pt-BR': 'TODOS OS LEADS', 'en-US': 'ALL LEADS', es: 'TODOS LOS LEADS' },
  topbarLandingPages: { 'pt-BR': 'LANDING PAGES', 'en-US': 'LANDING PAGES', es: 'LANDING PAGES' },
  topbarProjects: { 'pt-BR': 'PROJETOS', 'en-US': 'PROJECTS', es: 'PROYECTOS' },
  topbarCalendar: { 'pt-BR': 'CALENDÁRIO', 'en-US': 'CALENDAR', es: 'CALENDARIO' },
  topbarClients: { 'pt-BR': 'CLIENTES', 'en-US': 'CLIENTS', es: 'CLIENTES' },
  topbarPartners: { 'pt-BR': 'PARCEIROS', 'en-US': 'PARTNERS', es: 'SOCIOS' },
  topbarFinances: { 'pt-BR': 'FINANÇAS', 'en-US': 'FINANCES', es: 'FINANZAS' },
  topbarSettings: { 'pt-BR': 'CONFIGURAÇÕES', 'en-US': 'SETTINGS', es: 'CONFIGURACIÓN' },
  topbarChat: { 'pt-BR': 'CHAT ADMIN', 'en-US': 'ADMIN CHAT', es: 'CHAT ADMIN' },

  // ─── DASHBOARD KPIs ───
  totalLeads: { 'pt-BR': 'Total de Leads', 'en-US': 'Total Leads', es: 'Total de Leads' },
  activeProjectsKpi: { 'pt-BR': 'Projetos Ativos', 'en-US': 'Active Projects', es: 'Proyectos Activos' },
  totalRevenue: { 'pt-BR': 'Receita Total', 'en-US': 'Total Revenue', es: 'Ingresos Totales' },
  conversionRate: { 'pt-BR': 'Taxa de Conversão', 'en-US': 'Conversion Rate', es: 'Tasa de Conversión' },
  recentLeads: { 'pt-BR': 'Leads Recentes', 'en-US': 'Recent Leads', es: 'Leads Recientes' },
  viewAll: { 'pt-BR': 'Ver Todos', 'en-US': 'View All', es: 'Ver Todos' },
  performance: { 'pt-BR': 'Performance', 'en-US': 'Performance', es: 'Rendimiento' },
  leadsPerMonth: { 'pt-BR': 'Leads por Mês', 'en-US': 'Leads per Month', es: 'Leads por Mes' },

  // ─── PIPELINE ───
  newLead: { 'pt-BR': 'Novo Lead', 'en-US': 'New Lead', es: 'Nuevo Lead' },
  contacted: { 'pt-BR': 'Contactado', 'en-US': 'Contacted', es: 'Contactado' },
  proposal: { 'pt-BR': 'Proposta', 'en-US': 'Proposal', es: 'Propuesta' },
  negotiation: { 'pt-BR': 'Negociação', 'en-US': 'Negotiation', es: 'Negociación' },
  closed: { 'pt-BR': 'Fechado', 'en-US': 'Closed', es: 'Cerrado' },
  won: { 'pt-BR': 'Ganho', 'en-US': 'Won', es: 'Ganado' },

  // ─── LEADS TABLE ───
  createdAt: { 'pt-BR': 'Criado Em', 'en-US': 'Created At', es: 'Creado En' },
  source: { 'pt-BR': 'Origem', 'en-US': 'Source', es: 'Origen' },
  assignedTo: { 'pt-BR': 'Atribuir a', 'en-US': 'Assign to', es: 'Asignar a' },
  internalNotes: { 'pt-BR': 'Histórico / Notas Internas', 'en-US': 'History / Internal Notes', es: 'Historial / Notas Internas' },
  addNote: { 'pt-BR': 'Adicionar Nota', 'en-US': 'Add Note', es: 'Agregar Nota' },
  noLeads: { 'pt-BR': 'Nenhum lead encontrado', 'en-US': 'No leads found', es: 'No se encontraron leads' },

  // ─── LANDING PAGES ───
  createLP: { 'pt-BR': 'Criar Landing Page', 'en-US': 'Create Landing Page', es: 'Crear Landing Page' },
  lpTitle: { 'pt-BR': 'Título', 'en-US': 'Title', es: 'Título' },
  lpSlug: { 'pt-BR': 'Slug', 'en-US': 'Slug', es: 'Slug' },
  lpStatus: { 'pt-BR': 'Status', 'en-US': 'Status', es: 'Estado' },
  active: { 'pt-BR': 'Ativa', 'en-US': 'Active', es: 'Activa' },
  inactive: { 'pt-BR': 'Inativa', 'en-US': 'Inactive', es: 'Inactiva' },

  // ─── PROJECTS ───
  projectName: { 'pt-BR': 'Nome do Projeto', 'en-US': 'Project Name', es: 'Nombre del Proyecto' },
  projectProgress: { 'pt-BR': 'Progresso', 'en-US': 'Progress', es: 'Progreso' },
  projectBudget: { 'pt-BR': 'Orçamento', 'en-US': 'Budget', es: 'Presupuesto' },
  projectClient: { 'pt-BR': 'Cliente', 'en-US': 'Client', es: 'Cliente' },
  addProject: { 'pt-BR': 'Novo Projeto', 'en-US': 'New Project', es: 'Nuevo Proyecto' },
  noProjects: { 'pt-BR': 'Nenhum projeto encontrado', 'en-US': 'No projects found', es: 'No se encontraron proyectos' },

  // ─── CALENDAR ───
  calendarTitle: { 'pt-BR': 'Calendário de Vistorias e Agendamentos', 'en-US': 'Inspections & Scheduling Calendar', es: 'Calendario de Inspecciones y Citas' },
  newEvent: { 'pt-BR': '+ Novo Evento', 'en-US': '+ New Event', es: '+ Nuevo Evento' },
  syncGoogle: { 'pt-BR': 'Sincronizar Google', 'en-US': 'Sync Google', es: 'Sincronizar Google' },
  month: { 'pt-BR': 'Mês', 'en-US': 'Month', es: 'Mes' },
  week: { 'pt-BR': 'Semana', 'en-US': 'Week', es: 'Semana' },
  day: { 'pt-BR': 'Dia', 'en-US': 'Day', es: 'Día' },
  today: { 'pt-BR': 'Hoje', 'en-US': 'Today', es: 'Hoy' },
  sun: { 'pt-BR': 'DOM.', 'en-US': 'SUN.', es: 'DOM.' },
  mon: { 'pt-BR': 'SEG.', 'en-US': 'MON.', es: 'LUN.' },
  tue: { 'pt-BR': 'TER.', 'en-US': 'TUE.', es: 'MAR.' },
  wed: { 'pt-BR': 'QUA.', 'en-US': 'WED.', es: 'MIÉ.' },
  thu: { 'pt-BR': 'QUI.', 'en-US': 'THU.', es: 'JUE.' },
  fri: { 'pt-BR': 'SEX.', 'en-US': 'FRI.', es: 'VIE.' },
  sat: { 'pt-BR': 'SÁB.', 'en-US': 'SAT.', es: 'SÁB.' },

  // ─── FINANCES ───
  monthlyRevenue: { 'pt-BR': 'Receita Mensal', 'en-US': 'Monthly Revenue', es: 'Ingresos Mensuales' },
  pendingPayments: { 'pt-BR': 'Pagamentos Pendentes', 'en-US': 'Pending Payments', es: 'Pagos Pendientes' },
  receivedPayments: { 'pt-BR': 'Pagamentos Recebidos', 'en-US': 'Received Payments', es: 'Pagos Recibidos' },
  invoices: { 'pt-BR': 'Faturas', 'en-US': 'Invoices', es: 'Facturas' },

  // ─── SETTINGS ───
  platformSettings: { 'pt-BR': 'Configurações da Plataforma', 'en-US': 'Platform Settings', es: 'Configuración de la Plataforma' },
  adminProfile: { 'pt-BR': 'Perfil do Administrador', 'en-US': 'Admin Profile', es: 'Perfil del Administrador' },
  fullName: { 'pt-BR': 'Nome Completo', 'en-US': 'Full Name', es: 'Nombre Completo' },
  saveChanges: { 'pt-BR': 'Salvar Alterações', 'en-US': 'Save Changes', es: 'Guardar Cambios' },
  security: { 'pt-BR': 'Segurança', 'en-US': 'Security', es: 'Seguridad' },
  currentPassword: { 'pt-BR': 'Senha Atual', 'en-US': 'Current Password', es: 'Contraseña Actual' },
  newPassword: { 'pt-BR': 'Nova Senha', 'en-US': 'New Password', es: 'Nueva Contraseña' },
  confirmPassword: { 'pt-BR': 'Confirmar Nova Senha', 'en-US': 'Confirm New Password', es: 'Confirmar Nueva Contraseña' },
  changePassword: { 'pt-BR': 'Alterar Senha', 'en-US': 'Change Password', es: 'Cambiar Contraseña' },
  twoFactor: { 'pt-BR': '2FA', 'en-US': '2FA', es: '2FA' },
  twoFactorDesc: { 'pt-BR': 'Autenticação em 2 etapas', 'en-US': 'Two-factor authentication', es: 'Autenticación en 2 pasos' },
  notifications: { 'pt-BR': 'Notificações', 'en-US': 'Notifications', es: 'Notificaciones' },
  newLeadReceived: { 'pt-BR': 'Novo Lead recebido', 'en-US': 'New Lead received', es: 'Nuevo Lead recibido' },
  newLeadReceivedDesc: { 'pt-BR': 'Alerta ao receber um novo lead', 'en-US': 'Alert when a new lead arrives', es: 'Alerta al recibir un nuevo lead' },
  partnerMessage: { 'pt-BR': 'Mensagem de Parceiro', 'en-US': 'Partner Message', es: 'Mensaje de Socio' },
  partnerMessageDesc: { 'pt-BR': 'Notificar mensagem no chat', 'en-US': 'Notify chat messages', es: 'Notificar mensajes en el chat' },
  projectUpdated: { 'pt-BR': 'Projeto atualizado', 'en-US': 'Project updated', es: 'Proyecto actualizado' },
  projectUpdatedDesc: { 'pt-BR': 'Atualização no progresso', 'en-US': 'Progress update', es: 'Actualización de progreso' },
  weeklyReports: { 'pt-BR': 'Relatórios semanais', 'en-US': 'Weekly reports', es: 'Reportes semanales' },
  weeklyReportsDesc: { 'pt-BR': 'Resumo por email', 'en-US': 'Summary by email', es: 'Resumen por email' },
  platformConfig: { 'pt-BR': 'Configurações da Plataforma', 'en-US': 'Platform Configuration', es: 'Configuración de la Plataforma' },
  companyName: { 'pt-BR': 'Nome da Empresa', 'en-US': 'Company Name', es: 'Nombre de la Empresa' },
  timezone: { 'pt-BR': 'Fuso Horário', 'en-US': 'Timezone', es: 'Zona Horaria' },
  currency: { 'pt-BR': 'Moeda Padrão', 'en-US': 'Default Currency', es: 'Moneda Predeterminada' },
  language: { 'pt-BR': 'Idioma da Plataforma', 'en-US': 'Platform Language', es: 'Idioma de la Plataforma' },
  savePlatformSettings: { 'pt-BR': 'Salvar Configurações', 'en-US': 'Save Settings', es: 'Guardar Configuración' },
  dangerZone: { 'pt-BR': 'Zona de Perigo', 'en-US': 'Danger Zone', es: 'Zona de Peligro' },
  exportData: { 'pt-BR': 'Exportar Dados', 'en-US': 'Export Data', es: 'Exportar Datos' },
  exportDataDesc: { 'pt-BR': 'Baixar informações em CSV/JSON', 'en-US': 'Download data in CSV/JSON', es: 'Descargar información en CSV/JSON' },
  deleteAccount: { 'pt-BR': 'Excluir Conta', 'en-US': 'Delete Account', es: 'Eliminar Cuenta' },
  deleteAccountDesc: { 'pt-BR': 'Ação irreversível. Dados perdidos.', 'en-US': 'Irreversible action. Data will be lost.', es: 'Acción irreversible. Se perderán los datos.' },
  deleteAccountConfirm: { 'pt-BR': 'ATENÇÃO: Deseja realmente excluir sua conta? Essa ação é IRREVERSÍVEL.', 'en-US': 'WARNING: Do you really want to delete your account? This action is IRREVERSIBLE.', es: 'ATENCIÓN: ¿Realmente desea eliminar su cuenta? Esta acción es IRREVERSIBLE.' },
  passwordUpdated: { 'pt-BR': 'Senha atualizada com sucesso!', 'en-US': 'Password updated successfully!', es: '¡Contraseña actualizada exitosamente!' },
  twoFactorSoon: { 'pt-BR': '2FA será implementado em breve!', 'en-US': '2FA will be implemented soon!', es: '¡2FA será implementado pronto!' },
  platformSettingsSaved: { 'pt-BR': 'Configurações da plataforma salvas!', 'en-US': 'Platform settings saved!', es: '¡Configuración de la plataforma guardada!' },
  exportEmail: { 'pt-BR': 'Exportação de dados será gerada e enviada ao seu email!', 'en-US': 'Data export will be generated and sent to your email!', es: '¡La exportación de datos será generada y enviada a su correo!' },
  accountDeleted: { 'pt-BR': 'Conta marcada para exclusão. Você receberá um email de confirmação.', 'en-US': 'Account marked for deletion. You will receive a confirmation email.', es: 'Cuenta marcada para eliminación. Recibirás un correo de confirmación.' },
  min8chars: { 'pt-BR': 'Mínimo 8 caracteres', 'en-US': 'Minimum 8 characters', es: 'Mínimo 8 caracteres' },
  repeatPassword: { 'pt-BR': 'Repita a nova senha', 'en-US': 'Repeat new password', es: 'Repita la nueva contraseña' },
  jpgPngMax: { 'pt-BR': 'JPG, PNG (Max 2MB)', 'en-US': 'JPG, PNG (Max 2MB)', es: 'JPG, PNG (Máx 2MB)' },
  uploading: { 'pt-BR': 'Fazendo upload...', 'en-US': 'Uploading...', es: 'Subiendo...' },

  // ─── LOGIN ───
  loginTitle: { 'pt-BR': 'Acesse sua Conta', 'en-US': 'Login to Your Account', es: 'Accede a tu Cuenta' },
  loginSubtitle: { 'pt-BR': 'Insira suas credenciais para continuar.', 'en-US': 'Enter your credentials to continue.', es: 'Ingrese sus credenciales para continuar.' },
  emailPlaceholder: { 'pt-BR': 'seu@email.com', 'en-US': 'your@email.com', es: 'tu@correo.com' },
  password: { 'pt-BR': 'Senha', 'en-US': 'Password', es: 'Contraseña' },
  rememberMe: { 'pt-BR': 'Manter conectado', 'en-US': 'Remember me', es: 'Mantener conectado' },
  forgotPassword: { 'pt-BR': 'Esqueci a senha', 'en-US': 'Forgot password', es: 'Olvidé mi contraseña' },
  loginButton: { 'pt-BR': 'Entrar na Plataforma', 'en-US': 'Enter Platform', es: 'Entrar a la Plataforma' },
  loggingIn: { 'pt-BR': 'Entrando...', 'en-US': 'Logging in...', es: 'Entrando...' },
  noAccount: { 'pt-BR': 'Não tem conta?', 'en-US': "Don't have an account?", es: '¿No tienes cuenta?' },
  createAccount: { 'pt-BR': 'Criar conta', 'en-US': 'Create account', es: 'Crear cuenta' },
  createAccountTitle: { 'pt-BR': 'Criar Conta', 'en-US': 'Create Account', es: 'Crear Cuenta' },
  createAccountSubtitle: { 'pt-BR': 'Preencha os dados para solicitar acesso.', 'en-US': 'Fill in the details to request access.', es: 'Complete los datos para solicitar acceso.' },
  fullNameLabel: { 'pt-BR': 'Nome completo', 'en-US': 'Full name', es: 'Nombre completo' },
  profileLabel: { 'pt-BR': 'Perfil', 'en-US': 'Profile', es: 'Perfil' },
  selectProfile: { 'pt-BR': 'Selecione...', 'en-US': 'Select...', es: 'Seleccione...' },
  partnerContractor: { 'pt-BR': 'Parceiro / Empreiteiro', 'en-US': 'Partner / Contractor', es: 'Socio / Contratista' },
  client: { 'pt-BR': 'Cliente', 'en-US': 'Client', es: 'Cliente' },
  creatingAccount: { 'pt-BR': 'Criando conta...', 'en-US': 'Creating account...', es: 'Creando cuenta...' },
  alreadyHaveAccount: { 'pt-BR': 'Já tem conta?', 'en-US': 'Already have an account?', es: '¿Ya tienes cuenta?' },
  enter: { 'pt-BR': 'Entrar', 'en-US': 'Login', es: 'Entrar' },
  accountCreated: { 'pt-BR': 'Conta criada com sucesso! Você pode fazer login agora.', 'en-US': 'Account created successfully! You can login now.', es: '¡Cuenta creada exitosamente! Ya puede iniciar sesión.' },
  forgotSoon: { 'pt-BR': 'Em breve', 'en-US': 'Coming soon', es: 'Próximamente' },
  backToLogin: { 'pt-BR': 'Voltar ao Login', 'en-US': 'Back to Login', es: 'Volver al Login' },

  // ─── ADMIN TOPBAR ───
  partnerView: { 'pt-BR': '👷 Visão Parceiro', 'en-US': '👷 Partner View', es: '👷 Vista Socio' },
  clientView: { 'pt-BR': '👨‍👩‍👧 Visão Cliente', 'en-US': '👨‍👩‍👧 Client View', es: '👨‍👩‍👧 Vista Cliente' },

  // ─── PARTNER SIDEBAR ───
  partnerDashboard: { 'pt-BR': 'PARTNER DASHBOARD', 'en-US': 'PARTNER DASHBOARD', es: 'PANEL DEL SOCIO' },
  myProjects: { 'pt-BR': 'Meus Projetos', 'en-US': 'My Projects', es: 'Mis Proyectos' },
  myClients: { 'pt-BR': 'Meus Clientes', 'en-US': 'My Clients', es: 'Mis Clientes' },
  photosDocuments: { 'pt-BR': 'Fotos & Documentos', 'en-US': 'Photos & Documents', es: 'Fotos y Documentos' },
  schedule: { 'pt-BR': 'Cronograma', 'en-US': 'Schedule', es: 'Cronograma' },
  stages: { 'pt-BR': 'Etapas', 'en-US': 'Stages', es: 'Etapas' },
  chat: { 'pt-BR': 'Chat', 'en-US': 'Chat', es: 'Chat' },
  messaging: { 'pt-BR': 'COMUNICAÇÃO', 'en-US': 'MESSAGING', es: 'COMUNICACIÓN' },

  // ─── CLIENT SIDEBAR ───
  clientDashboard: { 'pt-BR': 'CLIENT DASHBOARD', 'en-US': 'CLIENT DASHBOARD', es: 'PANEL DEL CLIENTE' },
  myProject: { 'pt-BR': 'Meu Projeto', 'en-US': 'My Project', es: 'Mi Proyecto' },
  timeline: { 'pt-BR': 'Timeline', 'en-US': 'Timeline', es: 'Línea de Tiempo' },
  gallery: { 'pt-BR': 'Galeria', 'en-US': 'Gallery', es: 'Galería' },
  documents: { 'pt-BR': 'Documentos', 'en-US': 'Documents', es: 'Documentos' },
  approvals: { 'pt-BR': 'Aprovações', 'en-US': 'Approvals', es: 'Aprobaciones' },
  payments: { 'pt-BR': 'Financeiro', 'en-US': 'Payments', es: 'Pagos' },
  satisfaction: { 'pt-BR': 'Satisfação', 'en-US': 'Satisfaction', es: 'Satisfacción' },
  support: { 'pt-BR': 'Suporte', 'en-US': 'Support', es: 'Soporte' },
  myAccount: { 'pt-BR': 'MINHA CONTA', 'en-US': 'MY ACCOUNT', es: 'MI CUENTA' },
  darkMode: { 'pt-BR': 'Modo Escuro', 'en-US': 'Dark Mode', es: 'Modo Oscuro' },
  lightMode: { 'pt-BR': 'Modo Claro', 'en-US': 'Light Mode', es: 'Modo Claro' },

  // ─── ADMIN DASHBOARD ───
  adminDashboard: { 'pt-BR': 'ADMIN DASHBOARD', 'en-US': 'ADMIN DASHBOARD', es: 'PANEL DE ADMINISTRACIÓN' },
  administrator: { 'pt-BR': 'ADMINISTRADOR', 'en-US': 'ADMINISTRATOR', es: 'ADMINISTRADOR' },

  // ─── PARTNER EXTRA ───
  stagesOfWork: { 'pt-BR': 'Etapas da Obra', 'en-US': 'Work Stages', es: 'Etapas de la Obra' },
  dailyLog: { 'pt-BR': 'Log Diário', 'en-US': 'Daily Log', es: 'Registro Diario' },
  assignedLeads: { 'pt-BR': 'Leads Atribuídos', 'en-US': 'Assigned Leads', es: 'Leads Asignados' },
  photosDocs: { 'pt-BR': 'Fotos & Docs', 'en-US': 'Photos & Docs', es: 'Fotos y Docs' },
  myProfile: { 'pt-BR': 'Meu Perfil', 'en-US': 'My Profile', es: 'Mi Perfil' },
  account: { 'pt-BR': 'CONTA', 'en-US': 'ACCOUNT', es: 'CUENTA' },
  files: { 'pt-BR': 'ARQUIVOS', 'en-US': 'FILES', es: 'ARCHIVOS' },
  adminView: { 'pt-BR': '💼 Visão Admin', 'en-US': '💼 Admin View', es: '💼 Vista Admin' },
  calendarOfWorks: { 'pt-BR': 'Calendário de Obras', 'en-US': 'Works Calendar', es: 'Calendario de Obras' },
  system: { 'pt-BR': 'SISTEMA', 'en-US': 'SYSTEM', es: 'SISTEMA' },

  // ─── CLIENT EXTRA ───
  clientPortal: { 'pt-BR': 'Portal do Cliente', 'en-US': 'Client Portal', es: 'Portal del Cliente' },
  main: { 'pt-BR': 'PRINCIPAL', 'en-US': 'MAIN', es: 'PRINCIPAL' },
  myWork: { 'pt-BR': 'MINHA OBRA', 'en-US': 'MY PROJECT', es: 'MI OBRA' },
  workProgress: { 'pt-BR': 'Progresso da Obra', 'en-US': 'Work Progress', es: 'Progreso de la Obra' },
  photos: { 'pt-BR': 'Fotos', 'en-US': 'Photos', es: 'Fotos' },
  communication: { 'pt-BR': 'COMUNICAÇÃO', 'en-US': 'COMMUNICATION', es: 'COMUNICACIÓN' },
  evaluation: { 'pt-BR': 'Avaliação', 'en-US': 'Evaluation', es: 'Evaluación' },
};

// ── CONTEXT ──
interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt-BR',
  setLang: () => {},
  t: (key: string) => key,
});

// ── PROVIDER ──
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved as Lang) || 'pt-BR';
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const t = (key: string): string => {
    const entry = T[key];
    if (!entry) return key;
    return entry[lang] || entry['pt-BR'] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── HOOK ──
export function useLanguage() {
  return useContext(LanguageContext);
}

export default T;
