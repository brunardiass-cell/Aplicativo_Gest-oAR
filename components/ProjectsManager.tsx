
import React, { useState, useMemo, useEffect } from 'react';
import { Project, MacroActivity, MicroActivity, ActivityPlanTemplate, TeamMember, AppUser, RegulatoryStandard, MicroActivityStatus } from '../types';
import { 
  FolderPlus, ListPlus, FolderKanban, Workflow, GanttChartSquare, 
  Copy, Edit, User, Save, X, Users, Plus, Trash2, Printer, 
  ClipboardCheck, Search, ChevronRight, LayoutDashboard, BarChart3, 
  Clock, CheckCircle, AlertTriangle, TrendingUp, Presentation, 
  Kanban, LayoutGrid, Activity, PieChart, Users2
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
  currentUser
}) => {
  const [viewMode, setViewMode] = useState<'initial' | 'selection' | 'dashboard'>('initial');
  const [projectDetailView, setProjectDetailView] = useState<'dashboard' | 'timeline' | 'kanban' | 'phases'>('dashboard');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProjectData, setEditedProjectData] = useState<Partial<Project>>({});
  const [newTeamMemberName, setNewTeamMemberName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUserRole === 'admin';
  
  useEffect(() => {
    if (initialProjectId && viewMode === 'initial') {
      const projectToSelect = projects.find(p => p.id === initialProjectId);
      if (projectToSelect) {
        setSelectedProject(projectToSelect);
        setViewMode('dashboard');
      }
    }
  }, [initialProjectId, projects, viewMode]);

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
    const alerts: any[] = [];
    let nextMilestone: MicroActivity | null = null;
    
    selectedProject.macroActivities.forEach(macro => {
      phaseDist[macro.phase] = (phaseDist[macro.phase] || 0) + 1;
      
      macro.microActivities.forEach(micro => {
        totalMicros++;
        
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
        
        if (dueDate && dueDate < today && micro.status !== 'Concluído e aprovado') {
          lateMicros++;
          alerts.push({
            id: micro.id,
            name: micro.name,
            macroName: macro.name,
            dueDate: micro.dueDate,
            daysLate: Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          });
        }

        // Next milestone (incomplete with earliest due date)
        if (micro.status !== 'Concluído e aprovado' && dueDate) {
          if (!nextMilestone || (micro.dueDate && nextMilestone.dueDate && micro.dueDate < nextMilestone.dueDate)) {
            nextMilestone = micro;
          }
        }
      });
    });

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
      nextMilestone
    };
  }, [selectedProject]);

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

  const handleStartEdit = () => {
    if (selectedProject) {
      setEditedProjectData({ name: selectedProject.name, responsible: selectedProject.responsible, team: selectedProject.team || [] });
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

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.responsible && p.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        // Ativos first
        if (a.status === 'Ativo' && b.status !== 'Ativo') return -1;
        if (a.status !== 'Ativo' && b.status === 'Ativo') return 1;
        return 0;
      });
  }, [projects, searchTerm]);

  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-emerald-500';
    if (score > 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-700';
      case 'Em Planejamento': return 'bg-amber-100 text-amber-700';
      case 'Suspenso': return 'bg-red-100 text-red-700';
      case 'Concluído': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (viewMode === 'initial') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-4xl w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gerenciador de Projetos</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Selecione uma opção para começar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => setViewMode('selection')} className="group p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-brand-primary/30 transition-all flex flex-col items-center gap-6 active:scale-95">
              <div className="p-5 bg-brand-primary text-white rounded-3xl shadow-xl shadow-brand-primary/20 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">Acompanhar projeto</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visualize progresso e métricas.</p>
              </div>
            </button>

            <button onClick={() => setIsNewProjectModalOpen(true)} className="group p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-teal-400/30 transition-all flex flex-col items-center gap-6 active:scale-95">
              <div className="p-5 bg-teal-500 text-white rounded-3xl shadow-xl shadow-teal-500/20 group-hover:scale-110 transition-transform">
                <FolderPlus size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">Criar Novo Projeto</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inicie um novo cronograma.</p>
              </div>
            </button>

            {isAdmin && (
              <button onClick={() => setIsPlanModalOpen(true)} className="group p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-amber-400/30 transition-all flex flex-col items-center gap-6 active:scale-95">
                <div className="p-5 bg-amber-500 text-white rounded-3xl shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <ListPlus size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">Gerenciar Planos</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Edite templates de projetos.</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {isNewProjectModalOpen && (<NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} plans={activityPlans} onAddProject={addProject} teamMembers={teamMembers}/>)}
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

  if (viewMode === 'selection') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('initial')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Acompanhar projeto</h2>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou responsável..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-brand-primary/20 transition outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            let totalMicros = 0;
            let doneMicros = 0;
            let alerts = 0;
            const today = new Date();
            today.setHours(0,0,0,0);

            project.macroActivities.forEach(macro => {
              macro.microActivities.forEach(micro => {
                totalMicros++;
                if (micro.status === 'Concluído e aprovado') doneMicros++;
                if (micro.dueDate && new Date(micro.dueDate + 'T00:00:00') < today && micro.status !== 'Concluído e aprovado') {
                  alerts++;
                }
              });
            });

            const progress = totalMicros > 0 ? Math.round((doneMicros / totalMicros) * 100) : 0;

            return (
              <button 
                key={project.id} 
                onClick={() => {
                  setSelectedProject(project);
                  setViewMode('dashboard');
                  setProjectDetailView('dashboard');
                }}
                className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-primary/30 transition-all text-left space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-brand-primary transition-colors">{project.name}</h3>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <User size={12} />
                      {project.responsible || 'Sem responsável'}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-slate-800 tracking-tighter w-12">{progress}%</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1.5 rounded-md ${alerts > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                        <AlertTriangle size={12} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-tight ${alerts > 0 ? 'text-red-500' : 'text-slate-400'}`}>{alerts} Alertas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 bg-slate-50 text-slate-400 rounded-md">
                        <FolderKanban size={12} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">{project.macroActivities.length} Macros</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-brand-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                  <span className="text-[9px] font-black uppercase tracking-widest mr-2">Abrir Dashboard</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum projeto encontrado.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 project-manager-container animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('selection')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 px-2.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[8px] font-black uppercase tracking-widest">
              <Activity size={10} /> Dashboard do Projeto
            </div>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedProject?.name}</h1>
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest leading-tight">Responsável: {selectedProject?.responsible || 'Não definido'}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-[200px]">
          <div className="w-full flex justify-between items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso Total</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">{Math.round(projectStats?.progress || 0)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
            <div className="h-full bg-brand-primary rounded-full shadow-lg transition-all duration-1000" style={{ width: `${projectStats?.progress}%` }}></div>
          </div>
        </div>

        <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
           <button onClick={() => setProjectDetailView('dashboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${projectDetailView === 'dashboard' ? 'bg-white text-brand-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
             <LayoutDashboard size={12} /> Dashboard
           </button>
           <button onClick={() => setProjectDetailView('timeline')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${projectDetailView === 'timeline' ? 'bg-white text-brand-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
             <GanttChartSquare size={12} /> Timeline
           </button>
           <button onClick={() => setProjectDetailView('kanban')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${projectDetailView === 'kanban' ? 'bg-white text-brand-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
             <Kanban size={12} /> Kanban
           </button>
           <button onClick={() => setProjectDetailView('phases')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${projectDetailView === 'phases' ? 'bg-white text-brand-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
             <LayoutGrid size={12} /> Fases
           </button>
        </div>
      </div>

      {projectDetailView === 'dashboard' ? (
        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard label="Em Andamento" value={projectStats?.ongoingMicros || 0} icon={<Clock className="text-blue-500" />} subtitle="Atividades ativas" />
              <MetricCard label="Concluídas" value={projectStats?.completedMicros || 0} icon={<CheckCircle className="text-emerald-500" />} subtitle="Total entregue" />
              <MetricCard label="Em Atraso" value={projectStats?.lateMicros || 0} icon={<AlertTriangle className="text-red-500" />} subtitle="Requer atenção" color={projectStats?.lateMicros && projectStats.lateMicros > 0 ? 'border-red-200 bg-red-50/30' : ''} />
              <MetricCard label="Saúde" value={`${projectStats?.health}%`} icon={<TrendingUp className={getHealthColor(projectStats?.health || 0)} />} subtitle="Índice de conformidade" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Users2 size={16} /> Carga da Equipe
                    </h3>
                 </div>
                 <div className="h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={projectStats?.teamLoadData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" fontSize={9} fontWeight="black" width={80} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{fill: '#f8fafc'}} />
                       <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={25}>
                         {projectStats?.teamLoadData.map((_, i) => <Cell key={i} fill={['#6366f1', '#06b6d4', '#2dd4bf', '#fbbf24'][i % 4]} />)}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <PieChart size={16} /> Distribuição por Fase
                    </h3>
                 </div>
                 <div className="h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <RePieChart>
                       <Pie
                         data={projectStats?.phaseDistData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {projectStats?.phaseDistData.map((_, i) => <Cell key={i} fill={['#6366f1', '#06b6d4', '#2dd4bf', '#fbbf24', '#f472b6'][i % 5]} />)}
                       </Pie>
                       <Tooltip />
                     </RePieChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-[350px] space-y-8">
            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl space-y-6">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                 <Presentation size={14} /> Próximo Marco
               </div>
               {projectStats?.nextMilestone ? (
                 <div className="space-y-4">
                    <h4 className="text-xl font-black uppercase tracking-tighter leading-tight">{(projectStats.nextMilestone as any).name}</h4>
                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prazo</span>
                      <span className="text-xs font-bold text-amber-400">{new Date((projectStats.nextMilestone as any).dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                 </div>
               ) : (
                 <p className="text-xs text-slate-500 font-bold italic">Nenhum marco pendente.</p>
               )}
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500">
                 <AlertTriangle size={14} /> Alertas Críticos
               </div>
               <div className="space-y-4">
                  {projectStats?.alerts && projectStats.alerts.length > 0 ? projectStats.alerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 space-y-1">
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">{alert.name}</h5>
                      <div className="flex justify-between items-center text-[9px] font-bold">
                         <span className="text-slate-500">{alert.macroName}</span>
                         <span className="text-red-600">+{alert.daysLate} dias</span>
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem alertas críticos</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4 sm:p-8">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-50 pb-6 gap-4">
               <div className="flex items-center gap-4">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                   {projectDetailView === 'timeline' && <><GanttChartSquare size={20} className="text-brand-primary"/> Linha do Tempo</>}
                   {projectDetailView === 'kanban' && <><Kanban size={20} className="text-brand-primary"/> Kanban do Projeto</>}
                   {projectDetailView === 'phases' && <><LayoutGrid size={20} className="text-brand-primary"/> Fluxo de Fases</>}
                 </h2>
               </div>
               <div className="flex gap-2 no-print">
                 <button onClick={() => setIsChecklistModalOpen(true)} className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary/20 transition" title="Checklist Regulatório"><ClipboardCheck size={16}/></button>
                 <button onClick={handleStartEdit} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition"><Edit size={16}/></button>
                 <button onClick={handlePrint} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition"><Printer size={16}/></button>
                 <button onClick={() => onOpenDeletionModal({ type: 'project', ids: { projectId: selectedProject!.id }, name: selectedProject!.name })} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"><Trash2 size={16}/></button>
               </div>
             </div>

             {projectDetailView === 'timeline' && selectedProject && (
               <ProjectTimeline 
                 project={selectedProject} 
                 onUpdateProject={handleUpdateProject} 
                 onOpenDeletionModal={(item) => onOpenDeletionModal(item as any)} 
                 teamMembers={teamMembers}
                 targetMicroId={targetMicroId}
                 onClearTargetMicroId={onClearTargetMicroId}
                 regulatoryStandards={regulatoryStandards}
                 onOpenRegulatoryModal={onOpenRegulatoryModal}
               />
             )}
             {projectDetailView === 'kanban' && selectedProject && (
               <ProjectKanbanView 
                 project={selectedProject} 
                 onUpdateProject={handleUpdateProject} 
                 onNavigateToMicroActivity={(pid, mid) => {
                   setProjectDetailView('timeline');
                 }}
                 regulatoryStandards={regulatoryStandards}
                 onOpenRegulatoryModal={onOpenRegulatoryModal}
               />
             )}
             {projectDetailView === 'phases' && selectedProject && (
               <ProjectFlowView 
                 project={selectedProject} 
                 onUpdateProject={handleUpdateProject} 
                 regulatoryStandards={regulatoryStandards} 
                 onOpenRegulatoryModal={onOpenRegulatoryModal} 
               />
             )}
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
      {isNewProjectModalOpen && (<NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} plans={activityPlans} onAddProject={addProject} teamMembers={teamMembers}/>)}
      {isChecklistModalOpen && selectedProject && (
        <RegulatoryChecklistModal 
          isOpen={isChecklistModalOpen} 
          onClose={() => setIsChecklistModalOpen(false)} 
          project={selectedProject} 
          onUpdateProject={handleUpdateProject}
          currentUser={currentUser}
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

