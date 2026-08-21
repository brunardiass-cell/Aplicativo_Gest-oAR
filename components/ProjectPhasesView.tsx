import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, MacroActivity, MicroActivity, TeamMember, RegulatoryStandard,
  MicroActivityStatus, Priority, Prerequisite, AppUser
} from '../types';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, AlertTriangle, 
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, MoreVertical, 
  Calendar, User, AlertCircle, Sparkles, Filter, Eye, EyeOff,
  Check, X, ShieldAlert, FileText, ExternalLink, HelpCircle,
  TrendingUp, ListOrdered, Share2, Layers, CheckCircle, Info
} from 'lucide-react';

interface ProjectPhasesViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBackToProjects: () => void;
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  currentUserRole: AppUser['role'] | null;
  regulatoryStandards?: RegulatoryStandard[];
  onOpenRegulatoryModal?: (activityName: string) => void;
  onOpenDeletionModal?: (item: { type: 'project' | 'macro' | 'micro', ids: { projectId: string; macroId?: string; microId?: string; }, name: string }) => void;
  targetMicroId?: string | null;
  onClearTargetMicroId?: () => void;
}

export const ProjectPhasesView: React.FC<ProjectPhasesViewProps> = ({
  project,
  onUpdateProject,
  onBackToProjects,
  teamMembers,
  currentUser,
  currentUserRole,
  regulatoryStandards = [],
  onOpenRegulatoryModal = () => {},
  onOpenDeletionModal,
  targetMicroId,
  onClearTargetMicroId
}) => {
  // Navigation tabs: 'map' (Mapa de Fases) | 'details' (Detalhamento das Fases)
  const [activeTab, setActiveTab] = useState<'map' | 'details'>('map');
  
  // Selected Macroactivity for Detalhamento
  const [selectedMacroId, setSelectedMacroId] = useState<string>('');
  
  // Visibility toggles
  const [showCompletedPhasesInMap, setShowCompletedPhasesInMap] = useState<boolean>(false);
  const [statusFilterInDetails, setStatusFilterInDetails] = useState<'in_progress' | 'planned' | 'blocked' | 'completed'>('in_progress');
  const [showCompletedInDetails, setShowCompletedInDetails] = useState<boolean>(false);
  
  // Expanded microactivity details in table
  const [expandedMicroId, setExpandedMicroId] = useState<string | null>(null);
  
  // Modals
  const [isNewMicroModalOpen, setIsNewMicroModalOpen] = useState<boolean>(false);
  const [isEditMicroModalOpen, setIsEditMicroModalOpen] = useState<boolean>(false);
  const [microToEdit, setMicroToEdit] = useState<{ micro: MicroActivity; macroId: string } | null>(null);
  const [isPrerequisitesModalOpen, setIsPrerequisitesModalOpen] = useState<boolean>(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState<boolean>(false);
  const [tempProjectName, setTempProjectName] = useState<string>(project.name);

  // Focus on targetMicroId if provided
  useEffect(() => {
    if (targetMicroId) {
      // Find which macro contains this microactivity
      for (const macro of project.macroActivities) {
        if (macro.microActivities.some(m => m.id === targetMicroId)) {
          setSelectedMacroId(macro.id);
          setActiveTab('details');
          setExpandedMicroId(targetMicroId);
          if (onClearTargetMicroId) onClearTargetMicroId();
          break;
        }
      }
    }
  }, [targetMicroId]);

  // Set default selected macro if none is selected
  useEffect(() => {
    if (!selectedMacroId && project.macroActivities.length > 0) {
      // Prefer the active/in-progress macro or the first one
      const activeMacro = project.macroActivities.find(m => {
        const hasOngoing = m.microActivities.some(mi => mi.status === 'Em andamento' || mi.status === 'Concluído com restrições' || mi.status === 'A repetir / retrabalho');
        const isNotDone = m.microActivities.some(mi => mi.status !== 'Concluído e aprovado');
        return hasOngoing || isNotDone;
      });
      setSelectedMacroId(activeMacro ? activeMacro.id : project.macroActivities[0].id);
    }
  }, [project.macroActivities, selectedMacroId]);

  // Calculations for overall project stats
  const projectStats = useMemo(() => {
    let totalMicros = 0;
    let completedMicros = 0;
    let inProgressMicros = 0;
    let plannedMicros = 0;
    let blockedMicros = 0;

    project.macroActivities.forEach(macro => {
      macro.microActivities.forEach(micro => {
        totalMicros++;
        if (micro.status === 'Concluído e aprovado') {
          completedMicros++;
        } else if (micro.status === 'Em andamento' || micro.status === 'Concluído com restrições' || micro.status === 'A repetir / retrabalho') {
          inProgressMicros++;
        } else {
          plannedMicros++;
        }

        // Check if blocked by prerequisite
        if (micro.dependsOn && micro.dependsOn.length > 0) {
          // Check if any prerequisite is not completed
          const isBlocked = micro.dependsOn.some(depId => {
            for (const m of project.macroActivities) {
              const found = m.microActivities.find(item => item.id === depId || item.name === depId);
              if (found && found.status !== 'Concluído e aprovado') return true;
            }
            return false;
          });
          if (isBlocked && micro.status !== 'Concluído e aprovado') {
            blockedMicros++;
          }
        }
      });
    });

    const progressPct = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

    // Determine current active macro and next milestone
    let activeMacro: MacroActivity | null = null;
    let nextMilestoneName = 'Ensaio de Validação';
    let nextMilestoneDate = '--/--/----';

    for (const macro of project.macroActivities) {
      const allDone = macro.microActivities.length > 0 && macro.microActivities.every(m => m.status === 'Concluído e aprovado');
      const hasOngoing = macro.microActivities.some(m => m.status === 'Em andamento' || m.status === 'Concluído com restrições' || m.status === 'A repetir / retrabalho');
      
      if (hasOngoing || (!allDone && !activeMacro)) {
        activeMacro = macro;
        // Find next milestone / due date
        const nextMicro = macro.microActivities.find(m => m.status !== 'Concluído e aprovado' && m.dueDate);
        if (nextMicro) {
          nextMilestoneName = nextMicro.name;
          if (nextMicro.dueDate) {
            const parts = nextMicro.dueDate.split('-');
            if (parts.length === 3) {
              nextMilestoneDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            } else {
              nextMilestoneDate = nextMicro.dueDate;
            }
          }
        } else if (macro.dueDate) {
          nextMilestoneName = macro.name;
          const parts = macro.dueDate.split('-');
          if (parts.length === 3) nextMilestoneDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        break;
      }
    }

    if (!activeMacro && project.macroActivities.length > 0) {
      activeMacro = project.macroActivities[project.macroActivities.length - 1];
    }

    return {
      totalMicros,
      completedMicros,
      inProgressMicros,
      plannedMicros,
      blockedMicros,
      progressPct,
      activeMacroId: activeMacro?.id || (project.macroActivities[0]?.id || ''),
      activeMacroName: activeMacro?.name || 'Fase Inicial',
      nextMilestoneName,
      nextMilestoneDate
    };
  }, [project]);

  // Enhanced macro list with calculated metrics
  const macroListWithStats = useMemo(() => {
    return project.macroActivities.map((macro, index) => {
      const total = macro.microActivities.length;
      const done = macro.microActivities.filter(m => m.status === 'Concluído e aprovado').length;
      const inProgress = macro.microActivities.filter(m => m.status === 'Em andamento' || m.status === 'Concluído com restrições' || m.status === 'A repetir / retrabalho').length;
      const pending = total - done;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const isCompleted = total > 0 && done === total;
      const isCurrent = macro.id === projectStats.activeMacroId;

      // Auto-assign code if not set (e.g. "1", "2", "2.1", "2.2", "R", "3")
      let displayCode = macro.code;
      if (!displayCode) {
        if (macro.relationType === 'dependent_block' || macro.relationType === 'dependent_nonblock' || macro.name.toLowerCase().includes('regulatór')) {
          displayCode = 'R';
        } else {
          displayCode = `${index + 1}`;
        }
      }

      return {
        ...macro,
        displayCode,
        total,
        done,
        inProgress,
        pending,
        pct,
        isCompleted,
        isCurrent
      };
    });
  }, [project.macroActivities, projectStats.activeMacroId]);

  // Active macro for Aba 2 (Detalhamento)
  const currentSelectedMacro = useMemo(() => {
    return macroListWithStats.find(m => m.id === selectedMacroId) || macroListWithStats[0] || null;
  }, [macroListWithStats, selectedMacroId]);

  // Determine Next Phase for Sidebar calculation
  const nextPhaseInfo = useMemo(() => {
    if (!currentSelectedMacro) return null;
    const currentIndex = macroListWithStats.findIndex(m => m.id === currentSelectedMacro.id);
    const nextMacro = macroListWithStats[currentIndex + 1] || null;

    // If there is a next macro, build readiness conditions from current macro deliverables / key micros
    if (nextMacro) {
      // Key conditions are the microactivities of currentMacro
      const conditions = currentSelectedMacro.microActivities.map(micro => {
        const isDone = micro.status === 'Concluído e aprovado';
        const isInProgress = micro.status === 'Em andamento' || micro.status === 'Concluído com restrições' || micro.status === 'A repetir / retrabalho';
        return {
          id: micro.id,
          name: micro.name,
          status: isDone ? 'done' : isInProgress ? 'in_progress' : 'pending',
          label: isDone ? 'concluído' : isInProgress ? 'em andamento' : 'pendente'
        };
      });

      const totalCond = conditions.length;
      const doneCond = conditions.filter(c => c.status === 'done').length;
      const readinessPct = totalCond > 0 ? Math.round((doneCond / totalCond) * 100) : 100;
      const pendingCount = totalCond - doneCond;

      return {
        nextMacroName: nextMacro.name,
        readinessPct,
        totalConditions: totalCond,
        doneConditions: doneCond,
        pendingCount,
        conditions: conditions.slice(0, 5) // top 5 conditions for clean display
      };
    }

    // Default fallback conditions
    return {
      nextMacroName: 'Etapa Final / Registro',
      readinessPct: currentSelectedMacro.pct,
      totalConditions: currentSelectedMacro.total,
      doneConditions: currentSelectedMacro.done,
      pendingCount: currentSelectedMacro.pending,
      conditions: currentSelectedMacro.microActivities.slice(0, 5).map(m => ({
        id: m.id,
        name: m.name,
        status: m.status === 'Concluído e aprovado' ? 'done' : m.status === 'Em andamento' ? 'in_progress' : 'pending',
        label: m.status
      }))
    };
  }, [currentSelectedMacro, macroListWithStats]);

  // Smart Suggested Next Action (bottle neck or highest priority in current macro)
  const suggestedNextAction = useMemo(() => {
    if (!currentSelectedMacro) return null;
    const ongoing = currentSelectedMacro.microActivities.find(m => m.status === 'Em andamento');
    if (ongoing) {
      return {
        microId: ongoing.id,
        title: ongoing.name,
        macroCode: currentSelectedMacro.displayCode,
        assignee: ongoing.assignee || project.responsible || 'Responsável'
      };
    }
    const planned = currentSelectedMacro.microActivities.find(m => m.status !== 'Concluído e aprovado');
    if (planned) {
      return {
        microId: planned.id,
        title: planned.name,
        macroCode: currentSelectedMacro.displayCode,
        assignee: planned.assignee || project.responsible || 'Responsável'
      };
    }
    return null;
  }, [currentSelectedMacro, project.responsible]);

  // Filtered microactivities for table in Aba 2
  const filteredMicroActivities = useMemo(() => {
    if (!currentSelectedMacro) return [];
    
    return currentSelectedMacro.microActivities.filter(micro => {
      const isDone = micro.status === 'Concluído e aprovado';
      const isInProgress = micro.status === 'Em andamento' || micro.status === 'Concluído com restrições' || micro.status === 'A repetir / retrabalho';
      const isBlocked = micro.dependsOn && micro.dependsOn.length > 0 && micro.dependsOn.some(depId => {
        for (const m of project.macroActivities) {
          const found = m.microActivities.find(item => item.id === depId || item.name === depId);
          if (found && found.status !== 'Concluído e aprovado') return true;
        }
        return false;
      });

      if (statusFilterInDetails === 'in_progress') {
        return isInProgress;
      }
      if (statusFilterInDetails === 'planned') {
        return micro.status === 'Planejado';
      }
      if (statusFilterInDetails === 'blocked') {
        return isBlocked && !isDone;
      }
      if (statusFilterInDetails === 'completed') {
        return isDone;
      }

      // If showCompletedInDetails is true, include completed
      if (showCompletedInDetails) return true;
      return !isDone;
    });
  }, [currentSelectedMacro, statusFilterInDetails, showCompletedInDetails, project.macroActivities]);

  // Counts for filters in Aba 2
  const detailsFilterCounts = useMemo(() => {
    if (!currentSelectedMacro) return { inProgress: 0, planned: 0, blocked: 0, completed: 0 };
    let inProgress = 0, planned = 0, blocked = 0, completed = 0;

    currentSelectedMacro.microActivities.forEach(micro => {
      const isDone = micro.status === 'Concluído e aprovado';
      const isInProg = micro.status === 'Em andamento' || micro.status === 'Concluído com restrições' || micro.status === 'A repetir / retrabalho';
      const isBlocked = micro.dependsOn && micro.dependsOn.length > 0 && micro.dependsOn.some(depId => {
        for (const m of project.macroActivities) {
          const found = m.microActivities.find(item => item.id === depId || item.name === depId);
          if (found && found.status !== 'Concluído e aprovado') return true;
        }
        return false;
      });

      if (isDone) completed++;
      else if (isBlocked) blocked++;
      else if (isInProg) inProgress++;
      else planned++;
    });

    return { inProgress, planned, blocked, completed };
  }, [currentSelectedMacro, project.macroActivities]);

  // Handle Save New Microactivity
  const handleSaveMicroActivity = (newMicroData: Partial<MicroActivity>, targetMacroId: string) => {
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === targetMacroId) {
        const newMicro: MicroActivity = {
          id: `micro_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: newMicroData.name || 'Nova Microatividade',
          assignee: newMicroData.assignee || project.responsible || 'Responsável',
          dueDate: newMicroData.dueDate || new Date().toISOString().split('T')[0],
          startDate: newMicroData.startDate,
          status: newMicroData.status || 'Planejado',
          priority: newMicroData.priority || 'Média',
          progress: newMicroData.progress !== undefined ? newMicroData.progress : (newMicroData.status === 'Concluído e aprovado' ? 100 : 0),
          observations: newMicroData.observations || '',
          dependsOn: newMicroData.dependsOn || [],
          blocks: newMicroData.blocks || []
        };
        return {
          ...macro,
          microActivities: [...macro.microActivities, newMicro]
        };
      }
      return macro;
    });

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });
    setIsNewMicroModalOpen(false);
  };

  // Handle Edit Existing Microactivity
  const handleUpdateMicroActivity = (updatedMicro: MicroActivity, macroId: string) => {
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === macroId) {
        return {
          ...macro,
          microActivities: macro.microActivities.map(m => m.id === updatedMicro.id ? updatedMicro : m)
        };
      }
      return macro;
    });

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });
    setIsEditMicroModalOpen(false);
    setMicroToEdit(null);
  };

  // Handle Quick Status Change in Table
  const handleQuickStatusChange = (macroId: string, microId: string, newStatus: MicroActivityStatus) => {
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === macroId) {
        return {
          ...macro,
          microActivities: macro.microActivities.map(m => {
            if (m.id === microId) {
              const newProgress = newStatus === 'Concluído e aprovado' ? 100 : (m.progress === 100 ? 50 : m.progress || 0);
              return { ...m, status: newStatus, progress: newProgress };
            }
            return m;
          })
        };
      }
      return macro;
    });

    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };

  // Helper to format initials for avatars
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Helper for priority color badge
  const getPriorityBadge = (priority?: Priority) => {
    switch (priority) {
      case 'Alta':
      case 'Urgente':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200">Alta</span>;
      case 'Média':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200">Média</span>;
      case 'Baixa':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200">Baixa</span>;
    }
  };

  // Helper for status badge in table
  const getStatusBadge = (status: MicroActivityStatus) => {
    switch (status) {
      case 'Concluído e aprovado':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">Concluída</span>;
      case 'Em andamento':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">Em andamento</span>;
      case 'Concluído com restrições':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">Revisão</span>;
      case 'A repetir / retrabalho':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">Retrabalho</span>;
      case 'Planejado':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">Planejada</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 animate-in fade-in duration-300 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Matching Visual Reference Image 1 & 2)                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        
        {/* Row 1: Back Button & Notifications */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBackToProjects}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-full text-xs font-bold transition active:scale-95"
          >
            <ArrowLeft size={15} /> Voltar para Projetos
          </button>
        </div>

        {/* Row 2: Title, Next Milestone Badge & Overall Progress */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Project Title & Responsible */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              {isEditingProjectName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={tempProjectName} 
                    onChange={(e) => setTempProjectName(e.target.value)}
                    className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight border-b-2 border-teal-600 outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      onUpdateProject({ ...project, name: tempProjectName });
                      setIsEditingProjectName(false);
                    }}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setTempProjectName(project.name);
                      setIsEditingProjectName(false);
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {project.name}
                  </h1>
                  <button 
                    onClick={() => setIsEditingProjectName(true)}
                    className="text-slate-400 hover:text-teal-700 transition p-1 hover:bg-slate-50 rounded-lg"
                    title="Editar nome do projeto"
                  >
                    <Edit2 size={15} />
                  </button>
                </>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500">
              Responsável: <strong className="text-slate-700 font-bold">{project.responsible || 'Bruna'}</strong>
            </p>
          </div>

          {/* Right Highlights: Next Milestone Dark Badge & Total Progress */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 self-start lg:self-auto">
            
            {/* Dark Pill: Próximo Marco */}
            <div className="bg-[#101828] text-white px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-800">
              <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">PRÓXIMO MARCO</span>
                <span className="text-xs font-bold text-white block max-w-[170px] truncate">{projectStats.nextMilestoneName}</span>
              </div>
              <div className="h-7 w-px bg-slate-700 mx-1" />
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">PRAZO</span>
                <span className="text-xs font-bold text-amber-300 block">{projectStats.nextMilestoneDate}</span>
              </div>
            </div>

            {/* Total Progress Gauge */}
            <div className="space-y-1.5 min-w-[150px]">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                <span className="text-[10px] text-slate-400">PROGRESSO TOTAL</span>
                <span className="text-sm font-black text-slate-900">{projectStats.progressPct}%</span>
              </div>
              <div className="w-36 sm:w-44 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                  style={{ width: `${projectStats.progressPct}%` }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* Navigation Tabs: MAPA DE FASES | DETALHAMENTO DAS FASES */}
        <div className="flex items-center gap-8 border-b border-slate-200/80 pt-2">
          <button 
            onClick={() => setActiveTab('map')}
            className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all relative ${
              activeTab === 'map' 
                ? 'text-teal-800' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            MAPA DE FASES
            {activeTab === 'map' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-md animate-in fade-in duration-200" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all relative ${
              activeTab === 'details' 
                ? 'text-teal-800' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            DETALHAMENTO DAS FASES
            {activeTab === 'details' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-md animate-in fade-in duration-200" />
            )}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ABA 1: MAPA DE FASES (Visão Estratégica)                              */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-in fade-in duration-300">
          
          {/* Main Strategic Visual Map Area (Col-span 8 or 9) */}
          <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-2xs space-y-6 flex flex-col justify-between">
            
            {/* Header: Title & Subtitle + Top Right Legend */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  MAPA DE FASES
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Visão geral do projeto e relacionamento entre as macroetapas
                </p>
              </div>

              {/* Legend & Completed toggle */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-teal-600 rounded" />
                  <span>Sequencial (próxima)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-500" />
                  <span>Paralela (mesmo período)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dotted border-purple-400" />
                  <span>Dependente (não bloqueia)</span>
                </div>

                <button 
                  onClick={() => setShowCompletedPhasesInMap(!showCompletedPhasesInMap)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition ml-auto"
                >
                  <Eye size={13} />
                  {showCompletedPhasesInMap ? 'Ocultar concluídas' : `Ver etapas concluídas (${macroListWithStats.filter(m => m.isCompleted).length})`}
                </button>
              </div>
            </div>

            {/* Strategic Visual Canvas / Flow Graph */}
            <div className="py-6 px-2 overflow-x-auto min-h-[360px] flex items-center justify-start xl:justify-center">
              
              <div className="flex items-center gap-3 sm:gap-4 min-w-max">
                
                {macroListWithStats.map((macro, idx) => {
                  // If completed and not toggled to show, hide
                  if (macro.isCompleted && !showCompletedPhasesInMap) {
                    return null;
                  }

                  const isNextSequential = idx < macroListWithStats.length - 1;
                  const isParallel = macro.relationType === 'parallel' || macro.name.toLowerCase().includes('farmacot') || macro.name.toLowerCase().includes('pré-clín');
                  const isDependent = macro.relationType === 'dependent_block' || macro.relationType === 'dependent_nonblock' || macro.name.toLowerCase().includes('regulatór');

                  return (
                    <React.Fragment key={macro.id}>
                      
                      {/* Macro Phase Card Container */}
                      <div className="flex flex-col items-center relative">
                        
                        {/* "VOCÊ ESTÁ AQUI" Pin / Pointer */}
                        {macro.isCurrent && (
                          <div className="absolute -top-8 flex flex-col items-center animate-bounce duration-1000">
                            <span className="bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                              VOCÊ ESTÁ AQUI
                            </span>
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-teal-600" />
                          </div>
                        )}

                        {/* Card Component */}
                        <div 
                          onClick={() => {
                            setSelectedMacroId(macro.id);
                            setActiveTab('details');
                          }}
                          className={`w-52 sm:w-60 p-4 sm:p-5 rounded-2xl transition-all cursor-pointer text-left space-y-3 relative group ${
                            macro.isCurrent
                              ? 'bg-white border-2 border-teal-500 shadow-md ring-4 ring-teal-50'
                              : macro.isCompleted
                              ? 'bg-slate-50/80 border border-slate-200/90 opacity-80 hover:opacity-100'
                              : isParallel
                              ? 'bg-blue-50/40 border border-blue-200 hover:border-blue-400'
                              : isDependent
                              ? 'bg-purple-50/40 border border-purple-200 hover:border-purple-400'
                              : 'bg-white border border-slate-200/90 hover:border-teal-400 shadow-2xs'
                          }`}
                        >
                          {/* Top Label for Parallel or Dependent */}
                          {isParallel && (
                            <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider block">
                              EM ANDAMENTO (PARALELO)
                            </span>
                          )}
                          {isDependent && (
                            <span className="text-[9px] font-black uppercase text-purple-600 tracking-wider block">
                              DEPENDENTE (BLOQUEIA)
                            </span>
                          )}

                          {/* Top Row: Number / Code & Name & Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {macro.isCompleted ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                                  <Check size={14} />
                                </div>
                              ) : (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                  macro.isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {macro.displayCode}
                                </div>
                              )}
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug group-hover:text-teal-700 transition">
                                {macro.name}
                              </h3>
                            </div>

                            {macro.isCompleted ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-extrabold uppercase">
                                CONCLUÍDA
                              </span>
                            ) : macro.isCurrent ? (
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[9px] font-extrabold uppercase">
                                ATUAL
                              </span>
                            ) : null}
                          </div>

                          {/* Details & Progress */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>{macro.total} atividades</span>
                              <span className="font-extrabold text-slate-700">{macro.pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  macro.isCompleted ? 'bg-emerald-500' : isParallel ? 'bg-blue-600' : 'bg-teal-600'
                                }`} 
                                style={{ width: `${macro.pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Hover hint */}
                          <div className="text-[9px] font-bold text-teal-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition pt-1">
                            <span>Ver detalhamento</span> <ChevronRight size={12} />
                          </div>
                        </div>

                      </div>

                      {/* Visual Arrow / Connector between stages */}
                      {isNextSequential && (
                        <div className="flex items-center text-teal-600/70 px-1">
                          {isParallel ? (
                            <div className="w-6 h-0.5 border-t-2 border-dashed border-blue-400" />
                          ) : (
                            <div className="flex items-center">
                              <div className="w-6 h-0.5 bg-teal-500" />
                              <ArrowRight size={14} className="-ml-1 text-teal-600" />
                            </div>
                          )}
                        </div>
                      )}

                    </React.Fragment>
                  );
                })}

              </div>

            </div>

            {/* Bottom tip */}
            <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-100">
              Clique em qualquer macroetapa para abrir a área operacional e detalhar as microatividades.
            </div>

          </div>

          {/* Right Sidebar in ABA 1: Readiness & Next Stage Prerequisites (Image 1 reference) */}
          <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6 flex flex-col justify-between">
            
            <div className="space-y-5">
              {/* Header */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  PRÓXIMA ETAPA — {nextPhaseInfo?.nextMacroName || 'FASE SEGUINTE'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Prontidão para iniciar
                </h3>
              </div>

              {/* Circular Gauge / Donut Display */}
              <div className="flex items-center gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={nextPhaseInfo && nextPhaseInfo.readinessPct >= 80 ? "text-emerald-500" : "text-teal-600"}
                      strokeDasharray={`${nextPhaseInfo?.readinessPct || 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-slate-900">
                    {nextPhaseInfo?.readinessPct || 0}%
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    {nextPhaseInfo?.doneConditions} de {nextPhaseInfo?.totalConditions} condições
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    prontas para iniciar a próxima fase
                  </span>
                </div>
              </div>

              {/* Conditions Checklist with Icons */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  CHECKLIST DE PRÉ-REQUISITOS
                </span>
                
                <div className="space-y-2">
                  {nextPhaseInfo?.conditions.map(cond => (
                    <div key={cond.id} className="flex items-start gap-2.5 text-xs">
                      {cond.status === 'done' ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : cond.status === 'in_progress' ? (
                        <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </div>
                      ) : (
                        <Circle size={16} className="text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={`font-medium ${cond.status === 'done' ? 'text-slate-700' : 'text-slate-500'}`}>
                        {cond.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Alert Box */}
              {nextPhaseInfo && nextPhaseInfo.pendingCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle size={15} />
                    <span>Ainda não recomendado iniciar</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium pl-5 leading-relaxed">
                    {nextPhaseInfo.pendingCount} condições pendentes impedem o início da próxima etapa.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={15} />
                    <span>Pronta para iniciar</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium pl-5 leading-relaxed">
                    Todas as condições e pré-requisitos foram satisfeitos.
                  </p>
                </div>
              )}
            </div>

            {/* Button: Ver pré-requisitos completos */}
            <button 
              onClick={() => setIsPrerequisitesModalOpen(true)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              Ver pré-requisitos completos <ArrowRight size={14} />
            </button>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ABA 2: DETALHAMENTO DAS FASES (Área Operacional)                       */}
      {/* ========================================================================= */}
      {activeTab === 'details' && currentSelectedMacro && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Phase Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            
            {/* Top row: Voltar ao mapa & Selector of macro phase */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button 
                onClick={() => setActiveTab('map')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition"
              >
                <ArrowLeft size={14} /> Voltar para o mapa
              </button>

              {/* Macro Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Selecionar Fase:</span>
                <select 
                  value={selectedMacroId}
                  onChange={(e) => setSelectedMacroId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500"
                >
                  {macroListWithStats.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.pct}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Macro Title, Status, Progress & Nova Microatividade Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {currentSelectedMacro.name}
                  </h2>
                  {currentSelectedMacro.isCurrent && (
                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[9px] font-extrabold uppercase">
                      ATUAL
                    </span>
                  )}
                  {currentSelectedMacro.isCompleted && (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-extrabold uppercase">
                      CONCLUÍDA
                    </span>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">Progresso da fase:</span>
                  <div className="w-full max-w-xs h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                      style={{ width: `${currentSelectedMacro.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-900">{currentSelectedMacro.pct}%</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentSelectedMacro.done} de {currentSelectedMacro.total} atividades concluídas
                  </span>
                </div>
              </div>

              {/* Main Action Button: + Nova microatividade */}
              <button 
                onClick={() => setIsNewMicroModalOpen(true)}
                className="px-5 py-2.5 bg-[#00875A] hover:bg-[#00704a] text-white rounded-full text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 active:scale-95 self-start lg:self-auto"
              >
                <Plus size={16} /> Nova microatividade
              </button>

            </div>

          </div>

          {/* Operational Layout: 3 Columns (Filters | Table | Next Prerequisites + Actions) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            
            {/* Left Filter Navigation Pills (Col-span 2) */}
            <div className="xl:col-span-2 space-y-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                
                <button 
                  onClick={() => setStatusFilterInDetails('in_progress')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    statusFilterInDetails === 'in_progress' 
                      ? 'bg-teal-50 text-teal-800 border border-teal-100 font-black' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Em andamento</span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[10px] shadow-2xs">
                    {detailsFilterCounts.inProgress}
                  </span>
                </button>

                <button 
                  onClick={() => setStatusFilterInDetails('planned')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    statusFilterInDetails === 'planned' 
                      ? 'bg-teal-50 text-teal-800 border border-teal-100 font-black' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Planejadas</span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[10px] shadow-2xs">
                    {detailsFilterCounts.planned}
                  </span>
                </button>

                <button 
                  onClick={() => setStatusFilterInDetails('blocked')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    statusFilterInDetails === 'blocked' 
                      ? 'bg-teal-50 text-teal-800 border border-teal-100 font-black' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Bloqueadas</span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[10px] shadow-2xs">
                    {detailsFilterCounts.blocked}
                  </span>
                </button>

                <button 
                  onClick={() => setStatusFilterInDetails('completed')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    statusFilterInDetails === 'completed' 
                      ? 'bg-teal-50 text-teal-800 border border-teal-100 font-black' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Eye size={12} className="text-slate-400" /> Concluídas
                  </span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[10px] shadow-2xs">
                    {detailsFilterCounts.completed}
                  </span>
                </button>

              </div>
            </div>

            {/* Center: Microactivities Table (Col-span 7) */}
            <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              
              {/* Header Title */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  ATIVIDADES {statusFilterInDetails === 'in_progress' ? 'EM ANDAMENTO' : statusFilterInDetails === 'planned' ? 'PLANEJADAS' : statusFilterInDetails === 'blocked' ? 'BLOQUEADAS' : 'CONCLUÍDAS'}
                  <Info size={14} className="text-slate-400" />
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {filteredMicroActivities.length} itens listados
                </span>
              </div>

              {/* Table Render */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                      <th className="py-3 px-3">MICROATIVIDADE</th>
                      <th className="py-3 px-3">RESPONSÁVEL</th>
                      <th className="py-3 px-3">PRAZO</th>
                      <th className="py-3 px-3">STATUS</th>
                      <th className="py-3 px-3">PRIORIDADE</th>
                      <th className="py-3 px-3 text-center">PRÉ-REQUISITOS</th>
                      <th className="py-3 px-3">PROGRESSO</th>
                      <th className="py-3 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMicroActivities.map(micro => {
                      const isExpanded = expandedMicroId === micro.id;
                      const hasPrereqs = micro.dependsOn && micro.dependsOn.length > 0;
                      const prereqBadgeText = hasPrereqs ? `${micro.dependsOn!.length}` : '—';

                      return (
                        <React.Fragment key={micro.id}>
                          <tr 
                            onClick={() => setExpandedMicroId(isExpanded ? null : micro.id)}
                            className={`hover:bg-slate-50/80 transition cursor-pointer group ${isExpanded ? 'bg-slate-50/60' : ''}`}
                          >
                            {/* Nome com chevron */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 group-hover:text-slate-700">
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900 group-hover:text-teal-700 transition">
                                  {micro.name}
                                </span>
                              </div>
                            </td>

                            {/* Responsável com Avatar */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                  {getInitials(micro.assignee)}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate max-w-[90px]">
                                  {micro.assignee || 'Bruna'}
                                </span>
                              </div>
                            </td>

                            {/* Prazo */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                <Calendar size={13} className="text-slate-400" />
                                <span>{micro.dueDate ? micro.dueDate.split('-').reverse().join('/') : '--/--/----'}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3">
                              {getStatusBadge(micro.status)}
                            </td>

                            {/* Prioridade */}
                            <td className="py-3.5 px-3">
                              {getPriorityBadge(micro.priority)}
                            </td>

                            {/* Pré-requisitos */}
                            <td className="py-3.5 px-3 text-center">
                              {hasPrereqs ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-200">
                                  {prereqBadgeText}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>

                            {/* Progresso */}
                            <td className="py-3.5 px-3 min-w-[110px]">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-700">
                                  <span>{micro.progress || (micro.status === 'Concluído e aprovado' ? 100 : 0)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      micro.status === 'Concluído e aprovado' ? 'bg-emerald-500' : 'bg-teal-600'
                                    }`} 
                                    style={{ width: `${micro.progress || (micro.status === 'Concluído e aprovado' ? 100 : 0)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Menu de Ações */}
                            <td className="py-3.5 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => {
                                    setMicroToEdit({ micro, macroId: currentSelectedMacro.id });
                                    setIsEditMicroModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                                  title="Editar microatividade"
                                >
                                  <Edit2 size={13} />
                                </button>
                                {onOpenDeletionModal && (
                                  <button 
                                    onClick={() => onOpenDeletionModal({
                                      type: 'micro',
                                      ids: { projectId: project.id, macroId: currentSelectedMacro.id, microId: micro.id },
                                      name: micro.name
                                    })}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Excluir microatividade"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row (Progressive Disclosure) */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b border-slate-100">
                              <td colSpan={8} className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                  
                                  {/* Observações / Descrição */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block">OBSERVAÇÕES / DESCRIÇÃO</span>
                                    <p className="text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                                      {micro.observations || 'Nenhuma observação informada.'}
                                    </p>
                                  </div>

                                  {/* Pré-requisitos & Bloqueios */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block">PRÉ-REQUISITOS / BLOQUEIOS</span>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-500 block">Depende de:</span>
                                        <p className="text-slate-700 font-medium">
                                          {micro.dependsOn && micro.dependsOn.length > 0 ? micro.dependsOn.join(', ') : 'Nenhuma dependência direta.'}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-500 block">Bloqueia:</span>
                                        <p className="text-slate-700 font-medium">
                                          {micro.blocks && micro.blocks.length > 0 ? micro.blocks.join(', ') : 'Nenhuma etapa bloqueada.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ações Rápidas */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block">AÇÕES RÁPIDAS DE STATUS</span>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-wrap gap-2">
                                      <button 
                                        onClick={() => handleQuickStatusChange(currentSelectedMacro.id, micro.id, 'Em andamento')}
                                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition"
                                      >
                                        Marcar Em Andamento
                                      </button>
                                      <button 
                                        onClick={() => handleQuickStatusChange(currentSelectedMacro.id, micro.id, 'Concluído e aprovado')}
                                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition"
                                      >
                                        Marcar Concluída (100%)
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setMicroToEdit({ micro, macroId: currentSelectedMacro.id });
                                          setIsEditMicroModalOpen(true);
                                        }}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition"
                                      >
                                        Editar Detalhes
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {filteredMicroActivities.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                          <p className="text-xs font-bold uppercase">Nenhuma microatividade neste filtro</p>
                          <p className="text-[11px]">Clique em "+ Nova microatividade" para cadastrar uma nova atividade nesta fase.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom toggle: Ver concluídas */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button 
                  onClick={() => setShowCompletedInDetails(!showCompletedInDetails)}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                >
                  <Eye size={14} />
                  {showCompletedInDetails ? 'Ocultar concluídas da tabela' : `Ver concluídas (${detailsFilterCounts.completed})`}
                </button>
              </div>

            </div>

            {/* Right Sidebar in ABA 2 (Image 2 reference) (Col-span 3) */}
            <div className="xl:col-span-3 space-y-5">
              
              {/* Card 1: Pré-requisitos da Próxima Etapa */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    PRÉ-REQUISITOS DA PRÓXIMA ETAPA
                  </span>
                  <h4 className="text-xs font-black text-slate-900">
                    Para iniciar a {nextPhaseInfo?.nextMacroName || 'Próxima Fase'}
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {nextPhaseInfo?.conditions.map(cond => (
                    <div key={cond.id} className="flex items-start gap-2 text-xs">
                      {cond.status === 'done' ? (
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : cond.status === 'in_progress' ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1 h-1 rounded-full bg-amber-500" />
                        </div>
                      ) : (
                        <Circle size={15} className="text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={`font-medium leading-snug ${cond.status === 'done' ? 'text-slate-700' : 'text-slate-500'}`}>
                        {cond.name}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setIsPrerequisitesModalOpen(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1 pt-1"
                >
                  Ver todos os pré-requisitos <ArrowRight size={13} />
                </button>
              </div>

              {/* Card 2: Próxima Ação Sugerida */}
              {suggestedNextAction && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      PRÓXIMA AÇÃO SUGERIDA
                    </span>
                    <div className="flex items-start gap-2.5 pt-1">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">
                          {suggestedNextAction.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Microatividade {suggestedNextAction.macroCode} · Responsável: {suggestedNextAction.assignee}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setExpandedMicroId(suggestedNextAction.microId)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    Acessar atividade <ArrowRight size={13} />
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: + NOVA MICROATIVIDADE COM PROGRESSIVE DISCLOSURE                */}
      {/* ========================================================================= */}
      {isNewMicroModalOpen && (
        <MicroActivityFormModal 
          isOpen={isNewMicroModalOpen}
          onClose={() => setIsNewMicroModalOpen(false)}
          onSave={handleSaveMicroActivity}
          defaultMacroId={selectedMacroId || project.macroActivities[0]?.id || ''}
          macroActivities={project.macroActivities}
          teamMembers={teamMembers}
          projectResponsible={project.responsible || 'Bruna'}
        />
      )}

      {/* 5. MODAL: EDITAR MICROATIVIDADE */}
      {isEditMicroModalOpen && microToEdit && (
        <MicroActivityFormModal 
          isOpen={isEditMicroModalOpen}
          onClose={() => {
            setIsEditMicroModalOpen(false);
            setMicroToEdit(null);
          }}
          onSave={(data, macroId) => handleUpdateMicroActivity({ ...microToEdit.micro, ...data } as MicroActivity, macroId)}
          initialData={microToEdit.micro}
          defaultMacroId={microToEdit.macroId}
          macroActivities={project.macroActivities}
          teamMembers={teamMembers}
          projectResponsible={project.responsible || 'Bruna'}
          isEditing
        />
      )}

      {/* 6. MODAL: PRÉ-REQUISITOS COMPLETOS */}
      {isPrerequisitesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">Matriz de Pré-requisitos</h3>
                <p className="text-xs text-slate-500 font-medium">Condições necessárias para desbloqueio das próximas macroetapas</p>
              </div>
              <button onClick={() => setIsPrerequisitesModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {macroListWithStats.map(macro => (
                <div key={macro.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase">{macro.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${macro.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {macro.isCompleted ? 'Concluída' : `${macro.pct}% Concluído`}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {macro.microActivities.map(micro => (
                      <div key={micro.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          {micro.status === 'Concluído e aprovado' ? (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Circle size={14} className="text-slate-300 shrink-0" />
                          )}
                          <span className="font-medium text-slate-700">{micro.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{micro.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsPrerequisitesModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
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

// =============================================================================
// SUB-COMPONENT: MICROACTIVITY FORM MODAL (WITH PROGRESSIVE DISCLOSURE)
// =============================================================================
interface MicroActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<MicroActivity>, macroId: string) => void;
  initialData?: MicroActivity;
  defaultMacroId: string;
  macroActivities: MacroActivity[];
  teamMembers: TeamMember[];
  projectResponsible: string;
  isEditing?: boolean;
}

const MicroActivityFormModal: React.FC<MicroActivityFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultMacroId,
  macroActivities,
  teamMembers,
  projectResponsible,
  isEditing = false
}) => {
  // Essential fields
  const [name, setName] = useState(initialData?.name || '');
  const [macroId, setMacroId] = useState(defaultMacroId);
  const [assignee, setAssignee] = useState(initialData?.assignee || projectResponsible || 'Bruna');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<MicroActivityStatus>(initialData?.status || 'Planejado');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'Média');
  const [progress, setProgress] = useState<number>(initialData?.progress !== undefined ? initialData.progress : (initialData?.status === 'Concluído e aprovado' ? 100 : 0));
  
  // Progressive disclosure toggle
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(!!initialData?.observations || (initialData?.dependsOn && initialData.dependsOn.length > 0) || (initialData?.blocks && initialData.blocks.length > 0));
  
  // Advanced fields
  const [observations, setObservations] = useState(initialData?.observations || '');
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>(initialData?.dependsOn || []);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>(initialData?.blocks || []);

  // All available microactivities across the project for prerequisite selection
  const allAvailableMicroActivities = useMemo(() => {
    const list: { id: string; name: string; macroName: string; isDone: boolean; isInProg: boolean }[] = [];
    macroActivities.forEach(m => {
      m.microActivities.forEach(mi => {
        if (!initialData || mi.id !== initialData.id) {
          list.push({
            id: mi.id,
            name: mi.name,
            macroName: m.name,
            isDone: mi.status === 'Concluído e aprovado',
            isInProg: mi.status === 'Em andamento' || mi.status === 'Concluído com restrições' || mi.status === 'A repetir / retrabalho'
          });
        }
      });
    });
    return list;
  }, [macroActivities, initialData]);

  // Check if all chosen prerequisites are fulfilled
  const prereqReadiness = useMemo(() => {
    if (selectedPrereqIds.length === 0) return { isReady: true, pendingCount: 0 };
    const pending = selectedPrereqIds.filter(id => {
      const item = allAvailableMicroActivities.find(a => a.id === id);
      return !item || !item.isDone;
    });
    return {
      isReady: pending.length === 0,
      pendingCount: pending.length
    };
  }, [selectedPrereqIds, allAvailableMicroActivities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      assignee,
      startDate,
      dueDate,
      status,
      priority,
      progress: status === 'Concluído e aprovado' ? 100 : progress,
      observations,
      dependsOn: selectedPrereqIds,
      blocks: selectedBlockIds
    }, macroId);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {isEditing ? 'Editar Microatividade' : '+ Nova Microatividade'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Informe os dados essenciais e configure dependências se necessário.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nome da Microatividade */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nome da Microatividade *</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Síntese do DNA plasmidial recombinante..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
            />
          </div>

          {/* Macroetapa & Responsável (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Macroetapa *</label>
              <select 
                value={macroId}
                onChange={(e) => setMacroId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
              >
                {macroActivities.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Responsável *</label>
              <select 
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
              >
                {teamMembers.map(tm => (
                  <option key={tm.id} value={tm.name}>{tm.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Datas (Início e Prazo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Data de Início</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prazo de Entrega *</label>
              <input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Status & Prioridade & Progresso */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status</label>
              <select 
                value={status}
                onChange={(e) => {
                  const newSt = e.target.value as MicroActivityStatus;
                  setStatus(newSt);
                  if (newSt === 'Concluído e aprovado') setProgress(100);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
              >
                <option value="Planejado">Planejada</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído com restrições">Em Revisão</option>
                <option value="A repetir / retrabalho">Retrabalho</option>
                <option value="Concluído e aprovado">Concluída (100%)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prioridade</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Progresso ({progress}%)</label>
              <input 
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-teal-600 mt-2"
              />
            </div>
          </div>

          {/* Progressive Disclosure Toggle */}
          <div className="pt-1">
            <button 
              type="button"
              onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1.5"
            >
              {showAdvancedDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {showAdvancedDetails ? 'Ocultar detalhes adicionais' : '+ Adicionar detalhes (Pré-requisitos, Observações, Bloqueios)'}
            </button>
          </div>

          {/* Advanced Section (Pré-requisitos, Observações) */}
          {showAdvancedDetails && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5 animate-in fade-in duration-200">
              
              {/* PRÉ-REQUISITOS ("Para iniciar isto, é necessário:") */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    PARA INICIAR ISTO, É NECESSÁRIO:
                  </label>
                  {selectedPrereqIds.length > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prereqReadiness.isReady 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prereqReadiness.isReady ? '✓ Pronta para iniciar' : `! ${prereqReadiness.pendingCount} pendente(s)`}
                    </span>
                  )}
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2.5 rounded-xl border border-slate-200">
                  {allAvailableMicroActivities.map(item => {
                    const isSelected = selectedPrereqIds.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1.5 rounded cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPrereqIds([...selectedPrereqIds, item.id]);
                            } else {
                              setSelectedPrereqIds(selectedPrereqIds.filter(id => id !== item.id));
                            }
                          }}
                          className="accent-teal-600 rounded"
                        />
                        <span className="flex-1 truncate">{item.name} <span className="text-slate-400">({item.macroName})</span></span>
                        {item.isDone ? (
                          <span className="text-[9px] font-bold text-emerald-600">✓ Concluído</span>
                        ) : item.isInProg ? (
                          <span className="text-[9px] font-bold text-amber-600">◷ Em andamento</span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">○ Não iniciado</span>
                        )}
                      </label>
                    );
                  })}
                  {allAvailableMicroActivities.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">Nenhuma outra atividade disponível.</p>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">Observações</label>
                <textarea 
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Detalhes adicionais, protocolos ou notas..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-teal-600 transition"
                />
              </div>

            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2 bg-[#00875A] hover:bg-[#00704a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Microatividade'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
