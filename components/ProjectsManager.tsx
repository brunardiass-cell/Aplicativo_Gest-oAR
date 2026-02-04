
import React, { useState, useMemo } from 'react';
import { Project, MacroActivity, MicroActivity, ActivityPlanTemplate, TeamMember, AppUser } from '../types';
import { FolderPlus, ListPlus, FolderKanban, Workflow, GanttChartSquare, Copy, Edit, User, Save, X, Users, Plus } from 'lucide-react';
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
  currentUserRole: AppUser['role'] | null;
}

type ProjectView = 'timeline' | 'flow';

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ 
  projects, 
  onUpdateProjects,
  activityPlans,
  onUpdateActivityPlans,
  onOpenDeletionModal,
  teamMembers,
  currentUserRole
}) => {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);
  const [viewMode, setViewMode] = useState<ProjectView>('timeline');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProjectData, setEditedProjectData] = useState<Partial<Project>>({});
  const [newTeamMemberName, setNewTeamMemberName] = useState('');

  const isAdmin = currentUserRole === 'admin';

  const projectStats = useMemo(() => {
    if (!selectedProject) return null;

    let totalMicros = 0;
    let completedMicros = 0;
    let lateMicros = 0;
    let ongoingMicros = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    selectedProject.macroActivities.forEach(macro => {
        macro.microActivities.forEach(micro => {
            totalMicros++;
            if (micro.status === 'Concluída') {
                completedMicros++;
            }
            if (micro.status === 'Em Andamento') {
                ongoingMicros++;
            }
            if (micro.dueDate && new Date(micro.dueDate + 'T00:00:00') < today && micro.status !== 'Concluída') {
                lateMicros++;
            }
        });
    });

    const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0;

    return { totalMicros, completedMicros, lateMicros, ongoingMicros, progress };
  }, [selectedProject]);

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
          className="group flex items-center gap-6 p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all text-left"
        >
          <div className="p-5 bg-brand-primary text-white rounded-3xl shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
            <FolderPlus size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Criar Novo Projeto</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Use um plano para gerar um cronograma.</p>
          </div>
        </button>
        {isAdmin && (
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="group flex items-center gap-6 p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all text-left"
          >
            <div className="p-5 bg-amber-500 text-white rounded-3xl shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
              <ListPlus size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Gerenciar Planos</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crie e edite templates de atividades.</p>
            </div>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-2">Projetos Ativos</h3>
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => { setSelectedProject(p); setIsEditingProject(false); }}
                className={`w-full p-4 rounded-2xl text-left transition ${selectedProject?.id === p.id ? 'bg-brand-primary text-white shadow-lg' : 'hover:bg-slate-50'}`}
              >
                <p className="text-sm font-black uppercase tracking-tight truncate">{p.name}</p>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{p.status}</span>
              </button>
            ))}
             {projects.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Nenhum projeto criado.</p>
                </div>
             )}
          </div>
        </div>
        <div className="col-span-8">
            {selectedProject ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
                <div className="border-b border-slate-100 pb-6">
                  {isEditingProject ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                       <input 
                         value={editedProjectData.name}
                         onChange={(e) => setEditedProjectData({...editedProjectData, name: e.target.value})}
                         className="w-full text-2xl font-black text-slate-800 uppercase tracking-tighter bg-slate-100 border border-slate-200 rounded-lg px-3 py-2"
                       />
                       <div className="flex items-center gap-2">
                           <User size={14} className="text-slate-400"/>
                           <select 
                            value={editedProjectData.responsible}
                            onChange={(e) => setEditedProjectData({...editedProjectData, responsible: e.target.value})}
                            className="w-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-lg border border-slate-200 appearance-none outline-none px-3 py-1.5"
                           >
                              {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                           </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Equipe</label>
                          <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newTeamMemberName}
                                onChange={e => setNewTeamMemberName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMemberToEdit())}
                                placeholder="Adicionar integrante"
                                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                            />
                            <button type="button" onClick={handleAddMemberToEdit} className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"><Plus size={16}/>Add</button>
                          </div>
                          <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl flex flex-wrap gap-2 min-h-[40px]">
                              {editedProjectData.team?.map(name => (
                                  <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                      <span>{name}</span>
                                      <button type="button" onClick={() => handleRemoveMemberFromEdit(name)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                                  </div>
                              ))}
                          </div>
                       </div>
                       <div className="flex items-center gap-2 pt-2">
                         <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-600 transition"><Save size={14}/> Salvar</button>
                         <button onClick={handleCancelEdit} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-300 transition"><X size={14}/> Cancelar</button>
                       </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedProject.name}</h3>
                              <div className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                 <User size={14}/> Responsável: <span className="text-slate-800">{selectedProject.responsible || 'Não definido'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-4">
                                <select 
                                  value={selectedProject.status} 
                                  onChange={(e) => handleStatusChange(selectedProject.id, e.target.value as Project['status'])}
                                  className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-lg border border-slate-200 appearance-none outline-none"
                                >
                                    <option value="Em Planejamento">Em Planejamento</option>
                                    <option value="Ativo">Ativo</option>
                                    <option value="Suspenso">Suspenso</option>
                                    <option value="Concluído">Concluído</option>
                                </select>
                                <button onClick={() => handleDuplicateProject(selectedProject)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" title="Criar Versão 2 do Projeto">
                                    <Copy size={14} />
                                </button>
                                {isAdmin && (
                                  <button onClick={handleStartEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" title="Editar Projeto">
                                      <Edit size={14} />
                                  </button>
                                )}
                              </div>
                          </div>
                          <div className="bg-slate-100 p-1 rounded-full flex gap-1">
                              <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                                <GanttChartSquare size={14}/> Cronograma
                              </button>
                              <button onClick={() => setViewMode('flow')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 ${viewMode === 'flow' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                                <Workflow size={14}/> Fluxo Finalizado
                              </button>
                          </div>
                      </div>
                       {projectStats && (
                            <div className="mt-6 space-y-2">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-slate-500 w-12 text-left">{Math.round(projectStats.progress)}%</span>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${projectStats.progress}%` }}></div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 font-semibold">
                                    {projectStats.completedMicros}/{projectStats.totalMicros} microatividades concluídas
                                    {projectStats.lateMicros > 0 && <span className="text-red-500"> • {projectStats.lateMicros} em atraso</span>}
                                    {projectStats.ongoingMicros > 0 && <span className="text-teal-600"> • {projectStats.ongoingMicros} em andamento</span>}
                                </p>
                            </div>
                        )}
                    </div>
                  )}
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
                <div className="flex items-center justify-center h-full bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-10">
                    <div className="text-center">
                        <FolderKanban size={64} className="mx-auto text-slate-100 mb-6" />
                        <p className="text-slate-400 font-black uppercase text-sm tracking-widest italic">Selecione ou crie um projeto para ver o cronograma.</p>
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
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
};

export default ProjectsManager;