
import React, { useState } from 'react';
import { 
  X, ArrowRight, Activity, Beaker, ClipboardCheck, 
  Microscope, ShieldCheck, Truck, Factory, Search,
  ChevronRight, Workflow, HelpCircle, FileText,
  BadgeAlert, MessageSquare, DollarSign, Users,
  CheckCircle2, Info
} from 'lucide-react';
import { ActivityPlanTemplate } from '../types';

interface ProjectActivityMapProps {
  onClose: () => void;
  templates: ActivityPlanTemplate[];
}

const ProjectActivityMap: React.FC<ProjectActivityMapProps> = ({ onClose, templates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityPlanTemplate | null>(null);

  const getIcon = (phase: string) => {
    const p = phase.toLowerCase();
    if (p.includes('pesquisa') || p.includes('inicial')) return <Search size={20} />;
    if (p.includes('desenvolvimento') || p.includes('p&d')) return <Beaker size={20} />;
    if (p.includes('produção') || p.includes('fabrica')) return <Factory size={20} />;
    if (p.includes('clínico') || p.includes('fase') || p.includes('ensaio')) return <Activity size={20} />;
    if (p.includes('registro') || p.includes('regulatório')) return <ShieldCheck size={20} />;
    if (p.includes('logística') || p.includes('distribuição')) return <Truck size={20} />;
    return <ClipboardCheck size={20} />;
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

  const transversalActivities = [
    { icon: <ShieldCheck size={20} />, label: 'GESTÃO DE QUALIDADE', desc: 'Conformidade com normas (GMP, ISO, ANVISA)' },
    { icon: <BadgeAlert size={20} />, label: 'GESTÃO DE RISCOS', desc: 'Identificação e mitigação contínua' },
    { icon: <FileText size={20} />, label: 'GESTÃO DE DOCUMENTOS', desc: 'Controle de versões e rastreabilidade' },
    { icon: <MessageSquare size={20} />, label: 'COMUNICAÇÃO', desc: 'Alinhamento entre áreas e partes' },
    { icon: <DollarSign size={20} />, label: 'GESTÃO FINANCEIRA', desc: 'Orçamento, custo e investimento' },
    { icon: <Users size={20} />, label: 'GESTÃO DE PESSOAS', desc: 'Capacitação e engajamento' },
  ];

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
    <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col animate-in fade-in duration-500 overflow-auto">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSelectedTemplate(null)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition"
          >
            Voltar
          </button>
          <div className="h-10 w-px bg-slate-100" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">MAPA DO FLUXO – {selectedTemplate.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fluxo e ordem das atividades para a conclusão do projeto</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">OBJETIVO</p>
              <p className="text-[10px] font-medium text-emerald-600 leading-tight">Entregar o projeto com qualidade, segurança e conformidade regulatória.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 lg:p-12 space-y-12">
        {/* The Infographic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
          {selectedTemplate.phases.map((phase, pIdx) => {
            const phaseMacros = selectedTemplate.macroActivities.filter(m => m.phase === phase);
            const styles = getPhaseColor(pIdx);
            const styleParts = styles.split(' ');
            
            return (
              <div key={phase} className="flex flex-col gap-6 group">
                {/* Header with connection arrow */}
                <div className="flex items-center gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 z-10 ${styleParts[2]} ${styleParts[1]}`}>
                    {String(pIdx + 1).padStart(2, '0')}
                  </div>
                  {pIdx < selectedTemplate.phases.length - 1 && (
                    <div className="absolute left-10 right-[-1.5rem] top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0 hidden lg:block" />
                  )}
                  {pIdx < selectedTemplate.phases.length - 1 && (
                    <ArrowRight size={16} className="absolute right-[-1rem] top-1/2 -translate-y-1/2 text-slate-300 z-10 hidden lg:block" />
                  )}
                </div>

                {/* Main Column Box */}
                <div className={`flex-1 rounded-[2rem] border-2 bg-white flex flex-col overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-300 ${styleParts[0]}`}>
                  <div className={`p-6 text-center space-y-2 ${styleParts[1]}`}>
                     <div className="mx-auto w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        {getIcon(phase)}
                     </div>
                     <h3 className="text-xs font-black uppercase tracking-widest">{phase}</h3>
                     <p className="text-[8px] font-black opacity-60 uppercase">Est. Variável</p>
                  </div>

                  <div className="p-6 space-y-4 flex-1">
                    {phaseMacros.map((macro, mIdx) => (
                      <div key={mIdx} className="flex items-start gap-3 group/item">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-black mt-0.5 shrink-0 transition-colors ${styleParts[0]} ${styleParts[2]}`}>
                          {pIdx + 1}.{mIdx + 1}
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 leading-tight group-hover/item:text-slate-900 transition-colors">
                          {macro.name}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Entregável / Footer of column */}
                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">ENTREGÁVEL</p>
                    <div className={`p-3 rounded-xl border bg-white shadow-sm ${styleParts[0]} border-dashed`}>
                      <p className="text-[9px] font-bold text-slate-500 leading-snug">
                        {phaseMacros[phaseMacros.length - 1]?.expectedResults || `Dossiê de ${phase} concluído`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transversal Activities Section */}
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="h-px w-full bg-slate-200 absolute -z-10" />
            <h4 className="bg-slate-100 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] relative">Atividades Transversais (Ao longo de todo o projeto)</h4>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {transversalActivities.map((act, id) => (
              <div key={id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
                <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl">
                  {act.icon}
                </div>
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{act.label}</h5>
                  <p className="text-[9px] font-medium text-slate-400 leading-tight">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Infographic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center gap-8 shadow-sm">
             <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda de Status</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: 'Planejamento', color: 'bg-blue-500' },
                    { label: 'Em andamento', color: 'bg-emerald-500' },
                    { label: 'Em análise', color: 'bg-amber-500' },
                    { label: 'Concluído', color: 'bg-indigo-500' },
                    { label: 'Contínuo', color: 'bg-orange-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex items-center gap-6 shadow-sm">
             <div className="p-4 bg-white rounded-full text-blue-500 shadow-sm">
                <Info size={32} />
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
                   As estimativas de tempo podem variar conforme o tipo de projeto, tecnologia utilizada, exigências regulatórias e complexidade do projeto. Este mapa fornece uma visão conceitual simplificada.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectActivityMap;
