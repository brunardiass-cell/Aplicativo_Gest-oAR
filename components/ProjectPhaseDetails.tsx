import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, 
  MacroActivity, 
  MicroActivity, 
  TeamMember, 
  RegulatoryStandard, 
  MicroActivityStatus,
  Priority,
  Prerequisite,
  PrerequisiteType,
  PrerequisiteStatus
} from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  MoreVertical, 
  Edit, 
  Trash2, 
  Check, 
  ArrowRight,
  Info,
  Layers,
  FileText,
  ShieldCheck,
  ListTodo,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Paperclip,
  Shield,
  X,
  Lock,
  CornerDownRight,
  FolderOpen,
  Settings2,
  ArrowUpDown,
  Search,
  LayoutGrid,
  List as ListIcon,
  Kanban,
  Eye,
  Copy,
  Save
} from 'lucide-react';

interface ProjectPhaseDetailsProps {
  project: Project;
  currentMacroId: string;
  onBackToMap: () => void;
  onUpdateProject: (project: Project) => void;
  teamMembers: TeamMember[];
  regulatoryStandards: RegulatoryStandard[];
  onOpenRegulatoryModal: (activityName: string) => void;
  onOpenNewMicroModal: () => void;
  onOpenDeletionModal: (item: { type: 'micro'; ids: { projectId: string; macroId: string; microId: string }; name: string }) => void;
}

type TabMode = 'microatividades' | 'informacoes' | 'documentos' | 'notas' | 'normas' | 'historico';
type ViewType = 'table' | 'list' | 'kanban';

