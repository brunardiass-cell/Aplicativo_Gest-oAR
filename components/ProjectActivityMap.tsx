import React, { useState } from 'react';
import { 
  X, ArrowRight, Activity, Beaker, ClipboardCheck, 
  Microscope, ShieldCheck, Truck, Factory, Search,
  ChevronRight, Workflow, HelpCircle, FileText,
  BadgeAlert, MessageSquare, DollarSign, Users,
  CheckCircle2, Info, Printer, ChevronDown
} from 'lucide-react';
import { ActivityPlanTemplate, Project, MicroActivityStatus } from '../types';

interface ProjectActivityMapProps {
  onClose: () => void;
  templates: ActivityPlanTemplate[];
  projects: Project[];
}

const ProjectActivityMap: React.FC<ProjectActivityMapProps> = ({ onClose, templates, projects }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityPlanTemplate | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const getIcon = (phase: string) => {
    const p = phase.toLowerCase();
    if (p.includes('pesquisa') || p.includes('inicial') || p.includes('prova')) return <Search size={22} />;
    if (p.includes('desenvolvimento') || p.includes('p&d')) return <Beaker size={22} />;
    if (p.includes('produção') || p.includes('fabrica')) return <Factory size={22} />;
    if (p.includes('clínico') || p.includes('fase') || p.includes('ensaio')) return <Activity size={22} />;
    if (p.includes('registro') || p.includes('regulatório')) return <ShieldCheck size={22} />;
    if (p.includes('logística') || p.includes('distribuição')) return <Truck size={22} />;
    return <ClipboardCheck size={22} />;
  };

  const getStatusVisuals = (status: MicroActivityStatus | undefined) => {
    switch (status) {
      case 'Concluído e aprovado':
        return { icon: <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-white text-[8px]"><CheckCircle2 size={10} /></div>, borderColor: 'border-emerald-500', bgColor: 'bg-emerald-50' };
      case 'Em andamento':
        return { icon: <Activity size={14} className="text-blue-500" />, borderColor: 'border-blue-500', bgColor: 'bg-blue-50' };
      case 'Concluído com restrições':
        return { icon: <BadgeAlert size={14} className="text-cyan-500" />, borderColor: 'border-cyan-500', bgColor: 'bg-cyan-50' };
      case 'A repetir / retrabalho':
        return { icon: <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500"><ChevronDown size={10} /></div>, borderColor: 'border-amber-500', bgColor: 'bg-amber-50' };
      case 'Planejado':
      default:
        return { icon: <div className="w-4 h-4 rounded-full border-2 border-slate-300" />, borderColor: 'border-slate-200', bgColor: 'bg-white' };
    }
  };

  const getPhaseColor = (idx: number) => {
    const colors = [
      'border-blue-200 bg-blue-50/30 text-blue-600',
      'border-emerald-200 bg-emerald-50/30 text-emerald-600',
      'border-cyan-200 bg-cyan-50/30 text-cyan-600',
      'border-amber-200 bg-amber-50/30 text-amber-600',
      'border-indigo-200 bg-indigo-50/30 text-indigo-600',
      'border-orange-200 bg-orange-50/30 text-orange-600',
      'border-violet-200 bg-violet-50/30 text-violet-600',
    ];
    return colors[idx % colors.length];
  };

  if (!selectedTemplate) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Escolha o Mapa de Atividades</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecione um plano de trabalho para visualizar o fluxo</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTemplate(t)}
                className="group p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-white hover:border-brand-primary/30 hover:shadow-xl transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-brand-primary group-hover:scale-110 transition-transform">
                    <Workflow size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.phases.length} Fases • {t.macroActivities.length} Macros</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filtrar projetos que usam este template
  const projectsForTemplate = projects.filter(p => p.templateId === selectedTemplate.id);

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-[100] flex flex-col animate-in fade-in duration-500 overflow-auto">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setSelectedTemplate(null); setSelectedProjectId(null); }} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition"
          >
            <ChevronDown size={14} className="rotate-90" /> Voltar
          </button>
          <div className="h-10 w-px bg-slate-100 hidden lg:block" />
          <div className="space-y-0.5">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">MAPA DO FLUXO – {selectedTemplate.name}</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fluxo e ordem das atividades para a conclusão do projeto</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-2xl lg:rounded-none">
          <div className="flex flex-col lg:items-end">
             <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedProjectId ? 'text-emerald-500 uppercase' : 'text-red-500 uppercase'}`}>
                {selectedProjectId ? 'PROJETO SELECIONADO' : 'NENHUM PROJETO SELECIONADO'}
             </span>
             <div className="relative">
                <select 
                  value={selectedProjectId || ''} 
                  onChange={e => setSelectedProjectId(e.target.value || null)}
                  className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 transition appearance-none min-w-[240px]"
                >
                  <option value="">Selecione um projeto</option>
                  {projectsForTemplate.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
          </div>
          
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition no-print shadow-sm">
            <Printer size={16} /> Imprimir Mapa
          </button>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-300 hover:text-slate-500 no-print">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10 space-y-10 max-w-[1920px] mx-auto w-full">
        {/* Infographic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {selectedTemplate.phases.map((phase, pIdx) => {
            const templateMacros = selectedTemplate.macroActivities.filter(m => m.phase === phase);
            const styles = getPhaseColor(pIdx);
            const styleParts = styles.split(' ');
            
            // Get data from selected project if applicable
            const projectPhaseProgress = selectedProject ? 
              (() => {
                const phaseMacros = selectedProject.macroActivities.filter(m => m.phase === phase);
                let total = 0, done = 0;
                phaseMacros.forEach(m => {
                  m.microActivities.forEach(micro => {
                    total++;
                    if (micro.status === 'Concluído e aprovado') done++;
                  });
                });
                return total > 0 ? Math.round((done / total) * 100) : 0;
              })() : 0;

            return (
              <div key={phase} className="flex flex-col gap-5 group">
                <div className="flex items-center gap-4 relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 z-10 shadow-lg ${styleParts[2]} ${styleParts[1]}`}>
                    {String(pIdx + 1).padStart(2, '0')}
                  </div>
                  {pIdx < selectedTemplate.phases.length - 1 && (
                    <div className="absolute left-10 right-[-2.5rem] top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-slate-200 z-0 hidden xl:block" />
                  )}
                  {pIdx < selectedTemplate.phases.length - 1 && (
                    <div className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 hidden xl:flex">
                        <ArrowRight size={12} className="text-slate-300" />
                    </div>
                  )}
                </div>

                <div className={`flex-1 rounded-[2.5rem] border-2 bg-white flex flex-col overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-500 ${styleParts[0]}`}>
                  <div className={`p-8 text-center space-y-3 ${styleParts[1]} relative`}>
                     <div className="mx-auto w-14 h-14 rounded-[1.25rem] bg-white shadow-md flex items-center justify-center text-slate-600">
                        {getIcon(phase)}
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest">{phase}</h3>
                     <p className="text-[9px] font-black opacity-60 uppercase">Est. Variável</p>
                  </div>

                  <div className="p-8 space-y-6 flex-1 bg-white">
                    {templateMacros.map((macro, mIdx) => {
                      const projectMacro = selectedProject?.macroActivities.find(m => m.name === macro.name && m.phase === phase);
                      
                      return (
                        <div key={mIdx} className="space-y-4">
                            <div className="flex items-start gap-4 group/item">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-black mt-1 shrink-0 ${styleParts[0]} ${styleParts[2]}`}>
                                {pIdx + 1}.{mIdx + 1}
                                </div>
                                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                    {macro.name}
                                </p>
                            </div>
                            
                            {projectMacro && (
                                <div className="ml-10 space-y-3">
                                    {projectMacro.microActivities.map((micro) => {
                                        const { icon } = getStatusVisuals(micro.status);
                                        return (
                                            <div key={micro.id} className="flex items-center gap-3">
                                                <div className="mt-0.5">{icon}</div>
                                                <span className="text-[10px] font-medium text-slate-500 leading-tight">{micro.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!selectedProject && macro.microActivities && (
                                <div className="ml-10 space-y-3">
                                    {macro.microActivities.map((micro, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-200 mt-1" />
                                            <span className="text-[10px] font-medium text-slate-300 leading-tight">{micro}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-8 bg-slate-50/50 border-t border-slate-100 mt-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">CONCLUSÃO</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-1000 ${styleParts[1].split(' ')[1].replace('bg-', 'bg-opacity-100 bg-') || 'bg-brand-primary'}`} style={{ width: `${projectPhaseProgress}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-900">{projectPhaseProgress}% concluído</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sidebar Area */}
          <div className="flex flex-col gap-8">
             <div className="bg-emerald-50/30 p-8 rounded-[3rem] border border-emerald-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 size={24} />
                    <span className="text-[11px] font-black uppercase tracking-widest">OBJETIVO GERAL</span>
                </div>
                <p className="text-xs font-bold text-emerald-800 leading-relaxed italic">
                    "{selectedTemplate.objective || 'Nenhum objetivo definido para este plano.'}"
                </p>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Legenda de Status</h4>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Concluído', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
                    { label: 'Concluído e aprovado', icon: <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-white text-[8px]"><CheckCircle2 size={10} /></div> },
                    { label: 'Em andamento', icon: <Activity size={16} className="text-blue-500" /> },
                    { label: 'Em análise', icon: <div className="w-4 h-4 rounded-full border-2 border-amber-500" /> },
                    { label: 'Planejado', icon: <div className="w-4 h-4 rounded-full border-2 border-slate-300" /> },
                    { label: 'Atrasado', icon: <BadgeAlert size={16} className="text-red-500" /> },
                    { label: 'Bloqueado', icon: <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-white text-[8px] rotate-45"><ArrowRight size={10} /></div> },
                    { label: 'A repetir / retrabalho', icon: <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500"><ChevronDown size={10} /></div> },
                    { label: 'Concluído com restrições', icon: <BadgeAlert size={16} className="text-cyan-500" /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 group">
                      <div className="group-hover:scale-110 transition-transform">{item.icon}</div>
                      <span className="text-[10px] font-bold text-slate-500 tracking-tight group-hover:text-slate-800 transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>
             </div>

             {!selectedProjectId && (
                <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100 flex flex-col items-center text-center gap-4 shadow-sm animate-pulse">
                    <div className="p-4 bg-white rounded-full text-blue-500 shadow-sm">
                        <Info size={32} />
                    </div>
                    <p className="text-[11px] font-bold text-blue-600 leading-relaxed uppercase tracking-tight">
                        Selecione um projeto para visualizar os status das atividades.
                    </p>
                </div>
             )}
          </div>
        </div>

        {/* Transversal Activities Section */}
        {selectedTemplate.transversalActivities && selectedTemplate.transversalActivities.length > 0 && (
            <div className="space-y-8 pt-6 border-t border-slate-200">
                <div className="flex flex-col items-center">
                    <h4 className="px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] relative">Atividades Transversais (Ao longo de todo o projeto)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {selectedTemplate.transversalActivities.map((act) => (
                    <div key={act.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl">
                            {act.iconName === 'ShieldCheck' && <ShieldCheck size={24} />}
                            {act.iconName === 'BadgeAlert' && <BadgeAlert size={24} />}
                            {act.iconName === 'FileText' && <FileText size={24} />}
                            {act.iconName === 'MessageSquare' && <MessageSquare size={24} />}
                            {act.iconName === 'DollarSign' && <DollarSign size={24} />}
                            {act.iconName === 'Users' && <Users size={24} />}
                            {act.iconName === 'Settings' && <HelpCircle size={24} />}
                            {act.iconName === 'ClipboardCheck' && <ClipboardCheck size={24} />}
                        </div>
                        <div className="space-y-1.5">
                            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{act.label}</h5>
                            <p className="text-[10px] font-medium text-slate-400 leading-tight">{act.desc}</p>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectActivityMap;
