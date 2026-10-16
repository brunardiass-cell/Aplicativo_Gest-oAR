import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ytjhipjsigaalboztcdz.supabase.co';
const SCHEMA_NAME = 'ctvacinas';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  schema: string;
}

let cachedClient: SupabaseClient<any, any, any> | null = null;
let lastTestedConfig: { url: string; key: string } | null = null;

export const SupabaseService = {
  getConfig(): SupabaseConfig {
    const url = localStorage.getItem('ct_supabase_url') || 
                (import.meta as any).env?.VITE_SUPABASE_URL || 
                DEFAULT_SUPABASE_URL;
    const anonKey = localStorage.getItem('ct_supabase_anon_key') || 
                   (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                   '';
    const schema = (import.meta as any).env?.VITE_SUPABASE_SCHEMA || SCHEMA_NAME;
    return { url, anonKey, schema };
  },

  saveConfig(url: string, anonKey: string) {
    if (url) localStorage.setItem('ct_supabase_url', url.trim());
    if (anonKey) localStorage.setItem('ct_supabase_anon_key', anonKey.trim());
    cachedClient = null; // reset client
  },

  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config.url && config.anonKey);
  },

  getClient(): SupabaseClient<any, any, any> | null {
    const config = this.getConfig();
    if (!config.url || !config.anonKey) {
      return null;
    }

    if (cachedClient && lastTestedConfig?.url === config.url && lastTestedConfig?.key === config.anonKey) {
      return cachedClient;
    }

    try {
      cachedClient = createClient(config.url, config.anonKey, {
        db: {
          schema: config.schema || SCHEMA_NAME
        },
        auth: {
          persistSession: false
        }
      });
      lastTestedConfig = { url: config.url, key: config.anonKey };
      return cachedClient;
    } catch (e) {
      console.error('Erro ao inicializar cliente Supabase:', e);
      return null;
    }
  },

  async testConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string; details?: any }> {
    const url = customUrl || this.getConfig().url;
    const key = customKey || this.getConfig().anonKey;

    if (!url || !key) {
      return {
        success: false,
        message: 'URL e Anon Key do Supabase são obrigatórios para testar a conexão.'
      };
    }

    try {
      const client = createClient(url, key, {
        db: { schema: SCHEMA_NAME },
        auth: { persistSession: false }
      });

      // Testa consulta na tabela de projetos ou app_config do schema ctvacinas
      const { data, error } = await client
        .from('projects')
        .select('id')
        .limit(1);

      if (error) {
        // Se o erro indicar que o schema ou a tabela não existem
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema')) {
          return {
            success: false,
            message: `Conectou ao Supabase, porém o schema "${SCHEMA_NAME}" ou as tabelas ainda não foram criados. Por favor, execute o script SQL no editor do Supabase.`,
            details: error
          };
        }
        return {
          success: false,
          message: `Erro ao consultar Supabase: ${error.message} (Código: ${error.code})`,
          details: error
        };
      }

      return {
        success: true,
        message: `Conexão bem-sucedida! Schema "${SCHEMA_NAME}" acessível e tabelas operacionais no Supabase.`,
        details: { count: data?.length || 0 }
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Exceção ao conectar no Supabase: ${e.message}`,
        details: e
      };
    }
  },

  // =========================================================================
  // CARREGAMENTO COMPLETO DE METADADOS DO SUPABASE
  // =========================================================================

  async loadAllData(): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não configurado ou chave anônima ausente.' };
    }

    try {
      // Helper para buscar todos os registros com paginação se necessário
      const fetchTable = async (tableName: string): Promise<any[]> => {
        try {
          const { data, error } = await client
            .from(tableName)
            .select('*');

          if (error) {
            console.warn(`Aviso ao ler tabela ${tableName} do Supabase:`, error.message);
            return [];
          }

          if (!data || !Array.isArray(data)) return [];

          // Mescla payload JSONB para fidelidade completa de propriedades
          return data.map((row: any) => {
            if (row.payload && typeof row.payload === 'object') {
              return {
                ...row.payload,
                id: row.id,
                ...(row.file_location ? { fileLocation: row.file_location } : {}),
                ...(row.file_url ? { fileUrl: row.file_url } : {}),
                ...(row.coa_url ? { coaUrl: row.coa_url } : {}),
                ...(row.safety_data_sheet_link ? { safetyDataSheetLink: row.safety_data_sheet_link } : {})
              };
            }
            return row;
          });
        } catch (e) {
          console.warn(`Exceção ao buscar tabela ${tableName}:`, e);
          return [];
        }
      };

      const [
        projects,
        tasks,
        teamMembers,
        appUsers,
        activityPlans,
        regulatoryStandards,
        regulatorySubjects,
        regulatoryEvidence,
        macroActivityConfigs,
        regulatoryInfoItems,
        repeatableRecords,
        regulatoryNarratives,
        regulatoryDocs,
        dossierContributions,
        vaccineCandidates,
        vaccineComponents,
        formulationBatches,
        vaccineImpurities,
        meetings,
        notifications,
        logs,
        appConfigRows
      ] = await Promise.all([
        fetchTable('projects'),
        fetchTable('tasks'),
        fetchTable('team_members'),
        fetchTable('app_users'),
        fetchTable('activity_plans'),
        fetchTable('regulatory_standards'),
        fetchTable('regulatory_subjects'),
        fetchTable('regulatory_evidence'),
        fetchTable('macro_activity_configs'),
        fetchTable('regulatory_info_items'),
        fetchTable('repeatable_records'),
        fetchTable('regulatory_narratives'),
        fetchTable('regulatory_docs'),
        fetchTable('dossier_contributions'),
        fetchTable('vaccine_candidates'),
        fetchTable('vaccine_components'),
        fetchTable('formulation_batches'),
        fetchTable('vaccine_impurities'),
        fetchTable('meetings'),
        fetchTable('notifications'),
        fetchTable('system_logs'),
        fetchTable('app_config')
      ]);

      // Mapeia app_config key-value
      const configMap: Record<string, any> = {};
      appConfigRows.forEach((row: any) => {
        if (row.key && row.value !== undefined) {
          configMap[row.key] = row.value;
        }
      });

      const fullData = {
        projects: projects || [],
        tasks: tasks || [],
        teamMembers: teamMembers.length > 0 ? teamMembers : undefined,
        appUsers: appUsers.length > 0 ? appUsers : undefined,
        activityPlans: activityPlans || [],
        regulatoryStandards: regulatoryStandards.length > 0 ? regulatoryStandards : undefined,
        regulatorySubjects: regulatorySubjects.length > 0 ? regulatorySubjects : undefined,
        regulatoryEvidence: regulatoryEvidence || [],
        macroActivityConfigs: macroActivityConfigs || [],
        regulatoryInfoItems: regulatoryInfoItems || [],
        repeatableRecords: repeatableRecords || [],
        regulatoryNarratives: regulatoryNarratives || [],
        regulatoryDocs: regulatoryDocs || [],
        dossierContributions: dossierContributions || [],
        vaccineCandidates: vaccineCandidates.length > 0 ? vaccineCandidates : undefined,
        vaccineComponents: vaccineComponents.length > 0 ? vaccineComponents : undefined,
        formulationBatches: formulationBatches.length > 0 ? formulationBatches : undefined,
        vaccineImpurities: vaccineImpurities.length > 0 ? vaccineImpurities : undefined,
        meetings: meetings.length > 0 ? meetings : undefined,
        notifications: notifications || [],
        logs: logs || [],
        managerEmail: configMap.managerEmail || 'brunadias@ctvacinas.org'
      };

      console.log('[Supabase] Metadados carregados com sucesso do schema ctvacinas:', {
        projetos: projects.length,
        tarefas: tasks.length,
        membros: teamMembers.length,
        normas: regulatoryStandards.length,
        evidencias: regulatoryEvidence.length,
        docs: regulatoryDocs.length
      });

      return {
        success: true,
        data: fullData
      };
    } catch (e: any) {
      console.error('Erro ao carregar dados do Supabase:', e);
      return { success: false, error: e.message };
    }
  },

  // =========================================================================
  // SALVAMENTO COMPLETO DE METADADOS NO SUPABASE
  // =========================================================================

  async saveAllData(fullData: any, user: string = 'Sistema'): Promise<{ success: boolean; error?: string; stats?: any }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não configurado.' };
    }

    try {
      const timestamp = new Date().toISOString();

      // Upsert em lotes com tratamento de erro
      const upsertBatch = async (tableName: string, items: any[], transformRow: (item: any) => any) => {
        if (!items || items.length === 0) return;
        const rows = items.map(transformRow);

        // Divide em chunks de 50 registros para estabilidade
        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const { error } = await client
            .from(tableName)
            .upsert(chunk, { onConflict: 'id' });

          if (error) {
            console.error(`Erro ao fazer upsert na tabela ${tableName}:`, error);
            throw error;
          }
        }
      };

      // 1. Projetos
      await upsertBatch('projects', fullData.projects || [], (p: any) => ({
        id: p.id,
        name: p.name || 'Projeto sem nome',
        code: p.code || '',
        description: p.description || '',
        leader: p.leader || '',
        status: p.status || 'Planejado',
        priority: p.priority || 'Média',
        start_date: p.startDate || '',
        due_date: p.dueDate || '',
        completion_date: p.completionDate || '',
        payload: p,
        updated_at: timestamp,
        updated_by: user
      }));

      // 2. Tarefas
      await upsertBatch('tasks', fullData.tasks || [], (t: any) => ({
        id: t.id,
        project: t.project || '',
        activity: t.activity || '',
        description: t.description || '',
        project_lead: t.projectLead || '',
        priority: t.priority || 'Média',
        status: t.status || 'Planejada',
        request_date: t.requestDate || '',
        planned_start_date: t.plannedStartDate || '',
        completion_date: t.completionDate || '',
        file_location: t.fileLocation || '', // Link SharePoint
        payload: t,
        updated_at: timestamp,
        updated_by: user
      }));

      // 3. Membros
      await upsertBatch('team_members', fullData.teamMembers || [], (m: any) => ({
        id: m.id || m.name,
        name: m.name,
        role: m.role || '',
        email: m.email || '',
        active: m.active !== false,
        is_leader: !!m.isLeader,
        payload: m,
        updated_at: timestamp
      }));

      // 4. Usuários
      await upsertBatch('app_users', fullData.appUsers || [], (u: any) => ({
        id: u.id || u.email,
        username: u.username || u.name || '',
        email: u.email || '',
        role: u.role || 'collaborator',
        status: u.status || 'active',
        payload: u,
        updated_at: timestamp
      }));

      // 5. Planos de Atividades
      await upsertBatch('activity_plans', fullData.activityPlans || [], (pl: any) => ({
        id: pl.id,
        name: pl.name || '',
        description: pl.description || '',
        payload: pl,
        updated_at: timestamp
      }));

      // 6. Normas Regulatórias
      await upsertBatch('regulatory_standards', fullData.regulatoryStandards || [], (s: any) => ({
        id: s.id,
        code: s.code || '',
        title: s.title || '',
        agency: s.agency || '',
        category: s.category || '',
        status: s.status || 'Vigente',
        payload: s,
        updated_at: timestamp
      }));

      // 7. Assuntos Regulatórios
      await upsertBatch('regulatory_subjects', fullData.regulatorySubjects || [], (sub: any) => ({
        id: sub.id,
        code: sub.code || '',
        name: sub.name || '',
        description: sub.description || '',
        payload: sub,
        updated_at: timestamp
      }));

      // 8. Evidências Regulatórias (armazena link SharePoint)
      await upsertBatch('regulatory_evidence', fullData.regulatoryEvidence || [], (ev: any) => ({
        id: ev.id,
        project_id: ev.projectId || '',
        macro_activity_id: ev.macroActivityId || '',
        title: ev.title || '',
        description: ev.description || '',
        file_name: ev.fileName || '',
        file_url: ev.fileUrl || '', // Link SharePoint
        date: ev.date || '',
        responsible: ev.responsible || '',
        use_in_regulatory_doc: ev.useInRegulatoryDoc !== false,
        payload: ev,
        updated_at: timestamp
      }));

      // 9. Configurações de Macroatividades
      await upsertBatch('macro_activity_configs', fullData.macroActivityConfigs || [], (m: any) => ({
        id: m.id || m.macroActivityName,
        macro_activity_name: m.macroActivityName || '',
        phase: m.phase || '',
        payload: m,
        updated_at: timestamp
      }));

      // 10. Itens de Informação Regulatória
      await upsertBatch('regulatory_info_items', fullData.regulatoryInfoItems || [], (it: any) => ({
        id: it.id,
        project_id: it.projectId || '',
        internal_id: it.internalId || '',
        name: it.name || '',
        category: it.category || '',
        value: it.value || '',
        payload: it,
        updated_at: timestamp
      }));

      // 11. Registros Repetitivos
      await upsertBatch('repeatable_records', fullData.repeatableRecords || [], (r: any) => ({
        id: r.id,
        project_id: r.projectId || '',
        category: r.category || '',
        title: r.title || '',
        payload: r,
        updated_at: timestamp
      }));

      // 12. Narrativas
      await upsertBatch('regulatory_narratives', fullData.regulatoryNarratives || [], (n: any) => ({
        id: n.id,
        project_id: n.projectId || '',
        title: n.title || '',
        category: n.category || '',
        approval_status: n.approvalStatus || 'Rascunho',
        payload: n,
        updated_at: timestamp
      }));

      // 13. Dossiês Regulatórios
      await upsertBatch('regulatory_docs', fullData.regulatoryDocs || [], (d: any) => ({
        id: d.id,
        project_id: d.projectId || '',
        title: d.title || '',
        type: d.type || '',
        group_name: d.group || '',
        current_version: d.currentVersion || '1.0',
        current_version_status: d.currentVersionStatus || 'Ativo',
        payload: d,
        updated_at: timestamp
      }));

      // 14. Contribuições
      await upsertBatch('dossier_contributions', fullData.dossierContributions || [], (c: any) => ({
        id: c.id,
        task_id: c.taskId || '',
        project_id: c.projectId || '',
        title: c.title || '',
        status: c.status || '',
        file_url: c.fileUrl || '', // Link SharePoint
        payload: c,
        updated_at: timestamp
      }));

      // 15. Candidatos Vacinais
      await upsertBatch('vaccine_candidates', fullData.vaccineCandidates || [], (vc: any) => ({
        id: vc.id,
        name: vc.name || '',
        platform: vc.platform || '',
        disease: vc.disease || '',
        stage: vc.stage || '',
        payload: vc,
        updated_at: timestamp
      }));

      // 16. Componentes
      await upsertBatch('vaccine_components', fullData.vaccineComponents || [], (comp: any) => ({
        id: comp.id,
        name: comp.name || '',
        type: comp.type || '',
        coa_url: comp.coaUrl || '', // Link SharePoint
        safety_data_sheet_link: comp.safetyDataSheetLink || '', // Link SharePoint
        payload: comp,
        updated_at: timestamp
      }));

      // 17. Lotes
      await upsertBatch('formulation_batches', fullData.formulationBatches || [], (b: any) => ({
        id: b.id,
        batch_code: b.batchCode || '',
        vaccine_id: b.vaccineId || '',
        quality_control_status: b.qualityControlStatus || '',
        payload: b,
        updated_at: timestamp
      }));

      // 18. Impurezas
      await upsertBatch('vaccine_impurities', fullData.vaccineImpurities || [], (imp: any) => ({
        id: imp.id,
        vaccine_id: imp.vaccineId || '',
        vaccine_name: imp.vaccineName || '',
        category: imp.category || '',
        item: imp.item || '',
        payload: imp,
        updated_at: timestamp
      }));

      // 19. Reuniões
      await upsertBatch('meetings', fullData.meetings || [], (m: any) => ({
        id: m.id,
        title: m.title || '',
        project_id: m.projectId || '',
        date: m.date || '',
        time: m.time || '',
        type: m.type || '',
        status: m.status || 'Agendada',
        moderator: m.moderator || '',
        payload: m,
        updated_at: timestamp
      }));

      // 20. App Config (managerEmail e configurações gerais)
      if (fullData.managerEmail) {
        await client
          .from('app_config')
          .upsert({
            key: 'managerEmail',
            value: fullData.managerEmail,
            updated_at: timestamp,
            updated_by: user
          }, { onConflict: 'key' });
      }

      console.log('[Supabase] Todos os metadados foram salvos com sucesso no schema ctvacinas!');

      return {
        success: true,
        stats: {
          projects: (fullData.projects || []).length,
          tasks: (fullData.tasks || []).length,
          evidence: (fullData.regulatoryEvidence || []).length,
          docs: (fullData.regulatoryDocs || []).length
        }
      };
    } catch (e: any) {
      console.error('Erro ao salvar no Supabase:', e);
      return { success: false, error: e.message };
    }
  },

  // =========================================================================
  // GESTÃO DE BACKUP DIÁRIO NO SHAREPOINT (1º ACESSO DO DIA)
  // =========================================================================

  async checkDailyBackupCompletedToday(): Promise<boolean> {
    const todayStr = new Date().toISOString().split('T')[0];
    const client = this.getClient();

    if (!client) {
      return localStorage.getItem('ct_last_daily_backup_date') === todayStr;
    }

    try {
      const { data, error } = await client
        .from('sync_backups')
        .select('id, backup_date, status')
        .eq('backup_date', todayStr)
        .eq('status', 'Sucesso')
        .limit(1);

      if (error) {
        return localStorage.getItem('ct_last_daily_backup_date') === todayStr;
      }

      return !!(data && data.length > 0);
    } catch (e) {
      return localStorage.getItem('ct_last_daily_backup_date') === todayStr;
    }
  },

  async recordDailyBackupSuccess(dateStr: string, stats: any, filePath: string, user: string = 'Sistema'): Promise<boolean> {
    localStorage.setItem('ct_last_daily_backup_date', dateStr);
    const client = this.getClient();
    if (!client) return true;

    try {
      await client
        .from('sync_backups')
        .upsert({
          id: `backup_${dateStr}`,
          backup_date: dateStr,
          backup_type: 'SharePoint Diário (Primeiro Acesso do Dia)',
          status: 'Sucesso',
          file_path_sharepoint: filePath || `Sistema/Backups_Diarios/backup_${dateStr}.json`,
          stats: stats || {},
          created_at: new Date().toISOString(),
          created_by: user
        }, { onConflict: 'id' });

      return true;
    } catch (e) {
      console.warn('Aviso ao registrar histórico de backup diário no Supabase:', e);
      return false;
    }
  }
};