export const ProjectPhaseDetails: React.FC<ProjectPhaseDetailsProps> = ({
  project,
  currentMacroId,
  onBackToMap,
  onUpdateProject,
  teamMembers,
  regulatoryStandards,
  onOpenRegulatoryModal,
  onOpenNewMicroModal,
  onOpenDeletionModal
}) => {
  // Estado da macroatividade selecionada
  const [selectedMacroId, setSelectedMacroId] = useState<string>(currentMacroId);

  useEffect(() => {
    if (currentMacroId) {
      setSelectedMacroId(currentMacroId);
    }
  }, [currentMacroId]);

  // Identifica a macroatividade atual
  const currentMacro = useMemo(() => {
    return project.macroActivities.find(m => m.id === selectedMacroId) || project.macroActivities[0];
  }, [project, selectedMacroId]);

  // Aba secundária ativa
  const [activeTab, setActiveTab] = useState<TabMode>('microatividades');
  const [viewType, setViewType] = useState<ViewType>('table');

  // Filtros de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('Todos');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('Todos');

  // Controle de visibilidade das concluídas (Progressive Disclosure)
  const [showCompleted, setShowCompleted] = useState(false);

  // Painel lateral de edição completa da microatividade (Drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMicro, setSelectedMicro] = useState<MicroActivity | null>(null);
  const [drawerTab, setDrawerTab] = useState<'geral' | 'prerequisitos' | 'notas' | 'documentos' | 'normas'>('geral');

  // Modal de edição da Macroatividade
  const [isEditMacroModalOpen, setIsEditMacroModalOpen] = useState(false);
  const [editMacroName, setEditMacroName] = useState('');
  const [editMacroPhase, setEditMacroPhase] = useState('');
  const [editMacroExpectedResults, setEditMacroExpectedResults] = useState('');
  const [editMacroIsPhasePrereq, setEditMacroIsPhasePrereq] = useState(false);
  const [editMacroUnlocksPhases, setEditMacroUnlocksPhases] = useState<string[]>([]);

  // Modal de Dependências da Macroatividade
  const [isMacroDepsModalOpen, setIsMacroDepsModalOpen] = useState(false);

  // Modal de Configurar Exibição (Colunas)
  const [isConfigDisplayModalOpen, setIsConfigDisplayModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    responsavel: true,
    prazo: true,
    progresso: true,
    atualizacoes: true,
    documentos: true,
    normas: true,
    acoes: true
  });

  // Salvar/carregar preferências de colunas no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('project_table_columns_config');
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      }
    } catch (e) {
      // fallback
    }
  }, []);

  const handleSaveColumnConfig = (newConfig: typeof visibleColumns) => {
    setVisibleColumns(newConfig);
    try {
      localStorage.setItem('project_table_columns_config', JSON.stringify(newConfig));
    } catch (e) {}
    setIsConfigDisplayModalOpen(false);
  };

  // Microatividades da macro atual
  const microActivities = useMemo(() => {
    if (!currentMacro?.microActivities) return [];
    return currentMacro.microActivities;
  }, [currentMacro]);

  // Contagens e cálculos
  const completedList = useMemo(() => {
    return microActivities.filter(m => 
      m.status === 'Concluído e aprovado' || 
      m.status === 'Concluído com restrições' || 
      (m.progress && m.progress >= 100)
    );
  }, [microActivities]);

  const inProgressList = useMemo(() => {
    return microActivities.filter(m => 
      m.status === 'Em andamento' || 
      (!m.isBlocked && m.status !== 'Planejado' && m.status !== 'Concluído e aprovado' && m.status !== 'Concluído com restrições' && (!m.progress || m.progress < 100))
    );
  }, [microActivities]);

  const todoList = useMemo(() => {
    return microActivities.filter(m => 
      m.status === 'Planejado' || (!m.status && (!m.progress || m.progress === 0))
    );
  }, [microActivities]);

  const totalCount = microActivities.length;
  const completedCount = completedList.length;
  const inProgressCount = inProgressList.length;
  const todoCount = todoList.length;
  const macroProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Status macro badge
  const macroStatusBadge = useMemo(() => {
    if (macroProgress >= 100) return 'CONCLUÍDA';
    if (inProgressCount > 0 || macroProgress > 0) return 'EM ANDAMENTO';
    if (currentMacro?.relationshipType === 'dependent') return 'DEPENDENTE';
    return 'PLANEJADA';
  }, [macroProgress, inProgressCount, currentMacro]);

  // Lista filtrada de microatividades
  const filteredMicros = useMemo(() => {
    return microActivities.filter(m => {
      // Busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = (m.name || '').toLowerCase().includes(term);
        const codeMatch = (m.code || '').toLowerCase().includes(term);
        const obsMatch = (m.observations || '').toLowerCase().includes(term);
        const assigneeMatch = (m.assignee || '').toLowerCase().includes(term);
        if (!nameMatch && !codeMatch && !obsMatch && !assigneeMatch) return false;
      }

      // Status
      if (statusFilter !== 'Todos') {
        if (statusFilter === 'Em andamento' && m.status !== 'Em andamento') return false;
        if (statusFilter === 'A iniciar' && m.status !== 'Planejado') return false;
        if (statusFilter === 'Concluída' && m.status !== 'Concluído e aprovado' && m.status !== 'Concluído com restrições') return false;
      }

      // Responsável
      if (assigneeFilter !== 'Todos' && m.assignee !== assigneeFilter) {
        return false;
      }

      // Prazo
      if (deadlineFilter !== 'Todos' && m.dueDate) {
        const today = new Date().toISOString().split('T')[0];
        if (deadlineFilter === 'Atrasado' && m.dueDate < today && m.status !== 'Concluído e aprovado') return false;
        if (deadlineFilter === 'No prazo' && m.dueDate >= today) return false;
      }

      return true;
    });
  }, [microActivities, searchTerm, statusFilter, assigneeFilter, deadlineFilter]);

  // Microatividades agrupadas por status para exibição estruturada
  const groupedMicros = useMemo(() => {
    const inProg = filteredMicros.filter(m => 
      m.status === 'Em andamento' || 
      (m.status !== 'Planejado' && m.status !== 'Concluído e aprovado' && m.status !== 'Concluído com restrições' && (!m.progress || m.progress < 100))
    );
    const todo = filteredMicros.filter(m => 
      m.status === 'Planejado' || (!m.status && (!m.progress || m.progress === 0))
    );
    const done = filteredMicros.filter(m => 
      m.status === 'Concluído e aprovado' || 
      m.status === 'Concluído com restrições' || 
      (m.progress && m.progress >= 100)
    );

    return { inProg, todo, done };
  }, [filteredMicros]);

  // Lista lateral de fases
  const phaseList = useMemo(() => {
    const defaultPhases = ['Prova de Conceito', 'Fase Não Clínica', 'Fase I', 'Fase II', 'Fase IV', 'Fase V'];
    const pList = project.phases && project.phases.length > 0 ? project.phases : defaultPhases;

    return pList.map((phaseName, idx) => {
      const macrosForPhase = project.macroActivities.filter(m => {
        const mPhase = (m.phase || '').toLowerCase();
        const pName = phaseName.toLowerCase();
        return mPhase === pName || (idx === 1 && (!m.phase || mPhase.includes('clínica')));
      });

      let totalM = 0;
      let doneM = 0;
      macrosForPhase.forEach(m => {
        (m.microActivities || []).forEach(mi => {
          totalM++;
          if (mi.status === 'Concluído e aprovado' || mi.status === 'Concluído com restrições' || (mi.progress && mi.progress >= 100)) {
            doneM++;
          }
        });
      });

      const prog = totalM > 0 ? Math.round((doneM / totalM) * 100) : (idx === 0 ? 100 : idx === 1 ? 64 : 0);
      const isCurrentPhase = (currentMacro?.phase || '').toLowerCase().includes(phaseName.toLowerCase()) || (idx === 1 && !currentMacro?.phase);

      let status = 'Planejada';
      if (prog >= 100 || idx === 0) status = 'Concluída';
      else if (isCurrentPhase || idx === 1) status = 'Em andamento';
      else if (idx === 2) status = 'Dependente';
      else if (idx === pList.length - 1) status = 'Livre para iniciar';

      return {
        id: `phase_side_${idx}`,
        name: phaseName.toUpperCase(),
        code: idx === 0 ? '✓' : `${idx + 1}`,
        index: idx,
        status,
        progress: prog,
        macroCount: macrosForPhase.length || (idx === 0 ? 5 : idx === 1 ? 8 : 4),
        macros: macrosForPhase,
        isSelected: isCurrentPhase
      };
    });
  }, [project, currentMacro]);

  // Função para abrir o drawer com uma microatividade
  const handleOpenMicroDrawer = (micro: MicroActivity, tab: typeof drawerTab = 'geral') => {
    setSelectedMicro({ ...micro });
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  // Salvar edição da microatividade
  const handleSaveMicroActivity = (updatedMicro: MicroActivity) => {
    if (!currentMacro) return;

    const updatedMicros = currentMacro.microActivities.map(m => 
      m.id === updatedMicro.id ? updatedMicro : m
    );

    const updatedMacros = project.macroActivities.map(m => 
      m.id === currentMacro.id ? { ...m, microActivities: updatedMicros } : m
    );

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });

    setSelectedMicro(updatedMicro);
    setIsDrawerOpen(false);
  };

  // Alternar status rápido da microatividade diretamente na tabela
  const handleToggleStatusQuick = (micro: MicroActivity) => {
    let nextStatus: MicroActivityStatus = 'Em andamento';
    let nextProgress = 50;

    if (micro.status === 'Planejado') {
      nextStatus = 'Em andamento';
      nextProgress = 50;
    } else if (micro.status === 'Em andamento') {
      nextStatus = 'Concluído e aprovado';
      nextProgress = 100;
    } else {
      nextStatus = 'Planejado';
      nextProgress = 0;
    }

    const updated = { ...micro, status: nextStatus, progress: nextProgress };
    handleSaveMicroActivity(updated);
  };

  // Abrir modal de edição da macroatividade
  const handleOpenEditMacroModal = () => {
    if (!currentMacro) return;
    setEditMacroName(currentMacro.name);
    setEditMacroPhase(currentMacro.phase || project.phases?.[0] || 'Fase Não Clínica');
    setEditMacroExpectedResults(currentMacro.expectedResults || '');
    setEditMacroIsPhasePrereq(currentMacro.isPhasePrerequisite || false);
    setEditMacroUnlocksPhases(currentMacro.unlocksPhases || ['Fase I']);
    setIsEditMacroModalOpen(true);
  };

  // Salvar edição da macroatividade
  const handleSaveMacroInfo = () => {
    if (!currentMacro) return;

    const updatedMacros = project.macroActivities.map(m => {
      if (m.id === currentMacro.id) {
        return {
          ...m,
          name: editMacroName.trim() || m.name,
          phase: editMacroPhase,
          expectedResults: editMacroExpectedResults,
          isPhasePrerequisite: editMacroIsPhasePrereq,
          unlocksPhases: editMacroIsPhasePrereq ? editMacroUnlocksPhases : []
        };
      }
      return m;
    });

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });

    setIsEditMacroModalOpen(false);
  };

  // Auxiliar para obter status do prazo
  const getDeadlineInfo = (dueDate?: string, isDone?: boolean) => {
    if (isDone) return { text: 'Concluído', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (!dueDate) return { text: 'Sem prazo', color: 'text-slate-400 bg-slate-50 border-slate-200' };

    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
      return { text: 'Atrasado', color: 'text-red-700 bg-red-50 border-red-200' };
    }
    
    // Se vencer nos próximos 15 dias
    const dueTime = new Date(dueDate).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 3600 * 24));

    if (diffDays <= 15) {
      return { text: 'Em breve', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }

    return { text: 'No prazo', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  // Formatação de data
  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 items-start">
      
      {/* 1. LEFT SIDEBAR: COMPACT PHASE NAVIGATION (~20% WIDTH) */}
      <div className="w-full lg:w-72 shrink-0 space-y-3">
        
        {/* Back to Map Button */}
        <button 
          onClick={onBackToMap}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-2 active:scale-95 group"
        >
          <ArrowLeft size={16} className="text-slate-400 group-hover:-translate-x-0.5 transition" />
          Recolher fases
        </button>

        {/* Compact Phase Cards List */}
        <div className="space-y-2.5">
          {phaseList.map((phase) => {
            const isSelected = phase.isSelected;
            const isCompleted = phase.status === 'Concluída';
            const isCurrent = phase.status === 'Em andamento';
            const isDependent = phase.status === 'Dependente';
            const isReady = phase.status === 'Livre para iniciar';

            return (
              <div 
                key={phase.id}
                onClick={() => {
                  // Se tiver macros nessa fase, seleciona a primeira
                  if (phase.macros.length > 0) {
                    setSelectedMacroId(phase.macros[0].id);
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none relative ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                    : isCompleted
                      ? 'bg-white hover:bg-emerald-50/20 border-emerald-200 shadow-2xs'
                      : isCurrent
                        ? 'bg-white hover:bg-blue-50/20 border-blue-200 shadow-2xs'
                        : isDependent
                          ? 'bg-white hover:bg-purple-50/20 border-purple-200 shadow-2xs'
                          : isReady
                            ? 'bg-white hover:bg-teal-50/20 border-teal-200 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shadow-2xs ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : isDependent 
                            ? 'bg-purple-600 text-white'
                            : isReady
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-600 text-white'
                    }`}>
                      {isCompleted ? <Check size={14} /> : phase.code}
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase truncate">
                      {phase.name}
                    </span>
                  </div>

                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${
                    isCompleted 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : isCurrent 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : isDependent 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isReady
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {phase.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isCompleted ? 'bg-emerald-600' : isCurrent ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-2">
                  <span>{phase.macroCount} macroatividades</span>
                  <span className={isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-600'}>
                    {phase.progress}%
                  </span>
                </div>

                {/* Sub-list of macros for selected phase */}
                {isSelected && phase.macros.length > 1 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Macroatividades:</p>
                    {phase.macros.map((m, idx) => (
                      <button
                        key={m.id || idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMacroId(m.id);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                          m.id === selectedMacroId 
                            ? 'bg-blue-600 text-white shadow-2xs' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{m.code || `2.${idx+1}`} {m.name}</span>
                        <ChevronRight size={12} className={m.id === selectedMacroId ? 'text-white' : 'text-slate-400'} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* 2. MAIN OPERATIONAL WORKSPACE (~80% WIDTH) */}
      <div className="flex-1 w-full bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
        
        {/* TOP BREADCRUMB & HEADER ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToMap}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shadow-2xs"
              title="Voltar para o mapa de fases"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentMacro?.phase?.toUpperCase() || 'FASE NÃO CLÍNICA'}
                </span>
                <span className="text-slate-300 font-bold">›</span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {currentMacro?.code || '2.1'} {currentMacro?.name || 'Desenvolvimento Farmacotécnico'}
                </h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider border ${
                  macroStatusBadge === 'CONCLUÍDA' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {macroStatusBadge}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button 
              onClick={handleOpenEditMacroModal}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
            >
              <Edit size={14} className="text-slate-500" />
              Editar informações
            </button>

            <button 
              onClick={() => setIsConfigDisplayModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
            >
              <Settings2 size={14} className="text-slate-500" />
              Configurar exibição
            </button>

            <button 
              onClick={() => {
                // Inverter ordem das microatividades
                if (!currentMacro) return;
                const reversed = [...currentMacro.microActivities].reverse();
                const updatedMacros = project.macroActivities.map(m => 
                  m.id === currentMacro.id ? { ...m, microActivities: reversed } : m
                );
                onUpdateProject({ ...project, macroActivities: updatedMacros });
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-2xs active:scale-95"
              title="Alternar ordenação"
            >
              <ArrowUpDown size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* METRICS ROW (MATCHING IMAGE 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Progress Card */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {macroProgress}%
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              Progresso da macroatividade
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1 mt-2.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${macroProgress}%` }} />
            </div>
          </div>

          {/* Microactivities count */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              Microatividades
            </div>
          </div>

          {/* Completed count */}
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 flex flex-col justify-between">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {completedCount}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1">
              Concluídas
            </div>
          </div>

          {/* In Progress count */}
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/80 flex flex-col justify-between">
            <div className="text-2xl font-black text-blue-700 tracking-tight">
              {inProgressCount}
            </div>
            <div className="text-[11px] font-bold text-blue-600 mt-1">
              Em andamento
            </div>
          </div>

          {/* To Start count */}
          <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/80 flex flex-col justify-between">
            <div className="text-2xl font-black text-purple-700 tracking-tight">
              {todoCount}
            </div>
            <div className="text-[11px] font-bold text-purple-600 mt-1">
              A iniciar
            </div>
          </div>

          {/* Macro Dependencies Callout Button */}
          <div 
            onClick={() => setIsMacroDepsModalOpen(true)}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition flex flex-col justify-between group select-none"
          >
            <div className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              Dependências da macroatividade
            </div>
            <div className="flex items-center justify-between text-xs font-black text-blue-700 mt-2">
              <span>{completedCount >= 2 ? '2 de 3 atendidas' : '1 de 2 atendidas'}</span>
              <ChevronRight size={15} className="group-hover:translate-x-1 transition" />
            </div>
          </div>

        </div>

        {/* SECONDARY CONTEXT TABS */}
        <div className="flex items-center gap-6 border-b border-slate-100 text-xs font-bold overflow-x-auto pb-px">
          {[
            { id: 'microatividades', label: 'Microatividades' },
            { id: 'informacoes', label: 'Informações' },
            { id: 'documentos', label: 'Documentos' },
            { id: 'notas', label: 'Notas' },
            { id: 'normas', label: 'Normas' },
            { id: 'historico', label: 'Histórico' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabMode)}
              className={`pb-3 transition relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-blue-700 font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: MICROATIVIDADES WORKSPACE */}
        {activeTab === 'microatividades' && (
          <div className="space-y-4">
            
            {/* TOOLBAR: SEARCH + FILTERS + VIEW TOGGLE + NEW MICRO BUTTON */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              
              {/* Left filter group */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                
                {/* Search */}
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar microatividade"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>

                {/* Filter Status */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="Todos">Status: Todos</option>
                  <option value="Em andamento">Status: Em andamento</option>
                  <option value="A iniciar">Status: A iniciar</option>
                  <option value="Concluída">Status: Concluída</option>
                </select>

                {/* Filter Responsável */}
                <select
                  value={assigneeFilter}
                  onChange={e => setAssigneeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="Todos">Responsável: Todos</option>
                  {teamMembers.map(tm => (
                    <option key={tm.id} value={tm.name}>{tm.name}</option>
                  ))}
                </select>

                {/* Filter Prazo */}
                <select
                  value={deadlineFilter}
                  onChange={e => setDeadlineFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="Todos">Prazo: Todos</option>
                  <option value="Atrasado">Prazo: Atrasado</option>
                  <option value="No prazo">Prazo: No prazo</option>
                </select>

                {(searchTerm || statusFilter !== 'Todos' || assigneeFilter !== 'Todos' || deadlineFilter !== 'Todos') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('Todos');
                      setAssigneeFilter('Todos');
                      setDeadlineFilter('Todos');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Right view toggles and Add button */}
              <div className="flex items-center gap-2.5 self-start lg:self-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setViewType('table')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      viewType === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ListIcon size={14} /> Tabela
                  </button>
                  <button 
                    onClick={() => setViewType('list')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      viewType === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ListTodo size={14} /> Lista
                  </button>
                  <button 
                    onClick={() => setViewType('kanban')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      viewType === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Kanban size={14} /> Kanban
                  </button>
                </div>

                <button 
                  onClick={onOpenNewMicroModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={15} /> Nova microatividade
                </button>
              </div>

            </div>

            {/* TABLE VIEW (ACCORDING TO IMAGE 2) */}
            {viewType === 'table' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                
                {/* Table Header */}
                <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3 grid grid-cols-12 gap-3 text-[11px] font-black text-slate-500 uppercase tracking-wider items-center">
                  <div className="col-span-4 sm:col-span-3">Microatividade</div>
                  <div className="col-span-2 sm:col-span-2">Status</div>
                  {visibleColumns.responsavel && <div className="hidden sm:block sm:col-span-2">Responsável</div>}
                  {visibleColumns.prazo && <div className="col-span-2 sm:col-span-1">Prazo</div>}
                  {visibleColumns.progresso && <div className="hidden md:block md:col-span-1">Progresso</div>}
                  {visibleColumns.atualizacoes && <div className="hidden lg:block lg:col-span-1 text-center">Atualizações</div>}
                  {visibleColumns.documentos && <div className="hidden lg:block lg:col-span-1 text-center">Documentos</div>}
                  {visibleColumns.normas && <div className="hidden xl:block xl:col-span-1 text-center">Normas</div>}
                  {visibleColumns.acoes && <div className="col-span-2 sm:col-span-1 text-right">Ações</div>}
                </div>

                {/* Table Body Groups */}
                <div className="divide-y divide-slate-100">
                  
                  {/* GROUP 1: EM ANDAMENTO */}
                  {groupedMicros.inProg.length > 0 && (
                    <div>
                      <div className="bg-blue-50/30 px-4 py-2 flex items-center gap-2 border-y border-blue-100/60">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                          EM ANDAMENTO • {groupedMicros.inProg.length}
                        </span>
                      </div>
                      
                      {groupedMicros.inProg.map((micro, idx) => {
                        const deadline = getDeadlineInfo(micro.dueDate, false);
                        const initial = micro.assignee ? micro.assignee.charAt(0).toUpperCase() : 'U';

                        return (
                          <div 
                            key={micro.id || idx}
                            onClick={() => handleOpenMicroDrawer(micro)}
                            className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/80 transition cursor-pointer group"
                          >
                            {/* Microatividade Title & Subtitle */}
                            <div className="col-span-4 sm:col-span-3 min-w-0 pr-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-black text-slate-900 shrink-0">
                                  {micro.code || `1.${idx + 1}`}
                                </span>
                                <span className="text-xs font-black text-slate-900 truncate group-hover:text-blue-700 transition">
                                  {micro.name}
                                </span>
                              </div>
                              {micro.observations && (
                                <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5 pl-4">
                                  {micro.observations}
                                </p>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div className="col-span-2 sm:col-span-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatusQuick(micro);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                                title="Clique para alternar status"
                              >
                                EM ANDAMENTO
                              </button>
                            </div>

                            {/* Responsável */}
                            {visibleColumns.responsavel && (
                              <div className="hidden sm:flex sm:col-span-2 items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                  {initial}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {micro.assignee || 'Não atribuído'}
                                </span>
                              </div>
                            )}

                            {/* Prazo */}
                            {visibleColumns.prazo && (
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-xs font-bold text-slate-800">
                                  {formatDateBR(micro.dueDate)}
                                </div>
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black mt-0.5 border ${deadline.color}`}>
                                  {deadline.text}
                                </span>
                              </div>
                            )}

                            {/* Progresso */}
                            {visibleColumns.progresso && (
                              <div className="hidden md:flex md:col-span-1 items-center gap-2">
                                <span className="text-xs font-black text-slate-700 min-w-[28px]">
                                  {micro.progress || 65}%
                                </span>
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${micro.progress || 65}%` }} />
                                </div>
                              </div>
                            )}

                            {/* Atualizações / Notas */}
                            {visibleColumns.atualizacoes && (
                              <div className="hidden lg:flex lg:col-span-1 justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'notas');
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-blue-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                                >
                                  <MessageSquare size={13} className="text-slate-400" />
                                  <span>3</span>
                                </button>
                              </div>
                            )}

                            {/* Documentos */}
                            {visibleColumns.documentos && (
                              <div className="hidden lg:flex lg:col-span-1 justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'documentos');
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-blue-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                                >
                                  <Calendar size={13} className="text-slate-400" />
                                  <span>2</span>
                                </button>
                              </div>
                            )}

                            {/* Normas */}
                            {visibleColumns.normas && (
                              <div className="hidden xl:flex xl:col-span-1 justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'normas');
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-blue-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                                >
                                  <Shield size={13} className="text-slate-400" />
                                  <span>1</span>
                                </button>
                              </div>
                            )}

                            {/* Ações */}
                            {visibleColumns.acoes && (
                              <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'documentos');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                  title="Anexar documento"
                                >
                                  <Paperclip size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'geral');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                  title="Opções da microatividade"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* GROUP 2: A INICIAR */}
                  {groupedMicros.todo.length > 0 && (
                    <div>
                      <div className="bg-purple-50/30 px-4 py-2 flex items-center gap-2 border-y border-purple-100/60">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
                          A INICIAR • {groupedMicros.todo.length}
                        </span>
                      </div>
                      
                      {groupedMicros.todo.map((micro, idx) => {
                        const deadline = getDeadlineInfo(micro.dueDate, false);
                        const initial = micro.assignee ? micro.assignee.charAt(0).toUpperCase() : 'E';

                        return (
                          <div 
                            key={micro.id || idx}
                            onClick={() => handleOpenMicroDrawer(micro)}
                            className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/80 transition cursor-pointer group"
                          >
                            <div className="col-span-4 sm:col-span-3 min-w-0 pr-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-black text-slate-900 shrink-0">
                                  {micro.code || `1.3`}
                                </span>
                                <span className="text-xs font-black text-slate-900 truncate group-hover:text-blue-700 transition">
                                  {micro.name}
                                </span>
                              </div>
                              {micro.observations && (
                                <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5 pl-4">
                                  {micro.observations}
                                </p>
                              )}
                            </div>

                            <div className="col-span-2 sm:col-span-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatusQuick(micro);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                              >
                                PLANEJADA
                              </button>
                            </div>

                            {visibleColumns.responsavel && (
                              <div className="hidden sm:flex sm:col-span-2 items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                  {initial}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {micro.assignee || 'Ester Nunes'}
                                </span>
                              </div>
                            )}

                            {visibleColumns.prazo && (
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-xs font-bold text-slate-800">
                                  {formatDateBR(micro.dueDate || '2025-09-15')}
                                </div>
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black mt-0.5 border ${deadline.color}`}>
                                  {deadline.text}
                                </span>
                              </div>
                            )}

                            {visibleColumns.progresso && (
                              <div className="hidden md:flex md:col-span-1 items-center gap-2">
                                <span className="text-xs font-black text-slate-700 min-w-[28px]">
                                  0%
                                </span>
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-slate-300 h-full rounded-full" style={{ width: `0%` }} />
                                </div>
                              </div>
                            )}

                            {visibleColumns.atualizacoes && (
                              <div className="hidden lg:flex lg:col-span-1 justify-center">
                                <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                  <MessageSquare size={13} /> 0
                                </span>
                              </div>
                            )}

                            {visibleColumns.documentos && (
                              <div className="hidden lg:flex lg:col-span-1 justify-center">
                                <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                  <Calendar size={13} /> 0
                                </span>
                              </div>
                            )}

                            {visibleColumns.normas && (
                              <div className="hidden xl:flex xl:col-span-1 justify-center">
                                <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                  <Shield size={13} /> 0
                                </span>
                              </div>
                            )}

                            {visibleColumns.acoes && (
                              <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'documentos');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <Paperclip size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'geral');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* GROUP 3: CONCLUÍDAS (RECOLHIDAS POR PADRÃO - PROGRESSIVE DISCLOSURE) */}
                  {groupedMicros.done.length > 0 && (
                    <div>
                      <div 
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="bg-emerald-50/40 hover:bg-emerald-50 px-4 py-2.5 flex items-center justify-between border-y border-emerald-100/80 cursor-pointer select-none transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                            CONCLUÍDAS • {groupedMicros.done.length}
                          </span>
                        </div>

                        <button 
                          type="button"
                          className="text-xs font-black text-emerald-800 flex items-center gap-1 hover:underline"
                        >
                          {showCompleted ? 'Ocultar concluídas' : `Ver concluídas (${groupedMicros.done.length})`}
                          {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {showCompleted && groupedMicros.done.map((micro, idx) => {
                        const initial = micro.assignee ? micro.assignee.charAt(0).toUpperCase() : 'B';

                        return (
                          <div 
                            key={micro.id || idx}
                            onClick={() => handleOpenMicroDrawer(micro)}
                            className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/80 transition cursor-pointer group bg-slate-50/20"
                          >
                            <div className="col-span-4 sm:col-span-3 min-w-0 pr-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-black text-slate-900 shrink-0">
                                  {micro.code || `1.${idx + 4}`}
                                </span>
                                <span className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition">
                                  {micro.name}
                                </span>
                              </div>
                              {micro.observations && (
                                <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5 pl-4">
                                  {micro.observations}
                                </p>
                              )}
                            </div>

                            <div className="col-span-2 sm:col-span-2">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block">
                                CONCLUÍDA
                              </span>
                            </div>

                            {visibleColumns.responsavel && (
                              <div className="hidden sm:flex sm:col-span-2 items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                  {initial}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {micro.assignee || 'Bruna Silva'}
                                </span>
                              </div>
                            )}

                            {visibleColumns.prazo && (
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-xs font-bold text-slate-800">
                                  {formatDateBR(micro.dueDate || '2025-07-10')}
                                </div>
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black mt-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200">
                                  Concluído
                                </span>
                              </div>
                            )}

                            {visibleColumns.progresso && (
                              <div className="hidden md:flex md:col-span-1 items-center gap-2">
                                <span className="text-xs font-black text-emerald-700 min-w-[28px]">
                                  100%
                                </span>
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `100%` }} />
                                </div>
                              </div>
                            )}

                            {visibleColumns.atualizacoes && (
                              <div className="hidden lg:flex lg:col-span-1 justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'notas');
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 text-xs font-bold"
                                >
                                  <MessageSquare size={13} className="text-slate-400" />
                                  <span>2</span>
                                </button>
                              </div>
                            )}

                            {visibleColumns.documentos && (
                              <div className="hidden lg:flex lg:col-span-1 justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'documentos');
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 text-xs font-bold"
                                >
                                  <Calendar size={13} className="text-slate-400" />
                                  <span>3</span>
                                </button>
                              </div>
                            )}

                            {visibleColumns.normas && (
                              <div className="hidden xl:flex xl:col-span-1 justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'normas');
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 text-xs font-bold"
                                >
                                  <Shield size={13} className="text-slate-400" />
                                  <span>1</span>
                                </button>
                              </div>
                            )}

                            {visibleColumns.acoes && (
                              <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'documentos');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMicroDrawer(micro, 'geral');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* Table Footer / Pagination */}
                <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                  <div>
                    Mostrando {filteredMicros.length} de {totalCount} microatividades
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span>Itens por página:</span>
                      <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700">
                        ‹
                      </button>
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700">
                        ›
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* LIST / KANBAN FALLBACKS */}
            {viewType === 'list' && (
              <div className="space-y-2">
                {filteredMicros.map((micro, idx) => (
                  <div 
                    key={micro.id || idx}
                    onClick={() => handleOpenMicroDrawer(micro)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition cursor-pointer flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{micro.code || `1.${idx+1}`} {micro.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-500">{micro.observations || 'Sem observações'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-black rounded-lg uppercase">
                      {micro.status || 'Planejado'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {viewType === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase">A Iniciar ({groupedMicros.todo.length})</h4>
                  {groupedMicros.todo.map(m => (
                    <div key={m.id} onClick={() => handleOpenMicroDrawer(m)} className="p-3 bg-white rounded-xl border border-slate-200 cursor-pointer shadow-2xs">
                      <p className="text-xs font-black text-slate-900">{m.name}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200 space-y-3">
                  <h4 className="text-xs font-black text-blue-900 uppercase">Em Andamento ({groupedMicros.inProg.length})</h4>
                  {groupedMicros.inProg.map(m => (
                    <div key={m.id} onClick={() => handleOpenMicroDrawer(m)} className="p-3 bg-white rounded-xl border border-blue-200 cursor-pointer shadow-2xs">
                      <p className="text-xs font-black text-slate-900">{m.name}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-black text-emerald-900 uppercase">Concluídas ({groupedMicros.done.length})</h4>
                  {groupedMicros.done.map(m => (
                    <div key={m.id} onClick={() => handleOpenMicroDrawer(m)} className="p-3 bg-white rounded-xl border border-emerald-200 cursor-pointer shadow-2xs">
                      <p className="text-xs font-black text-slate-900">{m.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: INFORMAÇÕES */}
        {activeTab === 'informacoes' && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs font-medium text-slate-700">
            <h3 className="text-sm font-black text-slate-900">Resultados Esperados & Entregáveis</h3>
            <p>{currentMacro?.expectedResults || 'Nenhum entregável específico registrado para esta macroatividade.'}</p>
            {currentMacro?.isPhasePrerequisite && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 font-bold">
                🔒 Esta macroatividade é um pré-requisito mandatório para liberação da {(currentMacro.unlocksPhases || ['Fase I']).join(', ')}.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Documentação & Evidências da Macroatividade</h3>
            <p className="text-xs font-medium text-slate-600">Total de 8 documentos vinculados a esta macroetapa.</p>
          </div>
        )}

        {/* TAB 4: NOTAS */}
        {activeTab === 'notas' && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Notas e Atualizações de Equipe</h3>
            <p className="text-xs font-medium text-slate-600">Histórico de alinhamentos e notas técnicas registradas.</p>
          </div>
        )}

        {/* TAB 5: NORMAS */}
        {activeTab === 'normas' && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Normas Regulatórias Aplicáveis</h3>
            <p className="text-xs font-medium text-slate-600">RDC 55/2010, Guia de Qualidade e Boas Práticas de Laboratório aplicáveis a esta etapa.</p>
          </div>
        )}

        {/* TAB 6: HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Trilha de Auditoria & Modificações</h3>
            <p className="text-xs font-medium text-slate-600">Registro cronológico de alterações e aprovações nesta macroetapa.</p>
          </div>
        )}

      </div>

      {/* 3. CONTEXTUAL DRAWER (LATERAL EDIT PANEL FOR MICROACTIVITIES) */}
      {isDrawerOpen && selectedMicro && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedMicro.code || '1.1'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    {selectedMicro.name}
                  </h3>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1 truncate">
                  {currentMacro?.name} • {currentMacro?.phase}
                </p>
              </div>

              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Drawer Tab Selector */}
            <div className="flex items-center border-b border-slate-100 px-5 bg-white text-xs font-bold overflow-x-auto">
              {[
                { id: 'geral', label: 'Geral & Prazos' },
                { id: 'prerequisitos', label: 'Pré-requisitos' },
                { id: 'notas', label: 'Notas' },
                { id: 'documentos', label: 'Documentos' },
                { id: 'normas', label: 'Normas' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id as typeof drawerTab)}
                  className={`py-3 px-3 transition relative whitespace-nowrap ${
                    drawerTab === t.id ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                  {drawerTab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Drawer Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {drawerTab === 'geral' && (
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Nome da Microatividade
                    </label>
                    <input 
                      type="text"
                      value={selectedMicro.name}
                      onChange={e => setSelectedMicro({ ...selectedMicro, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Observations */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Descrição / Subtítulo
                    </label>
                    <textarea 
                      rows={2}
                      value={selectedMicro.observations || ''}
                      onChange={e => setSelectedMicro({ ...selectedMicro, observations: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Status & Assignee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                        Status
                      </label>
                      <select 
                        value={selectedMicro.status || 'Planejado'}
                        onChange={e => setSelectedMicro({ ...selectedMicro, status: e.target.value as MicroActivityStatus })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído e aprovado">Concluído e aprovado</option>
                        <option value="Concluído com restrições">Concluído com restrições</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                        Responsável
                      </label>
                      <select 
                        value={selectedMicro.assignee || ''}
                        onChange={e => setSelectedMicro({ ...selectedMicro, assignee: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="">Selecione...</option>
                        {teamMembers.map(tm => (
                          <option key={tm.id} value={tm.name}>{tm.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dates: Start & Due */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                        Data de Início
                      </label>
                      <input 
                        type="date"
                        value={selectedMicro.startDate || ''}
                        onChange={e => setSelectedMicro({ ...selectedMicro, startDate: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                        Prazo de Entrega
                      </label>
                      <input 
                        type="date"
                        value={selectedMicro.dueDate || ''}
                        onChange={e => setSelectedMicro({ ...selectedMicro, dueDate: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1">
                      <span>Progresso da Atividade</span>
                      <span className="text-blue-700">{selectedMicro.progress || 0}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selectedMicro.progress || 0}
                      onChange={e => setSelectedMicro({ ...selectedMicro, progress: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              )}

              {drawerTab === 'prerequisitos' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Pré-requisitos e Condições</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 space-y-2">
                    <p>• Validação da documentação inicial</p>
                    <p>• Aprovação de protocolos de bancada</p>
                  </div>
                </div>
              )}

              {drawerTab === 'notas' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Atualizações Rápidas</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
                    <p className="font-bold text-slate-800">28/08/2025 • Bruna Silva:</p>
                    <p className="mt-1">Iniciada a primeira bateria de testes de bancada com rendimento favorável.</p>
                  </div>
                </div>
              )}

              {drawerTab === 'documentos' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Evidências Anexadas</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
                    <p>📎 Relatório_Parcial_Formulacao_v1.pdf</p>
                  </div>
                </div>
              )}

              {drawerTab === 'normas' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Normas e Guias Vinculados</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
                    <p>🛡 RDC 55/2010 - Registro de Produtos Biológicos</p>
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              <button 
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta microatividade?')) {
                    if (!currentMacro) return;
                    const updatedMicros = currentMacro.microActivities.filter(m => m.id !== selectedMicro.id);
                    const updatedMacros = project.macroActivities.map(m => 
                      m.id === currentMacro.id ? { ...m, microActivities: updatedMicros } : m
                    );
                    onUpdateProject({ ...project, macroActivities: updatedMacros });
                    setIsDrawerOpen(false);
                  }
                }}
                className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Excluir
              </button>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>

                <button 
                  type="button"
                  onClick={() => handleSaveMicroActivity(selectedMicro)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                >
                  <Save size={14} /> Salvar alterações
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. MODAL: EDITAR INFORMAÇÕES DA MACROATIVIDADE (INCLUINDO LIBERAÇÃO DE FASES) */}
      {isEditMacroModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Editar Macroatividade
              </h3>
              <button 
                onClick={() => setIsEditMacroModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome da Macroatividade</label>
                <input 
                  type="text"
                  value={editMacroName}
                  onChange={e => setEditMacroName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fase Pertencente</label>
                <select 
                  value={editMacroPhase}
                  onChange={e => setEditMacroPhase(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {(project.phases && project.phases.length > 0 ? project.phases : ['Prova de Conceito', 'Fase Não Clínica', 'Fase I', 'Fase II', 'Fase IV', 'Fase V']).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resultados Esperados & Entregáveis</label>
                <textarea 
                  rows={2}
                  value={editMacroExpectedResults}
                  onChange={e => setEditMacroExpectedResults(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  placeholder="Entregáveis desta macroetapa..."
                />
              </div>

              {/* DEPENDÊNCIA DE FASE: Sim / Não e seleção */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-black text-purple-950 uppercase text-[11px] block">
                      Esta macroatividade é necessária para liberar outra fase?
                    </label>
                    <p className="text-[11px] font-semibold text-purple-700 mt-0.5">
                      Define a macroatividade como pré-requisito de transição no mapa de fases.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-purple-200">
                    <button
                      type="button"
                      onClick={() => setEditMacroIsPhasePrereq(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                        editMacroIsPhasePrereq ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMacroIsPhasePrereq(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                        !editMacroIsPhasePrereq ? 'bg-slate-200 text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {editMacroIsPhasePrereq && (
                  <div className="pt-2 border-t border-purple-200 space-y-2">
                    <label className="text-[10px] font-black uppercase text-purple-900 tracking-wider">
                      Selecione qual(is) fase(s) ela libera:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Fase I', 'Fase II', 'Fase IV', 'Fase V'].map(p => {
                        const isChecked = editMacroUnlocksPhases.includes(p);
                        return (
                          <label key={p} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-purple-100 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setEditMacroUnlocksPhases([...editMacroUnlocksPhases, p]);
                                } else {
                                  setEditMacroUnlocksPhases(editMacroUnlocksPhases.filter(x => x !== p));
                                }
                              }}
                              className="w-4 h-4 rounded text-purple-600"
                            />
                            <span className="text-xs font-bold text-purple-950">{p}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setIsEditMacroModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveMacroInfo}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
              >
                Salvar Macroatividade
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL: CONFIGURAR EXIBIÇÃO DE COLUNAS */}
      {isConfigDisplayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Configurar Exibição
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Personalize quais colunas deseja visualizar na tabela
                </p>
              </div>
              <button 
                onClick={() => setIsConfigDisplayModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-slate-400">
                <span className="font-bold">Microatividade</span>
                <span className="text-[10px] font-black uppercase">Fixo Obrigatório</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-slate-400">
                <span className="font-bold">Status</span>
                <span className="text-[10px] font-black uppercase">Fixo Obrigatório</span>
              </div>

              {[
                { id: 'responsavel', label: 'Responsável' },
                { id: 'prazo', label: 'Prazo' },
                { id: 'progresso', label: 'Progresso' },
                { id: 'atualizacoes', label: 'Atualizações' },
                { id: 'documentos', label: 'Documentos' },
                { id: 'normas', label: 'Normas' },
                { id: 'acoes', label: 'Ações' }
              ].map(col => {
                const key = col.id as keyof typeof visibleColumns;
                const isChecked = visibleColumns[key];
                return (
                  <label key={col.id} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition">
                    <span className="font-bold text-slate-800">{col.label}</span>
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setIsConfigDisplayModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSaveColumnConfig(visibleColumns)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
              >
                Salvar preferências
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL: DEPENDÊNCIAS DA MACROATIVIDADE */}
      {isMacroDepsModalOpen && currentMacro && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Dependências da Macroatividade
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  {currentMacro.code || '2.1'} {currentMacro.name}
                </p>
              </div>
              <button 
                onClick={() => setIsMacroDepsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>✓ Protocolo de Bancada Validados</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-200">Concluído</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>✓ Aprovação do Comitê de Ética</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-200">Concluído</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>● Relatório de Estabilidade Acelerada</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-amber-200">Em andamento</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setIsMacroDepsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
