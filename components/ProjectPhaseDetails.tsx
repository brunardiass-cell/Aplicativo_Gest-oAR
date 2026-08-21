import React, { useState, useMemo } from 'react';
import { 
  Project, 
  MacroActivity, 
  MicroActivity, 
  TeamMember, 
  RegulatoryStandard, 
  MicroActivityStatus,
  Priority,
  Prerequisite
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
  Eye, 
  EyeOff, 
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
  Sparkles
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

type FilterTab = 'em_andamento' | 'planejadas' | 'bloqueadas' | 'concluidas';

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
  const [activeTab, setActiveTab] = useState<FilterTab>('em_andamento');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedMicroIds, setExpandedMicroIds] = useState<Set<string>>(new Set());
  const [editingMicroId, setEditingMicroId] = useState<string | null>(null);
  const [menuOpenMicroId, setMenuOpenMicroId] = useState<string | null>(null);
  const [highlightedMicroId, setHighlightedMicroId] = useState<string | null>(null);

  // Identifica a macroetapa atual
  const currentMacro = useMemo(() => {
    return project.macroActivities.find(m => m.id === currentMacroId) || project.macroActivities[0];
  }, [project, currentMacroId]);

  // Lista de microatividades da fase com cálculos e ordenação
  const microActivities = useMemo(() => {
    if (!currentMacro?.microActivities) return [];
    return currentMacro.microActivities;
  }, [currentMacro]);

  // Próxima macroetapa no fluxo
  const nextMacro = useMemo(() => {
    const currentIndex = project.macroActivities.findIndex(m => m.id === currentMacro?.id);
    if (currentIndex >= 0 && currentIndex < project.macroActivities.length - 1) {
      return project.macroActivities[currentIndex + 1];
    }
    return null;
  }, [project, currentMacro]);

  // Contagens por categoria
  const inProgressList = useMemo(() => {
    return microActivities.filter(m => 
      m.status === 'Em andamento' || 
      (!m.isBlocked && m.status !== 'Planejado' && m.status !== 'Concluído e aprovado' && m.status !== 'Concluído com restrições')
    );
  }, [microActivities]);

  const plannedList = useMemo(() => {
    return microActivities.filter(m => m.status === 'Planejado' && !m.isBlocked);
  }, [microActivities]);

  const blockedList = useMemo(() => {
    return microActivities.filter(m => 
      m.isBlocked || 
      m.status === 'A repetir / retrabalho' ||
      (m.prerequisites && m.prerequisites.some(p => p.status === 'não iniciado' && !p.completed))
    );
  }, [microActivities]);

  const completedList = useMemo(() => {
    return microActivities.filter(m => 
      m.status === 'Concluído e aprovado' || 
      m.status === 'Concluído com restrições' || 
      (m.progress && m.progress >= 100)
    );
  }, [microActivities]);

  // Estatísticas gerais da fase
  const totalCount = microActivities.length;
  const completedCount = completedList.length;
  const phaseProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Lista filtrada para exibição na tabela
  const displayedList = useMemo(() => {
    switch (activeTab) {
      case 'em_andamento':
        return inProgressList;
      case 'planejadas':
        return plannedList;
      case 'bloqueadas':
        return blockedList;
      case 'concluidas':
        return completedList;
      default:
        return inProgressList;
    }
  }, [activeTab, inProgressList, plannedList, blockedList, completedList]);

  // Pré-requisitos para iniciar a próxima etapa
  const nextStageConditions = useMemo(() => {
    const conditions: { id: string; name: string; status: 'met' | 'in_progress' | 'pending'; microId?: string; assignee?: string }[] = [];
    
    // Coleta as 5 primeiras atividades da fase atual para demonstrar a passagem de bastão
    microActivities.slice(0, 5).forEach((m, idx) => {
      let condStatus: 'met' | 'in_progress' | 'pending' = 'pending';
      if (m.status === 'Concluído e aprovado' || (m.progress && m.progress >= 100)) {
        condStatus = 'met';
      } else if (m.status === 'Em andamento' || (m.progress && m.progress > 0)) {
        condStatus = 'in_progress';
      }
      conditions.push({
        id: m.id || `cond_${idx}`,
        name: m.name,
        status: condStatus,
        microId: m.id,
        assignee: m.assignee
      });
    });

    if (conditions.length === 0) {
      return [
        { id: 'c1', name: 'Síntese do DNA plasmidial concluída', status: 'met' as const },
        { id: 'c2', name: 'Caracterização bioquímica concluída', status: 'met' as const },
        { id: 'c3', name: 'Banco de célula mestre disponível', status: 'met' as const },
        { id: 'c4', name: 'Seleção de clones em andamento', status: 'in_progress' as const },
        { id: 'c5', name: 'Aprovação regulatória necessária', status: 'pending' as const },
      ];
    }

    return conditions;
  }, [microActivities]);

  // Próxima ação sugerida
  const suggestedAction = useMemo(() => {
    const inProg = inProgressList.find(m => (m.progress || 0) < 90) || inProgressList[0] || plannedList[0];
    if (inProg) {
      return {
        microId: inProg.id,
        name: inProg.name,
        code: inProg.code || '2.2',
        assignee: inProg.assignee || 'Ester'
      };
    }
    return {
      microId: microActivities[0]?.id || '',
      name: 'Concluir seleção de clones e caracterização',
      code: '2.2',
      assignee: 'Ester'
    };
  }, [inProgressList, plannedList, microActivities]);

  const toggleExpand = (id: string) => {
    setExpandedMicroIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpdateMicro = (microId: string, updates: Partial<MicroActivity>) => {
    if (!currentMacro) return;
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === currentMacro.id) {
        const updatedMicros = macro.microActivities.map(micro => {
          if (micro.id === microId) {
            const next = { ...micro, ...updates };
            if (updates.status === 'Concluído e aprovado') {
              next.progress = 100;
            }
            return next;
          }
          return micro;
        });
        return { ...macro, microActivities: updatedMicros };
      }
      return macro;
    });

    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };

  const getPriorityBadge = (priority?: Priority) => {
    switch (priority) {
      case 'Alta':
      case 'Urgente':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200">Alta</span>;
      case 'Baixa':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-slate-600 bg-slate-100 border border-slate-200">Baixa</span>;
      case 'Média':
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200">Média</span>;
    }
  };

  const getStatusBadge = (status: MicroActivityStatus) => {
    switch (status) {
      case 'Concluído e aprovado':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200">Concluída</span>;
      case 'Concluído com restrições':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-200">Revisão</span>;
      case 'A repetir / retrabalho':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-rose-800 bg-rose-100 border border-rose-200">Bloqueada</span>;
      case 'Planejado':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200">Planejada</span>;
      case 'Em andamento':
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-blue-800 bg-blue-100 border border-blue-200">Em andamento</span>;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-slate-700 text-white';
    const first = name.charAt(0).toUpperCase();
    if (['A', 'B', 'C'].includes(first)) return 'bg-emerald-600 text-white';
    if (['D', 'E', 'F'].includes(first)) return 'bg-purple-600 text-white';
    if (['G', 'H', 'I'].includes(first)) return 'bg-blue-600 text-white';
    if (['J', 'K', 'L', 'M'].includes(first)) return 'bg-amber-600 text-white';
    return 'bg-teal-600 text-white';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER ROW: Back button, Macro Name + Badge, Progress, + Nova Microatividade */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-2">
          <button
            onClick={onBackToMap}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition mb-1"
          >
            <ArrowLeft size={14} />
            <span>Voltar para o mapa</span>
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {currentMacro?.name || 'FASE NÃO CLÍNICA'}
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md uppercase tracking-wider">
              {phaseProgress === 100 ? 'CONCLUÍDA' : 'ATUAL'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs pt-1 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400">Progresso da fase</span>
            <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-700" 
                style={{ width: `${phaseProgress}%` }} 
              />
            </div>
            <span className="text-xs font-black text-slate-800">{phaseProgress}%</span>
            <span className="text-[11px] font-bold text-slate-400">
              {completedCount} de {totalCount} atividades concluídas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={onOpenNewMicroModal}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} />
            <span>Nova microatividade</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN OPERATIONAL LAYOUT: Filter Sidebar + Main Table + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT FILTER SIDEBAR (col-span-2) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-3 border border-slate-200/90 shadow-2xs space-y-1">
          <button
            onClick={() => setActiveTab('em_andamento')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'em_andamento'
                ? 'bg-emerald-100/90 text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Em andamento</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'em_andamento' ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {inProgressList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('planejadas')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'planejadas'
                ? 'bg-emerald-100/90 text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Planejadas</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'planejadas' ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {plannedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bloqueadas')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'bloqueadas'
                ? 'bg-rose-100/90 text-rose-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Bloqueadas</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'bloqueadas' ? 'bg-white text-rose-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {blockedList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('concluidas');
              setShowCompleted(true);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'concluidas'
                ? 'bg-emerald-100/90 text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>Concluídas</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'concluidas' ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {completedList.length}
            </span>
          </button>

          <div className="pt-3 mt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (activeTab === 'concluidas') {
                  setActiveTab('em_andamento');
                } else {
                  setActiveTab('concluidas');
                }
              }}
              className="w-full py-2 px-3 text-[11px] font-black text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Eye size={13} />
              <span>{activeTab === 'concluidas' ? 'Ocultar concluídas' : 'Ver concluídas'}</span>
            </button>
          </div>
        </div>

        {/* MAIN TABLE (col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4 overflow-hidden">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>
                {activeTab === 'em_andamento' && 'ATIVIDADES EM ANDAMENTO'}
                {activeTab === 'planejadas' && 'ATIVIDADES PLANEJADAS'}
                {activeTab === 'bloqueadas' && 'ATIVIDADES BLOQUEADAS'}
                {activeTab === 'concluidas' && 'ATIVIDADES CONCLUÍDAS'}
              </span>
              <Info size={13} className="text-slate-400" />
            </h3>

            <span className="text-[11px] font-bold text-slate-400">
              {displayedList.length} {displayedList.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-2 w-8"></th>
                  <th className="py-3 px-3">Microatividade</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Prazo</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-2">Prioridade</th>
                  <th className="py-3 px-2 text-center">Pré-req.</th>
                  <th className="py-3 px-3">Progresso</th>
                  <th className="py-3 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.map((micro, idx) => {
                  const isExpanded = expandedMicroIds.has(micro.id);
                  const isHighlighted = highlightedMicroId === micro.id;
                  const formattedDate = micro.dueDate 
                    ? new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '--/--/----';

                  return (
                    <React.Fragment key={micro.id}>
                      <tr
                        onClick={() => toggleExpand(micro.id)}
                        className={`hover:bg-slate-50/80 transition cursor-pointer group text-xs ${
                          isHighlighted ? 'bg-teal-50/60 border-l-4 border-teal-600' : ''
                        }`}
                      >
                        {/* Expand Chevron */}
                        <td className="py-3.5 px-2 text-slate-400">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>

                        {/* Name + Code */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            {micro.code && (
                              <span className="font-black text-slate-500 text-[11px] shrink-0">
                                {micro.code}
                              </span>
                            )}
                            <span className="font-black text-slate-900 uppercase tracking-tight group-hover:text-teal-700 transition">
                              {micro.name}
                            </span>
                          </div>
                        </td>

                        {/* Assignee */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 shadow-xs ${getAvatarColor(micro.assignee)}`}>
                              {getInitials(micro.assignee)}
                            </div>
                            <span className="font-bold text-slate-700 text-xs">
                              {micro.assignee || 'Não atribuído'}
                            </span>
                          </div>
                        </td>

                        {/* Prazo */}
                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-[11px]">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3">
                          {getStatusBadge(micro.status)}
                        </td>

                        {/* Priority Badge */}
                        <td className="py-3.5 px-2">
                          {getPriorityBadge(micro.priority)}
                        </td>

                        {/* Prerequisites indicator */}
                        <td className="py-3.5 px-2 text-center">
                          {micro.code ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded">
                              {micro.code}
                            </span>
                          ) : micro.prerequisites && micro.prerequisites.length > 0 ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded">
                              {micro.prerequisites.length}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* Progress bar */}
                        <td className="py-3.5 px-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-700 w-8">
                              {micro.progress || (micro.status === 'Concluído e aprovado' ? 100 : 0)}%
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${micro.progress || (micro.status === 'Concluído e aprovado' ? 100 : 0)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions Menu */}
                        <td className="py-3.5 px-2 text-right">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenMicroId(menuOpenMicroId === micro.id ? null : micro.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {menuOpenMicroId === micro.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in duration-150">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateMicro(micro.id, { 
                                      status: micro.status === 'Concluído e aprovado' ? 'Em andamento' : 'Concluído e aprovado',
                                      progress: micro.status === 'Concluído e aprovado' ? 50 : 100
                                    });
                                    setMenuOpenMicroId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  <span>{micro.status === 'Concluído e aprovado' ? 'Marcar em andamento' : 'Concluir atividade'}</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDeletionModal({
                                      type: 'micro',
                                      ids: { projectId: project.id, macroId: currentMacro.id, microId: micro.id },
                                      name: micro.name
                                    });
                                    setMenuOpenMicroId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 size={13} />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ACCORDION ROW (Progressive Disclosure) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="space-y-4 text-xs animate-in fade-in duration-200">
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Observações & Descrição */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                    Observações e Metodologia
                                  </span>
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                                    {micro.observations || 'Nenhuma observação cadastrada para esta microatividade.'}
                                  </p>
                                </div>

                                {/* Pré-requisitos e Dependências */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                    Pré-requisitos e Condições
                                  </span>
                                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                                    {micro.prerequisites && micro.prerequisites.length > 0 ? (
                                      micro.prerequisites.map(p => (
                                        <div key={p.id} className="flex items-center justify-between text-xs font-bold text-slate-700">
                                          <div className="flex items-center gap-2">
                                            {p.completed || p.status === 'concluído' ? (
                                              <Check size={13} className="text-emerald-600" />
                                            ) : (
                                              <Clock size={13} className="text-amber-500" />
                                            )}
                                            <span>{p.name}</span>
                                          </div>
                                          <span className="text-[10px] uppercase text-slate-400">{p.status}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[11px] text-slate-400 italic">
                                        Nenhum pré-requisito bloqueante registrado.
                                      </p>
                                    )}
                                  </div>
                                </div>

                              </div>

                              {/* Quick inline status / progress adjuster */}
                              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase text-slate-400">Alterar Status:</span>
                                  <select
                                    value={micro.status}
                                    onChange={(e) => handleUpdateMicro(micro.id, { status: e.target.value as MicroActivityStatus })}
                                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                  >
                                    <option value="Em andamento">Em andamento</option>
                                    <option value="Planejado">Planejada</option>
                                    <option value="Concluído e aprovado">Concluída e aprovada</option>
                                    <option value="Concluído com restrições">Concluída com restrições</option>
                                    <option value="A repetir / retrabalho">A repetir / retrabalho</option>
                                  </select>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase text-slate-400">Ajustar Progresso:</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={micro.progress || 0}
                                    onChange={(e) => handleUpdateMicro(micro.id, { progress: Number(e.target.value) })}
                                    className="w-28 accent-teal-600"
                                  />
                                  <span className="font-black text-slate-800 text-xs w-8">
                                    {micro.progress || 0}%
                                  </span>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {displayedList.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Layers size={32} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold uppercase text-slate-500">
                  Nenhuma atividade nesta categoria
                </p>
                <p className="text-[11px] text-slate-400">
                  Alterne entre as abas ao lado ou clique em "+ Nova microatividade" para adicionar.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR (col-span-3, Matches Image 2 right column) */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Card: PRÉ-REQUISITOS DA PRÓXIMA ETAPA */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                PRÉ-REQUISITOS DA PRÓXIMA ETAPA
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                Para iniciar a {nextMacro?.name || 'Fase 1/2'}
              </p>
            </div>

            <div className="space-y-2.5">
              {nextStageConditions.map(cond => {
                const isMet = cond.status === 'met';
                const isInProgress = cond.status === 'in_progress';

                return (
                  <div key={cond.id} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                    {isMet && (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                    )}
                    {isInProgress && (
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      </div>
                    )}
                    {!isMet && !isInProgress && (
                      <div className="w-4 h-4 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      </div>
                    )}
                    <span className={isMet ? 'text-slate-800' : isInProgress ? 'text-slate-600' : 'text-slate-500'}>
                      {cond.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => onBackToMap()}
                className="text-xs font-black text-indigo-700 hover:text-indigo-900 transition flex items-center gap-1"
              >
                <span>Ver todos os pré-requisitos</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card: PRÓXIMA AÇÃO SUGERIDA */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                PRÓXIMA AÇÃO SUGERIDA
              </h3>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <ListTodo size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900 uppercase leading-snug">
                  {suggestedAction.name}
                </h4>
                <p className="text-[10px] font-bold text-slate-500">
                  Microatividade {suggestedAction.code} · Responsável: {suggestedAction.assignee}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (suggestedAction.microId) {
                  setActiveTab('em_andamento');
                  setHighlightedMicroId(suggestedAction.microId);
                  setExpandedMicroIds(new Set([suggestedAction.microId]));
                }
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <span>Acessar atividade</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
