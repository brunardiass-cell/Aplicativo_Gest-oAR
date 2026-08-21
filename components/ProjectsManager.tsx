
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, MacroActivity, MicroActivity, ActivityPlanTemplate, TeamMember, AppUser, RegulatoryStandard, MicroActivityStatus, Meeting,
  Task, RegulatoryEvidence, MacroActivityConfig, RegulatoryInfoItem, RepeatableRecord, RegulatoryNarrative, RegulatoryDocument, RegulatoryDocumentItem, RegulatoryDocItemType, RegulatoryDocItemStatus
} from '../types';
import { 
  X, ChevronDown, ListPlus, FolderPlus, Search, 
  Settings, Save, Plus, ChevronRight, LayoutDashboard, 
  PieChart, Activity, Clock, CheckCircle, AlertTriangle, 
  Users2, Presentation, ArrowLeft, Edit, Trash2, LayoutGrid,
  ShieldAlert, CheckCircle2, Workflow, DollarSign, User,
  FolderKanban, GanttChartSquare, Kanban, ClipboardCheck,
  Printer, BarChart3, TrendingUp, Layers, Folder, Play,
  SlidersHorizontal, MoreVertical, ArrowRight, ListOrdered,
  ShieldCheck, FilePlus, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import PlanManagerModal from './PlanManagerModal';
import NewProjectModal from './NewProjectModal';
import ProjectTimeline from './ProjectTimeline';
import ProjectKanbanView from './ProjectKanbanView';
import ProjectFlowView from './ProjectFlowView';
import RegulatoryChecklistModal from './RegulatoryChecklistModal';
import ProjectGanttView from './ProjectGanttView';
import ProjectActivityMap from './ProjectActivityMap';
import { ProjectPhasesMap } from './ProjectPhasesMap';
import { ProjectPhaseDetails } from './ProjectPhaseDetails';
import { NewMicroActivityModal } from './NewMicroActivityModal';
import { PrerequisitesModal } from './PrerequisitesModal';
import { RegulatoryDocManagement } from './RegulatoryDocManagement';
import { isNameMatch } from '../constants';

interface ProjectsManagerProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  activityPlans: ActivityPlanTemplate[];
  onUpdateActivityPlans: (plans: ActivityPlanTemplate[]) => void;
  onOpenDeletionModal: (item: { type: 'project' | 'macro' | 'micro', ids: { projectId: string; macroId?: string; microId?: string; }, name: string }) => void;
  teamMembers: TeamMember[];
  currentUserRole: AppUser['role'] | null;
  initialProjectId?: string | null;
  targetMicroId?: string | null;
  onClearTargetMicroId: () => void;
  regulatoryStandards: RegulatoryStandard[];
  onOpenRegulatoryModal: (activityName: string) => void;
  currentUser: TeamMember | null;
  meetings?: Meeting[];

  tasks?: Task[];
  regulatoryEvidence?: RegulatoryEvidence[];
  macroActivityConfigs?: MacroActivityConfig[];
  regulatoryInfoItems?: RegulatoryInfoItem[];
  repeatableRecords?: RepeatableRecord[];
  regulatoryNarratives?: RegulatoryNarrative[];
  regulatoryDocs?: RegulatoryDocument[];
  onUpdateEvidence?: (items: RegulatoryEvidence[]) => void;
  onUpdateMacroConfigs?: (configs: MacroActivityConfig[]) => void;
  onUpdateInfoItems?: (items: RegulatoryInfoItem[]) => void;
  onUpdateRepeatableRecords?: (records: RepeatableRecord[]) => void;
  onUpdateNarratives?: (narratives: RegulatoryNarrative[]) => void;
  onUpdateDocs?: (docs: RegulatoryDocument[]) => void;
}

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ 
  projects, 
  onUpdateProjects,
  activityPlans,
  onUpdateActivityPlans,
  onOpenDeletionModal,
  teamMembers,
  currentUserRole,
  initialProjectId,
  targetMicroId,
  onClearTargetMicroId,
  regulatoryStandards,
  onOpenRegulatoryModal,
  currentUser,
  meetings = [],
  tasks = [],
  regulatoryEvidence = [],
  macroActivityConfigs = [],
  regulatoryInfoItems = [],
  repeatableRecords = [],
  regulatoryNarratives = [],
  regulatoryDocs = [],
  onUpdateEvidence = () => {},
  onUpdateMacroConfigs = () => {},
  onUpdateInfoItems = () => {},
  onUpdateRepeatableRecords = () => {},
  onUpdateNarratives = () => {},
  onUpdateDocs = () => {}
}) => {
  const [viewMode, setViewMode] = useState<'initial' | 'selection' | 'dashboard'>('selection');
  const [projectDetailView, setProjectDetailView] = useState<'dashboard' | 'timeline' | 'kanban' | 'phases' | 'gantt' | 'regulatory_docs'>('dashboard');
  const [projectPhaseTab, setProjectPhaseTab] = useState<'map' | 'details' | 'regulatory_docs'>('map');
  const [selectedPhaseMacroId, setSelectedPhaseMacroId] = useState<string>('');
  const [isNewMicroModalOpen, setIsNewMicroModalOpen] = useState(false);
  const [isPrerequisitesModalOpen, setIsPrerequisitesModalOpen] = useState(false);
  const [selectedMacroForPrerequisites, setSelectedMacroForPrerequisites] = useState<MacroActivity | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isNewModelModalOpen, setIsNewModelModalOpen] = useState(false);

  // Form state for creating a new regulatory model
  const [newModelTitle, setNewModelTitle] = useState('');
  const [newModelGroup, setNewModelGroup] = useState('Dossiê do IFA - Proteína Recombinante');
  const [newModelType, setNewModelType] = useState('Dossiê Regulatório');
  const [newModelDesc, setNewModelDesc] = useState('');
  const [newModelText, setNewModelText] = useState('');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProjectData, setEditedProjectData] = useState<Partial<Project>>({});
  const [newTeamMemberName, setNewTeamMemberName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter & Sort State for Projects Overview
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('Todos');
  const [areaFilter, setAreaFilter] = useState<string>('Todas');
  const [typeFilter, setTypeFilter] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'progress'>('recent');
  const [projectsLayoutMode, setProjectsLayoutMode] = useState<'list' | 'cards'>('list');
  const [showFiltersBar, setShowFiltersBar] = useState<boolean>(true);
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);

  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-emerald-500';
    if (score > 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const isComiteGestor = useMemo(() => {
    return !!(
      currentUser?.isComiteGestor ||
      currentUser?.name === 'Comitê Gestor' ||
      currentUser?.name === 'Visão Geral da Equipe'
    );
  }, [currentUser]);

  const isAdmin = currentUserRole === 'admin';
  const isLeader = isComiteGestor;
  const canCreatePlan = isComiteGestor || isAdmin || currentUser?.isLeader;
  
  useEffect(() => {
    if (initialProjectId) {
      const projectToSelect = projects.find(p => p.id === initialProjectId);
      if (projectToSelect) {
        setSelectedProject(projectToSelect);
        setViewMode('dashboard');
      }
    }
  }, [initialProjectId, projects]);

  useEffect(() => {
    if (selectedProject) {
      const currentProj = projects.find(p => p.id === selectedProject.id);
      if (currentProj) {
        setSelectedProject(currentProj);
      }
    }
  }, [projects]);

  useEffect(() => {
    const afterPrintHandler = () => {
      document.body.classList.remove('is-printing-project');
    };

    window.addEventListener('afterprint', afterPrintHandler);

    return () => {
      window.removeEventListener('afterprint', afterPrintHandler);
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add('is-printing-project');
    window.print();
  };

  const projectStats = useMemo(() => {
    if (!selectedProject) return null;
    
    let totalMicros = 0;
    let completedMicros = 0;
    let lateMicros = 0;
    let ongoingMicros = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teamLoad: Record<string, number> = {};
    const phaseDist: Record<string, number> = {};
    const trulyLateAlerts: any[] = [];
    const restrictedLateAlerts: any[] = [];
    const allMicros: any[] = [];
    
    selectedProject.macroActivities.forEach(macro => {
      phaseDist[macro.phase] = (phaseDist[macro.phase] || 0) + 1;
      
      macro.microActivities.forEach(micro => {
        totalMicros++;
        allMicros.push({ ...micro, macroName: macro.name, phase: macro.phase });
        
        // Team load
        if (micro.assignee) {
          teamLoad[micro.assignee] = (teamLoad[micro.assignee] || 0) + 1;
        }

        if (micro.status === 'Concluído e aprovado') {
          completedMicros++;
        } else if (micro.status === 'Em andamento') {
          ongoingMicros++;
        }

        const dueDate = micro.dueDate ? new Date(micro.dueDate + 'T00:00:00') : null;
        
        if (dueDate && dueDate < today) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (micro.status === 'Planejado' || micro.status === 'Em andamento') {
            lateMicros++;
            trulyLateAlerts.push({
              id: micro.id,
              name: micro.name,
              macroName: macro.name,
              dueDate: micro.dueDate,
              status: micro.status,
              daysLate: daysOverdue,
              isRestricted: false
            });
          } else if (micro.status === 'Concluído com restrições' || micro.status === 'A repetir / retrabalho') {
            restrictedLateAlerts.push({
              id: micro.id,
              name: micro.name,
              macroName: macro.name,
              dueDate: micro.dueDate,
              status: micro.status,
              daysLate: daysOverdue,
              isRestricted: true
            });
          }
        }
      });
    });

    const alerts = trulyLateAlerts.length > 0 ? trulyLateAlerts : restrictedLateAlerts;

    const findStatus = (names: string[]) => {
      let isStarted = false;
      let isCompleted = false;
      let targetMicro: any = null;
      
      selectedProject.macroActivities.forEach(macro => {
        macro.microActivities.forEach(micro => {
          if (names.some(name => micro.name.toLowerCase().includes(name.toLowerCase()))) {
            if (micro.status !== 'Planejado') isStarted = true;
            if (micro.status === 'Concluído e aprovado') isCompleted = true;
            targetMicro = micro;
          }
        });
      });
      return { isStarted, isCompleted, micro: targetMicro };
    };

    const bpl = findStatus(['ensaio de segurança BPL', 'ensaio de seguranca BPL']);
    const ddcm = findStatus(['submissão do DDCM', 'submissao do DDCM', 'DDCM']);
    const fase1 = findStatus(['Ensaio Clínico Fase I', 'avaliação do desfecho primário', 'fase 1', 'fase I']);
    const fase3 = findStatus(['Ensaio Clínico Fase III', 'Fase IIII', 'fase 3', 'fase III']); 
    const registro = findStatus(['Registro']);

    let milestoneName = "A definir";
    let milestoneDate = "";

    if (!bpl.isStarted) {
      milestoneName = "Ensaio de segurança BPL";
      milestoneDate = bpl.micro?.dueDate || "";
    } else if (!ddcm.isStarted) {
      milestoneName = "Submissão do DDCM";
      milestoneDate = ddcm.micro?.dueDate || "";
    } else if (!fase1.isCompleted) {
      milestoneName = "Ensaio Clínico Fase I";
      milestoneDate = fase1.micro?.dueDate || "";
    } else if (!fase3.isCompleted) {
      milestoneName = "Ensaio Clínico Fase III";
      milestoneDate = fase3.micro?.dueDate || "";
    } else if (!registro.isCompleted) {
      milestoneName = "Registro";
      milestoneDate = registro.micro?.dueDate || "";
    } else {
      milestoneName = "Projeto Concluído";
    }

    const recentActivities = allMicros
      .sort((a, b) => {
        const da = a.completionDate || a.dueDate;
        const db = b.completionDate || b.dueDate;
        return new Date(db + 'T00:00:00').getTime() - new Date(da + 'T00:00:00').getTime();
      })
      .slice(0, 4);

    const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0;
    
    const health = Math.max(0, Math.min(100, Math.round(progress - (totalMicros > 0 ? (lateMicros / totalMicros) * 100 : 0))));

    const teamLoadData = Object.entries(teamLoad).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const phaseDistData = Object.entries(phaseDist).map(([name, value]) => ({ name, value }));

    return { 
      totalMacros: selectedProject.macroActivities.length, 
      totalMicros,
      completedMicros,
      lateMicros, 
      ongoingMicros, 
      progress,
      health,
      teamLoadData,
      phaseDistData,
      alerts: alerts.sort((a, b) => b.daysLate - a.daysLate).slice(0, 5),
      milestoneName,
      milestoneDate,
      recentActivities
    };
  }, [selectedProject]);

  const [isActivityMapOpen, setIsActivityMapOpen] = useState(false);

  const addProject = (project: Project) => {
    const updatedProjects = [...projects, project];
    onUpdateProjects(updatedProjects);
    setSelectedProject(project);
    setViewMode('dashboard');
    setProjectDetailView('dashboard');
  };

  const handleUpdateProject = (updatedProject: Project) => {
    const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    onUpdateProjects(updatedProjects);
    setSelectedProject(updatedProject);
  };

  const handleAddMicroActivity = (macroId: string, newMicro: MicroActivity) => {
    if (!selectedProject) return;
    const updatedMacros = selectedProject.macroActivities.map(macro => {
      if (macro.id === macroId) {
        return {
          ...macro,
          microActivities: [...(macro.microActivities || []), newMicro]
        };
      }
      return macro;
    });
    handleUpdateProject({ ...selectedProject, macroActivities: updatedMacros });
  };

  const handleUpdateMacroPrerequisites = (updatedPrerequisites: any[]) => {
    if (!selectedProject || !selectedMacroForPrerequisites) return;
    const updatedMacros = selectedProject.macroActivities.map(macro => {
      if (macro.id === selectedMacroForPrerequisites.id) {
        return {
          ...macro,
          prerequisites: updatedPrerequisites
        };
      }
      return macro;
    });
    handleUpdateProject({ ...selectedProject, macroActivities: updatedMacros });
  };

  const handleNavigateToProject = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setSelectedProject(proj);
      setViewMode('dashboard');
      setProjectDetailView('timeline');
      setIsActivityMapOpen(false);
    }
  };

  const handleStartEdit = () => {
    if (selectedProject) {
      setEditedProjectData({ 
        name: selectedProject.name, 
        responsible: selectedProject.responsible, 
        team: selectedProject.team || [],
        status: selectedProject.status 
      });
      setIsEditingProject(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProject(false);
    setEditedProjectData({});
    setNewTeamMemberName('');
  };

  const handleSaveEdit = () => {
    if (selectedProject) {
      handleUpdateProject({ ...selectedProject, ...editedProjectData });
      handleCancelEdit();
    }
  };
  
  const handleStatusChange = (projectId: string, newStatus: Project['status']) => {
    const updatedProjects = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
    onUpdateProjects(updatedProjects);
    if(selectedProject?.id === projectId) {
        setSelectedProject({...selectedProject, status: newStatus});
    }
  };
  
  const handleAddMemberToEdit = () => {
    const name = newTeamMemberName.trim();
    if (name && !editedProjectData.team?.includes(name)) {
      setEditedProjectData({
        ...editedProjectData,
        team: [...(editedProjectData.team || []), name]
      });
      setNewTeamMemberName('');
    }
  };

  const handleRemoveMemberFromEdit = (nameToRemove: string) => {
    setEditedProjectData({
      ...editedProjectData,
      team: editedProjectData.team?.filter(name => name !== nameToRemove)
    });
  };

  const handleDuplicateProject = (projectToDuplicate: Project) => {
    if (!confirm(`Deseja criar uma nova versão do projeto "${projectToDuplicate.name}"? As tarefas serão reiniciadas.`)) return;

    const newProject: Project = {
      ...projectToDuplicate,
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      name: `${projectToDuplicate.name} (v2)`,
      status: 'Em Planejamento',
      macroActivities: projectToDuplicate.macroActivities.map(macro => ({
        ...macro,
        id: 'macro_' + Math.random().toString(36).substr(2, 9),
        microActivities: macro.microActivities.map(micro => ({
          ...micro,
          id: 'micro_' + Math.random().toString(36).substr(2, 9),
          status: 'Planejado',
          observations: '',
          reportLink: '',
          completionDate: undefined,
          progress: 0,
        }))
      }))
    };
    addProject(newProject);
  };

  // Accessible projects: Comitê Gestor sees all projects; individual profiles see only projects they lead/are responsible for
  const accessibleProjects = useMemo(() => {
    if (isComiteGestor || !currentUser?.name) {
      return projects;
    }
    const currentUserName = currentUser.name;
    return projects.filter(project => {
      return isNameMatch(project.responsible, currentUserName);
    });
  }, [projects, isComiteGestor, currentUser]);

  const uniqueResponsibles = useMemo(() => {
    const set = new Set<string>();
    accessibleProjects.forEach(p => {
      if (p.responsible) set.add(p.responsible);
    });
    return Array.from(set);
  }, [accessibleProjects]);

  const overviewStats = useMemo(() => {
    const total = accessibleProjects.length;
    let inProgress = 0;
    let completed = 0;
    let planned = 0;

    accessibleProjects.forEach(p => {
      const st = (p.status || '').toLowerCase();
      if (st.includes('concl')) {
        completed++;
      } else if (st.includes('plan')) {
        planned++;
      } else {
        inProgress++;
      }
    });

    const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const plannedPct = total > 0 ? Math.round((planned / total) * 100) : 0;

    return { total, inProgress, inProgressPct, completed, completedPct, planned, plannedPct };
  }, [accessibleProjects]);

  const filteredProjects = useMemo(() => {
    return accessibleProjects
      .filter(project => {
        // Search term
        const term = searchTerm.toLowerCase().trim();
        if (term) {
          const nameMatch = project.name.toLowerCase().includes(term);
          const respMatch = (project.responsible || '').toLowerCase().includes(term);
          const descMatch = (project.description || '').toLowerCase().includes(term);
          if (!nameMatch && !respMatch && !descMatch) return false;
        }

        // Status Filter
        if (statusFilter !== 'Todos') {
          const st = (project.status || '').toLowerCase();
          if (statusFilter === 'EM ANDAMENTO' && (!st.includes('ativo') && !st.includes('andamento'))) return false;
          if (statusFilter === 'EM REVISÃO' && !st.includes('revis')) return false;
          if (statusFilter === 'PLANEJADO' && !st.includes('planej')) return false;
          if (statusFilter === 'CONCLUÍDO' && !st.includes('concl')) return false;
          if (statusFilter === 'SUSPENSO' && !st.includes('susp')) return false;
        }

        // Responsible Filter
        if (responsibleFilter !== 'Todos' && project.responsible !== responsibleFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'progress') {
          const getProgress = (proj: Project) => {
            let tot = 0, done = 0;
            proj.macroActivities.forEach(m => m.microActivities.forEach(mi => {
              tot++;
              if (mi.status === 'Concluído e aprovado') done++;
            }));
            return tot > 0 ? done / tot : 0;
          };
          return getProgress(b) - getProgress(a);
        }
        // Recent / Active first
        if (a.status === 'Ativo' && b.status !== 'Ativo') return -1;
        if (a.status !== 'Ativo' && b.status === 'Ativo') return 1;
        return 0;
      });
  }, [accessibleProjects, searchTerm, statusFilter, responsibleFilter, sortBy]);

  if (viewMode === 'selection' || viewMode === 'initial') {
    return (
      <div className="space-y-4 animate-in fade-in duration-500 pb-12">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100/90 text-teal-700 flex items-center justify-center shadow-xs shrink-0">
              <Folder size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Projetos</h1>
              <p className="text-xs font-medium text-slate-500">
                Acompanhe, gerencie e visualize todos os projetos do módulo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {canCreatePlan && (
              <>
                <button 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-2 active:scale-95"
                >
                  <Plus size={16} className="text-slate-500" /> Criar Novo Plano
                </button>

                <button 
                  onClick={() => setIsNewModelModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-2 active:scale-95 cursor-pointer"
                  title="Criar um novo modelo de dossiê regulatório (Exclusivo para Líderes e Administradores)"
                >
                  <FilePlus size={16} className="text-indigo-600" /> Criar Modelo de Dossiê
                </button>
              </>
            )}

            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-5 py-2.5 bg-[#00875A] hover:bg-[#00704a] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Plus size={16} /> CRIAR NOVO PROJETO
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Projetos */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-start justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL DE PROJETOS</span>
              <span className="text-2xl font-black text-slate-900 block leading-tight">{overviewStats.total}</span>
              <span className="text-[11px] font-bold text-slate-400 block">Todos os projetos</span>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-700 border border-teal-100/80 rounded-2xl">
              <Folder size={20} />
            </div>
          </div>

          {/* Em Andamento */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">EM ANDAMENTO</span>
                <span className="text-2xl font-black text-slate-900 block leading-tight">{overviewStats.inProgress}</span>
                <span className="text-[11px] font-bold text-slate-400 block">{overviewStats.inProgressPct}% do total</span>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-500 rounded-full border border-blue-100/80">
                <Play size={18} className="fill-blue-500 ml-0.5" />
              </div>
            </div>
            <div className="w-full h-1 bg-blue-500 rounded-full mt-4" />
          </div>

          {/* Concluídos */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CONCLUÍDOS</span>
                <span className="text-2xl font-black text-slate-900 block leading-tight">{overviewStats.completed}</span>
                <span className="text-[11px] font-bold text-slate-400 block">{overviewStats.completedPct}% do total</span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/80">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="w-full h-1 bg-emerald-500 rounded-full mt-4" />
          </div>

          {/* Planejados */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">PLANEJADOS</span>
                <span className="text-2xl font-black text-slate-900 block leading-tight">{overviewStats.planned}</span>
                <span className="text-[11px] font-bold text-slate-400 block">{overviewStats.plannedPct}% do total</span>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-500 rounded-full border border-amber-100/80">
                <Clock size={18} />
              </div>
            </div>
            <div className="w-full h-1 bg-amber-500 rounded-full mt-4" />
          </div>
        </div>

        {/* Search & Action Controls Row */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome do projeto, responsável ou descrição..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/60 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setProjectsLayoutMode('list')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                    projectsLayoutMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Visualizar em formato de Lista"
                >
                  <ListOrdered size={15} /> Lista
                </button>
                <button
                  onClick={() => setProjectsLayoutMode('cards')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                    projectsLayoutMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Visualizar em formato de Cards"
                >
                  <LayoutGrid size={15} /> Cards
                </button>
              </div>

              <button
                onClick={() => setShowFiltersBar(!showFiltersBar)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 border ${
                  showFiltersBar ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={15} /> FILTROS
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer"
              >
                <option value="recent">Mais recentes</option>
                <option value="name">Nome (A-Z)</option>
                <option value="progress">Maior progresso</option>
              </select>

              <button 
                onClick={() => setIsActivityMapOpen(true)} 
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold uppercase transition flex items-center gap-1.5"
                title="Abrir Mapa de Atividades"
              >
                <Workflow size={16} /> <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFiltersBar && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex flex-col text-[10px] font-bold text-slate-400 uppercase">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Todos">Todos</option>
                  <option value="EM ANDAMENTO">Em andamento</option>
                  <option value="EM REVISÃO">Em revisão</option>
                  <option value="PLANEJADO">Planejado</option>
                  <option value="CONCLUÍDO">Concluído</option>
                  <option value="SUSPENSO">Suspenso</option>
                </select>
              </div>

              <div className="flex flex-col text-[10px] font-bold text-slate-400 uppercase">
                <span>Responsável</span>
                <select
                  value={responsibleFilter}
                  onChange={e => setResponsibleFilter(e.target.value)}
                  className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Todos">Todos</option>
                  {uniqueResponsibles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col text-[10px] font-bold text-slate-400 uppercase">
                <span>Área</span>
                <select
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value)}
                  className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Todas">Todas</option>
                </select>
              </div>

              <div className="flex flex-col text-[10px] font-bold text-slate-400 uppercase">
                <span>Tipo de projeto</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Todos">Todos</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setStatusFilter('Todos');
                  setResponsibleFilter('Todos');
                  setAreaFilter('Todas');
                  setTypeFilter('Todos');
                  setSearchTerm('');
                }}
                className="mt-4 text-[10px] font-black uppercase text-teal-700 hover:text-teal-900 transition flex items-center gap-1 ml-auto"
              >
                <X size={12} /> LIMPAR FILTROS
              </button>
            </div>
          )}
        </div>

        {/* Projects View Render (List or Cards) */}
        {projectsLayoutMode === 'list' ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-4 px-6">Projeto</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Líder</th>
                    <th className="py-4 px-6">Progresso</th>
                    <th className="py-4 px-4 text-center">Alertas / Macros</th>
                    <th className="py-4 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map(project => {
                    let totalMicros = 0;
                    let doneMicros = 0;
                    let alertsCount = 0;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    project.macroActivities.forEach(macro => {
                      macro.microActivities.forEach(micro => {
                        totalMicros++;
                        if (micro.status === 'Concluído e aprovado') doneMicros++;
                        if (micro.dueDate && new Date(micro.dueDate + 'T00:00:00') < today && micro.status !== 'Concluído e aprovado') {
                          alertsCount++;
                        }
                      });
                    });

                    const progress = totalMicros > 0 ? Math.round((doneMicros / totalMicros) * 100) : 0;
                    const macrosCount = project.macroActivities.length;

                    const stLower = (project.status || '').toLowerCase();
                    let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                    let statusBadgeText: string = project.status || 'Ativo';

                    if (stLower.includes('revis')) {
                      statusBadgeClass = 'bg-blue-100/90 text-blue-800 border-blue-200/80';
                      statusBadgeText = 'EM REVISÃO';
                    } else if (stLower.includes('plan')) {
                      statusBadgeClass = 'bg-amber-100/90 text-amber-800 border-amber-200/80';
                      statusBadgeText = 'PLANEJADO';
                    } else if (stLower.includes('concl')) {
                      statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                      statusBadgeText = 'CONCLUÍDO';
                    } else if (stLower.includes('susp')) {
                      statusBadgeClass = 'bg-red-100/90 text-red-800 border-red-200/80';
                      statusBadgeText = 'SUSPENSO';
                    } else {
                      statusBadgeClass = 'bg-emerald-100/90 text-emerald-800 border-emerald-200/80';
                      statusBadgeText = 'EM ANDAMENTO';
                    }

                    return (
                      <tr 
                        key={project.id}
                        onClick={() => {
                          setSelectedProject(project);
                          setViewMode('dashboard');
                          setProjectDetailView('dashboard');
                        }}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-teal-700 transition-colors">
                              {project.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {project.description || 'Desenvolvimento e acompanhamento de candidato vacinal no módulo CTVacinas.'}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${statusBadgeClass}`}>
                            {statusBadgeText}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="text-xs font-extrabold text-slate-700 uppercase">
                            {project.responsible || 'BRUNA'}
                          </span>
                        </td>

                        <td className="py-4 px-6 min-w-[180px]">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-extrabold">
                              <span className="text-slate-900 font-black">{progress}%</span>
                              <span className="text-slate-400">{doneMicros} / {totalMicros} ativ.</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                            <span className={`px-2 py-0.5 rounded-full ${alertsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                              {alertsCount} alertas
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {macrosCount} macros
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setViewMode('dashboard');
                                setProjectDetailView('dashboard');
                              }}
                              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-2xs flex items-center gap-1"
                            >
                              Abrir <ArrowRight size={14} />
                            </button>

                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuProjectId(activeMenuProjectId === project.id ? null : project.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeMenuProjectId === project.id && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in duration-150">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject(project);
                                      setViewMode('dashboard');
                                      setProjectDetailView('dashboard');
                                      setActiveMenuProjectId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Folder size={14} /> Abrir Projeto
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateProject(project);
                                      setActiveMenuProjectId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <ListPlus size={14} /> Duplicar
                                  </button>
                                  {(isLeader || project.responsible === currentUser?.name) && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenDeletionModal({ type: 'project', ids: { projectId: project.id }, name: project.name });
                                        setActiveMenuProjectId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 size={14} /> Excluir
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Projects Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map(project => {
              let totalMicros = 0;
              let doneMicros = 0;
              let alertsCount = 0;
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              project.macroActivities.forEach(macro => {
                macro.microActivities.forEach(micro => {
                  totalMicros++;
                  if (micro.status === 'Concluído e aprovado') doneMicros++;
                  if (micro.dueDate && new Date(micro.dueDate + 'T00:00:00') < today && micro.status !== 'Concluído e aprovado') {
                    alertsCount++;
                  }
                });
              });

              const progress = totalMicros > 0 ? Math.round((doneMicros / totalMicros) * 100) : 0;
              const macrosCount = project.macroActivities.length;

              const stLower = (project.status || '').toLowerCase();
              let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
              let statusBadgeText: string = project.status || 'Ativo';

              if (stLower.includes('revis')) {
                statusBadgeClass = 'bg-blue-100/90 text-blue-800 border-blue-200/80';
                statusBadgeText = 'EM REVISÃO';
              } else if (stLower.includes('plan')) {
                statusBadgeClass = 'bg-amber-100/90 text-amber-800 border-amber-200/80';
                statusBadgeText = 'PLANEJADO';
              } else if (stLower.includes('concl')) {
                statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                statusBadgeText = 'CONCLUÍDO';
              } else if (stLower.includes('susp')) {
                statusBadgeClass = 'bg-red-100/90 text-red-800 border-red-200/80';
                statusBadgeText = 'SUSPENSO';
              } else {
                statusBadgeClass = 'bg-emerald-100/90 text-emerald-800 border-emerald-200/80';
                statusBadgeText = 'EM ANDAMENTO';
              }

              return (
                <div 
                  key={project.id} 
                  className="group p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-teal-300 transition-all text-left flex flex-col justify-between space-y-5 relative"
                >
                  {/* Card Top Row */}
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${statusBadgeClass}`}>
                      {statusBadgeText}
                    </span>

                    {/* Menu Options Button */}
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuProjectId(activeMenuProjectId === project.id ? null : project.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuProjectId === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in duration-150">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setViewMode('dashboard');
                              setProjectDetailView('dashboard');
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Folder size={14} /> Abrir Projeto
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProject(project);
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <ListPlus size={14} /> Duplicar
                          </button>
                          {(isLeader || project.responsible === currentUser?.name) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDeletionModal({ type: 'project', ids: { projectId: project.id }, name: project.name });
                                setActiveMenuProjectId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div 
                    className="space-y-2 cursor-pointer flex-1"
                    onClick={() => {
                      setSelectedProject(project);
                      setViewMode('dashboard');
                      setProjectDetailView('dashboard');
                    }}
                  >
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-teal-800 transition-colors leading-snug">
                      {project.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                      <User size={13} className="text-slate-400" />
                      <span>{project.responsible || 'BRUNA'}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-1 min-h-[34px]">
                      {project.description || 'Desenvolvimento e acompanhamento de candidato vacinal no módulo CTVacinas.'}
                    </p>
                  </div>

                  {/* Progress Bar & Details */}
                  <div 
                    className="space-y-2 pt-2 border-t border-slate-100 cursor-pointer"
                    onClick={() => {
                      setSelectedProject(project);
                      setViewMode('dashboard');
                      setProjectDetailView('dashboard');
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="font-black text-slate-900">{progress}%</span>
                      <span className="text-[10px] text-slate-400">{doneMicros} / {totalMicros} atividades</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600 rounded-full transition-all duration-700" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Card Footer Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className={alertsCount > 0 ? 'text-amber-500' : 'text-slate-300'} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${alertsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {alertsCount} ALERTAS
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <FolderKanban size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                          {macrosCount} MACROS
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedProject(project);
                        setViewMode('dashboard');
                        setProjectDetailView('dashboard');
                      }}
                      className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition"
                      title="Abrir Projeto"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <Folder size={36} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold uppercase text-slate-500">Nenhum projeto encontrado</p>
            <p className="text-[11px] text-slate-400">Tente ajustar a busca ou limpe os filtros aplicados.</p>
          </div>
        )}

        {/* Modals preserved */}
        {isNewProjectModalOpen && (
          <NewProjectModal 
            isOpen={isNewProjectModalOpen} 
            onClose={() => setIsNewProjectModalOpen(false)} 
            plans={activityPlans} 
            onAddProject={addProject} 
            teamMembers={teamMembers}
          />
        )}
        {isActivityMapOpen && (
          <ProjectActivityMap 
            templates={activityPlans} 
            projects={projects}
            onClose={() => setIsActivityMapOpen(false)} 
            onNavigateToProject={handleNavigateToProject}
          />
        )}
        {isPlanModalOpen && (
          <PlanManagerModal 
            isOpen={isPlanModalOpen} 
            onClose={() => setIsPlanModalOpen(false)} 
            plans={activityPlans} 
            onSave={onUpdateActivityPlans}
            projects={projects}
            onUpdateProjects={onUpdateProjects}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 project-manager-container animate-in fade-in duration-500">
      
      {/* PROJECT HEADER CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col gap-5">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('selection')} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition active:scale-95 shadow-2xs"
              title="Voltar para a Lista de Projetos"
            >
              <ArrowLeft size={16} /> Voltar para Projetos
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Two Tabs: MAPA DE FASES | DETALHAMENTO DAS FASES */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
              <button 
                onClick={() => setProjectPhaseTab('map')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  projectPhaseTab === 'map' 
                    ? 'bg-teal-700 text-white shadow-xs font-black' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={15} /> MAPA DE FASES
              </button>

              <button 
                onClick={() => setProjectPhaseTab('details')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  projectPhaseTab === 'details' 
                    ? 'bg-teal-700 text-white shadow-xs font-black' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListOrdered size={15} /> DETALHAMENTO DAS FASES
              </button>

              <button 
                onClick={() => setProjectPhaseTab('regulatory_docs')} 
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  projectPhaseTab === 'regulatory_docs' 
                    ? 'bg-indigo-600 text-white shadow-xs font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Documentação Regulatória do Projeto"
              >
                <ShieldCheck size={14} /> Doc. Regulatórios
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 no-print">
              <button 
                onClick={() => setIsChecklistModalOpen(true)} 
                className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition" 
                title="Checklist Regulatório"
              >
                <ClipboardCheck size={16} />
              </button>
              <button 
                onClick={handlePrint} 
                className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                title="Imprimir visualização"
              >
                <Printer size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Project Meta Info Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                {selectedProject?.name}
              </h1>
              <div className="flex gap-1 no-print">
                {(isLeader || selectedProject?.responsible === currentUser?.name) && (
                  <>
                    <button onClick={handleStartEdit} className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition" title="Editar Projeto"><Edit size={14}/></button>
                    <button onClick={() => onOpenDeletionModal({ type: 'project', ids: { projectId: selectedProject!.id }, name: selectedProject!.name })} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir Projeto"><Trash2 size={14}/></button>
                  </>
                )}
              </div>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-tight">
              Responsável: {selectedProject?.responsible || 'Não definido'}
            </p>
          </div>

          {/* Next Milestone Pill */}
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl flex items-center gap-4 shadow-md border border-white/5 no-print">
            <div className="p-2 bg-white/10 rounded-xl text-amber-400 shrink-0">
              <Presentation size={18} />
            </div>
            <div className="space-y-0.5 min-w-[130px]">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Próximo Marco</p>
              <p className="text-xs font-black uppercase tracking-tight leading-tight truncate max-w-[180px]">
                {projectStats?.milestoneName || 'Ensaio de Segurança BPL'}
              </p>
            </div>
            <div className="pl-3.5 border-l border-white/10">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Prazo</p>
              <p className="text-xs font-black text-amber-400 tracking-tight">
                {projectStats?.milestoneDate ? new Date(projectStats.milestoneDate + 'T00:00:00').toLocaleDateString('pt-BR') : '--/--/----'}
              </p>
            </div>
          </div>

          {/* Overall Project Progress */}
          <div className="flex flex-col items-center gap-1 min-w-[180px]">
            <div className="w-full flex justify-between items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso Total</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">{Math.round(projectStats?.progress || 0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
              <div className="h-full bg-teal-600 rounded-full transition-all duration-1000" style={{ width: `${projectStats?.progress}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* ACTIVE TAB CONTENT */}
      {projectPhaseTab === 'map' && selectedProject && (
        <ProjectPhasesMap 
          project={selectedProject}
          onSelectMacro={(macroId) => {
            setSelectedPhaseMacroId(macroId);
            setProjectPhaseTab('details');
          }}
          onOpenPrerequisitesModal={(macro) => {
            setSelectedMacroForPrerequisites(macro);
            setIsPrerequisitesModalOpen(true);
          }}
        />
      )}

      {projectPhaseTab === 'details' && selectedProject && (
        <ProjectPhaseDetails
          project={selectedProject}
          currentMacroId={selectedPhaseMacroId || selectedProject.macroActivities[0]?.id}
          onBackToMap={() => setProjectPhaseTab('map')}
          onUpdateProject={handleUpdateProject}
          teamMembers={teamMembers}
          regulatoryStandards={regulatoryStandards}
          onOpenRegulatoryModal={onOpenRegulatoryModal}
          onOpenNewMicroModal={() => setIsNewMicroModalOpen(true)}
          onOpenDeletionModal={(item) => onOpenDeletionModal(item as any)}
        />
      )}

      {projectPhaseTab === 'regulatory_docs' && selectedProject && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6">
          <RegulatoryDocManagement 
            projects={projects}
            tasks={tasks}
            regulatoryEvidence={regulatoryEvidence}
            macroActivityConfigs={macroActivityConfigs}
            regulatoryInfoItems={regulatoryInfoItems}
            repeatableRecords={repeatableRecords}
            regulatoryNarratives={regulatoryNarratives}
            regulatoryDocs={regulatoryDocs}
            onUpdateEvidence={onUpdateEvidence}
            onUpdateMacroConfigs={onUpdateMacroConfigs}
            onUpdateInfoItems={onUpdateInfoItems}
            onUpdateRepeatableRecords={onUpdateRepeatableRecords}
            onUpdateNarratives={onUpdateNarratives}
            onUpdateDocs={onUpdateDocs}
            currentUser={currentUser?.name || 'Usuário'}
            hasAdminAccess={canCreatePlan}
            selectedProjectId={selectedProject?.id}
          />
        </div>
      )}

      {/* Modal: Nova Microatividade */}
      {selectedProject && (
        <NewMicroActivityModal
          isOpen={isNewMicroModalOpen}
          onClose={() => setIsNewMicroModalOpen(false)}
          project={selectedProject}
          selectedMacroId={selectedPhaseMacroId || selectedProject.macroActivities[0]?.id}
          teamMembers={teamMembers}
          onAddMicroActivity={handleAddMicroActivity}
        />
      )}

      {/* Modal: Pré-requisitos */}
      {selectedProject && isPrerequisitesModalOpen && (
        <PrerequisitesModal
          isOpen={isPrerequisitesModalOpen}
          onClose={() => setIsPrerequisitesModalOpen(false)}
          title={selectedMacroForPrerequisites?.name || selectedProject.name}
          prerequisites={selectedMacroForPrerequisites?.prerequisites || []}
          onUpdatePrerequisites={handleUpdateMacroPrerequisites}
        />
      )}

      {/* Modal para Líderes e Administradores criarem novos Modelos de Dossiê */}
      {isNewModelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <FilePlus className="text-indigo-600" size={22} /> Criar Novo Modelo de Dossiê Regulatório
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Defina um novo modelo ou padrão de documento regulatório (Exclusivo para Líderes e Administradores).
                  </p>
                </div>
                <button 
                  onClick={() => setIsNewModelModalOpen(false)} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-left max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Título do Modelo *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Dossiê do IFA - Proteína Recombinante Liofilizada"
                    value={newModelTitle}
                    onChange={e => setNewModelTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Grupo do Modelo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Dossiê do IFA - Proteína Recombinante"
                      value={newModelGroup}
                      onChange={e => setNewModelGroup(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Tipo de Documento</label>
                    <select 
                      value={newModelType}
                      onChange={e => setNewModelType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Dossiê Regulatório">Dossiê Regulatório</option>
                      <option value="DDCM">DDCM</option>
                      <option value="Brochura do Investigador">Brochura do Investigador</option>
                      <option value="DEEC">DEEC</option>
                      <option value="Outro Modelo">Outro Modelo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Descrição</label>
                  <textarea 
                    rows={2}
                    placeholder="Descrição breve do objetivo do modelo..."
                    value={newModelDesc}
                    onChange={e => setNewModelDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Texto / Marcadores Iniciais [MARCADOR] (Opcional)
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Cole ou insira o modelo com marcadores entre colchetes, por exemplo:&#10;Vacina [NOME DA VACINA] indicada para [INDICAÇÃO TERAPÊUTICA] com lote [LOTE DO PRODUTO]."
                    value={newModelText}
                    onChange={e => setNewModelText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsNewModelModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (!newModelTitle.trim()) {
                      alert('Por favor, informe o título do modelo.');
                      return;
                    }
                    const markerMatches = newModelText.match(/\[([^\]]+)\]/g) || [];
                    const uniqueMarkers = Array.from(new Set(markerMatches));
                    const defaultItems: RegulatoryDocumentItem[] = uniqueMarkers.map((marker, idx) => {
                      const cleanName = marker.replace(/[\[\]]/g, '');
                      return {
                        id: `item_m_${Date.now()}_${idx}`,
                        code: `1.${idx + 1}`,
                        name: cleanName,
                        type: 'Informação Estruturada' as RegulatoryDocItemType,
                        required: true,
                        sourceInternalId: cleanName.toUpperCase().replace(/\s+/g, '_'),
                        status: 'Vazio' as RegulatoryDocItemStatus,
                        marker: marker,
                        value: ''
                      };
                    });

                    const newDoc: RegulatoryDocument = {
                      id: `doc_model_${Date.now()}`,
                      projectId: selectedProject?.id || projects[0]?.id || 'p1',
                      title: newModelTitle.trim(),
                      type: newModelType,
                      group: newModelGroup.trim(),
                      description: newModelDesc.trim() || 'Modelo regulatório customizado.',
                      currentVersion: '1.0',
                      currentVersionStatus: 'Ativo',
                      updatedAt: new Date().toISOString(),
                      chapters: [
                        {
                          id: `cap_m_${Date.now()}`,
                          code: '1.0',
                          title: '1. Estrutura e Marcadores do Modelo',
                          description: 'Itens gerados a partir do modelo',
                          items: defaultItems.length > 0 ? defaultItems : [
                            {
                              id: `item_def_${Date.now()}`,
                              code: '1.1',
                              name: 'Nome da Vacina / Candidato',
                              type: 'Informação Estruturada',
                              required: true,
                              sourceInternalId: 'PRODUCT_NAME',
                              status: 'Vazio',
                              marker: '[NOME DA VACINA]',
                              value: ''
                            }
                          ]
                        }
                      ]
                    };

                    onUpdateDocs([...regulatoryDocs, newDoc]);
                    setIsNewModelModalOpen(false);
                    setNewModelTitle('');
                    setNewModelDesc('');
                    setNewModelText('');
                    alert(`Modelo "${newDoc.title}" criado com sucesso!`);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
                >
                  Salvar Modelo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPlanModalOpen && (
        <PlanManagerModal 
          isOpen={isPlanModalOpen} 
          onClose={() => setIsPlanModalOpen(false)} 
          plans={activityPlans} 
          onSave={onUpdateActivityPlans}
          projects={projects}
          onUpdateProjects={onUpdateProjects}
        />
      )}
      {isNewProjectModalOpen && (
        <NewProjectModal 
          isOpen={isNewProjectModalOpen} 
          onClose={() => setIsNewProjectModalOpen(false)} 
          plans={activityPlans} 
          onAddProject={addProject} 
          teamMembers={teamMembers}
          currentUser={currentUser}
          isLeader={isLeader}
        />
      )}
      {isChecklistModalOpen && selectedProject && (
        <RegulatoryChecklistModal 
          isOpen={isChecklistModalOpen} 
          onClose={() => setIsChecklistModalOpen(false)} 
          project={selectedProject} 
          onUpdateProject={handleUpdateProject}
          currentUser={currentUser}
        />
      )}

      {isEditingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Editar Projeto</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Atualize as informações básicas do projeto</p>
                </div>
                <button onClick={handleCancelEdit} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Projeto</label>
                  <input 
                    type="text" 
                    value={editedProjectData.name || ''} 
                    onChange={e => setEditedProjectData({...editedProjectData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável Principal</label>
                  <select 
                    value={editedProjectData.responsible || ''} 
                    disabled={!isLeader}
                    onChange={e => setEditedProjectData({...editedProjectData, responsible: e.target.value})}
                    className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none transition ${!isLeader ? 'opacity-70 cursor-not-allowed' : ''}`}
                    title={!isLeader ? 'Apenas o líder pode alterar o responsável pelo projeto' : undefined}
                  >
                    <option value="">Selecione o responsável</option>
                    {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status do Projeto</label>
                  <select 
                    value={editedProjectData.status || 'Em Planejamento'} 
                    onChange={e => setEditedProjectData({...editedProjectData, status: e.target.value as any})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none transition"
                  >
                    <option value="Em Planejamento">Em Planejamento</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipe do Projeto</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nome do integrante..."
                      value={newTeamMemberName}
                      onChange={e => setNewTeamMemberName(e.target.value)}
                      className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                    />
                    <button 
                      onClick={handleAddMemberToEdit}
                      className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition shadow-lg shadow-brand-primary/20"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedProjectData.team?.map(member => (
                      <div key={member} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 group">
                        <span className="text-[10px] font-bold text-slate-600">{member}</span>
                        <button onClick={() => handleRemoveMemberFromEdit(member)} className="text-slate-400 hover:text-red-500 transition"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleCancelEdit}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 shadow-xl shadow-brand-primary/20 transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isActivityMapOpen && (
        <ProjectActivityMap 
          templates={activityPlans} 
          projects={projects}
          onClose={() => setIsActivityMapOpen(false)} 
          onNavigateToProject={handleNavigateToProject}
        />
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon, subtitle, color = '' }: { label: string, value: string | number, icon: any, subtitle: string, color?: string }) => (
  <div className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-lg transition-all ${color}`}>
    <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-1 truncate">{subtitle}</p>
    </div>
  </div>
);

export default ProjectsManager;

