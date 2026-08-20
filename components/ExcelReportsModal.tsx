import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  FolderTree, 
  User, 
  Layers, 
  ShieldCheck, 
  FileText, 
  RefreshCw,
  FolderOpen,
  Archive,
  Info
} from 'lucide-react';
import { 
  Task, 
  Project, 
  TeamMember, 
  RegulatoryEvidence, 
  RegulatoryStandard, 
  RegulatoryDocument, 
  DossierContribution 
} from '../types';
import {
  generateMonthlyTasksWorkbook,
  generateProjectsWorkbook,
  generateRegulatoryWorkbook,
  downloadWorkbookAsFile
} from '../utils/excelReports';
import { MicrosoftGraphService } from '../services/microsoftGraphService';

interface ExcelReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  tasks: Task[];
  projects: Project[];
  regulatoryEvidence: RegulatoryEvidence[];
  regulatoryStandards: RegulatoryStandard[];
  regulatoryDocs: RegulatoryDocument[];
  dossierContributions: DossierContribution[];
  currentProfileName?: string;
}

export const ExcelReportsModal: React.FC<ExcelReportsModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  tasks,
  projects,
  regulatoryEvidence,
  regulatoryStandards,
  regulatoryDocs,
  dossierContributions,
  currentProfileName
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    const matched = teamMembers.find(m => m.name === currentProfileName);
    return matched ? matched.id : (teamMembers[0]?.id || '');
  });

  const [isSyncingSharePoint, setIsSyncingSharePoint] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    details?: string[];
  }>({ type: 'idle', message: '' });

  if (!isOpen) return null;

  const activeMembers = teamMembers.filter(m => (m as any).active !== false && !(m as any).discontinued);
  const oldMembers = teamMembers.filter(m => (m as any).active === false || (m as any).discontinued === true);

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId) || activeMembers[0] || teamMembers[0];

  const handleDownloadMonthlyTasks = (member: TeamMember) => {
    const wb = generateMonthlyTasksWorkbook(member, tasks, projects);
    const safeName = member.name.replace(/\s+/g, '_');
    const monthYear = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }).replace('/', '-');
    downloadWorkbookAsFile(wb, `Atividades_do_Mes_${safeName}_${monthYear}.xlsx`);
  };

  const handleDownloadProjects = (member: TeamMember) => {
    const wb = generateProjectsWorkbook(member, projects);
    const safeName = member.name.replace(/\s+/g, '_');
    downloadWorkbookAsFile(wb, `Projetos_e_Atividades_${safeName}.xlsx`);
  };

  const handleDownloadRegulatory = (member: TeamMember) => {
    const wb = generateRegulatoryWorkbook(member, projects, tasks, regulatoryEvidence, regulatoryStandards, regulatoryDocs, dossierContributions);
    const safeName = member.name.replace(/\s+/g, '_');
    downloadWorkbookAsFile(wb, `Documentos_Regulatorios_${safeName}.xlsx`);
  };

  const handleDownloadAllForProfile = (member: TeamMember) => {
    handleDownloadMonthlyTasks(member);
    setTimeout(() => handleDownloadProjects(member), 300);
    setTimeout(() => handleDownloadRegulatory(member), 600);
  };

  const handleSyncToSharePoint = async () => {
    setIsSyncingSharePoint(true);
    setSyncStatus({ type: 'idle', message: '' });

    try {
      const fullData = {
        teamMembers,
        tasks,
        projects,
        regulatoryEvidence,
        regulatoryStandards,
        regulatoryDocs,
        dossierContributions
      };

      const result = await MicrosoftGraphService.syncProfileSpreadsheetsToSharePoint(fullData);

      if (result.success) {
        setSyncStatus({
          type: 'success',
          message: `Sincronização concluída com sucesso! ${result.syncedCount} perfis processados com suas respectivas pastas e 3 planilhas (.xlsx) atualizadas no SharePoint em Documentos > Sistema.`
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: `A sincronização encontrou pendências (${result.errors.length} avisos).`,
          details: result.errors
        });
      }
    } catch (e: any) {
      setSyncStatus({
        type: 'error',
        message: `Falha ao sincronizar com o SharePoint: ${e.message}`
      });
    } finally {
      setIsSyncingSharePoint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#008779] px-6 sm:px-8 py-5 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                Central de Relatórios em Excel (.xlsx)
              </h3>
              <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider">
                Geração por Perfil & Sincronização SharePoint (Documentos &gt; Sistema)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Top Profile Selection & SharePoint Cloud Sync Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
            {/* Profile Selector */}
            <div className="lg:col-span-7 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-[#008779]" /> Selecionar Perfil para Visualizar / Baixar
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] shadow-xs"
              >
                <optgroup label="Perfis Ativos (Pastas Individuais em Documentos > Sistema)">
                  {activeMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isLeader ? '(Líder)' : ''} {m.isComiteGestor ? '(Comitê Gestor)' : ''} - {m.role}
                    </option>
                  ))}
                </optgroup>
                {oldMembers.length > 0 && (
                  <optgroup label="Perfis Antigos / Descontinuados (Pasta: Documentos > Sistema > perfis antigos)">
                    {oldMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Descontinuado / Antigo)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-[11px] font-bold text-slate-400">
                Pasta de destino no SharePoint: <span className="font-mono text-slate-700 font-bold">Documentos &gt; Sistema &gt; {(selectedMember as any)?.active === false || (selectedMember as any)?.discontinued ? 'perfis antigos > ' : ''}{selectedMember?.name}</span>
              </p>
            </div>

            {/* SharePoint Cloud Auto Sync Button */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-teal-50/70 p-4 rounded-2xl border border-teal-100">
              <div>
                <div className="flex items-center gap-2 text-teal-900 text-xs font-black uppercase tracking-tight">
                  <Cloud size={16} className="text-[#008779]" /> Sincronização SharePoint
                </div>
                <p className="text-[10px] font-semibold text-teal-800/80 mt-1">
                  Cria as pastas de cada perfil ativo e perfis antigos e sobe as 3 planilhas atualizadas.
                </p>
              </div>

              <button
                onClick={handleSyncToSharePoint}
                disabled={isSyncingSharePoint}
                className="mt-3 w-full py-2.5 px-4 bg-[#008779] hover:bg-[#007367] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
              >
                {isSyncingSharePoint ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Sincronizando Pastas e Planilhas...
                  </>
                ) : (
                  <>
                    <FolderTree size={15} /> Sincronizar Tudo no SharePoint
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync Status Banner if any */}
          {syncStatus.type !== 'idle' && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold ${
              syncStatus.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {syncStatus.type === 'success' ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-extrabold">{syncStatus.message}</p>
                {syncStatus.details && syncStatus.details.length > 0 && (
                  <ul className="list-disc pl-4 text-[11px] font-normal space-y-0.5">
                    {syncStatus.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* 3 Main Excel Spreadsheets Cards */}
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <FolderOpen size={18} className="text-[#008779]" /> Planilhas Geradas para: <span className="text-[#008779]">{selectedMember.name}</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400">
                    Você pode baixar cada arquivo individualmente ou o pacote completo abaixo:
                  </p>
                </div>

                <button
                  onClick={() => handleDownloadAllForProfile(selectedMember)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
                >
                  <Download size={15} /> Baixar Pacote Completo (3 Planilhas)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Atividades do Mês */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008779] flex items-center justify-center font-black">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-[#008779] uppercase">
                        Planilha 1
                      </span>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-2">
                        Atividades do Mês
                      </h5>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Contém todas as atividades setoriais do perfil, status, prazos, colaboradores, fluxo de revisão, progresso e notas, além das microatividades correspondentes.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadMonthlyTasks(selectedMember)}
                    className="w-full py-2.5 px-4 bg-teal-50 hover:bg-[#008779] text-[#008779] hover:text-white rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 group-hover:bg-[#008779] group-hover:text-white"
                  >
                    <Download size={15} /> Baixar Excel (.xlsx)
                  </button>
                </div>

                {/* 2. Atividades e Informações dos Projetos */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                      <Layers size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                        Planilha 2
                      </span>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-2">
                        Projetos e Atividades
                      </h5>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Estrutura completa com visão geral dos projetos vinculados, fases, macroatividades, resultados esperados, entregáveis e microatividades detalhadas.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadProjects(selectedMember)}
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    <Download size={15} /> Baixar Excel (.xlsx)
                  </button>
                </div>

                {/* 3. Documentos Regulatórios dos Projetos */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                        Planilha 3
                      </span>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-2">
                        Documentos Regulatórios
                      </h5>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Evidências e contribuições para o Dossiê DDCM, normas e padrões regulatórios vinculados e controle de documentos e submissões regulatórias.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadRegulatory(selectedMember)}
                    className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 group-hover:bg-amber-600 group-hover:text-white"
                  >
                    <Download size={15} /> Baixar Excel (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Organizational Architecture & Guide */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-black uppercase tracking-tight">
              <Info size={16} className="text-[#008779]" /> Como funciona a organização automática de pastas e planilhas:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                <strong className="text-slate-800 block mb-1">📁 Perfis Ativos:</strong>
                Salvos diretamente em: <code className="text-[#008779] font-bold">Documentos &gt; Sistema &gt; &#123;Nome do Perfil&#125;</code> com suas 3 planilhas atualizadas.
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                <strong className="text-slate-800 block mb-1">📦 Perfis Antigos / Descontinuados:</strong>
                Armazenados em: <code className="text-amber-700 font-bold">Documentos &gt; Sistema &gt; perfis antigos &gt; &#123;Nome do Perfil&#125;</code> mantendo o histórico intacto.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelReportsModal;
