
import React, { useState } from 'react';
import { Project, ActivityPlanTemplate, TeamMember } from '../types';
import { FolderPlus, ListPlus, FolderKanban, Workflow, GanttChartSquare, Copy } from 'lucide-react';
import PlanManagerModal from './PlanManagerModal';
import NewProjectModal from './NewProjectModal';
import ProjectTimeline from './ProjectTimeline';
import ProjectFlowView from './ProjectFlowView';

interface ProjectsManagerProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  activityPlans: ActivityPlanTemplate[];
  onUpdateActivityPlans: (plans: ActivityPlanTemplate[]) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', projectId: string; macroId: string; microId?: string; name: string }) => void;
  teamMembers: TeamMember[];
  hasFullAccess: boolean;
  canCreate: boolean;
}

type ProjectView = 'timeline' | 'flow';

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ 
  projects, 
  onUpdateProjects,
  activityPlans,
  onUpdateActivityPlans,
  onOpenDeletionModal,
  teamMembers,
  hasFullAccess,
  canCreate
}) => {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);
  const [viewMode, setViewMode] = useState<ProjectView>('timeline');

  const addProject = (project: Project) => {
    const updatedProjects = [...projects, project];
    onUpdateProjects(updatedProjects);
    setSelectedProject(project);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    onUpdateProjects(updatedProjects);
    setSelectedProject(updatedProject);
  };
  
  const handleStatusChange = (projectId: string, newStatus: Project['status']) => {
    const updatedProjects = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
    onUpdateProjects(updatedProjects);
    if(selectedProject?.id === projectId) {
        setSelectedProject({...selectedProject, status: newStatus});
    }
  };

  const handleDuplicateProject = (projectToDuplicate: Project) => {
    if (!hasFullAccess) return;
    if (!confirm(`Deseja criar uma nova versão do projeto "${projectToDuplicate.name}"? As tarefas serão reiniciadas.`)) return;

    const newProject: Project = {
    ...projectToDuplicate,
    id: 'proj_' + Math.random().toString(36).substr(2, 9),
    name: `${projectToDuplicate.name} (v2)`,
    status: 'Em Planejamento',
    macroActivities: projectToDuplicate.macroActivities.map(macro => ({
        ...macro,
        id: 'macro_' + Math.random().toString(36).substr(2, 9),
        status: 'Planejada',
        microActivities: macro.microActivities.map(micro => ({
        ...micro,
        id: 'micro_' + Math.random().toString(36).substr(2, 9),
        status: 'Planejada',
        completionStatus: 'Não Finalizada',
        observations: '',
        reportLink: '',
        completionDate: undefined,
        }))
    }))
    };
    addProject(newProject);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {canCreate && (
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all text-left"
          >
            <div className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-100 group-hover:scale-105 transition-transform">
              <FolderPlus size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Criar Novo Projeto</h3>
              <p className="text-sm text-slate-500 mt-1">Use um plano para gerar um cronograma.</p>
            </div>
          </button>
        )}
        {hasFullAccess && (
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all text-left"
          >
            <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-100 group-hover:scale-105 transition-transform">
              <ListPlus size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Gerenciar Planos</h3>
              <p className="text-sm text-slate-500 mt-1">Crie e edite templates de atividades.</p>
            </div>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3 h-full">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 pb-2">Projetos Ativos</h3>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {projects.map(p => (
                <button 
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full p-4 rounded-xl text-left transition ${selectedProject?.id === p.id ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-slate-50'}`}
                >
                    <p className={`text-sm font-black uppercase tracking-tight truncate ${selectedProject?.id === p.id ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedProject?.id === p.id ? 'text-teal-200' : 'text-slate-500'}`}>{p.status}</span>
                </button>
                ))}
            </div>
             {projects.length === 0 && (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider italic">Nenhum projeto criado.</p>
                </div>
             )}
          </div>
        </div>
        <div className="col-span-8">
            {selectedProject ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 space-y-6 h-full">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{selectedProject.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <select 
                             value={selectedProject.status} 
                             onChange={(e) => handleStatusChange(selectedProject.id, e.target.value as Project['status'])}
                             disabled={!hasFullAccess}
                             className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-lg border border-slate-200 appearance-none outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-70"
                           >
                              <option value="Em Planejamento">Em Planejamento</option>
                              <option value="Ativo">Ativo</option>
                              <option value="Suspenso">Suspenso</option>
                              <option value="Concluído">Concluído</option>
                           </select>
                           {hasFullAccess &&
                            <button onClick={() => handleDuplicateProject(selectedProject)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" title="Criar Versão 2 do Projeto">
                                <Copy size={14} />
                            </button>
                           }
                        </div>
                    </div>
                    <div className="bg-slate-100 p-1 rounded-full flex gap-1 border border-slate-200">
                        <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 transition ${viewMode === 'timeline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                           <GanttChartSquare size={14}/> Cronograma
                        </button>
                        <button onClick={() => setViewMode('flow')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 transition ${viewMode === 'flow' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                           <Workflow size={14}/> Fluxo Finalizado
                        </button>
                    </div>
                </div>

                 {viewMode === 'timeline' ? (
                    <ProjectTimeline 
                      project={selectedProject} 
                      onUpdateProject={handleUpdateProject}
                      onOpenDeletionModal={onOpenDeletionModal}
                      teamMembers={teamMembers}
                    />
                 ) : (
                    <ProjectFlowView project={selectedProject} />
                 )}
              </div>
            ) : (
                <div className="flex items-center justify-center h-full bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10">
                    <div className="text-center">
                        <p className="text-slate-400 font-bold uppercase text-sm tracking-wider">Selecione ou crie um projeto.</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {isPlanModalOpen && (
        <PlanManagerModal 
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          plans={activityPlans}
          onSave={onUpdateActivityPlans}
        />
      )}

      {isNewProjectModalOpen && (
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          plans={activityPlans}
          onAddProject={addProject}
        />
      )}
    </div>
  );
};

export default ProjectsManager;
