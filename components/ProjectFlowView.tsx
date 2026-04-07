
import React, { useState, useMemo } from 'react';
import { Project, MacroActivity, MicroActivity, Prerequisite, BudgetInfo } from '../types';
import { ChevronDown, Clock, Activity, CheckCircle, MessageSquare, Link as LinkIcon, Layers, AlertTriangle, ListTodo, DollarSign, User, Calendar } from 'lucide-react';

interface ProjectFlowViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const ProjectFlowView: React.FC<ProjectFlowViewProps> = ({ project, onUpdateProject }) => {
  const phases = project.phases || [];

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

  if (phases.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-10">
          <div className="text-center">
              <Layers size={48} className="mx-auto text-slate-300 mb-6" />
              <h3 className="text-slate-600 font-black text-lg uppercase tracking-tight">Modelo Visual Indisponível</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Nenhuma fase foi definida para este projeto.</p>
              <p className="text-sm text-slate-500 mt-4 max-w-sm mx-auto">Para utilizar o quadro Kanban, por favor, edite o projeto e adicione as fases necessárias no cronograma.</p>
          </div>
      </div>
    )
  }

  return (
    <div className="grid h-auto lg:h-[600px] gap-6" style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(250px, 1fr))` }}>
      {phases.map((phase) => (
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
    const completedMicros = macro.microActivities.filter(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições').length;
    const restrictedCount = macro.microActivities.filter(m => m.status === 'Concluído com restrições').length;
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
                {restrictedCount > 0 && (
                    <div className="flex items-center justify-end gap-1 text-amber-600">
                        <AlertTriangle size={12} />
                        <span className="text-[9px] font-black uppercase">{restrictedCount}/{completedMicros} com restrições</span>
                    </div>
                )}
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
    const [showPrerequisites, setShowPrerequisites] = useState(false);
    const [showBudget, setShowBudget] = useState(false);

    const colorClass = micro.status === 'Concluído e aprovado' ? 'text-emerald-600'
                     : micro.status === 'Concluído com restrições' ? 'text-amber-600'
                     : micro.status === 'A repetir / retrabalho' ? 'text-red-600'
                     : 'text-slate-500';

    const prerequisiteAlert = useMemo(() => {
        if (!micro.prerequisites || micro.prerequisites.length === 0 || !micro.dueDate) return false;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        
        return micro.prerequisites.some(pre => {
            if (pre.status === 'concluído' || pre.completed) return false;
            const dueDate = new Date(micro.dueDate + 'T00:00:00');
            const startDate = new Date(dueDate);
            startDate.setDate(dueDate.getDate() - pre.leadTimeDays);
            return today >= startDate;
        });
    }, [micro.dueDate, micro.prerequisites]);

    return (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
                {prerequisiteAlert && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                <p className="text-xs font-bold text-slate-800">{micro.name}</p>
            </div>
            <div className="mt-2 flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase ${colorClass}`}>{micro.status}</span>
                <div className="flex items-center gap-2">
                    {micro.prerequisites && micro.prerequisites.length > 0 && (
                        <button onClick={() => setShowPrerequisites(!showPrerequisites)} className={`p-1 rounded-md ${showPrerequisites ? 'bg-teal-100 text-teal-600' : 'text-slate-400'}`}>
                            <ListTodo size={12}/>
                        </button>
                    )}
                    {micro.budget && (
                        <button onClick={() => setShowBudget(!showBudget)} className={`p-1 rounded-md ${showBudget ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>
                            <DollarSign size={12}/>
                        </button>
                    )}
                    <span className="text-[9px] font-bold text-slate-400">{micro.assignee}</span>
                </div>
            </div>

            {showPrerequisites && micro.prerequisites && (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                    <h6 className="text-[8px] font-black uppercase text-teal-600 flex items-center gap-1"><ListTodo size={10}/> Pré-requisitos</h6>
                    {micro.prerequisites.map(pre => (
                        <div key={pre.id} className="flex items-center gap-2 text-[10px]">
                            <div className={`w-2 h-2 rounded-full ${pre.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className={`flex-1 ${pre.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{pre.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{pre.type}</span>
                        </div>
                    ))}
                </div>
            )}

            {showBudget && micro.budget && (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                    <h6 className="text-[8px] font-black uppercase text-emerald-600 flex items-center gap-1"><DollarSign size={10}/> Orçamento</h6>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div>
                            <span className="text-slate-400 uppercase block">Valor</span>
                            <span className="font-bold text-slate-700">R$ {micro.budget.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 uppercase block">Status</span>
                            <span className="font-bold text-slate-700 uppercase">{micro.budget.status}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-400 uppercase block">Fornecedor</span>
                            <span className="font-bold text-slate-700">{micro.budget.supplier || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            )}

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
