
import React, { useState } from 'react';
import { Project, MacroActivity, MicroActivity, ActivityPlanTemplate, TeamMember } from '../types';
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
}

type ProjectView = 'timeline' | 'flow';

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ 
  projects, 
  onUpdateProjects,
  activityPlans,
  onUpdateActivityPlans,
  onOpenDeletionModal,
  teamMembers,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="group flex items-center gap-6 p-8 bg-white/5 rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all text-left"
        >
          <div className="p-5 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <FolderPlus size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Criar Novo Projeto</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Use um plano para gerar um cronograma.</p>
          </div>
        </button>
        <button
          onClick={() => setIsPlanModalOpen(true)}
          className="group flex items-center gap-6 p-8 bg-white/5 rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all text-left"
        >
          <div className="p-5 bg-amber-500 text-white rounded-3xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <ListPlus size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gerenciar Planos</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crie e edite templates de atividades.</p>
          </div>
        </button>
      </div>
      
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4">
          <div className="bg-white/5 rounded-[2rem] border border-white/10 shadow-sm p-6 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-2">Projetos Ativos</h3>
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full p-4 rounded-2xl text-left transition ${selectedProject?.id === p.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-white/10'}`}
              >
                <p className={`text-sm font-black uppercase tracking-tight truncate ${selectedProject?.id === p.id ? 'text-white' : 'text-slate-200'}`}>{p.name}</p>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedProject?.id === p.id ? 'text-blue-200' : 'text-slate-500'}`}>{p.status}</span>
              </button>
            ))}
             {projects.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Nenhum projeto criado.</p>
                </div>
             )}
          </div>
        </div>
        <div className="col-span-8">
            {selectedProject ? (
              <div className="bg-white/5 rounded-[2rem] border border-white/10 shadow-sm p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedProject.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <select 
                             value={selectedProject.status} 
                             onChange={(e) => handleStatusChange(selectedProject.id, e.target.value as Project['status'])}
                             className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-300 rounded-lg border border-white/10 appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                           >
                              <option value="Em Planejamento" className="bg-slate-900">Em Planejamento</option>
                              <option value="Ativo" className="bg-slate-900">Ativo</option>
                              <option value="Suspenso" className="bg-slate-900">Suspenso</option>
                              <option value="Concluído" className="bg-slate-900">Concluído</option>
                           </select>
                           <button onClick={() => handleDuplicateProject(selectedProject)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg" title="Criar Versão 2 do Projeto">
                              <Copy size={14} />
                           </button>
                        </div>
                    </div>
                    <div className="bg-black/20 p-1 rounded-full flex gap-1 border border-white/5">
                        <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 transition ${viewMode === 'timeline' ? 'bg-white/10 text-slate-100 shadow-sm' : 'text-slate-400'}`}>
                           <GanttChartSquare size={14}/> Cronograma
                        </button>
                        <button onClick={() => setViewMode('flow')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 transition ${viewMode === 'flow' ? 'bg-white/10 text-slate-100 shadow-sm' : 'text-slate-400'}`}>
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
                <div className="flex items-center justify-center h-full bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 p-10">
                    <div className="text-center">
                        <FolderKanban size={64} className="mx-auto text-slate-700 mb-6" />
                        <p className="text-slate-500 font-black uppercase text-sm tracking-widest italic">Selecione ou crie um projeto para ver o cronograma.</p>
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
