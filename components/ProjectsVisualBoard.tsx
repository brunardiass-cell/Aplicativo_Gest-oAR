
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import ProjectFlowView from './ProjectFlowView';
import ProjectKanbanView from './ProjectKanbanView';
import { SlidersHorizontal, Workflow, Printer, LayoutGrid, Kanban } from 'lucide-react';

interface ProjectsVisualBoardProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  initialProjectId?: string | null;
  onClearInitialProjectId: () => void;
  onNavigateToMicroActivity: (projectId: string, microId: string) => void;
}

const ProjectsVisualBoard: React.FC<ProjectsVisualBoardProps> = ({ 
  projects, 
  onUpdateProjects, 
  initialProjectId, 
  onClearInitialProjectId,
  onNavigateToMicroActivity
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'phases' | 'kanban'>('kanban');

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
      onClearInitialProjectId();
    } else if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    } else if (projects.length > 0 && !projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    } else if (projects.length === 0) {
      setSelectedProjectId(null);
    }
  }, [initialProjectId, projects, selectedProjectId, onClearInitialProjectId]);

  useEffect(() => {
    const afterPrintHandler = () => {
      document.body.classList.remove('is-printing-visual-board');
    };
    window.addEventListener('afterprint', afterPrintHandler);
    return () => window.removeEventListener('afterprint', afterPrintHandler);
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleUpdateProject = (updatedProject: Project) => {
    const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    onUpdateProjects(updatedProjects);
  };

  const handlePrint = () => {
    document.body.classList.add('is-printing-visual-board');
    window.print();
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .visual-board-header, .sidebar, header { display: none !important; }
          .bg-white { border: none !important; shadow: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          .overflow-x-auto { overflow: visible !important; }
          .custom-scrollbar { overflow: visible !important; }
        }
      `}} />
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm visual-board-header flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0 sm:min-w-[300px]">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pr-4 self-center shrink-0 hidden sm:flex">
            <SlidersHorizontal size={14} /> Filtro de Projeto
          </h3>
          <div className="flex-1">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
              disabled={projects.length === 0}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
          <button 
            onClick={() => setViewType('phases')} 
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${viewType === 'phases' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={14} /> Fases
          </button>
          <button 
            onClick={() => setViewType('kanban')} 
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${viewType === 'kanban' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Kanban size={14} /> Kanban
          </button>
        </div>

        <button onClick={handlePrint} className="p-3 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition hidden sm:block" title="Imprimir Modelo Visual">
          <Printer size={16}/>
        </button>
      </div>
      
      {selectedProject ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4 sm:p-8 overflow-x-auto">
          {viewType === 'phases' ? (
            <ProjectFlowView project={selectedProject} onUpdateProject={handleUpdateProject} />
          ) : (
            <ProjectKanbanView 
              project={selectedProject} 
              onUpdateProject={handleUpdateProject} 
              onNavigateToMicroActivity={onNavigateToMicroActivity}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[600px] bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-10">
          <div className="text-center">
            <Workflow size={64} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-400 font-black uppercase text-sm tracking-widest italic">
              Nenhum projeto para exibir.
            </p>
            <p className="text-sm text-slate-500 mt-2">Crie um projeto na aba de Gerenciamento.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsVisualBoard;