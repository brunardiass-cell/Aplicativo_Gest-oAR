import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { normalizeProfileGroupKey } from '../constants';

const DEFAULT_SUPABASE_URL = 'https://ytjhipjsigaalboztcdz.supabase.co';
const SCHEMA_NAME = 'ctvacinas';
const PAGE_SIZE = 1000;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  schema: string;
}

export interface SaveDeltaResult {
  success: boolean;
  error?: string;
  stats?: {
    upserted: number;
    deleted: number;
    tablesTouched: string[];
    projects: number;
    tasks: number;
    evidence: number;
    docs: number;
  };
}

let cachedClient: SupabaseClient<any, any, any> | null = null;
let lastTestedConfig: { url: string; key: string; schema: string } | null = null;
let memoryConfig: SupabaseConfig | null = null;

interface TableDef {
  tableName: string;
  stateKey: string;
  core?: boolean;
  getId: (item: any) => string;
  transform: (item: any, timestamp: string, user: string) => Record<string, any>;
}

const TABLE_DEFINITIONS: TableDef[] = [
  {
    tableName: 'projects',
    stateKey: 'projects',
    core: true,
    getId: (p) => String(p?.id || ''),
    transform: (p, timestamp, user) => ({
      id: String(p.id),
      name: p.name || 'Projeto sem nome',
      code: p.code || '',
      description: p.description || '',
      leader: p.leader || p.responsible || '',
      status: p.status || 'Planejado',
      priority: p.priority || 'Média',
      start_date: p.startDate || '',
      due_date: p.dueDate || '',
      completion_date: p.completionDate || '',
      payload: p,
      updated_at: timestamp,
      updated_by: user
    })
  },
  {
    tableName: 'tasks',
    stateKey: 'tasks',
    core: true,
    getId: (t) => String(t?.id || ''),
    transform: (t, timestamp, user) => ({
      id: String(t.id),
      project: t.project || '',
      activity: t.activity || '',
      description: t.description || '',
      project_lead: t.projectLead || '',
      priority: t.priority || 'Média',
      status: t.status || 'Planejada',
      request_date: t.requestDate || '',
      planned_start_date: t.plannedStartDate || '',
      completion_date: t.completionDate || '',
      file_location: t.fileLocation || '',
      payload: t,
      updated_at: timestamp,
      updated_by: user
    })
  },
  {
    tableName: 'team_members',
    stateKey: 'teamMembers',
    getId: (m) => String(m?.id || m?.name || ''),
    transform: (m, timestamp) => ({
      id: String(m.id || m.name),
      name: m.name || '',
      role: m.role || '',
      email: m.email || '',
      active: m.active !== false,
      is_leader: !!m.isLeader,
      payload: m,
      updated_at: timestamp
    })
  },
  {
    tableName: 'app_users',
    stateKey: 'appUsers',
    getId: (u) => String(u?.id || u?.email || ''),
    transform: (u, timestamp) => ({
      id: String(u.id || u.email),
      username: u.username || u.name || '',
      email: u.email || '',
      role: u.role || 'collaborator',
      status: u.status || 'active',
      payload: u,
      updated_at: timestamp
    })
  },
  {
    tableName: 'activity_plans',
    stateKey: 'activityPlans',
    getId: (pl) => String(pl?.id || ''),
    transform: (pl, timestamp) => ({
      id: String(pl.id),
      name: pl.name || '',
      description: pl.description || '',
      payload: pl,
      updated_at: timestamp
    })
  },
  {
    tableName: 'regulatory_standards',
    stateKey: 'regulatoryStandards',
    getId: (s) => String(s?.id || ''),
    transform: (s, timestamp) => ({
      id: String(s.id),
      code: s.code || '',
      title: s.title || '',
      agency: s.agency || '',
      category: s.category || '',
      status: s.status || 'Vigente',
      payload: s,
      updated_at: timestamp
    })
  },
  {
    tableName: 'regulatory_subjects',
    stateKey: 'regulatorySubjects',
    getId: (sub) => String(sub?.id || ''),
    transform: (sub, timestamp) => ({
      id: String(sub.id),
      code: sub.code || '',
      name: sub.name || '',
      description: sub.description || '',
      payload: sub,
      updated_at: timestamp
    })
  },
  {
    tableName: 'regulatory_evidence',
    stateKey: 'regulatoryEvidence',
    getId: (ev) => String(ev?.id || ''),
    transform: (ev, timestamp) => ({
      id: String(ev.id),
      project_id: ev.projectId || '',
      macro_activity_id: ev.macroActivityId || '',
      title: ev.title || '',
      description: ev.description || '',
      file_name: ev.fileName || '',
      file_url: ev.fileUrl || '',
      date: ev.date || '',
      responsible: ev.responsible || '',
      use_in_regulatory_doc: ev.useInRegulatoryDoc !== false,
      payload: ev,
      updated_at: timestamp
    })
  },
  {
    tableName: 'macro_activity_configs',
    stateKey: 'macroActivityConfigs',
    getId: (m) => String(m?.id || m?.macroActivityName || ''),
    transform: (m, timestamp) => ({
      id: String(m.id || m.macroActivityName),
      macro_activity_name: m.macroActivityName || '',
      phase: m.phase || '',
      payload: m,
      updated_at: timestamp
    })
  },
  {
    tableName: 'regulatory_info_items',
    stateKey: 'regulatoryInfoItems',
    getId: (it) => String(it?.id || ''),
    transform: (it, timestamp) => ({
      id: String(it.id),
      project_id: it.projectId || '',
      internal_id: it.internalId || '',
      name: it.name || '',
      category: it.category || '',
      value: typeof it.value === 'string' ? it.value : JSON.stringify(it.value ?? ''),
      payload: it,
      updated_at: timestamp
    })
  },
  {
    tableName: 'repeatable_records',
    stateKey: 'repeatableRecords',
    getId: (r) => String(r?.id || ''),
    transform: (r, timestamp) => ({
      id: String(r.id),
      project_id: r.projectId || '',
      category: r.category || '',
      title: r.title || '',
      payload: r,
      updated_at: timestamp
    })
  },
  {
    tableName: 'regulatory_narratives',
    stateKey: 'regulatoryNarratives',
    getId: (n) => String(n?.id || ''),
    transform: (n, timestamp) => ({
      id: String(n.id),
      project_id: n.projectId || '',
      title: n.title || '',
      category: n.category || '',
      approval_status: n.approvalStatus || 'Rascunho',
      payload: n,
      updated_at: timestamp
    })
  },
  {
    tableName: 'regulatory_docs',
    stateKey: 'regulatoryDocs',
    getId: (d) => String(d?.id || ''),
    transform: (d, timestamp) => ({
      id: String(d.id),
      project_id: d.projectId || '',
      title: d.title || '',
      type: d.type || '',
      group_name: d.group || '',
      current_version: d.currentVersion || '1.0',
      current_version_status: d.currentVersionStatus || 'Ativo',
      payload: d,
      updated_at: timestamp
    })
  },
  {
    tableName: 'dossier_contributions',
    stateKey: 'dossierContributions',
    getId: (c) => String(c?.id || ''),
    transform: (c, timestamp) => ({
      id: String(c.id),
      task_id: c.taskId || '',
      project_id: c.projectId || '',
      title: c.title || '',
      status: c.status || '',
      file_url: c.fileUrl || '',
      payload: c,
      updated_at: timestamp
    })
  },
  {
    tableName: 'vaccine_candidates',
    stateKey: 'vaccineCandidates',
    getId: (vc) => String(vc?.id || ''),
    transform: (vc, timestamp) => ({
      id: String(vc.id),
      name: vc.name || '',
      platform: vc.platform || '',
      disease: vc.disease || '',
      stage: vc.stage || '',
      payload: vc,
      updated_at: timestamp
    })
  },
  {
    tableName: 'vaccine_components',
    stateKey: 'vaccineComponents',
    getId: (comp) => String(comp?.id || ''),
    transform: (comp, timestamp) => ({
      id: String(comp.id),
      name: comp.name || '',
      type: comp.type || '',
      coa_url: comp.coaUrl || '',
      safety_data_sheet_link: comp.safetyDataSheetLink || '',
      payload: comp,
      updated_at: timestamp
    })
  },
  {
    tableName: 'formulation_batches',
    stateKey: 'formulationBatches',
    getId: (b) => String(b?.id || ''),
    transform: (b, timestamp) => ({
      id: String(b.id),
      batch_code: b.batchCode || '',
      vaccine_id: b.vaccineId || '',
      quality_control_status: b.qualityControlStatus || '',
      payload: b,
      updated_at: timestamp
    })
  },
  {
    tableName: 'vaccine_impurities',
    stateKey: 'vaccineImpurities',
    getId: (imp) => String(imp?.id || ''),
    transform: (imp, timestamp) => ({
      id: String(imp.id),
      vaccine_id: imp.vaccineId || '',
      vaccine_name: imp.vaccineName || '',
      category: imp.category || '',
      item: imp.item || '',
      payload: imp,
      updated_at: timestamp
    })
  },
  {
    tableName: 'meetings',
    stateKey: 'meetings',
    getId: (m) => String(m?.id || ''),
    transform: (m, timestamp) => ({
      id: String(m.id),
      title: m.title || 'Reunião',
      project_id: m.projectId || '',
      date: m.date || '',
      time: m.time || '',
      type: m.type || '',
      status: m.status || 'Agendada',
      moderator: m.moderator || '',
      payload: m,
      updated_at: timestamp
    })
  },
  {
    tableName: 'notifications',
    stateKey: 'notifications',
    getId: (n) => String(n?.id || ''),
    transform: (n) => ({
      id: String(n.id),
      user_id: n.userId || '',
      title: n.type || 'Notificação',
      message: n.message || '',
      read: Boolean(n.read),
      payload: n,
      created_at: n.timestamp || new Date().toISOString()
    })
  },
  {
    tableName: 'system_logs',
    stateKey: 'logs',
    getId: (l) => String(l?.id || ''),
    transform: (l) => ({
      id: String(l.id),
      user_name: l.user || 'Sistema',
      action: l.action || '',
      details: l.reason || l.taskTitle || '',
      payload: l,
      created_at: l.timestamp || new Date().toISOString()
    })
  }
];

