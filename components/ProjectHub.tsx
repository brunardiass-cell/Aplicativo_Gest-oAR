
import React, { useState, useEffect, useMemo } from 'react';
import { Project, ActivityPlanTemplate, TeamMember, AppUser, RegulatoryStandard, Task } from '../types';
import { 
  FolderPlus, 
  ListPlus, 
  FolderSearch, 
  ChevronRight, 
  ArrowLeft,
  Settings,
  Plus,
  LayoutDashboard,
  Activity,
  FolderKanban,
  ShieldAlert
} from 'lucide-react';
import ProjectsManager from './ProjectsManager';
import ProjectCompleteDashboard from './ProjectCompleteDashboard';
import ProjectKanbanView from './ProjectKanbanView';
import ProjectsVisualBoard from './ProjectsVisualBoard';
import ProjectSharingModal from './ProjectSharingModal';

interface ProjectHubProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  activityPlans: ActivityPlanTemplate[];
  onUpdateActivityPlans: (plans: ActivityPlanTemplate[]) => void;
  onOpenDeletionModal: (item: any) => void;
  teamMembers: TeamMember[];
  appUsers: AppUser[];
  currentUserRole: AppUser['role'] | null;
  tasks: Task[];
  regulatoryStandards: RegulatoryStandard[];
  onOpenRegulatoryModal: (activityName: string) => void;
  currentUser: TeamMember | null;
  step: 'landing' | 'selection' | 'details';
  onStepChange: (step: 'landing' | 'selection' | 'details') => void;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

const ProjectHub: React.FC<ProjectHubProps> = (props) => {
  const { step, onStepChange, selectedProjectId, onSelectProject } = props;
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'management' | 'kanban' | 'visual' | 'timeline' | 'gantt' | 'risk'>('dashboard');
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [pendingModal, setPendingModal] = useState<{ type: 'new' | 'plan' } | null>(null);

  const selectedProject = props.projects.find(p => p.id === selectedProjectId) || null;
  const isAdmin = props.currentUserRole === 'admin';

  // Filter projects based on sharing and responsibilities
  const filteredProjects = props.projects.filter(p => {
    if (p.deleted) return false;
    if (isAdmin) return true;
    if (props.currentUser?.name === 'Visão Geral da Equipe') return true;
    
    const isResponsible = p.responsible === props.currentUser?.name;
    const isTeamMember = p.team?.includes(props.currentUser?.name || '');
    const isShared = p.sharedWith?.includes(props.currentUser?.name || '');
    
    return isResponsible || isTeamMember || isShared;
  });

  const handleSelectProject = (projectId: string) => {
    onSelectProject(projectId);
    onStepChange('details');
    setActiveSubView('dashboard');
  };

  const handleBackToSelection = () => {
    onStepChange('selection');
  };

  const handleBackToLanding = () => {
    onStepChange('landing');
    onSelectProject(null);
  };

  const handleUpdateCurrentProject = (updated: Project) => {
     const up = props.projects.map(p => p.id === updated.id ? updated : p);
     props.onUpdateProjects(up);
  };

  if (step === 'landing') {
    return (
      <div className="max-w-6xl mx-auto space-y-12 py-10 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Gerenciador de Projetos</h2>
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Escolha uma ação para começar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <LandingCard 
            title="Criar Novo Projeto"
            description="Use um plano para gerar um cronograma completo."
            icon={<FolderPlus size={32} />}
            color="bg-emerald-500"
            onClick={() => {
                setPendingModal({ type: 'new' });
                onStepChange('details');
                setActiveSubView('management');
            }}
          />
          <LandingCard 
            title="Gerenciar Planos"
            description="Crie e edite templates de atividades e fases."
            icon={<ListPlus size={32} />}
            color="bg-amber-500"
            onClick={() => {
                setPendingModal({ type: 'plan' });
                onStepChange('details');
                setActiveSubView('management');
            }}
            disabled={!isAdmin}
          />
          <LandingCard 
            title="Acompanhar Projeto"
            description="Selecione um projeto para ver progresso e dashboard."
            icon={<FolderSearch size={32} />}
            color="bg-brand-primary"
            onClick={() => onStepChange('selection')}
          />
        </div>

        {filteredProjects.length > 0 && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14}/> Projetos Recentes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.slice(0, 3).map(proj => (
                        <button 
                            key={proj.id}
                            onClick={() => handleSelectProject(proj.id)}
                            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition group"
                        >
                            <div className="text-left">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate w-32">{proj.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{proj.status}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-primary transition-transform group-hover:translate-x-1" />
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  }

  if (step === 'selection') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between gap-4">
            <button onClick={handleBackToLanding} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition font-black text-[10px] uppercase tracking-widest">
                <ArrowLeft size={16} /> Voltar para Início
            </button>
            <div className="flex items-center gap-2">
                 {isAdmin && <button onClick={() => {/* Trigger Plans Modal */}} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><Settings size={18}/></button>}
                 <button onClick={() => {/* Trigger New Project Modal */}} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100"><Plus size={16}/> Novo Projeto</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length > 0 ? filteredProjects.map(project => (
                <ProjectSelectionCard 
                    key={project.id} 
                    project={project} 
                    onClick={() => handleSelectProject(project.id)}
                />
            )) : (
                <div className="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <FolderSearch size={48} className="text-slate-100 mb-4" />
                    <p className="text-slate-400 font-bold text-sm">Nenhum projeto encontrado.</p>
                </div>
            )}
        </div>
      </div>
    );
  }

  if (step === 'details' && selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button onClick={handleBackToSelection} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand-primary transition shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedProject.name}</h2>
                   <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${selectedProject.status === 'Ativo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedProject.status}</span>
                   </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-[500px]">
                <NavTab active={activeSubView === 'dashboard'} onClick={() => setActiveSubView('dashboard')} label="Dashboard" />
                <NavTab active={activeSubView === 'management'} onClick={() => setActiveSubView('management')} label="Tabela" />
                <NavTab active={activeSubView === 'kanban'} onClick={() => setActiveSubView('kanban')} label="Kanban" />
                <NavTab active={activeSubView === 'visual'} onClick={() => setActiveSubView('visual')} label="Fases" />
            </div>
        </div>

        {activeSubView === 'dashboard' && (
          <ProjectCompleteDashboard 
            project={selectedProject} 
            tasks={props.tasks} 
            onViewChange={setActiveSubView}
            activeView={activeSubView}
            onShare={() => setIsSharingModalOpen(true)}
            isAdmin={isAdmin}
            currentUser={props.currentUser}
          />
        )}

        {activeSubView === 'management' && (
          <ProjectsManager 
            {...props} 
            projects={props.projects}
            initialProjectId={selectedProjectId}
            openNewProjectModal={pendingModal?.type === 'new'}
            openPlanModal={pendingModal?.type === 'plan'}
            hideHeader={true}
          />
        )}

        {activeSubView === 'visual' && (
          <ProjectsVisualBoard 
             projects={props.projects}
             initialProjectId={selectedProjectId || undefined}
             onNavigateToMicroActivity={() => setActiveSubView('management')}
             regulatoryStandards={props.regulatoryStandards}
             onOpenRegulatoryModal={props.onOpenRegulatoryModal}
             onUpdateProjects={props.onUpdateProjects}
             onClearInitialProjectId={() => {}}
          />
        )}

        {isSharingModalOpen && selectedProject && (
          <ProjectSharingModal 
            isOpen={isSharingModalOpen}
            onClose={() => setIsSharingModalOpen(false)}
            project={selectedProject}
            onUpdateProject={handleUpdateCurrentProject}
            teamMembers={props.teamMembers}
            appUsers={props.appUsers}
          />
        )}

        {activeSubView === 'kanban' && selectedProject && (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm min-h-[600px]">
             <ProjectKanbanView 
                project={selectedProject}
                onUpdateProject={(p) => {
                    const up = props.projects.map(proj => proj.id === p.id ? p : proj);
                    props.onUpdateProjects(up);
                }}
                onNavigateToMicroActivity={() => setActiveSubView('management')}
                regulatoryStandards={props.regulatoryStandards}
                onOpenRegulatoryModal={props.onOpenRegulatoryModal}
             />
          </div>
        )}

        {(activeSubView === 'timeline' || activeSubView === 'gantt' || activeSubView === 'risk') && (
            <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                <ChevronRight size={48} className="mx-auto text-slate-100 mb-6" />
                <h3 className="text-lg font-black text-slate-800 uppercase italic">Visualização em desenvolvimento</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Escolha Lista, Kanban ou Fases para prosseguir.</p>
                <button onClick={() => setActiveSubView('dashboard')} className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">Voltar ao Dashboard</button>
            </div>
        )}
      </div>
    );
  }

  return null;
};

