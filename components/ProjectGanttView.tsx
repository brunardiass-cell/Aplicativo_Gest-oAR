
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showBaseline, setShowBaseline] = useState(false);
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    project.macroActivities.forEach(m => initial[m.id] = true);
    return initial;
  });

  const timelineRef = useRef<HTMLDivElement>(null);

  // Get date range for the current view based on scale
  const viewRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (viewScale === 'months') {
      start.setMonth(start.getMonth() - 2);
      start.setDate(1);
      end.setMonth(end.getMonth() + 10);
      end.setDate(1);
    } else if (viewScale === 'weeks') {
      start.setDate(start.getDate() - start.getDay() - 14); // 2 weeks back
      end.setDate(start.getDate() + 70); // ~10 weeks forward
    } else {
      start.setDate(start.getDate() - 10); // 10 days back
      end.setDate(start.getDate() + 30); // 30 days forward
    }
    
    return { start, end };
  }, [currentDate, viewScale]);

  const columns = useMemo(() => {
    const list = [];
    const current = new Date(viewRange.start);
    
    if (viewScale === 'months') {
      while (current <= viewRange.end) {
        list.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
    } else if (viewScale === 'weeks') {
      while (current <= viewRange.end) {
        list.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    } else {
      while (current <= viewRange.end) {
        list.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    return list;
  }, [viewRange, viewScale]);

  const columnWidth = viewScale === 'days' ? 60 : viewScale === 'weeks' ? 100 : 120;

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const startOfView = viewRange.start;
    
    if (viewScale === 'months') {
      const diffMonths = (date.getFullYear() - startOfView.getFullYear()) * 12 + (date.getMonth() - startOfView.getMonth());
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const dayProgress = (date.getDate() - 1) / daysInMonth;
      return (diffMonths + dayProgress) * columnWidth;
    } else if (viewScale === 'weeks') {
      const diffDays = (date.getTime() - startOfView.getTime()) / (1000 * 60 * 60 * 24);
      return (diffDays / 7) * columnWidth;
    } else {
      const diffDays = (date.getTime() - startOfView.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays * columnWidth;
    }
  };

  const getWidth = (startDateStr: string, dueDateStr: string) => {
    const start = getPosition(startDateStr);
    const end = getPosition(dueDateStr);
    return Math.max(end - start, 8);
  };

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    
    const newDate = new Date(currentDate);
    if (viewScale === 'months') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewScale === 'weeks') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
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
      <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['days', 'weeks', 'months'] as const).map(scale => (
              <button
                key={scale}
                onClick={() => setViewScale(scale)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewScale === scale ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {scale === 'days' ? 'Dias' : scale === 'weeks' ? 'Semanas' : 'Meses'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('today')}
              className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition"
            >
              Hoje
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => navigate('next')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            {viewRange.start.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} 
            <span className="text-slate-300">-</span>
            {viewRange.end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linha de base</span>
            <button 
              onClick={() => setShowBaseline(!showBaseline)}
              className={`w-9 h-5 rounded-full transition-colors relative ${showBaseline ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${showBaseline ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtros</span>
            <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition">
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Activity List */}
        <div className="w-[350px] border-r border-slate-100 flex flex-col bg-white shrink-0 z-20">
          <div className="h-[50px] border-b border-slate-100 flex items-center px-6 justify-between bg-slate-50/30">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Macroatividade</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável</span>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {project.macroActivities.map((macro, macroIdx) => (
              <React.Fragment key={macro.id}>
                <div 
                  className={`h-[48px] flex items-center px-4 gap-2 hover:bg-slate-50 cursor-pointer transition-colors group border-b border-slate-50 ${selectedActivityId === macro.id ? 'bg-slate-50' : ''}`}
                  onClick={() => setSelectedActivityId(macro.id)}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleMacro(macro.id); }}
                    className="p-1 hover:bg-slate-200 rounded transition"
                  >
                    {expandedMacros[macro.id] ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <p className="text-[10px] font-black text-slate-900 uppercase truncate tracking-tight">{macroIdx + 1}. {macro.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap ml-2">{project.responsible}</p>
                  </div>
                </div>
                
                {expandedMacros[macro.id] && macro.microActivities.map((micro, microIdx) => (
                  <div 
                    key={micro.id}
                    className={`h-[48px] flex items-center pl-10 pr-4 gap-2 hover:bg-slate-50 cursor-pointer transition-colors group border-b border-slate-50 ${selectedActivityId === micro.id ? 'bg-slate-50 border-r-2 border-brand-primary' : ''}`}
                    onClick={() => setSelectedActivityId(micro.id)}
                  >
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 truncate">{macroIdx + 1}.{microIdx + 1} {micro.name}</p>
                      <p className="text-[9px] text-slate-400 truncate font-bold uppercase ml-2">{micro.assignee}</p>
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
          <div className="sticky top-0 h-[50px] bg-white border-b border-slate-100 flex z-10">
            {columns.map((date, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 border-r border-slate-100 px-3 py-2 flex flex-col justify-end items-center bg-slate-50/30"
                style={{ width: columnWidth }}
              >
                <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">
                  {viewScale === 'months' 
                    ? date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase() + ' ' + date.getFullYear()
                    : viewScale === 'weeks'
                    ? 'W' + Math.ceil(date.getDate() / 7) + ' ' + date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()
                    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Rows & Bars */}
          <div className="relative" style={{ width: columns.length * columnWidth }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {columns.map((_, i) => (
                <div key={i} className="flex-shrink-0 border-r border-slate-50" style={{ width: columnWidth }} />
              ))}
            </div>

            {/* Current Day Marker */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-emerald-500/50 z-10 flex flex-col items-center"
              style={{ left: getPosition(new Date().toISOString()) }}
            >
              <div className="mt-2 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-full whitespace-nowrap shadow-sm">
                HOJE - {new Date().toLocaleDateString('pt-BR')}
              </div>
              <div className="h-full w-px border-l border-dashed border-emerald-500" />
            </div>

            {/* Bars */}
            <div className="relative">
              {project.macroActivities.map((macro) => {
                const results = [];
                
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

                const isMacroVisible = getPosition(macroEnd.toISOString()) > 0 && getPosition(macroStart.toISOString()) < columns.length * columnWidth;

                if (isMacroVisible) {
                  results.push(
                    <div key={macro.id} className="h-[48px] relative border-b border-slate-50 group hover:bg-slate-50/20 transition-colors">
                      <div 
                        className="absolute top-4 h-4 bg-slate-100 rounded-full overflow-hidden flex items-center border border-slate-200"
                        style={{ 
                          left: getPosition(macroStart.toISOString()), 
                          width: getWidth(macroStart.toISOString(), macroEnd.toISOString()) 
                        }}
                      >
                        <div 
                          className="h-full bg-emerald-600/80 transition-all duration-1000"
                          style={{ width: `${(macro.microActivities.filter(m => m.status === 'Concluído e aprovado').length / Math.max(1, macro.microActivities.length)) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                } else {
                  results.push(<div key={macro.id} className="h-[48px] border-b border-slate-50" />);
                }

                if (expandedMacros[macro.id]) {
                  macro.microActivities.forEach(micro => {
                    const microStart = micro.startDate || micro.dueDate;
                    const microEnd = micro.dueDate;
                    
                    const isVisible = getPosition(microEnd) > 0 && getPosition(microStart) < columns.length * columnWidth;

                    results.push(
                      <div key={micro.id} className="h-[48px] relative border-b border-slate-50 group hover:bg-slate-50/20 transition-colors">
                        {isVisible && (
                          <div 
                            className={`absolute top-4.5 h-2.5 rounded-full shadow-sm flex items-center transition-all ${
                              micro.status === 'Concluído e aprovado' ? 'bg-emerald-500' :
                              (new Date(micro.dueDate) < new Date()) ? 'bg-rose-500 animate-pulse' :
                              micro.status === 'Em andamento' ? 'bg-brand-primary' :
                              'bg-slate-200'
                            }`}
                            style={{ 
                              left: getPosition(microStart), 
                              width: getWidth(microStart, microEnd) 
                            }}
                          >
                            {micro.progress && micro.progress > 0 && micro.progress < 100 && (
                              <div className="h-full bg-black/10 rounded-full" style={{ width: `${micro.progress}%` }} />
                            )}
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(microEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                        )}
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
