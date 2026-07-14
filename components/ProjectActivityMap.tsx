import React, { useState } from 'react';
import { 
  X, ArrowRight, Activity, Beaker, ClipboardCheck, 
  Microscope, ShieldCheck, Truck, Factory, Search,
  ChevronRight, Workflow, HelpCircle, FileText,
  BadgeAlert, MessageSquare, DollarSign, Users,
  CheckCircle2, Info, Printer, ChevronDown, AlertTriangle
} from 'lucide-react';
import { ActivityPlanTemplate, Project, MicroActivityStatus } from '../types';

const getKeywords = (str: string): string[] => {
  if (!str) return [];
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => {
      if (w.endsWith('s')) return w.slice(0, -1);
      if (w.endsWith('es')) return w.slice(0, -2);
      return w;
    });
};

interface ProjectActivityMapProps {
  onClose: () => void;
  templates: ActivityPlanTemplate[];
  projects: Project[];
  onNavigateToProject?: (projectId: string) => void;
  initialProjectId?: string;
}

const ProjectActivityMap: React.FC<ProjectActivityMapProps> = ({ onClose, templates, projects, onNavigateToProject, initialProjectId }) => {
  const [showEmptyModel, setShowEmptyModel] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (initialProjectId && projects.some(p => p.id === initialProjectId)) {
      return initialProjectId;
    }
    return projects.length > 0 ? projects[0].id : null;
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityPlanTemplate | null>(() => {
    const defaultProj = initialProjectId && projects.find(p => p.id === initialProjectId) || (projects.length > 0 ? projects[0] : null);
    if (defaultProj) {
      return templates.find(t => t.id === defaultProj.templateId) || (templates.length > 0 ? templates[0] : null);
    }
    return templates.length > 0 ? templates[0] : null;
  });
  const [selectedMacro, setSelectedMacro] = useState<any | null>(null);

  const selectedProject = showEmptyModel ? undefined : projects.find(p => p.id === selectedProjectId);

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

  const getMacroStatus = (macro: any) => {
    const microActivities = macro.microActivities;
    if (!microActivities || microActivities.length === 0) return 'Planejado';
    
    const statuses = microActivities.map((m: any) => m.status);
    
    if (statuses.some((s: string) => s === 'Em andamento')) return 'Em andamento';
    if (statuses.some((s: string) => s === 'A repetir / retrabalho')) return 'A repetir / retrabalho';
    
    const allDone = statuses.every((s: string) => s === 'Concluído e aprovado' || s === 'Concluído com restrições');
    
    if (allDone) {
      const hasRestrictions = statuses.some((s: string) => s === 'Concluído com restrições');
      const deliverableMissing = macro.hasDeliverable && !macro.isDeliverableRegistered;
      
      if (hasRestrictions || deliverableMissing) return 'Concluído com restrições';
      return 'Concluído e aprovado';
    }
    
    if (statuses.every((s: string) => s === 'Planejado')) return 'Planejado';
    return 'Em andamento';
  };

  const getStatusVisuals = (status: string | undefined) => {
    switch (status) {
      case 'Concluído e aprovado':
        return { icon: <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white text-[10px]"><CheckCircle2 size={12} /></div>, borderColor: 'border-emerald-500', bgColor: 'bg-emerald-50' };
      case 'Em andamento':
        return { icon: <Activity size={16} className="text-blue-500" />, borderColor: 'border-blue-500', bgColor: 'bg-blue-50' };
      case 'Concluído com restrições':
        return { icon: <BadgeAlert size={16} className="text-cyan-500" />, borderColor: 'border-cyan-500', bgColor: 'bg-cyan-50' };
      case 'A repetir / retrabalho':
        return { icon: <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500"><ChevronDown size={12} /></div>, borderColor: 'border-amber-500', bgColor: 'bg-amber-50' };
      case 'Planejado':
      default:
        return { icon: <div className="w-5 h-5 rounded-full border-2 border-slate-300" />, borderColor: 'border-slate-200', bgColor: 'bg-white' };
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

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-[100] flex flex-col animate-in fade-in duration-500 overflow-auto">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition"
          >
            <ChevronDown size={14} className="rotate-90" /> Voltar
          </button>
          <div className="h-10 w-px bg-slate-100 hidden lg:block" />
          <div className="space-y-0.5">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              MAPA DO FLUXO – {selectedTemplate.name} {showEmptyModel ? '(MODELO VAZIO)' : ''}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fluxo e ordem das atividades para a conclusão do projeto</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-2xl lg:rounded-none">
          <div className="flex flex-col lg:items-end">
             <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedProjectId && !showEmptyModel ? 'text-emerald-500 uppercase' : (showEmptyModel ? 'text-blue-500 uppercase' : 'text-red-500 uppercase')}`}>
                {selectedProjectId && !showEmptyModel ? 'PROJETO SELECIONADO' : (showEmptyModel ? 'MODELO DE PLATAFORMA VAZIO' : 'NENHUM PROJETO SELECIONADO')}
             </span>
             <div className="relative">
                <select 
                  value={selectedProjectId || ''} 
                  onChange={e => {
                    const nextId = e.target.value;
                    setSelectedProjectId(nextId || null);
                    if (nextId) {
                      const nextProj = projects.find(p => p.id === nextId);
                      if (nextProj) {
                        const nextTemp = templates.find(t => t.id === nextProj.templateId);
                        if (nextTemp) {
                          setSelectedTemplate(nextTemp);
                        }
                      }
                    }
                  }}
                  className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 transition appearance-none min-w-[240px]"
                >
                  <option value="">Selecione um projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
          </div>
          
          {selectedProjectId && (
            <button 
              onClick={() => setShowEmptyModel(!showEmptyModel)} 
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm no-print border ${
                showEmptyModel 
                  ? 'bg-brand-primary text-white border-brand-primary hover:bg-brand-accent' 
                  : 'bg-teal-50 text-brand-primary border-teal-200 hover:bg-teal-100'
              }`}
            >
              <Workflow size={16} /> {showEmptyModel ? 'Ver Dados do Projeto' : 'Visualizar Modelo Vazio'}
            </button>
          )}

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
          {(selectedProject && selectedProject.phases && selectedProject.phases.length > 0
            ? selectedProject.phases
            : selectedTemplate.phases
          ).map((phase, pIdx) => {
            const styles = getPhaseColor(pIdx);
            const styleParts = styles.split(' ');
            
            // Filter macros for the current phase exactly, using robust normalized comparison
            const macrosForThisPhase = selectedProject
              ? selectedProject.macroActivities.filter(m => {
                  const cleanMPhase = m.phase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  const cleanPhase = phase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  return cleanMPhase === cleanPhase;
                })
              : selectedTemplate.macroActivities.filter(m => {
                  const cleanMPhase = m.phase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  const cleanPhase = phase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  return cleanMPhase === cleanPhase;
                });

            // Get data from selected project if applicable
            const projectPhaseProgress = selectedProject ? 
              (() => {
                let total = 0, done = 0;
                macrosForThisPhase.forEach(m => {
                  if (m.microActivities) {
                    m.microActivities.forEach((micro: any) => {
                      total++;
                      if (micro.status === 'Concluído e aprovado' || micro.status === 'Concluído com restrições') done++;
                    });
                  }
                });
                return total > 0 ? Math.round((done / total) * 100) : 0;
              })() : 0;

            const totalPhasesCount = selectedProject && selectedProject.phases && selectedProject.phases.length > 0
              ? selectedProject.phases.length
              : selectedTemplate.phases.length;

            return (
              <div key={phase} className="flex flex-col gap-5 group">
                <div className="flex items-center gap-4 relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 z-10 shadow-lg ${styleParts[2]} ${styleParts[1]}`}>
                    {String(pIdx + 1).padStart(2, '0')}
                  </div>
                  {pIdx < totalPhasesCount - 1 && (
                    <div className="absolute left-10 right-[-2.5rem] top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-slate-200 z-0 hidden xl:block" />
                  )}
                  {pIdx < totalPhasesCount - 1 && (
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
                    {macrosForThisPhase.map((macro, mIdx) => {
                      const projectMacro = selectedProject ? macro as any : undefined;
                      
                      const status = projectMacro ? getMacroStatus(projectMacro) : 'Planejado';
                      const { icon, borderColor, bgColor } = getStatusVisuals(status);
                      const deliverableMissing = projectMacro?.hasDeliverable && !projectMacro?.isDeliverableRegistered && status === 'Concluído com restrições';
                      
                      return (
                        <div key={mIdx} className="space-y-4">
                            <div 
                              onClick={() => setSelectedMacro({ macro, projectMacro, phase, pIdx, mIdx })}
                              className={`p-4 rounded-2xl border-2 transition-all group/item shadow-sm ${borderColor} ${bgColor} flex flex-col gap-3 relative cursor-pointer hover:shadow-md hover:scale-[1.01] duration-200`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0 bg-white ${borderColor} ${styleParts[2]}`}>
                                        {pIdx + 1}.{mIdx + 1}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[12px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                                            {macro.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {icon}
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{status}</span>
                                        </div>
                                    </div>
                                </div>

                                {deliverableMissing && (
                                    <div className="ml-12 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-1">
                                        <p className="text-[9px] font-bold text-amber-700 leading-tight">
                                            <AlertTriangle size={10} className="inline mr-1" />
                                            Entregável ({projectMacro.deliverableType || 'não especificado'}) pendente de registro.
                                        </p>
                                    </div>
                                )}

                                {projectMacro?.hasDeliverable && projectMacro?.isDeliverableRegistered && (
                                    <div className="ml-12 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 size={10} className="text-emerald-500" />
                                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                            {projectMacro.deliverableType || 'ENTREGÁVEL'} REGISTRADO
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-8 bg-slate-50/50 border-t border-slate-100 mt-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">CONCLUSÃO</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-1000 ${styleParts[2].replace('text-', 'bg-') || 'bg-brand-primary'}`} style={{ width: `${projectPhaseProgress}%` }}></div>
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
                    "{selectedProject?.objective || selectedTemplate.objective || 'Nenhum objetivo definido para este plano.'}"
                </p>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Legenda de Status</h4>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Planejado', icon: <div className="w-5 h-5 rounded-full border-2 border-slate-300" /> },
                    { label: 'Em andamento', icon: <Activity size={18} className="text-blue-500" /> },
                    { label: 'Concluído com restrição', icon: <BadgeAlert size={18} className="text-cyan-500" /> },
                    { label: 'A repetir', icon: <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500"><ChevronDown size={12} /></div> },
                    { label: 'Concluído e aprovado', icon: <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white text-[10px]"><CheckCircle2 size={12} /></div> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 group">
                      <div className="group-hover:scale-110 transition-transform">{item.icon}</div>
                      <span className="text-[10px] font-bold text-slate-500 tracking-tight group-hover:text-slate-800 transition-colors uppercase tracking-widest">{item.label}</span>
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
        {((selectedProject?.transversalActivities && selectedProject.transversalActivities.length > 0) || 
          (selectedTemplate.transversalActivities && selectedTemplate.transversalActivities.length > 0)) && (
            <div className="space-y-8 pt-6 border-t border-slate-200">
                <div className="flex flex-col items-center">
                    <h4 className="px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] relative">Atividades Transversais (Ao longo de todo o projeto)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {(selectedProject?.transversalActivities && selectedProject.transversalActivities.length > 0 
                      ? selectedProject.transversalActivities 
                      : selectedTemplate.transversalActivities || []).map((act) => (
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

      {/* Macro Activity Detail Modal */}
      {selectedMacro && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 text-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Fase {selectedMacro.pIdx + 1}: {selectedMacro.phase}
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-snug">
                  {selectedMacro.pIdx + 1}.{selectedMacro.mIdx + 1} {selectedMacro.macro.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedMacro(null)} 
                className="p-1.5 hover:bg-slate-200 rounded-xl transition text-slate-400 hover:text-slate-600 mt-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Macro Status & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status da Atividade</span>
                  <div className="flex items-center gap-2">
                    {getStatusVisuals(selectedMacro.projectMacro ? getMacroStatus(selectedMacro.projectMacro) : 'Planejado').icon}
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {selectedMacro.projectMacro ? getMacroStatus(selectedMacro.projectMacro) : 'Planejado'}
                    </span>
                  </div>
                </div>
                
                {selectedProjectId && onNavigateToProject && (
                  <button
                    onClick={() => {
                      onNavigateToProject(selectedProjectId);
                      setSelectedMacro(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition active:scale-95"
                  >
                    <Workflow size={14} /> Alterar Status / Ir para o Plano de Trabalho
                  </button>
                )}
              </div>

              {/* Expected Results */}
              {selectedMacro.macro.expectedResults && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Resultados Esperados</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    {selectedMacro.macro.expectedResults}
                  </p>
                </div>
              )}

              {/* Deliverable Info */}
              {selectedMacro.projectMacro?.hasDeliverable && (
                <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Entregável Associado
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">
                      Tipo: <strong className="text-slate-800">{selectedMacro.projectMacro.deliverableType || 'Não especificado'}</strong>
                    </span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      selectedMacro.projectMacro.isDeliverableRegistered 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedMacro.projectMacro.isDeliverableRegistered ? 'Registrado' : 'Pendente de Registro'}
                    </span>
                  </div>
                </div>
              )}

              {/* Micro Activities List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Atividades de Detalhe (Microatividades)</h4>
                
                {!selectedProjectId ? (
                  <p className="text-xs text-slate-400 italic">Selecione um projeto para visualizar o andamento das microatividades.</p>
                ) : !selectedMacro.projectMacro?.microActivities || selectedMacro.projectMacro.microActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma microatividade cadastrada para esta macroatividade.</p>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedMacro.projectMacro.microActivities.map((micro: any, idx: number) => {
                      const microStatusVisuals = getStatusVisuals(micro.status);
                      return (
                        <div key={micro.id || idx} className="p-4 hover:bg-slate-50/30 transition flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800">{micro.name}</p>
                              {micro.assignee && (
                                <p className="text-[10px] text-slate-500 font-medium">Responsável: <span className="font-bold text-slate-700">{micro.assignee}</span></p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                              {microStatusVisuals.icon}
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{micro.status}</span>
                            </div>
                          </div>

                          {(micro.startDate || micro.dueDate) && (
                            <div className="flex gap-4 text-[10px] text-slate-400 font-medium">
                              {micro.startDate && <span>Início: <strong className="text-slate-600">{micro.startDate}</strong></span>}
                              {micro.dueDate && <span>Prazo: <strong className="text-slate-600">{micro.dueDate}</strong></span>}
                            </div>
                          )}

                          {micro.observations && (
                            <div className="mt-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                              <span className="font-bold text-slate-700 block mb-0.5 uppercase text-[9px] tracking-wider">Observações / Links:</span>
                              {micro.observations}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedMacro(null)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectActivityMap;