function deduplicateById<T>(items: T[], getId: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const id = getId(item).trim();
    if (!id) continue;
    map.set(id, item);
  }
  return Array.from(map.values());
}

export const SupabaseService = {
  async ensureConfigLoaded(): Promise<SupabaseConfig> {
    if (memoryConfig && memoryConfig.anonKey) {
      return memoryConfig;
    }
    const current = this.getConfig();
    if (current.anonKey) {
      memoryConfig = current;
      try {
        fetch('/api/supabase-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current)
        }).catch(() => {});
      } catch {}
      return current;
    }

    try {
      const res = await fetch('/api/supabase-config');
      if (res.ok) {
        const data = await res.json();
        if (data?.config?.anonKey) {
          try {
            if (data.config.url) localStorage.setItem('ct_supabase_url', data.config.url);
            localStorage.setItem('ct_supabase_anon_key', data.config.anonKey);
          } catch {}
          memoryConfig = {
            url: data.config.url || DEFAULT_SUPABASE_URL,
            anonKey: data.config.anonKey,
            schema: data.config.schema || SCHEMA_NAME
          };
          cachedClient = null;
          return memoryConfig;
        }
      }
    } catch (e) {
      console.warn('Não foi possível sincronizar config do Supabase com o servidor:', e);
    }

    return current;
  },

  getConfig(): SupabaseConfig {
    if (memoryConfig && memoryConfig.anonKey) {
      return memoryConfig;
    }
    let localUrl = '';
    let localKey = '';
    try {
      localUrl = localStorage.getItem('ct_supabase_url') || '';
      localKey = localStorage.getItem('ct_supabase_anon_key') || '';
    } catch {}

    const url =
      localUrl ||
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const anonKey =
      localKey ||
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      '';
    const schema = (import.meta as any).env?.VITE_SUPABASE_SCHEMA || SCHEMA_NAME;
    return { url, anonKey, schema };
  },

  saveConfig(url: string, anonKey: string) {
    const cleanUrl = url ? url.trim() : DEFAULT_SUPABASE_URL;
    const cleanKey = anonKey ? anonKey.trim() : '';
    const cleanSchema = SCHEMA_NAME;

    memoryConfig = { url: cleanUrl, anonKey: cleanKey, schema: cleanSchema };
    try {
      if (cleanUrl) localStorage.setItem('ct_supabase_url', cleanUrl);
      if (cleanKey) localStorage.setItem('ct_supabase_anon_key', cleanKey);
    } catch {}

    cachedClient = null;

    try {
      fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey, schema: cleanSchema })
      }).catch(() => {});
    } catch {}
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

    if (
      cachedClient &&
      lastTestedConfig?.url === config.url &&
      lastTestedConfig?.key === config.anonKey &&
      lastTestedConfig?.schema === config.schema
    ) {
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
      lastTestedConfig = { url: config.url, key: config.anonKey, schema: config.schema || SCHEMA_NAME };
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

      const { data, error } = await client
        .from('projects')
        .select('id')
        .limit(1);

      if (error) {
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
  // CARREGAMENTO COMPLETO PAGINADO DO SUPABASE (FONTE ÚNICA DE VERDADE)
  // =========================================================================

  async loadAllData(): Promise<{ success: boolean; data?: any; error?: string; hasRemoteRecords?: boolean }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não configurado ou chave anônima ausente.' };
    }

    try {
      const failedTables: string[] = [];

      const fetchTable = async (tableName: string): Promise<any[]> => {
        try {
          const allRows: any[] = [];
          let from = 0;

          while (true) {
            const { data, error } = await client
              .from(tableName)
              .select('*')
              .range(from, from + PAGE_SIZE - 1);

            if (error) {
              console.warn(`[Supabase] Aviso ao ler tabela ${tableName}:`, error.message);
              failedTables.push(`${tableName}: ${error.message}`);
              return [];
            }

            if (!data || !Array.isArray(data)) break;

            for (const row of data) {
              if (row.payload && typeof row.payload === 'object') {
                allRows.push({
                  ...row.payload,
                  id: row.id,
                  ...(row.file_location ? { fileLocation: row.file_location } : {}),
                  ...(row.file_url ? { fileUrl: row.file_url } : {}),
                  ...(row.coa_url ? { coaUrl: row.coa_url } : {}),
                  ...(row.safety_data_sheet_link ? { safetyDataSheetLink: row.safety_data_sheet_link } : {})
                });
              } else {
                allRows.push(row);
              }
            }

            if (data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
          }

          return allRows;
        } catch (e: any) {
          console.warn(`[Supabase] Exceção ao buscar tabela ${tableName}:`, e);
          failedTables.push(`${tableName}: ${e?.message || 'erro desconhecido'}`);
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

      // Se tabelas principais falharam na leitura (ex: rede offline, RLS ou chave inválida), NÃO sobrescrever estado com vazio
      const coreFailed = failedTables.some(msg => msg.startsWith('projects:') || msg.startsWith('tasks:'));
      if (coreFailed) {
        return {
          success: false,
          error: `Falha ao ler tabelas principais do Supabase (${failedTables.slice(0, 2).join('; ')})`
        };
      }

      const configMap: Record<string, any> = {};
      const configUpdatedAt: Record<string, string> = {};
      appConfigRows.forEach((row: any) => {
        if (row.key && row.value !== undefined) {
          configMap[row.key] = row.value;
          configUpdatedAt[row.key] = row.updated_at || '';
        }
      });

      const profileTaskGroups: Record<string, any[]> = {};
      const profileUpdatedAt: Record<string, string> = {};

      Object.keys(configMap).forEach(key => {
        if (key.startsWith('task_groups_') && Array.isArray(configMap[key])) {
          const rawProfile = key.slice('task_groups_'.length);
          const canonicalKey = normalizeProfileGroupKey(rawProfile);
          const rowTs = configUpdatedAt[key] || '';
          const existingTs = profileUpdatedAt[canonicalKey];
          if (existingTs === undefined || rowTs >= existingTs) {
            profileTaskGroups[canonicalKey] = configMap[key];
            profileUpdatedAt[canonicalKey] = rowTs;
          }
        }
      });

      const legacyKey = Array.isArray(configMap.task_groups)
        ? 'task_groups'
        : Array.isArray(configMap.activity_groups)
          ? 'activity_groups'
          : null;

      if (legacyKey) {
        const legacyTs = configUpdatedAt[legacyKey] || '';
        const brunaTs = profileUpdatedAt['bruna'];
        if (brunaTs === undefined || legacyTs > brunaTs) {
          profileTaskGroups['bruna'] = configMap[legacyKey];
          profileUpdatedAt['bruna'] = legacyTs;
        }
      }

      const effectiveTaskGroups = Array.isArray(profileTaskGroups['bruna'])
        ? profileTaskGroups['bruna']
        : [];

      const hasRemoteRecords =
        projects.length > 0 ||
        tasks.length > 0 ||
        meetings.length > 0 ||
        teamMembers.length > 0 ||
        appUsers.length > 0 ||
        regulatoryDocs.length > 0 ||
        regulatoryEvidence.length > 0 ||
        appConfigRows.length > 0;

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
        // Se o banco já possui registros, preserva [] real de reuniões para não ressuscitar reuniões excluídas
        meetings: hasRemoteRecords ? (meetings || []) : (meetings.length > 0 ? meetings : undefined),
        notifications: notifications || [],
        logs: logs || [],
        taskGroups: effectiveTaskGroups,
        profileTaskGroups,
        maintenancePeriods: Array.isArray(configMap.maintenance_periods) ? configMap.maintenance_periods : undefined,
        systemRealStartDate: typeof configMap.system_real_start_date === 'string' ? configMap.system_real_start_date : undefined,
        systemRealStartNote: typeof configMap.system_real_start_note === 'string' ? configMap.system_real_start_note : undefined,
        managerEmail: configMap.managerEmail || 'brunadias@ctvacinas.org',
        _source: 'supabase'
      };

      console.log('[Supabase] Metadados carregados com sucesso do schema ctvacinas:', {
        projetos: projects.length,
        tarefas: tasks.length,
        reunioes: meetings.length,
        membros: teamMembers.length,
        notificacoes: notifications.length,
        logs: logs.length
      });

      return {
        success: true,
        data: fullData,
        hasRemoteRecords
      };
    } catch (e: any) {
      console.error('Erro ao carregar dados do Supabase:', e);
      return { success: false, error: e.message };
    }
  },

  // =========================================================================
  // VERIFICAÇÃO LEVE DE ALTERAÇÕES REMOTAS (MULTIUSUÁRIO EM QUALQUER AMBIENTE)
  // =========================================================================

  async getRemoteVersionStamp(): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;

    const watchedTables: Array<{ name: string; tsCol: 'updated_at' | 'created_at' }> = [
      { name: 'tasks', tsCol: 'updated_at' },
      { name: 'projects', tsCol: 'updated_at' },
      { name: 'meetings', tsCol: 'updated_at' },
      { name: 'app_config', tsCol: 'updated_at' },
      { name: 'regulatory_docs', tsCol: 'updated_at' },
      { name: 'regulatory_evidence', tsCol: 'updated_at' },
      { name: 'regulatory_standards', tsCol: 'updated_at' },
      { name: 'notifications', tsCol: 'created_at' }
    ];

    try {
      const parts = await Promise.all(
        watchedTables.map(async ({ name, tsCol }) => {
          const [latestRes, countRes] = await Promise.all([
            client
              .from(name)
              .select(tsCol)
              .order(tsCol, { ascending: false })
              .limit(1),
            client
              .from(name)
              .select(name === 'app_config' ? 'key' : 'id', { count: 'exact', head: true })
          ]);
          const latestTs =
            !latestRes.error && Array.isArray(latestRes.data) && latestRes.data[0]
              ? String((latestRes.data[0] as any)[tsCol] || '')
              : '';
          const count = !countRes.error && typeof countRes.count === 'number' ? countRes.count : -1;
          return `${name}:${count}:${latestTs}`;
        })
      );
      return parts.join('|');
    } catch {
      return null;
    }
  },

  subscribeToChanges(onRemoteChange: (tableName: string) => void): () => void {
    const client = this.getClient();
    if (!client) return () => {};
    const config = this.getConfig();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let channel: RealtimeChannel | null = null;

    try {
      channel = client
        .channel(`ctvacinas_realtime_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: config.schema || SCHEMA_NAME },
          (payload: any) => {
            const tbl = String(payload?.table || 'all');
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              onRemoteChange(tbl);
            }, 400);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Supabase Realtime] Conectado para sincronização multiusuário em tempo real.');
          }
        });
    } catch (e) {
      console.warn('[Supabase Realtime] Indisponível neste projeto (polling ativo como garantia):', e);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) {
        try {
          client.removeChannel(channel);
        } catch {}
      }
    };
  },

  // =========================================================================
  // SALVAMENTO INCREMENTAL MULTIUSUÁRIO (DELTA UPSERT + DELETE REAL)
  // Só grava registros criados/alterados e remove registros excluídos por este usuário,
  // evitando sobrescrever edições simultâneas de outros usuários!
  // =========================================================================

  async saveDeltaData(
    baseData: any | null,
    currentData: any,
    user: string = 'Sistema'
  ): Promise<SaveDeltaResult> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não configurado.' };
    }

    if (!baseData) {
      return this.saveAllData(currentData, user);
    }

    const timestamp = new Date().toISOString();
    let totalUpserted = 0;
    let totalDeleted = 0;
    const tablesTouched: string[] = [];
    const errors: string[] = [];

    const upsertRows = async (tableName: string, rows: Record<string, any>[]) => {
      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await client
          .from(tableName)
          .upsert(chunk, { onConflict: 'id' });
        if (error) {
          throw new Error(`${tableName} (upsert): ${error.message}`);
        }
      }
    };

    const deleteRows = async (tableName: string, ids: string[]) => {
      const chunkSize = 50;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { error } = await client
          .from(tableName)
          .delete()
          .in('id', chunk);
        if (error) {
          throw new Error(`${tableName} (delete): ${error.message}`);
        }
      }
    };

    // Processa todas as tabelas de forma isolada e paralela (somente o que realmente mudou)
    await Promise.all(
      TABLE_DEFINITIONS.map(async (def) => {
        try {
          const rawCurrent = Array.isArray(currentData?.[def.stateKey]) ? currentData[def.stateKey] : [];
          const rawBase = Array.isArray(baseData?.[def.stateKey]) ? baseData[def.stateKey] : [];

          const currentItems = deduplicateById(rawCurrent, def.getId);
          const baseItems = deduplicateById(rawBase, def.getId);

          const baseMap = new Map<string, string>();
          for (const bItem of baseItems) {
            baseMap.set(def.getId(bItem).trim(), JSON.stringify(bItem));
          }

          const currentIds = new Set<string>();
          const changedItems: any[] = [];

          for (const cItem of currentItems) {
            const id = def.getId(cItem).trim();
            currentIds.add(id);
            const prevJson = baseMap.get(id);
            if (prevJson === undefined || prevJson !== JSON.stringify(cItem)) {
              changedItems.push(cItem);
            }
          }

          const removedIds: string[] = [];
          for (const id of baseMap.keys()) {
            if (!currentIds.has(id)) {
              removedIds.push(id);
            }
          }

          if (changedItems.length === 0 && removedIds.length === 0) {
            return;
          }

          if (changedItems.length > 0) {
            const rows = changedItems.map((item) => def.transform(item, timestamp, user));
            await upsertRows(def.tableName, rows);
            totalUpserted += rows.length;
          }

          if (removedIds.length > 0) {
            await deleteRows(def.tableName, removedIds);
            totalDeleted += removedIds.length;
          }

          tablesTouched.push(def.tableName);
        } catch (err: any) {
          console.error(`[Supabase Delta] Erro na tabela ${def.tableName}:`, err);
          errors.push(err?.message || `Falha em ${def.tableName}`);
        }
      })
    );

    // App Config (apenas chaves alteradas)
    try {
      const configRowsToUpsert: Array<{ key: string; value: any; updated_at: string; updated_by: string }> = [];

      if (currentData?.managerEmail && currentData.managerEmail !== baseData?.managerEmail) {
        configRowsToUpsert.push({
          key: 'managerEmail',
          value: currentData.managerEmail,
          updated_at: timestamp,
          updated_by: user
        });
      }

      const currProfileGroups =
        currentData?.profileTaskGroups && typeof currentData.profileTaskGroups === 'object'
          ? currentData.profileTaskGroups
          : null;
      const baseProfileGroups =
        baseData?.profileTaskGroups && typeof baseData.profileTaskGroups === 'object'
          ? baseData.profileTaskGroups
          : {};

      if (currProfileGroups) {
        const seenKeys = new Set<string>();
        Object.entries(currProfileGroups).forEach(([rawKey, groupsVal]) => {
          if (!Array.isArray(groupsVal)) return;
          const canonicalKey = normalizeProfileGroupKey(rawKey);
          if (seenKeys.has(canonicalKey)) return;
          seenKeys.add(canonicalKey);

          const prevVal = baseProfileGroups[canonicalKey];
          if (JSON.stringify(prevVal) === JSON.stringify(groupsVal)) return;

          configRowsToUpsert.push({
            key: `task_groups_${canonicalKey}`,
            value: groupsVal,
            updated_at: timestamp,
            updated_by: user
          });
          if (canonicalKey === 'bruna') {
            configRowsToUpsert.push(
              {
                key: 'task_groups',
                value: groupsVal,
                updated_at: timestamp,
                updated_by: user
              },
              {
                key: 'task_groups_bruna dias',
                value: groupsVal,
                updated_at: timestamp,
                updated_by: user
              }
            );
          }
        });
      }

      if (configRowsToUpsert.length > 0) {
        const { error: cfgErr } = await client
          .from('app_config')
          .upsert(configRowsToUpsert, { onConflict: 'key' });
        if (cfgErr) {
          errors.push(`app_config: ${cfgErr.message}`);
        } else {
          totalUpserted += configRowsToUpsert.length;
          tablesTouched.push('app_config');
        }
      }
    } catch (err: any) {
      errors.push(`app_config: ${err?.message || 'erro desconhecido'}`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join(' | ')
      };
    }

    console.log('[Supabase Delta] Sincronização concluída:', {
      upserted: totalUpserted,
      deleted: totalDeleted,
      tablesTouched,
      user
    });

    return {
      success: true,
      stats: {
        upserted: totalUpserted,
        deleted: totalDeleted,
        tablesTouched,
        projects: (currentData?.projects || []).length,
        tasks: (currentData?.tasks || []).length,
        evidence: (currentData?.regulatoryEvidence || []).length,
        docs: (currentData?.regulatoryDocs || []).length
      }
    };
  },

  // =========================================================================
  // SALVAMENTO COMPLETO DE METADADOS NO SUPABASE (MIGRAÇÃO / BACKUP FULL)
  // =========================================================================

  async saveAllData(fullData: any, user: string = 'Sistema'): Promise<SaveDeltaResult> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não configurado.' };
    }

    try {
      const timestamp = new Date().toISOString();
      let totalUpserted = 0;
      const tablesTouched: string[] = [];
      const errors: string[] = [];

      const upsertBatch = async (tableName: string, rows: Record<string, any>[]) => {
        if (!rows || rows.length === 0) return;
        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const { error } = await client
            .from(tableName)
            .upsert(chunk, { onConflict: 'id' });

          if (error) {
            console.error(`Erro ao fazer upsert na tabela ${tableName}:`, error);
            throw new Error(`${tableName}: ${error.message}`);
          }
        }
        totalUpserted += rows.length;
        tablesTouched.push(tableName);
      };

      await Promise.all(
        TABLE_DEFINITIONS.map(async (def) => {
          try {
            const rawItems = Array.isArray(fullData?.[def.stateKey]) ? fullData[def.stateKey] : [];
            const uniqueItems = deduplicateById(rawItems, def.getId);
            if (uniqueItems.length === 0) return;
            const rows = uniqueItems.map((item) => def.transform(item, timestamp, user));
            await upsertBatch(def.tableName, rows);
          } catch (err: any) {
            errors.push(err?.message || `Falha em ${def.tableName}`);
          }
        })
      );

      // App Config (managerEmail, task_groups por perfil e configurações de manutenção/início real)
      const configRowsToUpsert: Array<{ key: string; value: any; updated_at: string; updated_by: string }> = [];

      if (fullData?.managerEmail) {
        configRowsToUpsert.push({
          key: 'managerEmail',
          value: fullData.managerEmail,
          updated_at: timestamp,
          updated_by: user
        });
      }

      if (fullData?.profileTaskGroups && typeof fullData.profileTaskGroups === 'object') {
        const seenKeys = new Set<string>();
        Object.entries(fullData.profileTaskGroups).forEach(([rawKey, groupsVal]) => {
          if (!Array.isArray(groupsVal)) return;
          const canonicalKey = normalizeProfileGroupKey(rawKey);
          if (seenKeys.has(canonicalKey)) return;
          seenKeys.add(canonicalKey);
          configRowsToUpsert.push({
            key: `task_groups_${canonicalKey}`,
            value: groupsVal,
            updated_at: timestamp,
            updated_by: user
          });
          if (canonicalKey === 'bruna') {
            configRowsToUpsert.push(
              {
                key: 'task_groups',
                value: groupsVal,
                updated_at: timestamp,
                updated_by: user
              },
              {
                key: 'task_groups_bruna dias',
                value: groupsVal,
                updated_at: timestamp,
                updated_by: user
              }
            );
          }
        });
      } else if (Array.isArray(fullData?.taskGroups)) {
        const activeCanonical = normalizeProfileGroupKey(user);
        configRowsToUpsert.push({
          key: `task_groups_${activeCanonical}`,
          value: fullData.taskGroups,
          updated_at: timestamp,
          updated_by: user
        });
        if (activeCanonical === 'bruna') {
          configRowsToUpsert.push(
            {
              key: 'task_groups',
              value: fullData.taskGroups,
              updated_at: timestamp,
              updated_by: user
            },
            {
              key: 'task_groups_bruna dias',
              value: fullData.taskGroups,
              updated_at: timestamp,
              updated_by: user
            }
          );
        }
      }

      if (Array.isArray(fullData?.maintenancePeriods)) {
        configRowsToUpsert.push({
          key: 'maintenance_periods',
          value: fullData.maintenancePeriods,
          updated_at: timestamp,
          updated_by: user
        });
      }
      if (typeof fullData?.systemRealStartDate === 'string') {
        configRowsToUpsert.push({
          key: 'system_real_start_date',
          value: fullData.systemRealStartDate,
          updated_at: timestamp,
          updated_by: user
        });
      }
      if (typeof fullData?.systemRealStartNote === 'string') {
        configRowsToUpsert.push({
          key: 'system_real_start_note',
          value: fullData.systemRealStartNote,
          updated_at: timestamp,
          updated_by: user
        });
      }

      if (configRowsToUpsert.length > 0) {
        const { error: cfgErr } = await client
          .from('app_config')
          .upsert(configRowsToUpsert, { onConflict: 'key' });
        if (cfgErr) {
          console.error('Erro ao salvar app_config no Supabase:', cfgErr);
          errors.push(`app_config: ${cfgErr.message}`);
        } else {
          totalUpserted += configRowsToUpsert.length;
          tablesTouched.push('app_config');
        }
      }

      if (errors.length > 0) {
        return { success: false, error: errors.join(' | ') };
      }

      console.log('[Supabase] Todos os metadados foram salvos com sucesso no schema ctvacinas!');

      return {
        success: true,
        stats: {
          upserted: totalUpserted,
          deleted: 0,
          tablesTouched,
          projects: (fullData?.projects || []).length,
          tasks: (fullData?.tasks || []).length,
          evidence: (fullData?.regulatoryEvidence || []).length,
          docs: (fullData?.regulatoryDocs || []).length
        }
      };
    } catch (e: any) {
      console.error('Erro ao salvar no Supabase:', e);
      return { success: false, error: e.message };
    }
  },

  async saveTaskGroups(taskGroups: any[], user: string = 'Sistema'): Promise<boolean> {
    return this.saveTaskGroupsForProfile(user || 'bruna', taskGroups, user);
  },

  async saveTaskGroupsForProfile(profileKey: string, taskGroups: any[], user: string = 'Sistema'): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const timestamp = new Date().toISOString();
      const canonicalKey = normalizeProfileGroupKey(profileKey);
      const rows: Array<{ key: string; value: any; updated_at: string; updated_by: string }> = [
        {
          key: `task_groups_${canonicalKey}`,
          value: taskGroups,
          updated_at: timestamp,
          updated_by: user
        }
      ];
      if (canonicalKey === 'bruna') {
        rows.push(
          {
            key: 'task_groups',
            value: taskGroups,
            updated_at: timestamp,
            updated_by: user
          },
          {
            key: 'task_groups_bruna dias',
            value: taskGroups,
            updated_at: timestamp,
            updated_by: user
          }
        );
      }
      const { error } = await client
        .from('app_config')
        .upsert(rows, { onConflict: 'key' });
      if (error) {
        console.warn(`Erro ao salvar grupos do perfil ${canonicalKey} no Supabase:`, error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn(`Erro ao salvar grupos do perfil ${profileKey} no Supabase:`, e);
      return false;
    }
  },

  async getAppConfig(key: string): Promise<{ found: boolean; value: any }> {
    const client = this.getClient();
    if (!client) return { found: false, value: undefined };
    try {
      const { data, error } = await client
        .from('app_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error || !data) return { found: false, value: undefined };
      return { found: true, value: data.value };
    } catch {
      return { found: false, value: undefined };
    }
  },

  async saveAppConfig(key: string, value: any, user: string = 'Sistema'): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from('app_config')
        .upsert(
          {
            key,
            value,
            updated_at: new Date().toISOString(),
            updated_by: user
          },
          { onConflict: 'key' }
        );
      return !error;
    } catch {
      return false;
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
    } catch {
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
        .upsert(
          {
            id: `backup_${dateStr}`,
            backup_date: dateStr,
            backup_type: 'SharePoint Diário (Primeiro Acesso do Dia)',
            status: 'Sucesso',
            file_path_sharepoint: filePath || `Sistema/Backups_Diarios/backup_${dateStr}.json`,
            stats: stats || {},
            created_at: new Date().toISOString(),
            created_by: user
          },
          { onConflict: 'id' }
        );

      return true;
    } catch (e) {
      console.warn('Aviso ao registrar histórico de backup diário no Supabase:', e);
      return false;
    }
  }
};
