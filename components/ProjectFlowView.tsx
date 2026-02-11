
import React, { useState } from 'react';
import { Project, MacroActivity, MicroActivity } from '../types';
import { ChevronDown, Clock, Activity, CheckCircle, AlertTriangle, MessageSquare, Link as LinkIcon } from 'lucide-react';

interface ProjectFlowViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const ProjectFlowView: React.FC<ProjectFlowViewProps> = ({ project, onUpdateProject }) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, macroId: string) => {
    e.dataTransfer.setData("macroId", macroId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPhase: string) => {
    const macroId = e.dataTransfer.getData("macroId");
    const updatedMacros = project.macroActivities.map(macro => {
      if (macro.id === macroId) {
        return { ...macro, phase: targetPhase };
      }
      return macro;
    });
    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="grid h-[600px] gap-6" style={{ gridTemplateColumns: `repeat(${project.phases.length}, minmax(0, 1fr))` }}>
      {project.phases.map((phase) => (
        <div 
          key={phase}
          onDrop={(e) => handleDrop(e, phase)}
          onDragOver={handleDragOver}
          className="bg-slate-100/80 rounded-2xl p-4 flex flex-col"
        >
          <h3 className="text-xs font-black uppercase tracking-widest p-2 flex items-center gap-2 text-slate-500">
            {phase}
            <span className="ml-auto px-2 py-0.5 bg-white rounded-full text-slate-500 text-[9px]">
              {project.macroActivities.filter(m => m.phase === phase).length}
            </span>
          </h3>
          <div className="space-y-3 mt-2 pr-2 flex-1 overflow-y-auto custom-scrollbar">
            {project.macroActivities.filter(m => m.phase === phase).map(macro => (
              <MacroCard 
                key={macro.id}
                macro={macro} 
                onDragStart={(e) => handleDragStart(e, macro.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MacroCard: React.FC<{ macro: MacroActivity; onDragStart: (e: React.DragEvent<HTMLDivElement>) => void }> = ({ macro, onDragStart }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const totalMicros = macro.microActivities.length;
    const completedMicros = macro.microActivities.filter(m => m.status === 'Concluído e aprovado').length;
    const progress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;
    const status = progress === 100 ? 'Concluída' : macro.microActivities.some(m => m.status === 'Em andamento') ? 'Em Andamento' : 'Planejada';

    const getStatusIcon = () => {
        if (status === 'Concluída') return <CheckCircle size={14} className="text-emerald-500" />;
        if (status === 'Em Andamento') return <Activity size={14} className="text-teal-500" />;
        return <Clock size={14} className="text-slate-500" />;
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-100 transition-all cursor-grab"
        >
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-3 flex-1">{macro.name}</h4>
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-slate-400">
                  <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">{getStatusIcon()} {status}</span>
                    <span className="text-xs font-bold text-brand-primary">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${status === 'Concluída' ? 'bg-emerald-500' : 'bg-brand-primary'}`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-300">
                    <h5 className="text-[10px] font-black uppercase text-slate-400">Microatividades ({totalMicros})</h5>
                    {macro.microActivities.length > 0 ? macro.microActivities.map(micro => (
                        <MicroDetail key={micro.id} micro={micro} />
                    )) : <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma microatividade.</p>}
                </div>
            )}
        </div>
    );
};

const MicroDetail: React.FC<{ micro: MicroActivity }> = ({ micro }) => {
    const colorClass = micro.status === 'Concluído e aprovado' ? 'text-emerald-600'
                     : micro.status === 'Concluído com restrições' ? 'text-amber-600'
                     : micro.status === 'A repetir / retrabalho' ? 'text-red-600'
                     : 'text-slate-500';

    return (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-800">{micro.name}</p>
            <div className="mt-2 flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase ${colorClass}`}>{micro.status}</span>
                <span className="text-[9px] font-bold text-slate-400">{micro.assignee}</span>
            </div>
             {(micro.observations || micro.reportLink) && (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                    {micro.observations && <p className="text-xs text-slate-600 italic flex items-start gap-2"><MessageSquare size={12} className="shrink-0 mt-0.5"/> {micro.observations}</p>}
                    {micro.reportLink && <a href={micro.reportLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-2 font-bold"><LinkIcon size={12}/> Acessar Relatório</a>}
                </div>
             )}
        </div>
    )
}

export default ProjectFlowView;
