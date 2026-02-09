
import React from 'react';
import { Project, MacroActivity, Status } from '../types';
import { Clock, Activity, PauseCircle, CheckCircle } from 'lucide-react';

interface ProjectFlowViewProps {
  project: Project;
}

const KANBAN_COLUMNS: { title: string; status: Status; icon: React.ReactNode; color: string }[] = [
  { title: 'Planejado', status: 'Planejada', icon: <Clock size={14}/>, color: 'text-slate-500' },
  { title: 'Em Andamento', status: 'Em Andamento', icon: <Activity size={14}/>, color: 'text-teal-500' },
  { title: 'Pausado', status: 'Pausado', icon: <PauseCircle size={14}/>, color: 'text-amber-500' },
  { title: 'Concluído', status: 'Concluída', icon: <CheckCircle size={14}/>, color: 'text-emerald-500' },
];

const ProjectFlowView: React.FC<ProjectFlowViewProps> = ({ project }) => {

  const macrosByStatus = KANBAN_COLUMNS.map(col => ({
    ...col,
    macros: project.macroActivities.filter(macro => macro.status === col.status)
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[500px]">
      {macrosByStatus.map(({ title, status, macros, icon, color }) => (
        <div key={status} className="bg-slate-100/80 rounded-2xl p-4 flex flex-col">
          <h3 className={`text-xs font-black uppercase tracking-widest p-2 flex items-center gap-2 ${color}`}>
            {icon}
            {title}
            <span className="ml-auto px-2 py-0.5 bg-white rounded-full text-slate-500 text-[9px]">{macros.length}</span>
          </h3>
          <div className="space-y-3 mt-2 pr-2 flex-1 overflow-y-auto custom-scrollbar">
            {macros.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400 italic">
                Nenhuma macroatividade aqui.
              </div>
            ) : (
              macros.map(macro => <MacroCard key={macro.id} macro={macro} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const MacroCard: React.FC<{ macro: MacroActivity }> = ({ macro }) => {
    const totalMicros = macro.microActivities.length;
    const completedMicros = macro.microActivities.filter(m => m.status === 'Concluída').length;
    const progress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

    return (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-100 transition-all cursor-grab">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-2">{macro.name}</h4>
            <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Progresso</span>
                    <span className="text-xs font-bold text-brand-primary">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-primary'}`} style={{ width: `${progress}%` }}></div>
                </div>
                <div className="text-right text-[9px] font-bold text-slate-400">
                    {completedMicros} de {totalMicros} concluídas
                </div>
            </div>
        </div>
    );
};


export default ProjectFlowView;
