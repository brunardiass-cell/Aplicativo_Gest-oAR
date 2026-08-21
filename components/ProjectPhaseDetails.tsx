import React, { useState, useMemo } from 'react';
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
  FolderOpen
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

type ContextDrawerTab = 'detalhes' | 'prerequisitos' | 'notas' | 'documentos' | 'normas';

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
  // Controle de visibilidade das concluídas (Progressive Disclosure)
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterMode, setFilterMode] = useState<'default' | 'all' | 'in_progress' | 'todo'>('default');

  // Painel lateral contextual sob demanda
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<ContextDrawerTab>('prerequisitos');
  const [selectedMicro, setSelectedMicro] = useState<MicroActivity | null>(null);

  // Menu de opções de microatividade (3 pontinhos)
  const [menuOpenMicroId, setMenuOpenMicroId] = useState<string | null>(null);

  // Modal rápido de adicionar pré-requisito
  const [isAddPrereqOpen, setIsAddPrereqOpen] = useState(false);
  const [prereqType, setPrereqType] = useState<string>('Documento');
  const [prereqItemName, setPrereqItemName] = useState('');

  // Identifica a macroetapa atual
  const currentMacro = useMemo(() => {
    return project.macroActivities.find(m => m.id === currentMacroId) || project.macroActivities[0];
  }, [project, currentMacroId]);

  // Lista de microatividades da fase
  const microActivities = useMemo(() => {
    if (!currentMacro?.microActivities) return [];
    return currentMacro.microActivities;
  }, [currentMacro]);

  // Contagens estruturadas
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
      (!m.isBlocked && m.status !== 'Planejado' && m.status !== 'Concluído e aprovado' && m.status !== 'Concluído com restrições')
    );
  }, [microActivities]);

  const todoList = useMemo(() => {
    return microActivities.filter(m => m.status === 'Planejado');
  }, [microActivities]);

  const totalCount = microActivities.length;
  const completedCount = completedList.length;
  const inProgressCount = inProgressList.length;
  const todoCount = todoList.length;
  const macroProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Lista visível de microatividades
  const displayedMicros = useMemo(() => {
    if (filterMode === 'all') {
      return microActivities;
    }
    if (filterMode === 'in_progress') {
      return inProgressList;
    }
    if (filterMode === 'todo') {
      return todoList;
    }
    
    // Default: Mostra Em andamento + A fazer, e concluídas somente se showCompleted for true
    if (showCompleted) {
      return microActivities;
    }
    return microActivities.filter(m => 
      m.status !== 'Concluído e aprovado' && 
      m.status !== 'Concluído com restrições' && 
      (!m.progress || m.progress < 100)
    );
  }, [microActivities, inProgressList, todoList, filterMode, showCompleted]);

  // Código visual da macroetapa
  const macroCode = useMemo(() => {
    if (!currentMacro) return '2.1';
    if (currentMacro.code) return currentMacro.code;
    const nameLower = currentMacro.name.toLowerCase();
    if (nameLower.includes('farmacotécnico')) return '2.1';
    if (nameLower.includes('pré-clínicos') || nameLower.includes('estudos pré')) return '2.2';
    if (nameLower.includes('regulatória')) return 'R';
    if (nameLower.includes('prova de conceito')) return '1';
    if (nameLower.includes('não clínica')) return '2';
    if (nameLower.includes('fase 1') || nameLower.includes('fase 1/2')) return '3';
    if (nameLower.includes('fase 3')) return '4';
    if (nameLower.includes('registro')) return '5';
    const idx = project.macroActivities.findIndex(m => m.id === currentMacro.id);
    return `${idx + 1}`;
  }, [currentMacro, project]);

  // Lista de pré-requisitos da macro ou da micro selecionada
  const activePrerequisites = useMemo(() => {
    if (selectedMicro) {
      return selectedMicro.prerequisites || [];
    }
    return currentMacro?.prerequisites || [];
  }, [selectedMicro, currentMacro]);

  // Cálculo de prontidão
  const readiness = useMemo(() => {
    const pres = activePrerequisites;
    if (pres.length === 0) {
      // Itens contextuais de demonstração fiéis ao design
      const mockItems = [
        { id: 'p1', name: 'Protocolo definido', type: 'Documento', status: 'concluído' as const, completed: true },
        { id: 'p2', name: 'Documento técnico disponível', type: 'Documento', status: 'concluído' as const, completed: true },
        { id: 'p3', name: 'Responsável definido', type: 'Manual', status: 'concluído' as const, completed: true },
        { id: 'p4', name: 'Aprovação do comitê técnico', type: 'Reunião', status: 'em andamento' as const, completed: false },
        { id: 'p5', name: 'Aprovação regulatória inicial', type: 'Documento', status: 'não iniciado' as const, completed: false },
      ];
      return {
        items: mockItems,
        total: mockItems.length,
        metCount: 3,
        isReady: false
      };
    }

    const total = pres.length;
    const metCount = pres.filter(p => p.completed || p.status === 'concluído').length;
    const isReady = total > 0 && metCount === total;

    return {
      items: pres,
      total,
      metCount,
      isReady
    };
  }, [activePrerequisites]);

  // Handler para atualizar dados da microatividade
  const handleUpdateMicro = (microId: string, updates: Partial<MicroActivity>) => {
    if (!currentMacro) return;
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === currentMacro.id) {
        const updatedMicros = (macro.microActivities || []).map(micro => {
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

  // Handler para atualizar pré-requisitos da macro ou micro
  const handleUpdatePrerequisitesList = (updatedPres: Prerequisite[]) => {
    if (!currentMacro) return;

    if (selectedMicro) {
      handleUpdateMicro(selectedMicro.id, { prerequisites: updatedPres });
      setSelectedMicro(prev => prev ? { ...prev, prerequisites: updatedPres } : null);
      return;
    }

    // Atualiza na macroatividade
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === currentMacro.id) {
        return { ...macro, prerequisites: updatedPres };
      }
      return macro;
    });
    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };

  // Salvar novo pré-requisito
  const handleSaveNewPrerequisite = () => {
    if (!prereqItemName.trim()) return;

    const newPre: Prerequisite = {
      id: 'pre_' + Math.random().toString(36).substr(2, 9),
      name: prereqItemName.trim(),
      type: 'recurso',
      status: 'não iniciado',
      completed: false,
      leadTimeDays: 7
    };

    const currentList = activePrerequisites;
    const updated = [...currentList, newPre];
    handleUpdatePrerequisitesList(updated);

    setPrereqItemName('');
    setIsAddPrereqOpen(false);
  };

  // Abrir gaveta lateral para microatividade específica
  const handleOpenMicroDrawer = (micro: MicroActivity, tab: ContextDrawerTab = 'detalhes') => {
    setSelectedMicro(micro);
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  // Abrir gaveta lateral para pré-requisitos da macroetapa
  const handleOpenMacroPrereqs = () => {
    setSelectedMicro(null);
    setDrawerTab('prerequisitos');
    setIsDrawerOpen(true);
  };

  // Iniciais para o avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.trim().charAt(0).toUpperCase();
  };

  // Cor do avatar baseada no nome
  const getAvatarBg = (name?: string) => {
    if (!name) return 'bg-slate-700 text-white';
    const first = name.trim().charAt(0).toUpperCase();
    if (['A', 'B'].includes(first)) return 'bg-amber-600 text-white';
    if (['C', 'D'].includes(first)) return 'bg-blue-600 text-white';
    if (['E', 'F', 'G'].includes(first)) return 'bg-emerald-600 text-white';
    if (['H', 'I', 'J', 'K'].includes(first)) return 'bg-purple-600 text-white';
    return 'bg-teal-700 text-white';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SECTION HEADER TAG */}
      <div className="flex items-center justify-between bg-white/60 px-2 py-1 rounded-2xl">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500">
          ABA 2 — DETALHAMENTO DAS FASES (VISÃO OPERACIONAL LIMPA)
        </div>
      </div>

      {/* MAIN TWO-COLUMN / THREE-COLUMN PROGRESSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: RESUMO DA MACROATIVIDADE (4 Colunas) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* Back button to Phase Map */}
          <button
            onClick={onBackToMap}
            className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-900 transition hover:-translate-x-0.5"
          >
            <ArrowLeft size={14} />
            <span>Voltar para o mapa de fases</span>
          </button>

          {/* Macro Code Circle + Title */}
          <div className="flex items-start gap-3.5 pt-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              {macroCode}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                {currentMacro?.name || 'DESENVOLVIMENTO FARMACOTÉCNICO'}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 mt-1">
                Progresso da macroatividade: <span className="text-slate-800 font-black">{macroProgress}%</span>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-700" 
              style={{ width: `${macroProgress}%` }} 
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400">
            {totalCount} de {totalCount} atividades
          </div>

          {/* Counter Summary Pills */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
            <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/60 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="stroke-[3]" /> Concluídas
              </span>
              <span className="font-black">{completedCount}</span>
            </div>

            <div className="flex items-center justify-between text-blue-700 bg-blue-50/60 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Em andamento
              </span>
              <span className="font-black">{inProgressCount}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border-2 border-slate-400 inline-block" /> A fazer
              </span>
              <span className="font-black">{todoCount}</span>
            </div>
          </div>

          {/* RESUMO DA MACROATIVIDADE CARD */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              RESUMO DA MACROATIVIDADE
            </h4>
            
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              {currentMacro?.expectedResults || 'Desenvolver formulações candidatas e realizar testes iniciais de estabilidade.'}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Responsável</span>
                <span className="text-slate-800 font-black">{project.responsible || 'Bruna Silva'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Início</span>
                <span className="text-slate-800 font-black">10/05/2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Previsão de término</span>
                <span className="text-slate-800 font-black">20/06/2025</span>
              </div>
            </div>

            {/* Quick Button to Open Prerequisites in Drawer */}
            <button
              onClick={handleOpenMacroPrereqs}
              className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition flex items-center justify-center gap-2"
            >
              <ListTodo size={14} className="text-teal-600" />
              <span>Ver Pré-requisitos da Fase</span>
            </button>
          </div>

        </div>

        {/* CENTER / MAIN COLUMN: TABELA DE MICROATIVIDADES (8 Colunas - ocupa tudo se drawer fechado) */}
        <div className={`transition-all duration-300 ${isDrawerOpen ? 'lg:col-span-4' : 'lg:col-span-8'} space-y-4`}>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            
            {/* Table Top Actions: + Nova microatividade and Filter */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={onOpenNewMicroModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-xs"
              >
                <Plus size={16} />
                <span>Nova microatividade</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Filter Selector */}
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="default">Padrão (Em andamento + A fazer)</option>
                  <option value="all">Todas as microatividades</option>
                  <option value="in_progress">Apenas em andamento</option>
                  <option value="todo">Apenas a fazer</option>
                </select>
              </div>
            </div>

            {/* THE CLEAN TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pl-2">Microatividade</th>
                    <th className="pb-3 px-2">Responsável</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Prazo</th>
                    <th className="pb-3 pr-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-800">
                  {displayedMicros.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        Nenhuma microatividade encontrada neste filtro.
                      </td>
                    </tr>
                  ) : (
                    displayedMicros.map((micro) => {
                      const isCompleted = micro.status === 'Concluído e aprovado' || (micro.progress && micro.progress >= 100);
                      const isPlanned = micro.status === 'Planejado';
                      const isSelected = selectedMicro?.id === micro.id && isDrawerOpen;

                      return (
                        <tr 
                          key={micro.id}
                          className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => handleOpenMicroDrawer(micro, 'detalhes')}
                        >
                          {/* 1. Microatividade com seta expansível */}
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-2">
                              <ChevronRight 
                                size={14} 
                                className="text-slate-400 group-hover:text-blue-600 transition shrink-0" 
                              />
                              <span className="font-bold text-slate-900 leading-snug">
                                {micro.name}
                              </span>
                            </div>
                          </td>

                          {/* 2. Responsável com avatar */}
                          <td className="py-3.5 px-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${getAvatarBg(micro.assignee)}`}>
                                {getInitials(micro.assignee)[0]}
                              </div>
                              <span className="text-slate-700 text-xs">
                                {micro.assignee || 'Não atribuído'}
                              </span>
                            </div>
                          </td>

                          {/* 3. Status Badge */}
                          <td className="py-3.5 px-2 whitespace-nowrap">
                            {isCompleted ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-lg">
                                Concluída
                              </span>
                            ) : isPlanned ? (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black rounded-lg">
                                A fazer
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded-lg">
                                Em andamento
                              </span>
                            )}
                          </td>

                          {/* 4. Prazo */}
                          <td className="py-3.5 px-2 whitespace-nowrap text-slate-500 text-[11px] font-semibold">
                            {micro.dueDate 
                              ? new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') 
                              : '12/05/2025'}
                          </td>

                          {/* 5. Ações (Ícones pequenos discretos) */}
                          <td className="py-3.5 pr-2 text-right whitespace-nowrap">
                            <div 
                              className="inline-flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* 💬 Notas */}
                              <button
                                onClick={() => handleOpenMicroDrawer(micro, 'notas')}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Notas e atualizações"
                              >
                                <MessageSquare size={14} />
                              </button>

                              {/* 📎 Documentos */}
                              <button
                                onClick={() => handleOpenMicroDrawer(micro, 'documentos')}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Documentos anexados"
                              >
                                <Paperclip size={14} />
                              </button>

                              {/* 🛡 Normas */}
                              <button
                                onClick={() => handleOpenMicroDrawer(micro, 'normas')}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Normas relacionadas"
                              >
                                <Shield size={14} />
                              </button>

                              {/* ⋯ Mais opções Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setMenuOpenMicroId(menuOpenMicroId === micro.id ? null : micro.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                  title="Mais opções"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {menuOpenMicroId === micro.id && (
                                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in duration-100">
                                    <button
                                      onClick={() => {
                                        handleUpdateMicro(micro.id, {
                                          status: isCompleted ? 'Em andamento' : 'Concluído e aprovado'
                                        });
                                        setMenuOpenMicroId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <CheckCircle2 size={14} className="text-emerald-600" />
                                      <span>{isCompleted ? 'Marcar em andamento' : 'Marcar concluída'}</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleOpenMicroDrawer(micro, 'prerequisitos');
                                        setMenuOpenMicroId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <ListTodo size={14} className="text-teal-600" />
                                      <span>Pré-requisitos</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        onOpenDeletionModal({
                                          type: 'micro',
                                          ids: {
                                            projectId: project.id,
                                            macroId: currentMacro?.id || '',
                                            microId: micro.id
                                          },
                                          name: micro.name
                                        });
                                        setMenuOpenMicroId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 size={14} />
                                      <span>Excluir</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER: Pagination / Progressive disclosure counts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold">
                Mostrando {displayedMicros.length} de {totalCount} microatividades
              </span>

              <div className="flex items-center gap-4">
                {completedCount > 0 && filterMode === 'default' && (
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-blue-600 hover:text-blue-800 font-black hover:underline"
                  >
                    {showCompleted ? 'Ocultar concluídas' : `Ver concluídas (${completedCount})`}
                  </button>
                )}

                <button
                  onClick={() => setFilterMode(filterMode === 'all' ? 'default' : 'all')}
                  className="text-blue-600 hover:text-blue-800 font-black hover:underline flex items-center gap-1"
                >
                  <span>{filterMode === 'all' ? 'Visualização padrão' : 'Ver todas as microatividades'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* SUBTLE FOOTER LEGEND */}
            <div className="flex items-center gap-6 pt-2 text-[10px] font-bold text-slate-400 border-t border-slate-50 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={12} className="text-slate-400" /> Notas e atualizações
              </span>
              <span className="flex items-center gap-1.5">
                <Paperclip size={12} className="text-slate-400" /> Documentos anexados
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={12} className="text-slate-400" /> Normas relacionadas
              </span>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: CONTEXTUAL DRAWER / SIDEBAR (Abre somente sob demanda) */}
        {isDrawerOpen && (
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg space-y-5 animate-in slide-in-from-right-4 duration-200 sticky top-4">
            
            {/* Drawer Header with Contextual Tabs and Close Button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-black uppercase tracking-wider text-slate-500">
                <button
                  onClick={() => setDrawerTab('detalhes')}
                  className={`pb-1 border-b-2 transition ${
                    drawerTab === 'detalhes' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Detalhes
                </button>
                <button
                  onClick={() => setDrawerTab('prerequisitos')}
                  className={`pb-1 border-b-2 transition ${
                    drawerTab === 'prerequisitos' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Pré-requisitos
                </button>
                <button
                  onClick={() => setDrawerTab('notas')}
                  className={`pb-1 border-b-2 transition ${
                    drawerTab === 'notas' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Notas
                </button>
                <button
                  onClick={() => setDrawerTab('documentos')}
                  className={`pb-1 border-b-2 transition ${
                    drawerTab === 'documentos' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Documentos
                </button>
                <button
                  onClick={() => setDrawerTab('normas')}
                  className={`pb-1 border-b-2 transition ${
                    drawerTab === 'normas' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Normas
                </button>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                title="Fechar painel"
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB CONTENT: PRÉ-REQUISITOS */}
            {drawerTab === 'prerequisitos' && (
              <div className="space-y-4">
                
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      {selectedMicro 
                        ? `Esta atividade depende de:` 
                        : `Pré-requisitos para esta macroatividade`}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      Para iniciar e manter esta etapa, os itens abaixo devem estar atendidos.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddPrereqOpen(!isAddPrereqOpen)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-black transition shrink-0"
                  >
                    + Adicionar pré-requisito
                  </button>
                </div>

                {/* Inline Quick Add Prerequisite Form */}
                {isAddPrereqOpen && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      O que precisa estar pronto?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={prereqType}
                        onChange={(e) => setPrereqType(e.target.value)}
                        className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5"
                      >
                        <option value="Documento">Documento</option>
                        <option value="Microatividade">Microatividade</option>
                        <option value="Macroatividade">Macroatividade</option>
                        <option value="Reunião">Reunião / decisão</option>
                        <option value="Aprovação">Aprovação</option>
                        <option value="Marco">Marco</option>
                        <option value="Manual">Condição manual</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nome do item..."
                        value={prereqItemName}
                        onChange={(e) => setPrereqItemName(e.target.value)}
                        className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsAddPrereqOpen(false)}
                        className="px-2 py-1 text-slate-400 text-[10px] font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveNewPrerequisite}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {/* Prerequisite List */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {readiness.items.map((item: any, idx: number) => {
                    const isDone = item.completed || item.status === 'concluído';
                    const isInProg = item.status === 'em andamento';

                    return (
                      <div 
                        key={item.id || idx}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <FileText size={15} className="text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.name}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-400">
                              {item.type || 'Documento'}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge Dropdown */}
                        <div className="shrink-0">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-black">
                              <Check size={12} className="stroke-[3]" /> Concluído
                            </span>
                          ) : isInProg ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-black">
                              <Clock size={12} /> Em andamento
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 text-[10px] font-black">
                              <AlertTriangle size={12} /> Pendente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Readiness Status Box */}
                <div className={`p-3.5 rounded-2xl border text-xs ${
                  readiness.isReady 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50/60 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center justify-between font-black">
                    <span>{readiness.metCount} de {readiness.total} condições atendidas</span>
                    <span>{readiness.isReady ? '✓ Pronta para iniciar' : 'Ainda não recomendado iniciar'}</span>
                  </div>
                </div>

                {/* Dependências da Macroatividade */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    DEPENDÊNCIAS DESTA MACROATIVIDADE
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Outras atividades ou macroatividades que esta depende para avançar.
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Seleção da plataforma</p>
                      <span className="text-[9px] text-slate-400">Microatividade da Fase Não Clínica</span>
                    </div>
                    <span className="text-emerald-700 text-[10px] font-black">✓ Concluída</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: DETALHES DA MICROATIVIDADE */}
            {drawerTab === 'detalhes' && (
              <div className="space-y-4">
                {selectedMicro ? (
                  <>
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-600">Microatividade</span>
                      <h3 className="text-sm font-black text-slate-900 mt-0.5">{selectedMicro.name}</h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-bold">Responsável</span>
                        <span className="text-slate-800 font-black">{selectedMicro.assignee}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-bold">Status</span>
                        <span className="text-slate-800 font-black">{selectedMicro.status}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-bold">Prazo</span>
                        <span className="text-slate-800 font-black">
                          {selectedMicro.dueDate ? new Date(selectedMicro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : '25/05/2025'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">Observações</label>
                      <textarea
                        value={selectedMicro.observations || ''}
                        onChange={(e) => handleUpdateMicro(selectedMicro.id, { observations: e.target.value })}
                        placeholder="Adicione observações para esta microatividade..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:bg-white min-h-[90px]"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 py-4">Selecione uma microatividade para ver detalhes.</p>
                )}
              </div>
            )}

            {/* TAB CONTENT: NOTAS */}
            {drawerTab === 'notas' && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase">Notas e Atualizações</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <span className="text-[9px] font-bold text-slate-400">12/05/2025 — Bruna Silva</span>
                  <p className="text-slate-700 font-medium">Testes preliminares de estabilidade iniciados com sucesso no laboratório.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nova nota..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black">
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DOCUMENTOS */}
            {drawerTab === 'documentos' && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase">Documentos Anexados</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Relatorio_Estabilidade_v1.pdf</span>
                  </div>
                  <span className="text-[10px] text-slate-400">1.4 MB</span>
                </div>
                <button className="w-full py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black">
                  + Anexar Documento
                </button>
              </div>
            )}

            {/* TAB CONTENT: NORMAS */}
            {drawerTab === 'normas' && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase">Normas Relacionadas</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-purple-700 uppercase">RDC 55/2010</span>
                    <p className="text-xs font-bold text-slate-800">Registro de Produtos Biológicos</p>
                  </div>
                  <button 
                    onClick={() => onOpenRegulatoryModal(selectedMicro?.name || currentMacro?.name || '')}
                    className="text-blue-600 text-xs font-black hover:underline"
                  >
                    Ver
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
