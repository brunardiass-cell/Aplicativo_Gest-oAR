
import React from 'react';
import { X, ArrowRight, Activity, Beaker, ClipboardCheck, GraduationCap, Microscope, ShieldCheck, Truck, Factory, Search } from 'lucide-react';
import { ActivityPlanTemplate } from '../types';

interface ProjectActivityMapProps {
  onClose: () => void;
  templates: ActivityPlanTemplate[];
}

const ProjectActivityMap: React.FC<ProjectActivityMapProps> = ({ onClose, templates }) => {
  // We'll focus on "Proteína Recombinante" if it exists, otherwise use the first one as an example
  const targetTemplate = templates.find(t => t.name.toLowerCase().includes('proteína recombinante')) || templates[0];

  const getIcon = (phase: string) => {
    const p = phase.toLowerCase();
    if (p.includes('pesquisa') || p.includes('inicial')) return <Search size={24} />;
    if (p.includes('desenvolvimento')) return <Beaker size={24} />;
    if (p.includes('produção') || p.includes('fabrica')) return <Factory size={24} />;
    if (p.includes('clínico') || p.includes('fase')) return <Activity size={24} />;
    if (p.includes('registro') || p.includes('regulatório')) return <ShieldCheck size={24} />;
    if (p.includes('logística')) return <Truck size={24} />;
    return <ClipboardCheck size={24} />;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 lg:p-8">
      <div className="bg-slate-50 w-full max-w-6xl h-full max-h-[850px] rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mapa de Atividades</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Fluxo de implantação: {targetTemplate?.name || 'Projeto Padrão'}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        {/* Content - Horizontal Scroll Infographic */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-12 scrollbar-hide">
          <div className="flex items-start gap-12 min-w-max h-full relative">
            {/* The Line */}
            <div className="absolute top-[100px] left-0 right-0 h-1 bg-slate-200" />

            {targetTemplate?.phases.map((phase, idx) => {
              const macroActivities = targetTemplate.macroActivities.filter(m => m.phase === phase);
              
              return (
                <div key={phase} className="relative z-10 w-[300px] flex flex-col items-center gap-12">
                  {/* Phase Circle */}
                  <div className="w-20 h-20 bg-brand-primary text-white rounded-3xl shadow-2xl shadow-brand-primary/20 flex items-center justify-center outline outline-8 outline-slate-50 relative group">
                    {getIcon(phase)}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                      {phase}
                    </div>
                  </div>

                  {/* Phase Title */}
                  <div className="text-center space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">{phase}</h4>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{idx + 1}ª Etapa</span>
                  </div>

                  {/* Macro Activities Cards */}
                  <div className="w-full space-y-4 pt-4">
                    {macroActivities.map((macro, mIdx) => (
                      <div key={mIdx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-50 text-brand-primary rounded-xl">
                            <Microscope size={14} />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight">{macro.name}</h5>
                            {macro.expectedResults && (
                                <p className="text-[8px] font-medium text-slate-400 leading-relaxed italic">{macro.expectedResults.slice(0, 60)}...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {idx < targetTemplate.phases.length - 1 && (
                    <div className="absolute top-[88px] -right-[3.1rem] text-slate-300">
                        <ArrowRight size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black">
                            {i}
                        </div>
                    ))}
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Processo Produtivo Certificado</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-primary rounded-full" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Atividade Obrigatória</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-300 rounded-full" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Suporte</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectActivityMap;