const LandingCard = ({ title, description, icon, color, onClick, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`group flex flex-col p-8 bg-white rounded-[3rem] border-2 border-transparent shadow-sm hover:shadow-2xl hover:border-slate-100 transition-all text-left space-y-6 ${disabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
        <div className={`w-16 h-16 ${color} text-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed">{description}</p>
        </div>
        <div className="pt-4 flex items-center gap-2 text-brand-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Prosseguir <ChevronRight size={14} />
        </div>
    </button>
);

const ProjectSelectionCard = ({ project, onClick }: { project: Project; onClick: () => void }) => {
    const stats = useMemo(() => {
        let total = 0;
        let completed = 0;
        project.macroActivities.forEach(m => {
            m.microActivities.forEach(mi => {
                total++;
                if (mi.status === 'Concluído e aprovado') completed++;
            });
        });
        return { total, completed, progress: total > 0 ? (completed / total) * 100 : 0 };
    }, [project]);

    return (
        <button 
            onClick={onClick}
            className="flex flex-col bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all text-left space-y-6 group"
        >
            <div className="flex items-center justify-between w-full">
                <div className={`p-3 rounded-2xl ${project.status === 'Ativo' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    <FolderKanban size={20} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-800 uppercase">{Math.round(stats.progress)}%</p>
                    <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{width: `${stats.progress}%`}}></div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate w-full">{project.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{project.responsible || 'Sem responsável'}</p>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[8px] font-black uppercase text-slate-400">
                    <span className="flex items-center gap-1.5"><Activity size={10} /> {stats.total} Ativ.</span>
                    <span className="flex items-center gap-1.5"><ShieldAlert size={10} className="text-amber-500" /> 2 Alertas</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <ChevronRight size={14} />
                </div>
            </div>
        </button>
    );
};

const NavTab = ({ active, onClick, label }: any) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
        }`}
    >
        {label}
    </button>
);

export default ProjectHub;
