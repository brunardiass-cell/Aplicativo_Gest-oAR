import React, { useState, useMemo } from 'react';
import { 
  Project, 
  Task, 
  RegulatoryEvidence, 
  MacroActivityConfig, 
  RegulatoryInfoItem, 
  RepeatableRecord, 
  RegulatoryNarrative, 
  RegulatoryDocument, 
  RegulatoryDocumentChapter, 
  RegulatoryDocumentItem,
  RegulatoryDocItemType,
  RegulatoryDocItemStatus
} from '../types';
import { 
  FileText, 
  BookOpen, 
  Database, 
  ShieldCheck, 
  FileCheck2, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Paperclip, 
  History, 
  Settings, 
  Tag, 
  Check, 
  X, 
  FileSpreadsheet, 
  ListOrdered,
  Eye,
  FileCode,
  ListPlus
} from 'lucide-react';

interface RegulatoryDocManagementProps {
  projects: Project[];
  tasks: Task[];
  regulatoryEvidence: RegulatoryEvidence[];
  macroActivityConfigs: MacroActivityConfig[];
  regulatoryInfoItems: RegulatoryInfoItem[];
  repeatableRecords: RepeatableRecord[];
  regulatoryNarratives: RegulatoryNarrative[];
  regulatoryDocs: RegulatoryDocument[];
  
  onUpdateEvidence: (items: RegulatoryEvidence[]) => void;
  onUpdateMacroConfigs: (configs: MacroActivityConfig[]) => void;
  onUpdateInfoItems: (items: RegulatoryInfoItem[]) => void;
  onUpdateRepeatableRecords: (records: RepeatableRecord[]) => void;
  onUpdateNarratives: (narratives: RegulatoryNarrative[]) => void;
  onUpdateDocs: (docs: RegulatoryDocument[]) => void;
  currentUser?: string;
  hasAdminAccess?: boolean;
}

