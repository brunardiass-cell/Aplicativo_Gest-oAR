import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  RefreshCw, 
  Cloud, 
  ExternalLink, 
  Key, 
  Server, 
  ArrowRight,
  FolderGit2, 
  FileSpreadsheet, 
  X,
  ShieldCheck,
  Lock,
  Check
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { MicrosoftGraphService } from '../services/microsoftGraphService';
import { SUPABASE_SCHEMA_SQL } from '../services/supabaseSchemaScript';

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullData: any;
  currentUser?: string;
  onDataMigrated?: () => void;
  isAdmin?: boolean;
  lastSync?: any;
}

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({
  isOpen,
  onClose,
  fullData,
  currentUser = 'Sistema',
  onDataMigrated,
  isAdmin = false,
  lastSync
}) => {
  const [config, setConfig] = useState(SupabaseService.getConfig());
  const [anonKeyInput, setAnonKeyInput] = useState(config.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [lastDailyBackup, setLastDailyBackup] = useState<string | null>(null);
  const [isBackingUpSharePoint, setIsBackingUpSharePoint] = useState(false);
  const [backupSharePointResult, setBackupSharePointResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentConf = SupabaseService.getConfig();
      setConfig(currentConf);
      setAnonKeyInput(currentConf.anonKey);
      setLastDailyBackup(localStorage.getItem('ct_last_daily_backup_date') || null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getFriendlySyncTime = () => {
    const ts = lastSync?.timestamp;
    if (!ts) {
      const now = new Date();
      return `hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `hoje às ${time}`;
    }
    return `${date.toLocaleDateString('pt-BR')} às ${time}`;
  };

  const handleSaveKey = () => {
    SupabaseService.saveConfig(config.url, anonKeyInput);
    setConfig(SupabaseService.getConfig());
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await SupabaseService.testConnection(config.url, anonKeyInput);
      setTestResult(res);
      if (res.success) {
        SupabaseService.saveConfig(config.url, anonKeyInput);
        setConfig(SupabaseService.getConfig());
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunMigration = async () => {
    if (!anonKeyInput) {
      alert('Por favor, informe a Chave Anônima (Anon Key) do Supabase antes de iniciar a migração.');
      return;
    }

    if (!window.confirm('Deseja iniciar a gravação de todos os metadados atuais no Supabase (Schema ctvacinas)?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);
    try {
      SupabaseService.saveConfig(config.url, anonKeyInput);
      const res = await SupabaseService.saveAllData(fullData, currentUser);
      if (res.success) {
        setMigrationResult({
          success: true,
          message: 'Todos os metadados foram enviados e armazenados no Supabase com sucesso!',
          stats: res.stats
        });
        if (onDataMigrated) onDataMigrated();
      } else {
        setMigrationResult({
          success: false,
          message: res.error || 'Falha ao migrar metadados para o Supabase.'
        });
      }
    } catch (e: any) {
      setMigrationResult({ success: false, message: e.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      alert('Selecione e copie o texto do script SQL.');
    }
  };

  const handleDownloadSql = () => {
    try {
      const blob = new Blob([SUPABASE_SCHEMA_SQL], { type: 'text/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'supabase_schema_ctvacinas.sql');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Erro ao baixar o arquivo: ' + e.message);
    }
  };

  const handleTriggerSharePointBackup = async () => {
    setIsBackingUpSharePoint(true);
    setBackupSharePointResult(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await MicrosoftGraphService.saveDailyBackupToSharePoint(fullData);
      if (res.success) {
        await SupabaseService.recordDailyBackupSuccess(today, {
          projetos: (fullData.projects || []).length,
          tarefas: (fullData.tasks || []).length
        }, `Sistema/Backups_Diarios/backup_${today}.json`, currentUser);
        setLastDailyBackup(today);
        setBackupSharePointResult(`Backup diário para ${today} gerado com sucesso no SharePoint!`);
      } else {
        setBackupSharePointResult(`Falha no backup: ${res.error}`);
      }
    } catch (e: any) {
      setBackupSharePointResult(`Erro: ${e.message}`);
    } finally {
      setIsBackingUpSharePoint(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* ========================================================= */}
        {/* VIEW 1: USUÁRIOS COMUNS (SOMENTE STATUS E SEGURANÇA)     */}
        {/* ========================================================= */}
        {!isAdmin ? (
          <>
            {/* Top Header para Usuários Comuns */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Cloud size={12} /> Armazenamento em Nuvem • Protegido
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <Database className="text-emerald-400" size={26} />
                  Armazenamento e Sincronização
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                  Os dados do sistema estão protegidos e sincronizados em tempo real na nuvem corporativa.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
                title="Fechar"
              >
                <X size={22} />
              </button>
            </div>

            {/* Conteúdo Amigável para Usuários Comuns */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto text-left">
              
              {/* Card Principal com Status Simplificado */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Armazenamento e sincronização
                  </span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Conexão Operacional
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs space-y-2.5">
                  <div className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🟢</span>
                    <span>Última sincronização: <strong className="text-emerald-900">{getFriendlySyncTime()}</strong></span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                    <span>☁️</span>
                    <span>Dados protegidos e sincronizados com o Supabase.</span>
                  </div>
                </div>
              </div>

              {/* Informações de Confiabilidade e Governança */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <ShieldCheck size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Salvamento Automático
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Todas as atualizações de atividades, tarefas e registros são gravadas continuamente em nuvem.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <FolderGit2 size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Documentos Oficiais
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Os arquivos, atas e relatórios são salvos e vinculados na biblioteca oficial do SharePoint.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                    <Lock size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Proteção & Permissões
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Acesso restrito por função e identidade corporativa Microsoft 365 cadastrada no CTVacinas.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer para Usuários Comuns */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                🔒 CTVacinas • Ambiente Seguro de Gestão Regulatória
              </span>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                Fechar
              </button>
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* VIEW 2: PAINEL COMPLETO EXCLUSIVO PARA ADMINISTRADORES    */
          /* ========================================================= */
          <>
            {/* Top Header para Administrador */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Painel do Administrador • Infraestrutura Supabase
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <Database className="text-emerald-400" size={26} />
                  Manutenção & Metadados do Supabase
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                  Gerenciamento técnico do armazenamento primário no Supabase (Schema <code className="bg-slate-800/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono">ctvacinas</code>). 
                  A criação de pastas e arquivos continua 100% no SharePoint; no Supabase são mantidos os metadados e os links dos arquivos.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
                title="Fechar"
              >
                <X size={22} />
              </button>
            </div>

            {/* Conteúdo Completo para Administrador */}
            <div className="p-6 sm:p-8 space-y-8 max-h-[72vh] overflow-y-auto text-left">

              {/* Status Rápido de Sincronização */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <span>🟢</span>
                  <span>Última sincronização ativa: <strong>{getFriendlySyncTime()}</strong></span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  Schema: ctvacinas
                </span>
              </div>

              {/* Card 1: Isolamento do Schema */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1 text-xs">
                  <h3 className="font-black text-emerald-900 uppercase tracking-wider">Isolamento Completo Garantido</h3>
                  <p className="text-emerald-800 leading-relaxed">
                    Para não misturar com o outro site existente no seu Supabase, todas as 23 tabelas do CT-Vacinas ficam no schema isolado 
                    <strong className="font-black mx-1">"ctvacinas"</strong>. As tabelas do schema <code>public</code> do seu outro projeto não sofrem nenhuma alteração.
                  </p>
                </div>
              </div>

              {/* Card 2: Passo a Passo do que fazer no Supabase */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Passo 1: Criar o Schema e Tabelas no Supabase
                </h3>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Acesse o painel do Supabase do seu projeto (<a href="https://supabase.com/dashboard/project/ytjhipjsigaalboztcdz" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-1">Dashboard Supabase <ExternalLink size={12} /></a>), abra a aba <strong>SQL Editor</strong>, cole o script e clique em <strong>Run</strong>.
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleCopySql}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
                    >
                      <Copy size={14} />
                      {copiedSql ? 'Copiado para a Área de Transferência!' : 'Copiar Script SQL Completo (23 Tabelas)'}
                    </button>

                    <button
                      onClick={handleDownloadSql}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      <Download size={14} />
                      Baixar supabase_schema.sql
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Configuração Importante na API do Supabase:</strong> No menu lateral do Supabase, vá em <em>Project Settings &gt; API &gt; Data API &gt; Exposed schemas</em> e adicione <strong>ctvacinas</strong> à lista de schemas expostos (ex: <code>public, ctvacinas</code>) para liberar o acesso pelo cliente web.
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Credenciais de Conexão */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Passo 2: Configurar Chave de API (Anon Key)
                </h3>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        URL do Projeto Supabase
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={config.url}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Schema Dedicado
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={config.schema}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1 flex items-center justify-between">
                      <span>Supabase Anon Public API Key *</span>
                      <a 
                        href="https://supabase.com/dashboard/project/ytjhipjsigaalboztcdz/settings/api" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 text-[10px]"
                      >
                        Obter no Dashboard &gt; Settings &gt; API <ExternalLink size={10} />
                      </a>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input 
                          type="password" 
                          placeholder="Cole aqui a sua anon/public key (começa com eyJhbGciOi...)"
                          value={anonKeyInput}
                          onChange={e => setAnonKeyInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleSaveKey}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button 
                        onClick={handleTestConnection}
                        disabled={isTesting || !anonKeyInput}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Server size={14} />}
                        Testar Conexão
                      </button>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>{testResult.message}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Botão de Migração dos Dados Atuais */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Passo 3: Migrar Metadados Existentes para o Supabase
                </h3>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Este processo enviará todos os projetos, tarefas, normas, evidências regulatórias, candidatos vacinais, 
                    reuniões e membros cadastrados para as tabelas correspondentes no schema <code>ctvacinas</code> do Supabase.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleRunMigration}
                      disabled={isMigrating || !anonKeyInput}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
                    >
                      {isMigrating ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Gravando no Supabase...
                        </>
                      ) : (
                        <>
                          <Database size={16} />
                          Gravar Todos os Dados Atuais no Supabase
                        </>
                      )}
                    </button>
                  </div>

                  {migrationResult && (
                    <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                      migrationResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      {migrationResult.success ? (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <p className="font-bold">{migrationResult.message}</p>
                        {migrationResult.stats && (
                          <p className="text-[11px] opacity-90">
                            Projetos: {migrationResult.stats.projects} | Tarefas: {migrationResult.stats.tasks} | Evidências: {migrationResult.stats.evidence} | Dossiês: {migrationResult.stats.docs}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 5: Política de Backup Diário no SharePoint */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">4</span>
                  Sincronização Diária no SharePoint (Backup Automático)
                </h3>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800">Status do Backup Diário no SharePoint</div>
                      <div className="text-[11px] text-slate-500">
                        O sistema executa automaticamente o backup consolidado no primeiro acesso do dia.
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl">
                      Último Backup: {lastDailyBackup || 'Pendente hoje'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTriggerSharePointBackup}
                      disabled={isBackingUpSharePoint}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      {isBackingUpSharePoint ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Gerando Backup no SharePoint...
                        </>
                      ) : (
                        <>
                          <Cloud size={14} />
                          Disparar Backup Manual no SharePoint Agora
                        </>
                      )}
                    </button>
                  </div>

                  {backupSharePointResult && (
                    <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs">
                      {backupSharePointResult}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer para Administrador */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
