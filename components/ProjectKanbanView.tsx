
import React, { useState } from 'react';
import { Project, MicroActivity, MicroActivityStatus } from '../types';
import { AlertTriangle, Clock, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';

interface ProjectKanbanViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onNavigateToMicroActivity: (projectId: string, microId: string) => void;
}

const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({ project, onUpdateProject, onNavigateToMicroActivity }) => {
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const columns = [
    { title: 'Planejado', statuses: ['Planejado'] as MicroActivityStatus[] },
    { title: 'Em andamento', statuses: ['Em andamento'] as MicroActivityStatus[] },
    { title: 'A repetir / retrabalho', statuses: ['A repetir / retrabalho'] as MicroActivityStatus[] },
    { title: 'Concluído', statuses: ['Concluído com restrições', 'Concluído e aprovado'] as MicroActivityStatus[] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejado': return 'bg-slate-100 border-slate-200 text-slate-600';
      case 'Em andamento': return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'Concluído': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'A repetir / retrabalho': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  };

  const allMicroActivities = project.macroActivities.flatMap(macro => 
    macro.microActivities.map(micro => ({ ...micro, macroId: macro.id, macroName: macro.name }))
  );

  const handleStatusChange = (macroId: string, microId: string, newStatus: MicroActivityStatus) => {
    const updatedProject = { ...project };
    const macro = updatedProject.macroActivities.find(m => m.id === macroId);
    if (macro) {
      const micro = macro.microActivities.find(mi => mi.id === microId);
      if (micro) {
        micro.status = newStatus;
        if (newStatus === 'Concluído e aprovado' || newStatus === 'Concluído com restrições') {
          micro.progress = 100;
          if (!micro.completionDate) {
            micro.completionDate = new Date().toISOString().split('T')[0];
          }
        } else if (newStatus === 'Planejado' || newStatus === 'A repetir / retrabalho') {
          micro.progress = 0;
        }
        onUpdateProject(updatedProject);
      }
    }
  };

  const handleDueDateChange = (macroId: string, microId: string, newDate: string) => {
    const updatedProject = { ...project };
    const macro = updatedProject.macroActivities.find(m => m.id === macroId);
    if (macro) {
      const micro = macro.microActivities.find(mi => mi.id === microId);
      if (micro) {
        micro.dueDate = newDate;
        onUpdateProject(updatedProject);
        setEditingDateId(null);
      }
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px] custom-scrollbar">
      {columns.map(column => {
        const tasksInColumn = allMicroActivities.filter(t => column.statuses.includes(t.status));
        
        return (
          <div key={column.title} className="flex-1 min-w-[300px] flex flex-col gap-4">
            <div className={`p-4 rounded-2xl border ${getStatusColor(column.title)} flex items-center justify-between`}>
              <h3 className="text-[10px] font-black uppercase tracking-widest">{column.title}</h3>
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-[10px] font-black">{tasksInColumn.length}</span>
            </div>
            
            <div className="flex-1 space-y-4 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100">
              {tasksInColumn.map(task => (
                <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{task.macroName}</p>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{task.name}</h4>
                    </div>
                    {task.status === 'Concluído com restrições' && (
                      <div className="bg-amber-100 text-amber-600 p-1 rounded-lg" title="Concluído com restrições">
                        <AlertTriangle size={14} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-brand-primary transition"
                      onDoubleClick={() => setEditingDateId(task.id)}
                      title="Duplo clique para alterar o prazo"
                    >
                      <Clock size={12} />
                      {editingDateId === task.id ? (
                        <input 
                          type="date" 
                          autoFocus
                          defaultValue={task.dueDate || ''}
                          onBlur={(e) => handleDueDateChange(task.macroId, task.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleDueDateChange(task.macroId, task.id, (e.target as HTMLInputElement).value);
                            if (e.key === 'Escape') setEditingDateId(null);
                          }}
                          className="p-0.5 border border-slate-200 rounded outline-none text-[9px]"
                        />
                      ) : (
                        <span>{task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}</span>
                      )}
                    </div>
                    <span>{task.assignee}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <select 
                        value={task.status} 
                        onChange={(e) => handleStatusChange(task.macroId, task.id, e.target.value as MicroActivityStatus)}
                        className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-lg px-2 py-1 outline-none flex-1"
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="A repetir / retrabalho">A repetir / retrabalho</option>
                        <option value="Concluído e aprovado">Concluído e aprovado</option>
                        <option value="Concluído com restrições">Concluído com restrições</option>
                      </select>
                      <button 
                        onClick={() => onNavigateToMicroActivity(project.id, task.id)}
                        className="p-1.5 bg-brand-light text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition"
                        title="Ir para microatividade"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {task.status === 'Concluído e aprovado' && <CheckCircle size={14} className="text-emerald-500" />}
                      {task.status === 'Concluído com restrições' && <CheckCircle size={14} className="text-amber-500" />}
                      {task.status === 'A repetir / retrabalho' && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                  </div>
                </div>
              ))}
              {tasksInColumn.length === 0 && (
                <div className="h-full flex items-center justify-center py-20">
                  <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Vazio</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectKanbanView;
