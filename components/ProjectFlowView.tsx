
import React from 'react';
import { Project, CompletionStatus } from '../types';
import { CheckCircle, AlertTriangle, Repeat, FileText, MessageSquare } from 'lucide-react';

interface ProjectFlowViewProps {
  project: Project;
}

const ProjectFlowView: React.FC<ProjectFlowViewProps> = ({ project }) => {
  const completedMacros = project.macroActivities.filter(
    (macro) => macro.status === 'Concluída' && macro.microActivities.some(micro => micro.status === 'Concluída')
  );

  return (
    <div className="space-y-8">
      {completedMacros.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma macroatividade foi concluída ainda.</p>
        </div>
      ) : (
        <div className="relative pl-8 before:content-[''] before:absolute before:left-4 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100">
          {completedMacros.map((macro, idx) => (
            <div key={macro.id} className="mb-12 relative">
              <div className="absolute -left-[22px] top-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center text-white font-black text-xs">
                {idx + 1}
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-4">{macro.name}</h3>
              
              <div className="space-y-3">
                {macro.microActivities.filter(m => m.status === 'Concluída').map(micro => (
                  <div key={micro.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{micro.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                          Finalizada por <span className="text-slate-600">{micro.assignee}</span> em {micro.completionDate ? new Date(micro.completionDate).toLocaleDateString() : 'N/D'}
                        </p>
                      </div>
                      <CompletionBadge status={micro.completionStatus} />
                    </div>
                    {micro.observations && (
                       <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-slate-500">
                         <MessageSquare size={14} className="shrink-0 mt-0.5"/>
                         <p className="text-xs italic">"{micro.observations}"</p>
                       </div>
                    )}
                     {micro.reportLink && (
                       <a href={micro.reportLink} target="_blank" rel="noopener noreferrer" className="mt-2 text-indigo-600 text-[10px] font-bold uppercase flex items-center gap-1 hover:underline">
                         <FileText size={12}/> Ver Relatório
                       </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CompletionBadge = ({ status }: { status: CompletionStatus }) => {
  const badgeStyles: Partial<Record<CompletionStatus, string>> = {
    'Aprovada': 'bg-emerald-100 text-emerald-700',
    'Finalizada com Restrições': 'bg-amber-100 text-amber-700',
    'A ser Repetida': 'bg-red-100 text-red-700',
  };
  const icon: Partial<Record<CompletionStatus, React.ReactNode>> = {
    'Aprovada': <CheckCircle size={12} />,
    'Finalizada com Restrições': <AlertTriangle size={12} />,
    'A ser Repetida': <Repeat size={12} />,
  };
  const text = status.replace('Finalizada com', 'Com');

  const style = badgeStyles[status];
  const iconEl = icon[status];

  if (!style || !iconEl) {
    return null;
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${style}`}>
      {iconEl} {text}
    </span>
  );
};


export default ProjectFlowView;
