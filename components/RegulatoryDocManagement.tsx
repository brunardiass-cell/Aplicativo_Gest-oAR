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
  RegulatoryDocItemStatus,
  RegulatoryDocumentVersion
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
  ListPlus,
  ExternalLink,
  ArrowRight,
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { EvidenceDetailModal } from './EvidenceDetailModal';

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
  // Main Tab Selection - Default is 'docs' (Document-Centric Workflow)
  const [activeTab, setActiveTab] = useState<
    'docs' | 'completeness' | 'contributions' | 'internal_db' | 'macro_configs'
  >('docs');

  // Sub-tab for Internal Database
  const [dbSubTab, setDbSubTab] = useState<
    'info_items' | 'narratives' | 'evidence' | 'repeatable'
  >('info_items');

  // Selected Project Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : 'all'
  );

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Selected Active Document inside Project
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  // Default Presets for Regulatory Documents
  const defaultDocs = useMemo<RegulatoryDocument[]>(() => {
    if (regulatoryDocs.length > 0) return regulatoryDocs;
    
    return projects.map(proj => [
      {
        id: `doc_vacina_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê da Vacina',
        type: 'Dossiê do Produto Final',
        description: 'Dossiê regulatório com dados clínicos, estabilidade e formulação do produto acabado.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        versionHistory: [
          { version: '0.1', date: new Date().toISOString(), status: 'Rascunho', author: currentUser, notes: 'Estruturação inicial do documento' }
        ],
        chapters: [
          {
            id: 'cap_1',
            code: '1.0',
            title: 'Informações Gerais e Descrição do Produto',
            items: [
              { id: 'item_1_1', name: 'Nome da Vacina', type: 'Informação Regulatória' as RegulatoryDocItemType, required: true, sourceInternalId: 'PRODUCT.NAME', status: 'Concluído' as RegulatoryDocItemStatus, marker: '[NOME_DA_VACINA]' },
              { id: 'item_1_2', name: 'Indicação Terapêutica / Proposta', type: 'Informação Regulatória' as RegulatoryDocItemType, required: true, sourceInternalId: 'PRODUCT.INDICATION', status: 'Concluído' as RegulatoryDocItemStatus, marker: '[INDICACAO]' },
              { id: 'item_1_3', name: 'Via de Administração e Forma Farmacêutica', type: 'Informação Regulatória' as RegulatoryDocItemType, required: true, sourceInternalId: 'PRODUCT.ADMINISTRATION_ROUTE', status: 'Em Andamento' as RegulatoryDocItemStatus, marker: '[FORMA_FARMACEUTICA]' },
              { id: 'item_1_4', name: 'Apresentações e Conservação', type: 'Informação Regulatória' as RegulatoryDocItemType, required: true, sourceInternalId: 'PRODUCT.PRESENTATION', status: 'Pendente' as RegulatoryDocItemStatus, marker: '[APRESENTACOES]' }
            ]
          },
          {
            id: 'cap_2',
            code: '2.0',
            title: 'Estudos Pré-clínicos e Clínicos',
            items: [
              { id: 'item_2_1', name: 'Resumo dos Ensaios de Imunogenicidade', type: 'Narrativa' as RegulatoryDocItemType, required: true, sourceInternalId: 'CLINICAL.IMMUNO', status: 'Em Andamento' as RegulatoryDocItemStatus, marker: '[IMUNOGENICIDADE]' },
              { id: 'item_2_2', name: 'Relatório de Toxicologia Pré-clínica', type: 'Evidência' as RegulatoryDocItemType, required: true, sourceInternalId: 'EVID_TOX', status: 'Pendente' as RegulatoryDocItemStatus, marker: '[RELATORIO_TOX]' }
            ]
          }
        ]
      },
      {
        id: `doc_ifa_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do IFA',
        type: 'Dossiê de Insumo Farmacêutico Ativo',
        description: 'Dados técnicos, rota sintética e controle de qualidade do Insumo Farmacêutico Ativo.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        versionHistory: [
          { version: '0.1', date: new Date().toISOString(), status: 'Rascunho', author: currentUser, notes: 'Abertura do dossiê de IFA' }
        ],
        chapters: [
          {
            id: 'cap_ifa_1',
            code: '1.0',
            title: 'Caracterização e Processo do IFA',
            items: [
              { id: 'item_ifa_1_1', name: 'Estrutura e Caracterização Físico-Química', type: 'Narrativa' as RegulatoryDocItemType, required: true, sourceInternalId: 'IFA.STRUCTURE', status: 'Em Andamento' as RegulatoryDocItemStatus, marker: '[ESTRUTURA_IFA]' },
              { id: 'item_ifa_1_2', name: 'Esquema do Processo de Fabricação', type: 'Evidência' as RegulatoryDocItemType, required: true, sourceInternalId: 'EVID_IFA_PROCESS', status: 'Pendente' as RegulatoryDocItemStatus, marker: '[PROCESSO_IFA]' }
            ]
          }
        ]
      },
      {
        id: `doc_adj_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do Adjuvante',
        type: 'Dossiê de Adjuvante',
        description: 'Informações de composição, esterilidade e segurança do sistema adjuvante.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: []
      },
      {
        id: `doc_brochura_${proj.id}`,
        projectId: proj.id,
        title: 'Brochura do Investigador',
        type: 'Brochura Clinica',
        description: 'Compilação de dados clínicos e de segurança para os investigadores do ensaio.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: []
      },
      {
        id: `doc_deec_${proj.id}`,
        projectId: proj.id,
        title: 'DEEC - Dossier de Ensaio Clínico',
        type: 'Documento de Submissão DEEC',
        description: 'Dossiê para submissão à Anvisa / CEUA / CONEP.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: []
      }
    ]).flat();
  }, [regulatoryDocs, projects, currentUser]);

  const effectiveDocs = useMemo(() => {
    return regulatoryDocs.length > 0 ? regulatoryDocs : defaultDocs;
  }, [regulatoryDocs, defaultDocs]);

  // Documents for the currently selected project
  const currentProjectDocs = useMemo(() => {
    if (selectedProjectId === 'all') return effectiveDocs;
    return effectiveDocs.filter(d => d.projectId === selectedProjectId);
  }, [effectiveDocs, selectedProjectId]);

  // Ensure active doc selected
  const activeDoc = useMemo(() => {
    if (selectedDocId) {
      const found = effectiveDocs.find(d => d.id === selectedDocId);
      if (found) return found;
    }
    return currentProjectDocs.length > 0 ? currentProjectDocs[0] : null;
  }, [effectiveDocs, currentProjectDocs, selectedDocId]);

  // Modals & Interactivity
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [newVersionNum, setNewVersionNum] = useState('');
  const [newVersionStatus, setNewVersionStatus] = useState('Rascunho');
  const [newVersionNotes, setNewVersionNotes] = useState('');

  const [showItemCompleterModal, setShowItemCompleterModal] = useState(false);
  const [activeItemForModal, setActiveItemForModal] = useState<{ chapterId: string; item: RegulatoryDocumentItem } | null>(null);

  const [selectedEvidenceForView, setSelectedEvidenceForView] = useState<any>(null);

  // Collections filtered for active project
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

  // Pending Contributions coming from Projects execution
  const projectPendingContributions = useMemo(() => {
    return tasks.filter(t => 
      (selectedProjectId === 'all' || t.project === activeProject?.name || t.project === selectedProjectId) &&
      (t.generatesRegulatoryContent || t.dossierContribution)
    );
  }, [tasks, selectedProjectId, activeProject]);

  // Metrics Calculation
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
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
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

  // Version bump handler
  const handleAddDocumentVersion = () => {
    if (!activeDoc || !newVersionNum.trim()) return;

    const newVerObj: RegulatoryDocumentVersion = {
      version: newVersionNum.trim(),
      date: new Date().toISOString(),
      status: newVersionStatus,
      author: currentUser,
      notes: newVersionNotes
    };

    const updatedDoc: RegulatoryDocument = {
      ...activeDoc,
      currentVersion: newVersionNum.trim(),
      currentVersionStatus: newVersionStatus,
      versionHistory: [...(activeDoc.versionHistory || []), newVerObj],
      updatedAt: new Date().toISOString()
    };

    const updatedList = effectiveDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    onUpdateDocs(updatedList);

    setShowVersionModal(false);
    setNewVersionNum('');
    setNewVersionNotes('');
  };

  // Toggle or edit item status
  const handleUpdateItemStatus = (chapterId: string, itemId: string, status: RegulatoryDocItemStatus) => {
    if (!activeDoc) return;

    const updatedChapters = activeDoc.chapters.map(chap => {
      if (chap.id !== chapterId) return chap;
      return {
        ...chap,
        items: chap.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, status };
        })
      };
    });

    const updatedDoc = { ...activeDoc, chapters: updatedChapters, updatedAt: new Date().toISOString() };
    const updatedList = effectiveDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    onUpdateDocs(updatedList);
  };

  // Export Json
  const handleExportDossierBank = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser,
        projectId: selectedProjectId,
        projectName: activeProject?.name || 'Todos os Projetos'
      },
      completenessMetrics,
      documents: currentProjectDocs,
      regulatoryInfoItems: projectInfoItems,
      narratives: projectNarratives,
      evidenceLibrary: projectEvidences,
      repeatableRecords: projectRepeatables
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Documentos_Regulatorios_${activeProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Projetos'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Módulo de Documentos Regulatórios
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Organização, construção, revisão e evolução dos documentos oficiais do projeto.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Project Filter */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-600 text-xs font-bold">
              <span className="text-slate-400">Projeto:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-800 text-white">Todos os Projetos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Export JSON */}
            <button
              onClick={handleExportDossierBank}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs flex items-center gap-2 transition shadow-lg active:scale-95 cursor-pointer"
            >
              <Download size={15} />
              <span>Exportar Dossiê</span>
            </button>
          </div>
        </div>

        {/* Primary Document-Centric Navigation Bar */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-700/60 pt-4 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>Documentos Regulatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('completeness')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'completeness'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Matriz de Completude</span>
          </button>

          <button
            onClick={() => setActiveTab('contributions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'contributions'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers size={16} />
            <span>Contribuições Pendentes ({projectPendingContributions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('internal_db')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'internal_db'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database size={16} />
            <span>Base de Dados Interna</span>
          </button>

          {hasAdminAccess && (
            <button
              onClick={() => setActiveTab('macro_configs')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'macro_configs'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings size={16} />
              <span>Modelos Macroatividades</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB: DOCUMENTOS REGULATÓRIOS (CENTERPIECE OF THE SYSTEM)
          ========================================================================= */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Document Selector Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Documentos do Projeto
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {currentProjectDocs.length}
                </span>
              </div>

              <div className="space-y-2">
                {currentProjectDocs.map(doc => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 shadow-md text-indigo-900'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase truncate">{doc.title}</span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          v{doc.currentVersion || '0.1'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{doc.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Evolution History Widget */}
            {activeDoc && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-indigo-600" />
                    Histórico de Versões
                  </h4>
                  <button
                    onClick={() => setShowVersionModal(true)}
                    className="text-[10px] font-black text-indigo-600 hover:underline uppercase flex items-center gap-1"
                  >
                    <Plus size={12} /> Nova Versão
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {(activeDoc.versionHistory || []).map((vh, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-indigo-800 text-xs">Versão {vh.version}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {vh.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{vh.notes || 'Atualização técnica'}</p>
                      <span className="text-[8px] font-bold text-slate-400 block">{new Date(vh.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Document Display (Chapters & Items) */}
          <div className="lg:col-span-3 space-y-6">
            {activeDoc ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                {/* Active Document Header */}
                <div className="pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-200">
                        {activeDoc.type}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                        Versão {activeDoc.currentVersion || '0.1'} • {activeDoc.currentVersionStatus || 'Rascunho'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activeDoc.title}</h2>
                    <p className="text-xs font-medium text-slate-500 mt-1">{activeDoc.description}</p>
                  </div>

                  <button
                    onClick={() => setShowVersionModal(true)}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-indigo-500 transition active:scale-95 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Atualizar Versão</span>
                  </button>
                </div>

                {/* Predefined Chapters & Items Tree */}
                <div className="space-y-6">
                  {activeDoc.chapters && activeDoc.chapters.length > 0 ? (
                    activeDoc.chapters.map(chap => (
                      <div key={chap.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
                        <div className="bg-slate-100/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px]">{chap.code}</span>
                            {chap.title}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500">
                            {chap.items?.filter(i => i.status === 'Concluído').length || 0} / {chap.items?.length || 0} itens concluídos
                          </span>
                        </div>

                        {/* Items Table */}
                        <div className="divide-y divide-slate-100">
                          {chap.items?.map(item => (
                            <div key={item.id} className="p-4 bg-white hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">{item.name}</span>
                                  {item.required && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[8px] font-black uppercase">Obrigatório</span>
                                  )}
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[8px] font-bold uppercase">{item.type}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Marcador: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">{item.marker || '[PADRAO]'}</code></p>
                              </div>

                              {/* Item Controls & Status Actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleUpdateItemStatus(chap.id, item.id, e.target.value as RegulatoryDocItemStatus)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                                    item.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                    item.status === 'Em Andamento' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <option value="Pendente">Pendente</option>
                                  <option value="Em Andamento">Em Andamento</option>
                                  <option value="Concluído">Concluído</option>
                                </select>

                                <button
                                  onClick={() => {
                                    setActiveItemForModal({ chapterId: chap.id, item });
                                    setShowItemCompleterModal(true);
                                  }}
                                  className="px-3.5 py-1.5 bg-brand-primary text-white hover:bg-brand-accent rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-sm"
                                >
                                  Completar Item
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Nenhum capítulo cadastrado para este documento.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Selecione um documento no painel lateral.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: MATRIZ DE COMPLETUDE (ASSISTANT METRICS)
          ========================================================================= */}
      {activeTab === 'completeness' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" size={24} />
                  Assistente de Completude dos Documentos
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Acompanhamento consolidado do preenchimento e prontidão dos documentos do projeto.
                </p>
              </div>

              <div className="text-right">
                <span className="text-4xl font-black text-indigo-600">{completenessMetrics.percent}%</span>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {completenessMetrics.completed} de {completenessMetrics.totalRequired} itens concluídos
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${completenessMetrics.percent}%` }}
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Itens Concluídos</span>
                <p className="text-3xl font-black text-emerald-700 mt-1">{completenessMetrics.completed}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Em Andamento</span>
                <p className="text-3xl font-black text-amber-700 mt-1">{completenessMetrics.inProgress}</p>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Itens Pendentes</span>
                <p className="text-3xl font-black text-rose-700 mt-1">{completenessMetrics.pending}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Requisitos Totais</span>
                <p className="text-3xl font-black text-slate-800 mt-1">{completenessMetrics.totalRequired}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: CONTRIBUIÇÕES PENDENTES DO PROJETO
          ========================================================================= */}
      {activeTab === 'contributions' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Layers size={20} className="text-indigo-600" />
              Contribuições Regulatórias Originadas no Módulo Projetos
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Atividades concluídas no gerenciamento de execução que foram marcadas como geradoras de conteúdo regulatório.
            </p>
          </div>

          <div className="space-y-3">
            {projectPendingContributions.map(task => (
              <div key={task.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-brand-primary bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {task.project}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">{task.activity}</h4>
                  <p className="text-xs text-slate-500 font-medium">{task.description || 'Sem descrição'}</p>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">Líder: {task.projectLead}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEvidenceForView(task)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Ver Evidência
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('docs');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Vincular ao Documento
                  </button>
                </div>
              </div>
            ))}

            {projectPendingContributions.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Nenhuma contribuição regulatória pendente proveniente dos projetos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: BASE DE DADOS INTERNA (LIBRARIES)
          ========================================================================= */}
      {activeTab === 'internal_db' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Database size={20} className="text-indigo-600" />
                Base de Dados Interna do Dossiê
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Acervo de apoio utilizado como fonte de dados para compor os itens dos documentos regulatórios.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDbSubTab('info_items')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${dbSubTab === 'info_items' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Informações
              </button>
              <button
                onClick={() => setDbSubTab('narratives')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${dbSubTab === 'narratives' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Narrativas
              </button>
              <button
                onClick={() => setDbSubTab('evidence')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${dbSubTab === 'evidence' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Evidências
              </button>
            </div>
          </div>

          {/* Render Subtab List */}
          {dbSubTab === 'info_items' && (
            <div className="space-y-3">
              {projectInfoItems.map(item => (
                <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{item.internalId}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{item.name}</h4>
                    <p className="text-xs text-slate-600 font-medium">{item.value || 'Sem valor preenchido'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {dbSubTab === 'narratives' && (
            <div className="space-y-3">
              {projectNarratives.map(nar => (
                <div key={nar.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-sm font-bold text-slate-900">{nar.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{nar.text}</p>
                </div>
              ))}
            </div>
          )}

          {dbSubTab === 'evidence' && (
            <div className="space-y-3">
              {projectEvidences.map(ev => (
                <div key={ev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-600">{ev.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version Bump Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Atualizar Versão do Documento</h3>
              <button onClick={() => setShowVersionModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Número da Versão</label>
                <input
                  type="text"
                  placeholder="ex: 0.2, 1.0, 1.1"
                  value={newVersionNum}
                  onChange={e => setNewVersionNum(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Status da Versão</label>
                <select
                  value={newVersionStatus}
                  onChange={e => setNewVersionStatus(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Complementação">Complementação</option>
                  <option value="Revisão Técnica">Revisão Técnica</option>
                  <option value="Submetido">Submetido</option>
                  <option value="Aprovado">Aprovado</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Notas do Histórico</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que mudou nesta versão..."
                  value={newVersionNotes}
                  onChange={e => setNewVersionNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowVersionModal(false)} className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">Cancelar</button>
              <button onClick={handleAddDocumentVersion} className="px-6 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg">Salvar Versão</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Completer Modal */}
      {showItemCompleterModal && activeItemForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Completar Item: {activeItemForModal.item.name}</h3>
              <button onClick={() => setShowItemCompleterModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Ajuste o status e os dados de suporte deste requisito obrigatório do documento.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Status do Item</label>
                <select
                  value={activeItemForModal.item.status}
                  onChange={e => {
                    handleUpdateItemStatus(activeItemForModal.chapterId, activeItemForModal.item.id, e.target.value as RegulatoryDocItemStatus);
                    setShowItemCompleterModal(false);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowItemCompleterModal(false)} className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing evidence */}
      {selectedEvidenceForView && (
        <EvidenceDetailModal
          item={selectedEvidenceForView}
          onClose={() => setSelectedEvidenceForView(null)}
        />
      )}
    </div>
  );
};