export const RegulatoryDocManagement: React.FC<RegulatoryDocManagementProps> = ({
  projects,
  tasks,
  regulatoryEvidence = [],
  macroActivityConfigs = [],
  regulatoryInfoItems = [],
  repeatableRecords = [],
  regulatoryNarratives = [],
  regulatoryDocs = [],
  onUpdateEvidence,
  onUpdateMacroConfigs,
  onUpdateInfoItems,
  onUpdateRepeatableRecords,
  onUpdateNarratives,
  onUpdateDocs,
  currentUser = 'Usuário',
  hasAdminAccess = true
}) => {
  // Main Tab Selection
  const [activeTab, setActiveTab] = useState<
    'completeness' | 'info_items' | 'narratives' | 'evidence' | 'repeatable' | 'macro_configs' | 'docs'
  >('completeness');

  // Selected Project Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : 'all'
  );

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  // Modal States
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingInfoItem, setEditingInfoItem] = useState<Partial<RegulatoryInfoItem> | null>(null);

  const [showNarrativeModal, setShowNarrativeModal] = useState(false);
  const [editingNarrative, setEditingNarrative] = useState<Partial<RegulatoryNarrative> | null>(null);

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Partial<RegulatoryEvidence> | null>(null);

  const [showRepeatableModal, setShowRepeatableModal] = useState(false);
  const [editingRepeatable, setEditingRepeatable] = useState<Partial<RepeatableRecord> | null>(null);

  const [showMacroConfigModal, setShowMacroConfigModal] = useState(false);
  const [editingMacroConfig, setEditingMacroConfig] = useState<Partial<MacroActivityConfig> | null>(null);

  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<RegulatoryDocument> | null>(null);

  // Default Document Presets if empty
  const defaultDocs = useMemo<RegulatoryDocument[]>(() => {
    if (regulatoryDocs.length > 0) return regulatoryDocs;
    const projId = activeProject?.id || 'p1';
    return [
      {
        id: `doc_ddcm_${projId}`,
        projectId: projId,
        title: 'DDCM - Dossiê de Desenvolvimento Clínico de Medicamento',
        type: 'DDCM',
        description: 'Dossiê regulatório para submissão e acompanhamento clínico do produto.',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_1',
            code: '1.0',
            title: 'Informações Gerais e Descrição do Produto',
            items: [
              {
                id: 'item_1_1',
                name: 'Nome da Vacina',
                type: 'Informação Regulatória',
                required: true,
                sourceInternalId: 'PRODUCT.NAME',
                status: 'Concluído',
                marker: '[NOME_DA_VACINA]'
              },
              {
                id: 'item_1_2',
                name: 'Indicação Terapêutica / Proposta',
                type: 'Informação Regulatória',
                required: true,
                sourceInternalId: 'PRODUCT.INDICATION',
                status: 'Concluído',
                marker: '[INDICACAO]'
              },
              {
                id: 'item_1_3',
                name: 'Via de Administração e Forma Farmacêutica',
                type: 'Informação Regulatória',
                required: true,
                sourceInternalId: 'PRODUCT.ADMINISTRATION_ROUTE',
                status: 'Em Andamento',
                marker: '[FORMA_FARMACEUTICA]'
              }
            ]
          },
          {
            id: 'cap_2',
            code: '2.0',
            title: 'Ingrediente Farmacêutico Ativo (IFA)',
            items: [
              {
                id: 'item_2_1',
                name: 'Descrição e Caracterização do IFA',
                type: 'Narrativa',
                required: true,
                sourceInternalId: 'IFA.DESCRIPTION',
                status: 'Em Andamento',
                marker: '[DESCRICAO_IFA]'
              },
              {
                id: 'item_2_2',
                name: 'Esquema do Processo Produtivo do IFA',
                type: 'Evidência',
                required: true,
                sourceInternalId: 'EVID_IFA_PROCESS',
                status: 'Pendente',
                marker: '[PROCESSO_IFA_EVIDENCIA]'
              }
            ]
          },
          {
            id: 'cap_3',
            code: '3.0',
            title: 'Estabilidade e Controle de Qualidade',
            items: [
              {
                id: 'item_3_1',
                name: 'Tabela Resumo de Estabilidade',
                type: 'Tabela',
                required: true,
                sourceInternalId: 'STABILITY.TABLE',
                status: 'Pendente',
                marker: '[TABELA_ESTABILIDADE]'
              },
              {
                id: 'item_3_2',
                name: 'Resultados do Controle de Qualidade',
                type: 'Informação Regulatória',
                required: true,
                sourceInternalId: 'QC.RESULTS',
                status: 'Pendente',
                marker: '[RESULTADOS_CQ]'
              }
            ]
          }
        ]
      }
    ];
  }, [regulatoryDocs, activeProject]);

  const currentProjectDocs = useMemo(() => {
    const list = regulatoryDocs.length > 0 ? regulatoryDocs : defaultDocs;
    if (selectedProjectId === 'all') return list;
    return list.filter(d => d.projectId === selectedProjectId);
  }, [regulatoryDocs, defaultDocs, selectedProjectId]);

  // Filtered collections for selected project
  const projectInfoItems = useMemo(() => {
    return regulatoryInfoItems.filter(i => selectedProjectId === 'all' || i.projectId === selectedProjectId);
  }, [regulatoryInfoItems, selectedProjectId]);

  const projectNarratives = useMemo(() => {
    return regulatoryNarratives.filter(n => selectedProjectId === 'all' || n.projectId === selectedProjectId);
  }, [regulatoryNarratives, selectedProjectId]);

  const projectEvidences = useMemo(() => {
    return regulatoryEvidence.filter(e => selectedProjectId === 'all' || e.projectId === selectedProjectId);
  }, [regulatoryEvidence, selectedProjectId]);

  const projectRepeatables = useMemo(() => {
    return repeatableRecords.filter(r => selectedProjectId === 'all' || r.projectId === selectedProjectId);
  }, [repeatableRecords, selectedProjectId]);

  // Completeness Metrics Calculation
  const completenessMetrics = useMemo(() => {
    let totalRequired = 0;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;

    let pendingEvidence = 0;
    let pendingNarrative = 0;
    let pendingInfo = 0;
    let pendingTable = 0;

    currentProjectDocs.forEach(doc => {
      doc.chapters.forEach(chap => {
        chap.items.forEach(item => {
          if (item.required) {
            totalRequired++;
            if (item.status === 'Concluído') {
              completed++;
            } else {
              pending++;
              if (item.status === 'Em Andamento') inProgress++;

              if (item.type === 'Evidência') pendingEvidence++;
              else if (item.type === 'Narrativa') pendingNarrative++;
              else if (item.type === 'Informação Regulatória') pendingInfo++;
              else if (item.type === 'Tabela' || item.type === 'Figura') pendingTable++;
            }
          }
        });
      });
    });

    const percent = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;

    return {
      totalRequired,
      completed,
      pending,
      inProgress,
      percent,
      pendingEvidence,
      pendingNarrative,
      pendingInfo,
      pendingTable
    };
  }, [currentProjectDocs]);

  // Export Dossier Bank Function
  const handleExportDossierBank = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser,
        projectId: selectedProjectId,
        projectName: activeProject?.name || 'Todos os Projetos',
        systemVersion: '1.0.0-REG'
      },
      completenessMetrics,
      documents: currentProjectDocs,
      regulatoryInfoItems: projectInfoItems,
      narratives: projectNarratives,
      evidenceLibrary: projectEvidences,
      repeatableRecords: projectRepeatables,
      macroActivityConfigs: macroActivityConfigs
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Banco_Dossie_${activeProject?.name.replace(/[^a-zA-Z0-0]/g, '_') || 'Projetos'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handlers for Info Items
  const handleSaveInfoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInfoItem?.name || !editingInfoItem?.internalId) return;

    const newItem: RegulatoryInfoItem = {
      id: editingInfoItem.id || `info_${Date.now()}`,
      internalId: editingInfoItem.internalId.toUpperCase().replace(/\s+/g, '_'),
      name: editingInfoItem.name,
      category: editingInfoItem.category || 'Geral',
      type: editingInfoItem.type || 'Texto',
      value: editingInfoItem.value || '',
      origin: editingInfoItem.origin || 'Manual',
      version: editingInfoItem.version || 1,
      supportingEvidenceId: editingInfoItem.supportingEvidenceId,
      supportingEvidenceTitle: editingInfoItem.supportingEvidenceTitle,
      updatedAt: new Date().toISOString(),
      projectId: editingInfoItem.projectId || activeProject?.id || 'p1'
    };

    const exists = regulatoryInfoItems.some(i => i.id === newItem.id);
    const updated = exists 
      ? regulatoryInfoItems.map(i => i.id === newItem.id ? newItem : i)
      : [...regulatoryInfoItems, newItem];

    onUpdateInfoItems(updated);
    setShowInfoModal(false);
    setEditingInfoItem(null);
  };

  const handleDeleteInfoItem = (id: string) => {
    onUpdateInfoItems(regulatoryInfoItems.filter(i => i.id !== id));
  };

  // Handlers for Narratives
  const handleSaveNarrative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNarrative?.title || !editingNarrative?.text) return;

    const prevHistory = editingNarrative.revisionHistory || [];
    const currentVer = editingNarrative.version || 1;

    const newRevision = {
      version: currentVer,
      date: new Date().toISOString(),
      author: currentUser,
      text: editingNarrative.text
    };

    const newNarrative: RegulatoryNarrative = {
      id: editingNarrative.id || `narrative_${Date.now()}`,
      projectId: editingNarrative.projectId || activeProject?.id || 'p1',
      title: editingNarrative.title,
      category: editingNarrative.category || 'Geral',
      text: editingNarrative.text,
      version: editingNarrative.id ? currentVer + 1 : 1,
      revisionHistory: editingNarrative.id ? [...prevHistory, newRevision] : [newRevision],
      approvalStatus: editingNarrative.approvalStatus || 'Rascunho',
      updatedAt: new Date().toISOString()
    };

    const exists = regulatoryNarratives.some(n => n.id === newNarrative.id);
    const updated = exists 
      ? regulatoryNarratives.map(n => n.id === newNarrative.id ? newNarrative : n)
      : [...regulatoryNarratives, newNarrative];

    onUpdateNarratives(updated);
    setShowNarrativeModal(false);
    setEditingNarrative(null);
  };

  const handleDeleteNarrative = (id: string) => {
    onUpdateNarratives(regulatoryNarratives.filter(n => n.id !== id));
  };

  // Handlers for Repeatable Records
  const handleSaveRepeatable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepeatable?.title || !editingRepeatable?.category) return;

    const newRec: RepeatableRecord = {
      id: editingRepeatable.id || `rec_${Date.now()}`,
      projectId: editingRepeatable.projectId || activeProject?.id || 'p1',
      category: editingRepeatable.category || 'Lotes',
      title: editingRepeatable.title,
      data: editingRepeatable.data || {},
      updatedAt: new Date().toISOString()
    };

    const exists = repeatableRecords.some(r => r.id === newRec.id);
    const updated = exists 
      ? repeatableRecords.map(r => r.id === newRec.id ? newRec : r)
      : [...repeatableRecords, newRec];

    onUpdateRepeatableRecords(updated);
    setShowRepeatableModal(false);
    setEditingRepeatable(null);
  };

  const handleDeleteRepeatable = (id: string) => {
    onUpdateRepeatableRecords(repeatableRecords.filter(r => r.id !== id));
  };

  // Handlers for Item Status in Document Requirements Matrix
  const handleToggleItemStatus = (docId: string, chapterId: string, itemId: string, newStatus: RegulatoryDocItemStatus) => {
    const list = regulatoryDocs.length > 0 ? regulatoryDocs : defaultDocs;
    const updated = list.map(doc => {
      if (doc.id !== docId) return doc;
      return {
        ...doc,
        updatedAt: new Date().toISOString(),
        chapters: doc.chapters.map(chap => {
          if (chap.id !== chapterId) return chap;
          return {
            ...chap,
            items: chap.items.map(item => {
              if (item.id !== itemId) return item;
              return { ...item, status: newStatus };
            })
          };
        })
      };
    });
    onUpdateDocs(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Gestão de Documentos Regulatórios
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Organização, rastreabilidade e matriz de completude das informações técnicas para dossiês regulatórios.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Select Project Filter */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-600 text-xs font-semibold">
              <span className="text-slate-400">Projeto:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-800 text-white">Todos os Projetos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Export Dossier Bank Button */}
            <button
              onClick={handleExportDossierBank}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg active:scale-95 cursor-pointer"
              title="Exportar arquivo JSON completo com todo o Banco do Dossiê"
            >
              <Download size={15} />
              <span>Exportar Banco do Dossiê</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-700/60 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('completeness')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'completeness'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Matriz de Completude</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>Documentos Regulatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('info_items')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'info_items'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Tag size={16} />
            <span>Informações Regulatórias ({projectInfoItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('narratives')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'narratives'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode size={16} />
            <span>Narrativas Técnicas ({projectNarratives.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Paperclip size={16} />
            <span>Biblioteca de Evidências ({projectEvidences.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('repeatable')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'repeatable'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ListOrdered size={16} />
            <span>Registros Repetíveis ({projectRepeatables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('macro_configs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'macro_configs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Settings size={16} />
            <span>Modelos Macroatividades</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: MATRIZ DE COMPLETUDE --- */}
      {activeTab === 'completeness' && (
        <div className="space-y-6">
          {/* Progress Overview Bar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" size={20} />
                  Status de Completude do Dossiê Regulatório
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Cálculo automático do percentual de conclusão baseado nos itens obrigatórios definidos nos documentos.
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-indigo-600">{completenessMetrics.percent}%</span>
                <p className="text-xs font-bold text-slate-500">
                  {completenessMetrics.completed} de {completenessMetrics.totalRequired} itens obrigatórios concluídos
                </p>
              </div>
            </div>

            {/* Progress Bar Visual */}
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${completenessMetrics.percent}%` }}
                title={`${completenessMetrics.completed} concluídos`}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${completenessMetrics.totalRequired > 0 ? (completenessMetrics.inProgress / completenessMetrics.totalRequired) * 100 : 0}%` }}
                title={`${completenessMetrics.inProgress} em andamento`}
              />
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Concluídos</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{completenessMetrics.completed}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">Em Andamento</span>
                <p className="text-2xl font-black text-amber-700 mt-1">{completenessMetrics.inProgress}</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                <span className="text-xs font-bold uppercase text-rose-800 tracking-wider">Pendentes Total</span>
                <p className="text-2xl font-black text-rose-700 mt-1">{completenessMetrics.pending}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">Total Requisitos</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{completenessMetrics.totalRequired}</p>
              </div>
            </div>
          </div>

          {/* Pending Dependencies Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Detalhamento de Pendências por Tipo de Recurso
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Evidências Pendentes</span>
                  <Paperclip size={16} className="text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{completenessMetrics.pendingEvidence}</p>
                <p className="text-[11px] text-slate-500 mt-1">Aguardando geração/upload de arquivo de suporte nas atividades.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Narrativas Pendentes</span>
                  <FileCode size={16} className="text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{completenessMetrics.pendingNarrative}</p>
                <p className="text-[11px] text-slate-500 mt-1">Aguardando elaboração ou revisão dos textos técnicos.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Informações Regulatórias</span>
                  <Tag size={16} className="text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{completenessMetrics.pendingInfo}</p>
                <p className="text-[11px] text-slate-500 mt-1">Dependem de parâmetros cadastrados na Biblioteca Regulatória.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Tabelas / Figuras</span>
                  <FileSpreadsheet size={16} className="text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{completenessMetrics.pendingTable}</p>
                <p className="text-[11px] text-slate-500 mt-1">Dependem de compilação de dados experimentais ou estabilidade.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: INFORMAÇÕES REGULATÓRIAS --- */}
      {activeTab === 'info_items' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Biblioteca de Informações Regulatórias</h3>
              <p className="text-xs text-slate-500">Parâmetros e dados oficiais reutilizáveis do projeto (existem apenas uma vez por projeto).</p>
            </div>

            <button
              onClick={() => {
                setEditingInfoItem({
                  category: 'Produto',
                  type: 'Texto',
                  projectId: activeProject?.id || 'p1'
                });
                setShowInfoModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus size={16} />
              <span>Nova Informação Regulatória</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                  <th className="p-3">ID Interno</th>
                  <th className="p-3">Nome da Informação</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Valor / Conteúdo</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projectInfoItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Nenhuma informação regulatória cadastrada ainda.
                    </td>
                  </tr>
                ) : (
                  projectInfoItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-indigo-700 bg-indigo-50/50 rounded-md">
                        {item.internalId}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{item.name}</td>
                      <td className="p-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{item.type}</td>
                      <td className="p-3 font-medium text-slate-700 max-w-xs truncate">{item.value || '---'}</td>
                      <td className="p-3 text-slate-500">{item.origin || 'Sistema'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingInfoItem(item);
                              setShowInfoModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteInfoItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: NARRATIVAS TÉCNICAS --- */}
      {activeTab === 'narratives' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Biblioteca de Narrativas Técnicas</h3>
              <p className="text-xs text-slate-500">Textos descritivos, históricos e conclusões técnicas para composição do dossiê.</p>
            </div>

            <button
              onClick={() => {
                setEditingNarrative({
                  category: 'Geral',
                  approvalStatus: 'Rascunho',
                  projectId: activeProject?.id || 'p1'
                });
                setShowNarrativeModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus size={16} />
              <span>Nova Narrativa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectNarratives.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhuma narrativa cadastrada. Clique em "Nova Narrativa" para registrar a primeira introdução ou histórico técnico.
              </div>
            ) : (
              projectNarratives.map(nar => (
                <div key={nar.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {nar.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{nar.title}</h4>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      nar.approvalStatus === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' :
                      nar.approvalStatus === 'Em Revisão' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      v{nar.version} - {nar.approvalStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg font-mono">
                    {nar.text}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    <span>{nar.revisionHistory?.length || 1} revisões registradas</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingNarrative(nar);
                          setShowNarrativeModal(true);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteNarrative(nar.id)}
                        className="p-1 hover:bg-rose-50 rounded text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: BIBLIOTECA DE EVIDÊNCIAS --- */}
      {activeTab === 'evidence' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Biblioteca de Evidências Regulatórias</h3>
              <p className="text-xs text-slate-500">Evidências e arquivos de suporte capturados durante a execução das atividades do projeto.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                  <th className="p-3">Título da Evidência</th>
                  <th className="p-3">Atividade de Origem</th>
                  <th className="p-3">Uso Regulatório?</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Arquivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projectEvidences.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                      Nenhuma evidência registrada ainda. Ao concluir uma atividade com a opção "Gerar Evidência", ela aparecerá aqui.
                    </td>
                  </tr>
                ) : (
                  projectEvidences.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{ev.title}</td>
                      <td className="p-3 text-slate-600">{ev.originActivityName || 'Atividade'}</td>
                      <td className="p-3">
                        {ev.useInRegulatoryDoc ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Sim (Enviado)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                            Não
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{ev.responsible}</td>
                      <td className="p-3 text-slate-500">{new Date(ev.date).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3">
                        {ev.fileUrl ? (
                          <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
                            <Paperclip size={13} /> {ev.fileName || 'Anexo'}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Sem arquivo</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: REGISTROS REPETÍVEIS --- */}
      {activeTab === 'repeatable' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registros Repetíveis</h3>
              <p className="text-xs text-slate-500">
                Registros ilimitados de lotes, doses, apresentações, ensaios e estabilidades sem campos fixos engessados.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRepeatable({
                  category: 'Lotes',
                  data: {},
                  projectId: activeProject?.id || 'p1'
                });
                setShowRepeatableModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus size={16} />
              <span>Novo Registro Repetível</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectRepeatables.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhum registro repetível cadastrado ainda (Lotes, Doses, Estabilidades, etc.).
              </div>
            ) : (
              projectRepeatables.map(rec => (
                <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {rec.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {Object.entries(rec.data || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="font-semibold text-slate-500">{k}:</span>
                        <span className="font-bold text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => handleDeleteRepeatable(rec.id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 6: MODELOS DE MACROATIVIDADES --- */}
      {activeTab === 'macro_configs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Configuração de Modelos por Macroatividade</h3>
              <p className="text-xs text-slate-500">
                Defina os campos obrigatórios e formulários dinâmicos configuráveis pelo administrador para cada macroatividade.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Produção de Lote</h4>
              <p className="text-xs text-slate-500">Campos obrigatórios: Número do lote, Data, Escala, Quantidade produzida, Rendimento.</p>
            </div>

            <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Controle de Qualidade</h4>
              <p className="text-xs text-slate-500">Campos obrigatórios: Lote, Método analítico, Especificação, Resultado obtido.</p>
            </div>

            <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Estabilidade</h4>
              <p className="text-xs text-slate-500">Campos obrigatórios: Lote, Temperatura, Tempo, Condição, Resultado.</p>
            </div>

            <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Ensaios Clínicos</h4>
              <p className="text-xs text-slate-500">Campos obrigatórios: Dose, Grupo, Número de participantes, Protocolo aprovado.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: ESTRUTURA E MATRIZ DE REQUISITOS DE DOCUMENTOS --- */}
      {activeTab === 'docs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Documentos Regulatórios & Matriz de Requisitos</h3>
            <p className="text-xs text-slate-500">
              Gerenciamento dos dossiês (DDCM, Dossiê da Vacina, Dossiê do IFA, Dossiê do Adjuvante, Brochura do Investigador, DEEC) com marcadores e origem dos dados.
            </p>
          </div>

          {currentProjectDocs.map(doc => (
            <div key={doc.id} className="border border-slate-200 rounded-xl overflow-hidden space-y-3 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-400" />
                  <h4 className="font-bold text-sm">{doc.title}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white">
                  {doc.type}
                </span>
              </div>

              {/* Chapters Tree & Requirements Matrix */}
              <div className="space-y-4 pt-2">
                {doc.chapters.map(chap => (
                  <div key={chap.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                    <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono text-xs">
                        {chap.code}
                      </span>
                      {chap.title}
                    </h5>

                    {/* Table of Items */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[9px] border-b border-slate-200">
                            <th className="p-2.5">Item do Capítulo</th>
                            <th className="p-2.5">Tipo</th>
                            <th className="p-2.5">Marcador Lógico</th>
                            <th className="p-2.5">Origem (ID Interno)</th>
                            <th className="p-2.5">Obrigatório?</th>
                            <th className="p-2.5">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {chap.items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-800">{item.name}</td>
                              <td className="p-2.5 text-slate-600">{item.type}</td>
                              <td className="p-2.5 font-mono text-indigo-600 text-[11px]">{item.marker || '---'}</td>
                              <td className="p-2.5 font-mono text-slate-500 text-[11px]">{item.sourceInternalId}</td>
                              <td className="p-2.5 font-bold">
                                {item.required ? (
                                  <span className="text-rose-600">Sim</span>
                                ) : (
                                  <span className="text-slate-400">Opcional</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleToggleItemStatus(doc.id, chap.id, item.id, e.target.value as RegulatoryDocItemStatus)}
                                  className={`px-2 py-1 rounded text-xs font-bold cursor-pointer focus:outline-none ${
                                    item.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                                    item.status === 'Em Andamento' ? 'bg-amber-100 text-amber-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  <option value="Pendente">Pendente</option>
                                  <option value="Em Andamento">Em Andamento</option>
                                  <option value="Concluído">Concluído</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL: INFORMAÇÃO REGULATÓRIA --- */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingInfoItem?.id ? 'Editar Informação Regulatória' : 'Nova Informação Regulatória'}
              </h3>
              <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInfoItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Identificador Interno (ex: PRODUCT.NAME)</label>
                <input
                  type="text"
                  required
                  placeholder="EX: PRODUCT.NAME"
                  value={editingInfoItem?.internalId || ''}
                  onChange={(e) => setEditingInfoItem({ ...editingInfoItem, internalId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Descritivo</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Nome Comercial da Vacina"
                  value={editingInfoItem?.name || ''}
                  onChange={(e) => setEditingInfoItem({ ...editingInfoItem, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={editingInfoItem?.category || 'Produto'}
                    onChange={(e) => setEditingInfoItem({ ...editingInfoItem, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Produto">Produto</option>
                    <option value="IFA">IFA</option>
                    <option value="Adjuvante">Adjuvante</option>
                    <option value="Processo">Processo</option>
                    <option value="Estabilidade">Estabilidade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={editingInfoItem?.type || 'Texto'}
                    onChange={(e) => setEditingInfoItem({ ...editingInfoItem, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Texto">Texto</option>
                    <option value="Parâmetro">Parâmetro</option>
                    <option value="Tabela">Tabela</option>
                    <option value="Especificação">Especificação</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor / Conteúdo Oficial</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Insira o valor oficial desta informação..."
                  value={editingInfoItem?.value || ''}
                  onChange={(e) => setEditingInfoItem({ ...editingInfoItem, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer shadow-sm"
                >
                  Salvar Informação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NARRATIVA TÉCNICA --- */}
      {showNarrativeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingNarrative?.id ? 'Editar Narrativa Técnica' : 'Nova Narrativa Técnica'}
              </h3>
              <button onClick={() => setShowNarrativeModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNarrative} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Narrativa</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Histórico de Desenvolvimento do IFA Sm29"
                  value={editingNarrative?.title || ''}
                  onChange={(e) => setEditingNarrative({ ...editingNarrative, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={editingNarrative?.category || 'Geral'}
                    onChange={(e) => setEditingNarrative({ ...editingNarrative, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Introdução">Introdução</option>
                    <option value="Histórico">Histórico de Desenvolvimento</option>
                    <option value="Desenvolvimento IFA">Desenvolvimento do IFA</option>
                    <option value="Desenvolvimento Adjuvante">Desenvolvimento do Adjuvante</option>
                    <option value="Análise de Risco">Análise de Risco</option>
                    <option value="Conclusão">Conclusão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status de Aprovação</label>
                  <select
                    value={editingNarrative?.approvalStatus || 'Rascunho'}
                    onChange={(e) => setEditingNarrative({ ...editingNarrative, approvalStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Aprovado">Aprovado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Texto da Narrativa Técnica</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Escreva o texto descritivo técnico..."
                  value={editingNarrative?.text || ''}
                  onChange={(e) => setEditingNarrative({ ...editingNarrative, text: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNarrativeModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer shadow-sm"
                >
                  Salvar Narrativa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTRO REPETÍVEL --- */}
      {showRepeatableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Novo Registro Repetível
              </h3>
              <button onClick={() => setShowRepeatableModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRepeatable} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={editingRepeatable?.category || 'Lotes'}
                  onChange={(e) => setEditingRepeatable({ ...editingRepeatable, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                >
                  <option value="Lotes">Lotes</option>
                  <option value="Doses">Doses</option>
                  <option value="Apresentações">Apresentações</option>
                  <option value="Estabilidades">Estabilidades</option>
                  <option value="ControleQualidade">Controle de Qualidade</option>
                  <option value="Comparabilidade">Comparabilidade</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Identificação / Título</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Lote Pilot-2026-01"
                  value={editingRepeatable?.title || ''}
                  onChange={(e) => setEditingRepeatable({ ...editingRepeatable, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRepeatableModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer shadow-sm"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
