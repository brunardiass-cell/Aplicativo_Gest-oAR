export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- SCHEMA DEDICADO PARA O SISTEMA CT-VACINAS
-- Projeto Supabase: https://ytjhipjsigaalboztcdz.supabase.co
--
-- ATENÇÃO:
-- 1. Este script cria o schema isolado "ctvacinas".
-- 2. Ele NÃO interfere com nenhuma tabela do schema "public" ou de outros sites.
-- 3. Todos os arquivos e pastas continuam armazenados no SharePoint.
-- 4. O Supabase armazena os metadados e os links (URLs) de acesso aos arquivos.
-- ============================================================================

-- 1. Criação do Schema Dedicado
CREATE SCHEMA IF NOT EXISTS ctvacinas;

-- Concede privilégios aos perfis anon, authenticated e service_role
GRANT USAGE ON SCHEMA ctvacinas TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ctvacinas GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ctvacinas GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

SET search_path TO ctvacinas, public;

-- ============================================================================
-- 2. TABELAS DE GESTÃO DE PROJETOS E ATIVIDADES
-- ============================================================================

-- 2.1 Projetos
CREATE TABLE IF NOT EXISTS ctvacinas.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    leader TEXT,
    status TEXT DEFAULT 'Planejado',
    priority TEXT DEFAULT 'Média',
    start_date TEXT,
    due_date TEXT,
    completion_date TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT DEFAULT 'Sistema'
);
CREATE INDEX IF NOT EXISTS idx_ct_projects_leader ON ctvacinas.projects(leader);
CREATE INDEX IF NOT EXISTS idx_ct_projects_status ON ctvacinas.projects(status);

-- 2.2 Tarefas Setoriais / Gerais
CREATE TABLE IF NOT EXISTS ctvacinas.tasks (
    id TEXT PRIMARY KEY,
    project TEXT,
    activity TEXT,
    description TEXT,
    project_lead TEXT,
    priority TEXT DEFAULT 'Média',
    status TEXT DEFAULT 'Planejada',
    request_date TEXT,
    planned_start_date TEXT,
    completion_date TEXT,
    file_location TEXT, -- Link para o arquivo de relatório no SharePoint
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT DEFAULT 'Sistema'
);
CREATE INDEX IF NOT EXISTS idx_ct_tasks_project ON ctvacinas.tasks(project);
CREATE INDEX IF NOT EXISTS idx_ct_tasks_status ON ctvacinas.tasks(status);

-- 2.3 Membros da Equipe / Perfis
CREATE TABLE IF NOT EXISTS ctvacinas.team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    is_leader BOOLEAN DEFAULT false,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 Usuários com Acesso ao Sistema
CREATE TABLE IF NOT EXISTS ctvacinas.app_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'collaborator',
    status TEXT DEFAULT 'active',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_app_users_email ON ctvacinas.app_users(email);

-- 2.5 Modelos / Planos de Atividades
CREATE TABLE IF NOT EXISTS ctvacinas.activity_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. TABELAS DE ASSUNTOS E DOCUMENTOS REGULATÓRIOS
-- ============================================================================

