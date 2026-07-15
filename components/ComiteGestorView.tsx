import React, { useMemo, useState } from 'react';
import { Project, Task, TeamMember, RegulatoryStandard, ActivityPlanTemplate } from '../types';
import { 
  LayoutDashboard, FolderKanban, Activity, CheckCircle, AlertTriangle, 
  User, Briefcase, Calendar, Map, Kanban, LayoutGrid, X, Search, 
  Users, ArrowUpRight, Info, Clock, ArrowLeft, Sliders, CheckSquare, ListTodo
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProjectGanttView from './ProjectGanttView';
import ProjectKanbanView from './ProjectKanbanView';
import ProjectFlowView from './ProjectFlowView';
import ProjectActivityMap from './ProjectActivityMap';

interface ComiteGestorViewProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  activityPlans: ActivityPlanTemplate[];
  regulatoryStandards: RegulatoryStandard[];
  onImpersonate: (member: TeamMember) => void;
  onOpenRegulatoryModal: (activityName: string) => void;
  defaultTab?: 'dashboard' | 'projects';
}

const ComiteGestorView: React.FC<ComiteGestorViewProps> = ({
  tasks,
  projects,
  teamMembers,
  activityPlans,
  regulatoryStandards,
  onImpersonate,
  onOpenRegulatoryModal,
  defaultTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>(defaultTab);
  
  // Sync activeTab when defaultTab prop changes
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  // Dashboard state
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [dashboardSubTab, setDashboardSubTab] = useState<'pessoas' | 'projetos'>('pessoas');
  
  // Project visualization state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projVisualTab, setProjVisualTab] = useState<'map' | 'gantt' | 'kanban' | 'phases'>('phases');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const activeProjects = useMemo(() => projects.filter(p => !p.deleted), [projects]);

  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => now.getMonth(), [now]);
  const currentYear = useMemo(() => now.getFullYear(), [now]);

  const isThisMonth = useMemo(() => {
    return (dateStr: string | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };
  }, [currentMonth, currentYear]);

  // 1. Calculate dashboard statistics for each team member
  const personStatsList = useMemo(() => {
    // Filter out other comitê gestor profiles from stats if needed, but keeping all team members
    return teamMembers.map(member => {
      // a) Atividades em andamento:
      // Standard tasks where member is lead or collaborator
      const tasksInProgress = tasks.filter(t => 
        !t.deleted && 
        t.status === 'Em Andamento' && 
        (t.projectLead === member.name || (Array.isArray(t.collaborators) && t.collaborators.includes(member.name)))
      ).length;

      // Project microactivities with 'Em andamento'
      let microInProgress = 0;
      activeProjects.forEach(p => {
        p.macroActivities?.forEach(macro => {
          macro.microActivities?.forEach(micro => {
            if (micro.assignee === member.name && micro.status === 'Em andamento') {
              microInProgress++;
            }
          });
        });
      });

      const inProgressCount = tasksInProgress + microInProgress;

      // b) Atividades críticas:
      // Standard tasks not completed with Alta or Urgente priority
      const tasksCritical = tasks.filter(t => 
        !t.deleted && 
        t.status !== 'Concluída' && 
        (t.priority === 'Alta' || t.priority === 'Urgente') && 
        (t.projectLead === member.name || (Array.isArray(t.collaborators) && t.collaborators.includes(member.name)))
      ).length;

      // Project microactivities with status 'A repetir / retrabalho'
      let microCritical = 0;
      activeProjects.forEach(p => {
        p.macroActivities?.forEach(macro => {
          macro.microActivities?.forEach(micro => {
            if (micro.assignee === member.name && micro.status === 'A repetir / retrabalho') {
              microCritical++;
            }
          });
        });
      });

      const criticalCount = tasksCritical + microCritical;

      // c) Entregas previstas no mês:
      // Standard tasks due this month not completed
      const tasksDueThisMonth = tasks.filter(t => 
        !t.deleted && 
        t.status !== 'Concluída' && 
        t.completionDate && 
        isThisMonth(t.completionDate) && 
        (t.projectLead === member.name || (Array.isArray(t.collaborators) && t.collaborators.includes(member.name)))
      ).length;

      // Project microactivities due this month not completed
      let microDueThisMonth = 0;
      activeProjects.forEach(p => {
        p.macroActivities?.forEach(macro => {
          macro.microActivities?.forEach(micro => {
            if (
              micro.assignee === member.name && 
              micro.status !== 'Concluído com restrições' && 
              micro.status !== 'Concluído e aprovado' && 
              micro.dueDate && 
              isThisMonth(micro.dueDate)
            ) {
              microDueThisMonth++;
            }
          });
        });
      });

      const monthlyDeliveriesCount = tasksDueThisMonth + microDueThisMonth;

      // d) Projetos acompanhados:
      // Projects where member is responsible or in the team, and not concluded
      const projectsCount = activeProjects.filter(p => 
        p.status !== 'Concluído' && 
        (p.responsible === member.name || (Array.isArray(p.team) && p.team.includes(member.name)))
      ).length;

      return {
        member,
        inProgressCount,
        criticalCount,
        monthlyDeliveriesCount,
        projectsCount
      };
    });
  }, [teamMembers, tasks, activeProjects, isThisMonth]);

  // 1b. Calculate dashboard statistics for each project
  const projectStatsList = useMemo(() => {
    return activeProjects.map(project => {
      let inProgressCount = 0;
      let criticalCount = 0;
      let monthlyDeliveriesCount = 0;
      let completedCount = 0;

      project.macroActivities?.forEach(macro => {
        macro.microActivities?.forEach(micro => {
          // In progress
          if (micro.status === 'Em andamento') {
            inProgressCount++;
          }
          // Critical / rework
          if (micro.status === 'A repetir / retrabalho') {
            criticalCount++;
          }
          // Completed
          if (micro.status === 'Concluído e aprovado' || micro.status === 'Concluído com restrições') {
            completedCount++;
          }
          // Deliveries in current month (due date is in this month, and not completed)
          if (
            micro.status !== 'Concluído e aprovado' && 
            micro.status !== 'Concluído com restrições' && 
            micro.dueDate && 
            isThisMonth(micro.dueDate)
          ) {
            monthlyDeliveriesCount++;
          }
        });
      });

      // Calculate current phase and its progress
      const phases = project.phases && project.phases.length > 0 
        ? project.phases 
        : Array.from(new Set(project.macroActivities?.map(m => m.phase) || []));

      const phaseCompletionList = phases.map(phaseName => {
        const phaseMacros = project.macroActivities?.filter(m => m.phase === phaseName) || [];
        const phaseMicros = phaseMacros.flatMap(m => m.microActivities || []);
        
        if (phaseMicros.length === 0) {
          return { phaseName, isCompleted: true, completedCount: 0, inProgressCount: 0, totalCount: 0 };
        }
        
        const completedMicros = phaseMicros.filter(mi => mi.status === 'Concluído e aprovado' || mi.status === 'Concluído com restrições');
        const inProgressMicros = phaseMicros.filter(mi => mi.status === 'Em andamento');
        const isCompleted = completedMicros.length === phaseMicros.length;
        
        return {
          phaseName,
          isCompleted,
          completedCount: completedMicros.length,
          inProgressCount: inProgressMicros.length,
          totalCount: phaseMicros.length
        };
      });

      // Find the first phase that is not completed, or default to the last one
      let currentPhaseIndex = phaseCompletionList.findIndex(p => !p.isCompleted);
      if (currentPhaseIndex === -1) {
        currentPhaseIndex = phaseCompletionList.length - 1;
      }

      // Special rule:
      // "E na parte de fase atual, se uma das fases tiver mais de 80% das atividades concluidas e o restante em andamento, e na fase seguinte tenha mais de 10% das atividades concluidas, deixe que a fase atual é a fase seguinte a fase que ta com mais de 80% concluida."
      for (let i = 0; i < phaseCompletionList.length - 1; i++) {
        const currentPhase = phaseCompletionList[i];
        const nextPhase = phaseCompletionList[i + 1];
        
        if (currentPhase.totalCount > 0 && nextPhase.totalCount > 0) {
          const currentCompletedPct = currentPhase.completedCount / currentPhase.totalCount;
          const currentRestInProgress = (currentPhase.completedCount + currentPhase.inProgressCount) === currentPhase.totalCount;
          const nextCompletedPct = nextPhase.completedCount / nextPhase.totalCount;
          
          if (currentCompletedPct > 0.8 && currentRestInProgress && nextCompletedPct > 0.1) {
            currentPhaseIndex = i + 1;
          }
        }
      }

      const activePhaseInfo = currentPhaseIndex !== -1 && phaseCompletionList[currentPhaseIndex]
        ? phaseCompletionList[currentPhaseIndex] 
        : (phaseCompletionList.length > 0 ? phaseCompletionList[phaseCompletionList.length - 1] : null);

      const currentPhaseName = activePhaseInfo ? activePhaseInfo.phaseName : 'N/A';
      const currentPhaseCompleted = activePhaseInfo ? activePhaseInfo.completedCount : 0;
      const currentPhaseTotal = activePhaseInfo ? activePhaseInfo.totalCount : 0;

      return {
        project,
        inProgressCount,
        criticalCount,
        monthlyDeliveriesCount,
        completedCount,
        currentPhaseName,
        currentPhaseCompleted,
        currentPhaseTotal
      };
    });
  }, [activeProjects, isThisMonth]);

  // Filter list by search term
  const filteredStatsList = useMemo(() => {
    return personStatsList.filter(item => 
      item.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [personStatsList, searchTerm]);

  // Filter projects by search term
  const filteredProjectStatsList = useMemo(() => {
    return projectStatsList.filter(item => 
      item.project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      (item.project.responsible || '').toLowerCase().includes(projectSearchTerm.toLowerCase())
    );
  }, [projectStatsList, projectSearchTerm]);

  const teamChartData = useMemo(() => {
    return filteredStatsList.map(item => ({
      name: item.member.name,
      'Em Andamento': item.inProgressCount,
      'Crítica / Retrabalho': item.criticalCount,
      'Entregas no Mês': item.monthlyDeliveriesCount,
      'Projetos Ativos': item.projectsCount,
    }));
  }, [filteredStatsList]);

  const projectChartData = useMemo(() => {
    return filteredProjectStatsList.map(item => ({
      name: item.project.name,
      'Em Andamento': item.inProgressCount,
      'Crítica / Retrabalho': item.criticalCount,
      'Entregas no Mês': item.monthlyDeliveriesCount,
      'Concluídas': item.completedCount,
    }));
  }, [filteredProjectStatsList]);

  // Set default selected project when project visualization tab opens
  const selectedProject = useMemo(() => {
    if (activeProjects.length === 0) return null;
    return activeProjects.find(p => p.id === selectedProjectId) || activeProjects[0];
  }, [activeProjects, selectedProjectId]);

  // Update selected project state if needed
  React.useEffect(() => {
    if (selectedProjectId === 'Todos') return;
    if (selectedProject && selectedProject.id !== selectedProjectId) {
      setSelectedProjectId(selectedProject.id);
    }
  }, [selectedProject, selectedProjectId]);

  // Sync selectedProjectId with projVisualTab
  React.useEffect(() => {
    if (projVisualTab === 'map') {
      setSelectedProjectId('Todos');
    } else if (selectedProjectId === 'Todos' && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [projVisualTab, activeProjects]);

  // Dummy updates so visualizers can still call onUpdateProject without erroring (since Comitê is read-only view)
  const handleNoopUpdateProject = (updatedProj: Project) => {
    console.log("Comitê Gestor is a visual-only view. Project update ignored:", updatedProj.name);
  };

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length > 1 && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Upper Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
            {activeTab === 'dashboard' ? <LayoutDashboard size={22} /> : <FolderKanban size={22} />}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
              {activeTab === 'dashboard' ? 'Painel de Desempenho e Indicadores' : 'Gestão e Visão de Projetos'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Acompanhamento de alta performance do Comitê Gestor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-teal-100 flex items-center gap-2">
            <Briefcase size={12} className="text-teal-600 animate-pulse" /> Perfil: Comitê Gestor
          </span>
        </div>
      </div>

      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Sub-Tabs for Dashboard */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 w-full sm:w-fit overflow-x-auto">
            <button 
              onClick={() => setDashboardSubTab('pessoas')} 
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${dashboardSubTab === 'pessoas' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Users size={14} /> Atividades das Pessoas
            </button>
            <button 
              onClick={() => setDashboardSubTab('projetos')} 
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${dashboardSubTab === 'projetos' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <FolderKanban size={14} /> Atividades dos Projetos
            </button>
          </div>

          {/* Sub Tab: Pessoas */}
          {dashboardSubTab === 'pessoas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Indicadores de Desempenho por Pessoa</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Acompanhamento resumido e consolidado de atividades e projetos da equipe.</p>
                  </div>

                  {/* Search input */}
                  <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar colaborador..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Grid of Team Members Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStatsList.map(({ member, inProgressCount, criticalCount, monthlyDeliveriesCount, projectsCount }) => (
                  <div key={member.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-teal-300 transition flex flex-col justify-between h-full group">
                    <div>
                      {/* Top: Avatar, Name, Role */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-md font-black text-brand-primary">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-brand-primary transition-colors">{member.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{member.role}</p>
                        </div>
                      </div>

                      {/* Indicators Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* In Progress */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Em Andamento</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-slate-800">{inProgressCount}</span>
                            <Activity size={12} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Critical */}
                        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${criticalCount > 0 ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/70 border-slate-100'}`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Críticas / Retrabalho</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className={`text-xl font-black ${criticalCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{criticalCount}</span>
                            <AlertTriangle size={12} className={criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-300'} />
                          </div>
                        </div>

                        {/* Month Deliveries */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Entregas no Mês</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-slate-800">{monthlyDeliveriesCount}</span>
                            <Calendar size={12} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Monitored Projects */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Projetos Ativos</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-slate-800">{projectsCount}</span>
                            <FolderKanban size={12} className="text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Impersonation Button */}
                    <button 
                      onClick={() => onImpersonate(member)}
                      className="w-full py-3 bg-slate-50 hover:bg-brand-primary hover:text-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-slate-150"
                    >
                      Visitar Perfil <ArrowUpRight size={14} />
                    </button>
                  </div>
                ))}

                {filteredStatsList.length === 0 && (
                  <div className="col-span-full bg-white p-16 text-center border border-slate-200 rounded-3xl">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">Nenhum colaborador encontrado com os filtros atuais.</p>
                  </div>
                )}
              </div>

              {/* Team Members Performance Chart */}
              {teamChartData.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Comparativo de Atividades por Colaborador</h4>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} stroke="#cbd5e1" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} stroke="#cbd5e1" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="Em Andamento" fill="#3b82f6" name="Em Andamento" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Crítica / Retrabalho" fill="#ef4444" name="Crítica / Retrabalho" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Entregas no Mês" fill="#10b981" name="Entregas no Mês" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: Projetos */}
          {dashboardSubTab === 'projetos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Indicadores de Desempenho por Projeto</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Acompanhamento consolidado de progresso, fases e indicadores específicos de cada projeto.</p>
                  </div>

                  {/* Search input for projects */}
                  <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={projectSearchTerm}
                      onChange={(e) => setProjectSearchTerm(e.target.value)}
                      placeholder="Buscar projeto..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Grid of Projects Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjectStatsList.map(({ 
                  project, 
                  inProgressCount, 
                  criticalCount, 
                  monthlyDeliveriesCount, 
                  completedCount, 
                  currentPhaseName, 
                  currentPhaseCompleted, 
                  currentPhaseTotal 
                }) => (
                  <div key={project.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-teal-300 transition flex flex-col justify-between h-full group">
                    <div>
                      {/* Top: Icon, Name, Coordinator */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-md font-black text-brand-primary shrink-0">
                          <FolderKanban size={22} className="text-brand-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-brand-primary transition-colors truncate" title={project.name}>{project.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">Coord: {project.responsible || 'Sem responsável'}</p>
                        </div>
                      </div>

                      {/* Indicators Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* In Progress */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Em Andamento</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-slate-800">{inProgressCount}</span>
                            <Activity size={12} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Critical */}
                        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${criticalCount > 0 ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/70 border-slate-100'}`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Críticas / Retrabalho</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className={`text-xl font-black ${criticalCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{criticalCount}</span>
                            <AlertTriangle size={12} className={criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-300'} />
                          </div>
                        </div>

                        {/* Month Deliveries */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Entregas no Mês</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-slate-800">{monthlyDeliveriesCount}</span>
                            <Calendar size={12} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Total Completed */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Atividades Concluídas</span>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-slate-800">{completedCount}</span>
                            <CheckCircle size={12} className="text-slate-400" />
                          </div>
                        </div>
                      </div>

                      {/* Fase Atual & Progresso da Fase */}
                      <div className="bg-teal-50/40 p-4 rounded-2xl border border-teal-100/70 mb-5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fase Atual</span>
                          <span className="text-[10px] font-black text-brand-primary bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 uppercase tracking-wider max-w-[140px] truncate" title={currentPhaseName}>
                            {currentPhaseName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                          <span>Progresso da Fase:</span>
                          <span className="font-extrabold text-slate-800">{currentPhaseCompleted} / {currentPhaseTotal}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand-primary h-full transition-all duration-500" 
                            style={{ width: `${currentPhaseTotal > 0 ? (currentPhaseCompleted / currentPhaseTotal) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* View Project flow Button */}
                    <button 
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setActiveTab('projects');
                      }}
                      className="w-full py-3 bg-slate-50 hover:bg-brand-primary hover:text-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-slate-150"
                    >
                      Ver Fluxo do Projeto <ArrowUpRight size={14} />
                    </button>
                  </div>
                ))}

                {filteredProjectStatsList.length === 0 && (
                  <div className="col-span-full bg-white p-16 text-center border border-slate-200 rounded-3xl">
                    <FolderKanban size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">Nenhum projeto encontrado com os filtros atuais.</p>
                  </div>
                )}
              </div>

              {/* Projects Performance Chart */}
              {projectChartData.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Comparativo de Atividades por Projeto</h4>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} stroke="#cbd5e1" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} stroke="#cbd5e1" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="Em Andamento" fill="#3b82f6" name="Em Andamento" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Concluídas" fill="#10b981" name="Concluídas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Crítica / Retrabalho" fill="#ef4444" name="Crítica / Retrabalho" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Entregas no Mês" fill="#f59e0b" name="Entregas no Mês" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. PROJECT VISUALIZATION VIEW */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Top Panel: Project Selection and Visual Type Selection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full lg:w-fit">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Projeto</span>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full lg:w-80 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white"
                disabled={activeProjects.length === 0}
              >
                {projVisualTab === 'map' && (
                  <option value="Todos">Todos os Projetos</option>
                )}
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {selectedProject && selectedProjectId !== 'Todos' && (
                <button 
                  onClick={() => setIsDetailModalOpen(true)}
                  className="p-3 bg-teal-50 text-brand-primary rounded-xl hover:bg-teal-100 transition shrink-0 flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider"
                  title="Ver Projeto em Detalhes"
                >
                  <Info size={16} /> <span className="hidden sm:inline">Detalhes</span>
                </button>
              )}
            </div>

            {/* Restricted Visual Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto">
              <button 
                onClick={() => setProjVisualTab('phases')} 
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${projVisualTab === 'phases' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <LayoutGrid size={14} /> Fases
              </button>
              <button 
                onClick={() => setProjVisualTab('kanban')} 
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${projVisualTab === 'kanban' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Kanban size={14} /> Kanban
              </button>
              <button 
                onClick={() => setProjVisualTab('gantt')} 
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${projVisualTab === 'gantt' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Clock size={14} /> Gantt
              </button>
              <button 
                onClick={() => setProjVisualTab('map')} 
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${projVisualTab === 'map' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Map size={14} /> Mapa de Atividades
              </button>
            </div>
          </div>

          {/* Visualization Container */}
          {selectedProject || selectedProjectId === 'Todos' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm p-6 overflow-hidden min-h-[500px]">
              {projVisualTab === 'map' && (
                <div className="space-y-4">
                  <ProjectActivityMap 
                    onClose={() => setProjVisualTab('phases')}
                    templates={activityPlans}
                    projects={selectedProjectId === 'Todos' ? activeProjects : activeProjects.filter(p => p.id === selectedProjectId)}
                    onNavigateToProject={(projId) => {
                      setSelectedProjectId(projId);
                      setProjVisualTab('phases');
                    }}
                    initialProjectId={selectedProjectId !== 'Todos' && selectedProjectId ? selectedProjectId : undefined}
                  />
                </div>
              )}

              {projVisualTab === 'gantt' && (
                <ProjectGanttView 
                  project={selectedProject!} 
                  onUpdateProject={handleNoopUpdateProject} 
                  teamMembers={teamMembers}
                />
              )}

              {projVisualTab === 'kanban' && (
                <ProjectKanbanView 
                  project={selectedProject!} 
                  onUpdateProject={handleNoopUpdateProject} 
                  onNavigateToMicroActivity={() => {}} // Read-only view
                  regulatoryStandards={regulatoryStandards}
                  onOpenRegulatoryModal={onOpenRegulatoryModal}
                />
              )}

              {projVisualTab === 'phases' && (
                <ProjectFlowView 
                  project={selectedProject!} 
                  onUpdateProject={handleNoopUpdateProject} 
                  regulatoryStandards={regulatoryStandards} 
                  onOpenRegulatoryModal={onOpenRegulatoryModal} 
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">Nenhum projeto ativo para visualizar.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. DETAILED VIEW MODAL OVERLAY */}
      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <header className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-brand-primary p-3.5 rounded-2xl text-white shadow-lg shadow-teal-500/10">
                  <FolderKanban size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedProject.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      selectedProject.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' :
                      selectedProject.status === 'Em Planejamento' ? 'bg-blue-50 text-blue-600' : 'bg-slate-150 text-slate-500'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Responsável: {selectedProject.responsible || 'Sem responsável oficial'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="p-2 hover:bg-slate-200 rounded-full transition"
              >
                <X size={20} />
              </button>
            </header>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Objective & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Info size={14} className="text-slate-400" /> Objetivo Geral
                  </h4>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line">{selectedProject.objective || 'Nenhum objetivo cadastrado para este projeto.'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <ListTodo size={14} className="text-slate-400" /> Descrição do Escopo
                  </h4>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line">{selectedProject.description || 'Nenhuma descrição detalhada cadastrada.'}</p>
                </div>
              </div>

              {/* Equipe do Projeto */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                  <Users size={14} /> Equipe Vinculada ({selectedProject.team?.length || 0} membros)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.team && selectedProject.team.length > 0 ? (
                    selectedProject.team.map(name => (
                      <span key={name} className="px-3.5 py-2 bg-teal-50 text-teal-700 text-xs font-bold rounded-xl border border-teal-100 flex items-center gap-1.5">
                        <User size={12} className="text-teal-500" /> {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">Nenhum membro vinculado à equipe do projeto.</span>
                  )}
                </div>
              </div>

              {/* Cronograma / Atividades do Projeto */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                  <Clock size={14} /> Detalhamento do Plano de Trabalho ({selectedProject.macroActivities?.length || 0} macroatividades)
                </h4>
                <div className="space-y-6">
                  {selectedProject.macroActivities?.map((macro, idx) => (
                    <div key={macro.id || idx} className="border border-slate-150 rounded-2xl bg-white shadow-sm overflow-hidden">
                      <header className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <span className="text-[8px] font-black uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded mr-2">{macro.phase}</span>
                          <span className="text-xs font-black text-slate-800">{macro.name}</span>
                        </div>
                        {macro.dueDate && (
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white border border-slate-250 px-2.5 py-1 rounded-lg">
                            <Calendar size={12} /> Prazo: {new Date(macro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </header>

                      {/* Micro atividades da macro */}
                      <div className="p-4 bg-white divide-y divide-slate-100">
                        {macro.microActivities && macro.microActivities.length > 0 ? (
                          macro.microActivities.map((micro) => {
                            const hasCompleted = micro.status === 'Concluído com restrições' || micro.status === 'Concluído e aprovado';
                            return (
                              <div key={micro.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{micro.name}</p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <User size={10} /> {micro.assignee || 'Não atribuído'}
                                    </span>
                                    {micro.dueDate && (
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Progress bar */}
                                  {micro.progress !== undefined && (
                                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mr-2">
                                      <div className="bg-brand-primary h-full" style={{ width: `${micro.progress}%` }}></div>
                                    </div>
                                  )}

                                  {/* Status badge */}
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                    micro.status === 'Concluído e aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    micro.status === 'Concluído com restrições' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    micro.status === 'Em andamento' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                    micro.status === 'A repetir / retrabalho' ? 'bg-red-50 text-red-700 border-red-100' :
                                    'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    {hasCompleted ? <CheckSquare size={10} /> : <Clock size={10} />}
                                    {micro.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-xs italic">Nenhuma microatividade programada para esta macroatividade.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-3 bg-slate-800 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl transition"
              >
                Fechar Detalhes
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComiteGestorView;
