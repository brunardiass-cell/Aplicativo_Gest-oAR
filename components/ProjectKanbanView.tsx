
import React from 'react';
import { Project, MicroActivity, MicroActivityStatus } from '../types';
import { AlertTriangle, Clock, CheckCircle, ArrowRight } from 'lucide-react';

interface ProjectKanbanViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({ project, onUpdateProject }) => {
  const statuses: MicroActivityStatus[] = [
    'Planejado',
    'Em andamento',
    'Concluído com restrições',
    'A repetir / retrabalho',
    'Concluído e aprovado'
  ];

  const getStatusColor = (status: MicroActivityStatus) => {
    switch (status) {
      case 'Planejado': return 'bg-slate-100 border-slate-200 text-slate-600';
      case 'Em andamento': return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'Concluído com restrições': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'A repetir / retrabalho': return 'bg-red-50 border-red-200 text-red-700';
      case 'Concluído e aprovado': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
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
        if (newStatus === 'Concluído e aprovado') {
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

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px] custom-scrollbar">
      {statuses.map(status => {
        const tasksInStatus = allMicroActivities.filter(t => t.status === status);
        
        return (
          <div key={status} className="flex-1 min-w-[300px] flex flex-col gap-4">
            <div className={`p-4 rounded-2xl border ${getStatusColor(status)} flex items-center justify-between`}>
              <h3 className="text-[10px] font-black uppercase tracking-widest">{status}</h3>
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-[10px] font-black">{tasksInStatus.length}</span>
            </div>
            
            <div className="flex-1 space-y-4 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100">
              {tasksInStatus.map(task => (
                <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{task.macroName}</p>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{task.name}</h4>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}</span>
                    </div>
                    <span>{task.assignee}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <select 
                      value={task.status} 
                      onChange={(e) => handleStatusChange(task.macroId, task.id, e.target.value as MicroActivityStatus)}
                      className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-lg px-2 py-1 outline-none"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {task.status === 'Concluído e aprovado' && <CheckCircle size={14} className="text-emerald-500" />}
                    {task.status === 'A repetir / retrabalho' && <AlertTriangle size={14} className="text-red-500" />}
                  </div>
                </div>
              ))}
              {tasksInStatus.length === 0 && (
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