-- 3.1 Normas Regulatórias
CREATE TABLE IF NOT EXISTS ctvacinas.regulatory_standards (
    id TEXT PRIMARY KEY,
    code TEXT,
    title TEXT NOT NULL,
    agency TEXT,
    category TEXT,
    status TEXT DEFAULT 'Vigente',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Assuntos Regulatórios
CREATE TABLE IF NOT EXISTS ctvacinas.regulatory_subjects (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Evidências Regulatórias (armazena link do arquivo no SharePoint)
CREATE TABLE IF NOT EXISTS ctvacinas.regulatory_evidence (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    macro_activity_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT,
    file_url TEXT, -- Link direto para o arquivo hospedado no SharePoint
    date TEXT,
    responsible TEXT,
    use_in_regulatory_doc BOOLEAN DEFAULT true,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_evidence_project ON ctvacinas.regulatory_evidence(project_id);

-- 3.4 Configurações de Macroatividades
CREATE TABLE IF NOT EXISTS ctvacinas.macro_activity_configs (
    id TEXT PRIMARY KEY,
    macro_activity_name TEXT,
    phase TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.5 Itens de Informação Regulatória
CREATE TABLE IF NOT EXISTS ctvacinas.regulatory_info_items (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    internal_id TEXT,
    name TEXT,
    category TEXT,
    value TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_info_items_project ON ctvacinas.regulatory_info_items(project_id);

-- 3.6 Registros Repetitivos
CREATE TABLE IF NOT EXISTS ctvacinas.repeatable_records (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    category TEXT,
    title TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_repeatable_project ON ctvacinas.repeatable_records(project_id);

-- 3.7 Narrativas Técnicas Regulatórias
CREATE TABLE IF NOT EXISTS ctvacinas.regulatory_narratives (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT,
    category TEXT,
    approval_status TEXT DEFAULT 'Rascunho',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_narratives_project ON ctvacinas.regulatory_narratives(project_id);

-- 3.8 Documentos / Dossiês Regulatórios (Estrutura e Capítulos)
CREATE TABLE IF NOT EXISTS ctvacinas.regulatory_docs (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT NOT NULL,
    type TEXT,
    group_name TEXT,
    current_version TEXT DEFAULT '1.0',
    current_version_status TEXT DEFAULT 'Ativo',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_docs_project ON ctvacinas.regulatory_docs(project_id);

-- 3.9 Contribuições para Dossiês (com link para SharePoint)
CREATE TABLE IF NOT EXISTS ctvacinas.dossier_contributions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    project_id TEXT,
    title TEXT,
    status TEXT,
    file_url TEXT, -- Link para o anexo no SharePoint
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. TABELAS DE VACINAS, COMPONENTES E LOTES
-- ============================================================================

-- 4.1 Candidatos Vacinais
CREATE TABLE IF NOT EXISTS ctvacinas.vaccine_candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT,
    disease TEXT,
    stage TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2 Componentes de Vacinas (COA e FISPQ apontam para SharePoint)
CREATE TABLE IF NOT EXISTS ctvacinas.vaccine_components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    coa_url TEXT, -- Link SharePoint do Certificado de Análise
    safety_data_sheet_link TEXT, -- Link SharePoint da FISPQ
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 Lotes de Formulação
CREATE TABLE IF NOT EXISTS ctvacinas.formulation_batches (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    vaccine_id TEXT,
    quality_control_status TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4 Impurezas de Vacinas
CREATE TABLE IF NOT EXISTS ctvacinas.vaccine_impurities (
    id TEXT PRIMARY KEY,
    vaccine_id TEXT,
    vaccine_name TEXT,
    category TEXT,
    item TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. REUNIÕES, ATAS E PAUTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ctvacinas.meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    project_id TEXT,
    date TEXT,
    time TEXT,
    type TEXT,
    status TEXT DEFAULT 'Agendada',
    moderator TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_meetings_date ON ctvacinas.meetings(date);

-- ============================================================================
-- 6. AUDITORIA, NOTIFICAÇÕES E CONFIGURAÇÃO
-- ============================================================================

-- 6.1 Notificações do Sistema
CREATE TABLE IF NOT EXISTS ctvacinas.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT false,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6.2 Histórico e Logs de Auditoria
CREATE TABLE IF NOT EXISTS ctvacinas.system_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT,
    action TEXT,
    details TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6.3 Configurações Globais (Key-Value)
CREATE TABLE IF NOT EXISTS ctvacinas.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT DEFAULT 'Sistema'
);

-- 6.4 Histórico de Backups Diários no SharePoint
CREATE TABLE IF NOT EXISTS ctvacinas.sync_backups (
    id TEXT PRIMARY KEY,
    backup_date TEXT NOT NULL, -- Formato YYYY-MM-DD
    backup_type TEXT DEFAULT 'SharePoint Diário (Primeiro Acesso)',
    status TEXT DEFAULT 'Sucesso',
    file_path_sharepoint TEXT,
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT DEFAULT 'Sistema'
);
CREATE INDEX IF NOT EXISTS idx_ct_sync_date ON ctvacinas.sync_backups(backup_date);

-- ============================================================================
-- 7. POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- Permite leitura e escrita aos clientes autorizados sem interferir nos outros schemas
-- ============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'projects', 'tasks', 'team_members', 'app_users', 'activity_plans',
        'regulatory_standards', 'regulatory_subjects', 'regulatory_evidence',
        'macro_activity_configs', 'regulatory_info_items', 'repeatable_records',
        'regulatory_narratives', 'regulatory_docs', 'dossier_contributions',
        'vaccine_candidates', 'vaccine_components', 'formulation_batches',
        'vaccine_impurities', 'meetings', 'notifications', 'system_logs',
        'app_config', 'sync_backups'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE ctvacinas.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "ctvacinas_allow_all_%s" ON ctvacinas.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "ctvacinas_allow_all_%s" ON ctvacinas.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- Garante concessão total aos perfis
GRANT ALL ON ALL TABLES IN SCHEMA ctvacinas TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ctvacinas TO anon, authenticated, service_role;

-- Confirmação
COMMENT ON SCHEMA ctvacinas IS 'Schema dedicado ao CT-Vacinas: metadados no Supabase e links para arquivos no SharePoint';
`;
