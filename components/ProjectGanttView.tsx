
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, MacroActivity, MicroActivity, TeamMember } from '../types';
import { 
  ChevronRight, ChevronDown, Calendar, User, 
  Clock, CheckCircle, AlertTriangle, Filter,
  Settings2, ChevronLeft, GanttChartSquare, X
} from 'lucide-react';

interface ProjectGanttViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  teamMembers: TeamMember[];
}

const COLUMN_WIDTH = 120; // Width of one month column
const ROW_HEIGHT = 48; // Height of one activity row
const HEADER_HEIGHT = 60;

const ProjectGanttView: React.FC<ProjectGanttViewProps> = ({ project, onUpdateProject, teamMembers }) => {
  const [viewScale, setViewScale] = useState<'days' | 'weeks' | 'months'>('months');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showBaseline, setShowBaseline] = useState(false);
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    project.macroActivities.forEach(m => initial[m.id] = true);
    return initial;
  });

  const timelineRef = useRef<HTMLDivElement>(null);

  // Get date range for the project
  const dateRange = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date();
    
    let hasDates = false;
    project.macroActivities.forEach(macro => {
      macro.microActivities.forEach(micro => {
        const start = new Date(micro.startDate || micro.dueDate);
        const end = new Date(micro.dueDate);
        
        if (!hasDates) {
          minDate = new Date(start);
          maxDate = new Date(end);
          hasDates = true;
        } else {
          if (start < minDate) minDate = new Date(start);
          if (end > maxDate) maxDate = new Date(end);
        }
      });
    });

    // Padding
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.setMonth(maxDate.getMonth() + 4));
    
    // Normalize to first of month
    minDate.setDate(1);
    maxDate.setDate(1);

    return { start: minDate, end: maxDate };
  }, [project]);

  const months = useMemo(() => {
    const list = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      list.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return list;
  }, [dateRange]);

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const startOfProject = dateRange.start;
    
    const diffMonths = (date.getFullYear() - startOfProject.getFullYear()) * 12 + (date.getMonth() - startOfProject.getMonth());
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayProgress = (date.getDate() - 1) / daysInMonth;
    
    return (diffMonths + dayProgress) * COLUMN_WIDTH;
  };

  const getWidth = (startDateStr: string, dueDateStr: string) => {
    const start = getPosition(startDateStr);
    const end = getPosition(dueDateStr);
    return Math.max(end - start, 10); // Minimum width
  };

  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) return null;
    for (const macro of project.macroActivities) {
      if (macro.id === selectedActivityId) return { type: 'macro', data: macro };
      const micro = macro.microActivities.find(m => m.id === selectedActivityId);
      if (micro) return { type: 'micro', data: micro, parentMacro: macro };
    }
    return null;
  }, [selectedActivityId, project]);

  const toggleMacro = (id: string) => {
    setExpandedMacros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-3xl border border-slate-200 overflow-hidden font-sans">
      {/* Gantt Header */}
      <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          {(['days', 'weeks', 'months'] as const).map(scale => (
            <button
              key={scale}
              onClick={() => setViewScale(scale)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewScale === scale ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {scale === 'days' ? 'Dias' : scale === 'weeks' ? 'Semanas' : 'Meses'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-slate-200" />
          <button className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200 transition">
            <Filter size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linha de base</span>
            <button 
              onClick={() => setShowBaseline(!showBaseline)}
              className={`w-10 h-5 rounded-full transition-colors relative ${showBaseline ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showBaseline ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Activity List */}
        <div className="w-[350px] border-r border-slate-100 flex flex-col bg-white shrink-0 z-20 shadow-xl shadow-slate-900/5">
          <div className="h-[60px] border-b border-slate-100 flex items-center px-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Macroatividade / Responsável</span>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {project.macroActivities.map((macro, macroIdx) => (
              <React.Fragment key={macro.id}>
                {/* Macro Row */}
                <div 
                  className={`h-[48px] flex items-center px-4 gap-2 hover:bg-slate-50 cursor-pointer transition-colors group ${selectedActivityId === macro.id ? 'bg-slate-50' : ''}`}
                  onClick={() => setSelectedActivityId(macro.id)}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleMacro(macro.id); }}
                    className="p-1 hover:bg-slate-200 rounded transition"
                  >
                    {expandedMacros[macro.id] ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-900 uppercase truncate tracking-tight">{macroIdx + 1}. {macro.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate">{project.responsible}</p>
                  </div>
                </div>
                
                {/* Micro Rows */}
                {expandedMacros[macro.id] && macro.microActivities.map((micro, microIdx) => (
                  <div 
                    key={micro.id}
                    className={`h-[48px] flex items-center pl-10 pr-4 gap-2 hover:bg-slate-50 cursor-pointer transition-colors group ${selectedActivityId === micro.id ? 'bg-slate-50 border-r-2 border-brand-primary' : ''}`}
                    onClick={() => setSelectedActivityId(micro.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-600 truncate">{macroIdx + 1}.{microIdx + 1} {micro.name}</p>
                      <p className="text-[9px] text-slate-400 truncate font-medium">{micro.assignee}</p>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Side: Chart */}
        <div className="flex-1 overflow-auto custom-scrollbar relative" ref={timelineRef}>
          {/* Chart Header */}
          <div className="sticky top-0 h-[60px] bg-white border-b border-slate-100 flex z-10">
            {months.map((month, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 border-r border-slate-100 px-4 py-2 flex flex-col justify-end"
                style={{ width: COLUMN_WIDTH }}
              >
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                  {month.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')} {month.getFullYear()}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Rows & Bars */}
          <div className="relative" style={{ width: months.length * COLUMN_WIDTH }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {months.map((_, i) => (
                <div key={i} className="flex-shrink-0 border-r border-slate-50" style={{ width: COLUMN_WIDTH }} />
              ))}
            </div>

            {/* Current Day Marker */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-emerald-500 z-10 flex flex-col items-center"
              style={{ left: getPosition(new Date().toISOString()) }}
            >
              <div className="mt-[-8px] px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-full whitespace-nowrap shadow-lg">
                HOJE - {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Bars */}
            <div className="relative">
              {project.macroActivities.map((macro) => {
                const results = [];
                
                // Macro bar (summary)
                const macroStart = macro.microActivities.length > 0 
                  ? macro.microActivities.reduce((min, mi) => {
                      const d = new Date(mi.startDate || mi.dueDate);
                      return d < min ? d : min;
                    }, new Date(macro.microActivities[0].startDate || macro.microActivities[0].dueDate))
                  : new Date();
                const macroEnd = macro.microActivities.length > 0
                  ? macro.microActivities.reduce((max, mi) => {
                      const d = new Date(mi.dueDate);
                      return d > max ? d : max;
                    }, new Date(macro.microActivities[0].dueDate))
                  : new Date();

                results.push(
                  <div key={macro.id} className="h-[48px] relative border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                    <div 
                      className="absolute top-4 h-5 bg-slate-200 rounded-full overflow-hidden shadow-inner flex items-center"
                      style={{ 
                        left: getPosition(macroStart.toISOString()), 
                        width: getWidth(macroStart.toISOString(), macroEnd.toISOString()) 
                      }}
                    >
                      <div 
                        className="h-full bg-slate-800 transition-all duration-1000"
                        style={{ width: `${project.status === 'Concluído' ? 100 : (macro.microActivities.filter(m => m.status === 'Concluído e aprovado').length / Math.max(1, macro.microActivities.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                );

                if (expandedMacros[macro.id]) {
                  macro.microActivities.forEach(micro => {
                    const microStart = micro.startDate || micro.dueDate;
                    const microEnd = micro.dueDate;
                    
                    results.push(
                      <div key={micro.id} className="h-[48px] relative border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <div 
                          className={`absolute top-4 h-3.5 rounded-full shadow-md flex items-center transition-all ${
                            micro.status === 'Concluído e aprovado' ? 'bg-emerald-500 shadow-emerald-200' :
                            micro.status === 'Em andamento' ? 'bg-brand-primary shadow-indigo-200' :
                            'bg-slate-300'
                          }`}
                          style={{ 
                            left: getPosition(microStart), 
                            width: getWidth(microStart, microEnd) 
                          }}
                        >
                          <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(microEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  });
                }

                return results;
              })}
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className={`w-[320px] bg-white border-l border-slate-100 flex flex-col transition-all duration-300 ${selectedActivity ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0'}`}>
          <div className="h-[60px] border-b border-slate-100 flex items-center px-6 justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes da Atividade</span>
            <button onClick={() => setSelectedActivityId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X size={16} className="text-slate-400" /></button>
          </div>
          
          {selectedActivity ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl text-white ${selectedActivity.type === 'macro' ? 'bg-slate-900' : 'bg-brand-primary'}`}>
                     {selectedActivity.type === 'macro' ? <Settings2 size={24} /> : <Clock size={24} />}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-tight">{selectedActivity.data.name}</h3>
                     <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          (selectedActivity.data as any).status === 'Concluído e aprovado' ? 'bg-emerald-500' :
                          (selectedActivity.data as any).status === 'Em andamento' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{(selectedActivity.data as any).status || 'Planejada'}</span>
                     </div>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cronograma</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Início</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {selectedActivity.type === 'micro' 
                          ? new Date((selectedActivity.data as MicroActivity).startDate || (selectedActivity.data as MicroActivity).dueDate).toLocaleDateString('pt-BR')
                          : 'Calculado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Término</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                         {new Date(selectedActivity.data.dueDate!).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Progresso</h4>
                   <div className="space-y-2">
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-2xl font-black text-slate-900 tracking-tighter">
                            {selectedActivity.type === 'micro' ? (selectedActivity.data as MicroActivity).progress || 0 : 43}%
                         </span>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-brand-primary" 
                          style={{ width: `${selectedActivity.type === 'micro' ? (selectedActivity.data as MicroActivity).progress || 0 : 43}%` }} 
                        />
                      </div>
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Responsável</h4>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="p-2 bg-white rounded-xl text-slate-400">
                         <User size={16} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase">{(selectedActivity.data as any).assignee || project.responsible}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Coordenador</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
               <div className="p-6 bg-slate-50 rounded-[2.5rem] text-slate-200">
                 <GanttChartSquare size={48} />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                 Selecione uma atividade para visualizar detalhes e logs relacionados
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectGanttView;
