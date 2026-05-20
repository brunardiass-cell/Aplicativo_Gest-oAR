
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
  const [viewScale, setViewScale] = useState<'weeks' | 'months' | 'years'>('months');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showBaseline, setShowBaseline] = useState(true);
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    project.macroActivities.forEach(m => initial[m.id] = true);
    return initial;
  });

  // Filter States
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [assigneeFilter, setAssigneeFilter] = useState('Todos');

  const listRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Memo for unique assignees from microactivities
  const uniqueAssignees = useMemo(() => {
    const list = new Set<string>();
    project.macroActivities.forEach(m => {
      m.microActivities.forEach(mi => {
        if (mi.assignee) {
          list.add(mi.assignee);
        }
      });
    });
    return Array.from(list).sort();
  }, [project.macroActivities]);

  // Memo for filtered macro and microactivities
  const filteredMacroActivities = useMemo(() => {
    return project.macroActivities.map((macro, macroIdx) => {
      const filteredMicros = macro.microActivities.filter(micro => {
        const matchesSearch = searchQuery === '' || 
          micro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          macro.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'Todos' || micro.status === statusFilter;

        const matchesAssignee = assigneeFilter === 'Todos' || micro.assignee === assigneeFilter;

        return matchesSearch && matchesStatus && matchesAssignee;
      });

      const macroMatchesSearch = searchQuery === '' || macro.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isMacroVisible = (statusFilter === 'Todos' && assigneeFilter === 'Todos' && macroMatchesSearch) || filteredMicros.length > 0;

      return {
        ...macro,
        originalIndex: macroIdx,
        microActivities: filteredMicros,
        isVisible: isMacroVisible
      };
    }).filter(m => m.isVisible);
  }, [project.macroActivities, searchQuery, statusFilter, assigneeFilter]);

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = timelineRef.current;
    if (target && target.scrollTop !== e.currentTarget.scrollTop) {
      target.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = listRef.current;
    if (target && target.scrollTop !== e.currentTarget.scrollTop) {
      target.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const isValidDate = (dateStr: any): boolean => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d.getTime());
  };

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
      // Scale is years
      start.setFullYear(start.getFullYear() - 2);
      start.setMonth(0);
      start.setDate(1);
      end.setFullYear(end.getFullYear() + 3);
      end.setMonth(11);
      end.setDate(31);
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
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    return list;
  }, [viewRange, viewScale]);

  const columnWidth = viewScale === 'weeks' ? 100 : viewScale === 'months' ? 120 : 180;

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
      const diffYears = date.getFullYear() - startOfView.getFullYear();
      const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      const daysInYear = isLeap(date.getFullYear()) ? 366 : 365;
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const diffDays = (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
      const progress = Math.max(0, diffDays) / daysInYear;
      return (diffYears + progress) * columnWidth;
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
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
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
      <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-4 bg-white no-print">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['weeks', 'months', 'years'] as const).map(scale => (
              <button
                key={scale}
                onClick={() => setViewScale(scale)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewScale === scale ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {scale === 'weeks' ? 'Semanas' : scale === 'months' ? 'Meses' : 'Anos'}
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
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linha de Hoje (Data Atual)</span>
            <button 
              onClick={() => setShowBaseline(!showBaseline)}
              className={`w-9 h-5 rounded-full transition-colors relative ${showBaseline ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${showBaseline ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtros</span>
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              className={`p-1.5 rounded-lg transition ${showFilterDropdown ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Filtrar Atividades"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Options Bar */}
      {showFilterDropdown && (
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-1 duration-200 no-print">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Buscar por nome de macro/micro..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 outline-none focus:border-brand-primary"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none">
              <Filter size={12} />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-primary"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Planejado">Planejado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluído e aprovado">Concluído e aprovado</option>
              <option value="Concluído com restrições">Concluído com restrições</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Responsável:</span>
            <select 
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-primary"
            >
              <option value="Todos">Todos os Integrantes</option>
              {uniqueAssignees.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>

          {(searchQuery || statusFilter !== 'Todos' || assigneeFilter !== 'Todos') && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('Todos');
                setAssigneeFilter('Todos');
              }}
              className="text-xs text-brand-primary hover:underline font-bold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Beautiful Clear Legend Bar */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider">Cronograma:</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-2.5 bg-slate-300 border border-slate-400/30 rounded" />
            <span className="font-bold text-slate-600">Planejado (Cinza)</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <div className="w-5 h-2.5 bg-emerald-500 border border-emerald-605/30 rounded animate-pulse" />
            <span className="font-bold text-slate-600">Real (Verde)</span>
          </div>
        </div>
        <div className="w-px h-3 bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider font-semibold">Progresso dos Status:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 bg-orange-100 border border-orange-300 text-orange-855 font-black rounded-md text-[8.5px] uppercase">
              Planejado (Laranja)
            </span>
            <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-800 font-bold rounded-md text-[8.5px] uppercase">
              Em Andamento (Azul)
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-md text-[8.5px] uppercase">
              Concluído (Verde)
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold rounded-md text-[8.5px] uppercase flex items-center gap-0.5">
              <span className="bg-emerald-900 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono font-black text-[9px]">!</span>
              Concluído com Restrições (Verde Claro + !)
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Activity List */}
        <div className="w-[350px] border-r border-slate-100 flex flex-col bg-white shrink-0 z-20">
          <div className="h-[50px] border-b border-slate-100 flex items-center px-6 bg-slate-50/30">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Macro / Microatividade</span>
          </div>
          <div 
            ref={listRef}
            onScroll={handleListScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredMacroActivities.map((macro, filteredIdx) => {
              const macroIdx = macro.originalIndex;
              return (
                <React.Fragment key={macro.id}>
                  <div 
                    className={`h-[48px] flex items-center px-4 gap-2 bg-slate-100/60 hover:bg-slate-200/50 cursor-pointer transition-colors group border-b border-slate-100 ${selectedActivityId === macro.id ? 'bg-slate-200/60' : ''}`}
                    onClick={() => setSelectedActivityId(macro.id)}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleMacro(macro.id); }}
                      className="p-1 hover:bg-slate-200 rounded transition"
                    >
                      {expandedMacros[macro.id] ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </button>
                    <div className="flex-1 flex items-center min-w-0">
                      <p className="text-[10px] font-black text-slate-900 uppercase truncate tracking-tight">{macroIdx + 1}. {macro.name}</p>
                    </div>
                  </div>
                  
                  {expandedMacros[macro.id] && macro.microActivities.map((micro, microIdx) => {
                    let badgeColors = "bg-orange-100 text-orange-850 border border-orange-300";
                    let statusLabel = "Planejado";
                    let isRestricted = false;

                    if (micro.status === 'Concluído e aprovado') {
                      badgeColors = "bg-emerald-100 text-emerald-800 border border-emerald-300";
                      statusLabel = "Concluído";
                    } else if (micro.status === 'Em andamento') {
                      badgeColors = "bg-blue-100 text-blue-800 border border-blue-300";
                      statusLabel = "Em andamento";
                    } else if (micro.status === 'Concluído com restrições') {
                      badgeColors = "bg-emerald-200 text-emerald-950 border border-emerald-400 font-extrabold";
                      statusLabel = "Com Restrição";
                      isRestricted = true;
                    }

                    return (
                      <div 
                        key={micro.id}
                        className={`h-[48px] flex items-center pl-10 pr-4 gap-2 hover:bg-slate-50 cursor-pointer transition-colors group border-b border-slate-50 ${selectedActivityId === micro.id ? 'bg-slate-50 border-r-2 border-brand-primary' : ''}`}
                        onClick={() => setSelectedActivityId(micro.id)}
                      >
                        <div className="flex-1 flex justify-between items-center min-w-0">
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-500 truncate">{macroIdx + 1}.{microIdx + 1} {micro.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              <span className={`text-[7px] px-1 py-0.2 rounded font-black uppercase tracking-wider ${badgeColors} flex items-center gap-0.5 shrink-0`}>
                                {isRestricted && <span className="bg-emerald-950 text-white rounded-full w-2.5 h-2.5 flex items-center justify-center font-mono font-black text-[7px]" style={{ lineHeight: '1' }}>!</span>}
                                {statusLabel} ({micro.progress || 0}%)
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono truncate font-semibold">{micro.assignee}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right Side: Chart */}
        <div 
          ref={timelineRef}
          onScroll={handleTimelineScroll}
          className="flex-1 overflow-auto custom-scrollbar relative"
        >
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
                    : date.getFullYear().toString()}
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
            {showBaseline && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-emerald-500/50 z-10 flex flex-col items-center"
                style={{ left: getPosition(new Date().toISOString()) }}
              >
                <div className="mt-2 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-full whitespace-nowrap shadow-sm">
                  HOJE - {new Date().toLocaleDateString('pt-BR')}
                </div>
                <div className="h-full w-px border-l border-dashed border-emerald-500" />
              </div>
            )}

            {/* Bars */}
            <div className="relative">
              {filteredMacroActivities.map((macro) => {
                const results = [];
                
                results.push(
                  <div key={macro.id} className="h-[48px] relative border-b border-slate-100 bg-slate-100/60 transition-colors">
                    {/* Completamente vazia */}
                  </div>
                );

                if (expandedMacros[macro.id]) {
                  macro.microActivities.forEach(micro => {
                    const microStart = micro.startDate || micro.dueDate;
                    const microEnd = micro.dueDate;
                    const realStart = micro.realStartDate || micro.startDate || micro.dueDate;
                    const realEnd = micro.realEndDate || micro.completionDate || micro.dueDate;
                    
                    const hasValidPlanned = isValidDate(microStart) && isValidDate(microEnd);
                    const hasValidReal = isValidDate(realStart) && isValidDate(realEnd);

                    const isPlannedVisible = hasValidPlanned && getPosition(microEnd) > 0 && getPosition(microStart) < columns.length * columnWidth;
                    
                    const isRealActive = micro.status === 'Em andamento' || micro.status === 'Concluído e aprovado' || micro.status === 'Concluído com restrições';
                    const isRealVisible = isRealActive && hasValidReal && getPosition(realEnd) > 0 && getPosition(realStart) < columns.length * columnWidth;

                    // Progress style configurations based on status
                    let badgeColors = "bg-orange-500 text-white font-black";
                    let isRestricted = false;

                    if (micro.status === 'Concluído e aprovado') {
                      badgeColors = "bg-emerald-600 text-white font-black";
                    } else if (micro.status === 'Em andamento') {
                      badgeColors = "bg-blue-500 text-white font-black";
                    } else if (micro.status === 'Concluído com restrições') {
                      badgeColors = "bg-emerald-200 text-emerald-950 font-black border border-emerald-400";
                      isRestricted = true;
                    }

                    results.push(
                      <div key={micro.id} className="h-[48px] relative border-b border-slate-50 group hover:bg-slate-50/20 transition-colors">
                        {/* Micro Planned Bar (Cinza) */}
                        {isPlannedVisible && (
                          <div 
                            className="absolute top-1.5 h-2 bg-slate-300 border border-slate-400/20 rounded shadow-xs"
                            style={{ 
                              left: getPosition(microStart), 
                              width: getWidth(microStart, microEnd) 
                            }}
                          />
                        )}

                        {/* Micro Real Bar (Verde) */}
                        {isRealVisible && (
                          <div 
                            className="absolute top-5 h-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded overflow-hidden"
                            style={{ 
                              left: getPosition(realStart), 
                              width: getWidth(realStart, realEnd) 
                            }}
                          >
                            <div 
                              className="h-full bg-emerald-500 rounded-sm"
                              style={{ width: `${micro.progress || 0}%` }}
                            />
                          </div>
                        )}

                        {/* Status/Progress Badge on Timeline */}
                        {isRealVisible && (
                          <div 
                            className={`absolute top-[14px] h-[18px] text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs whitespace-nowrap leading-none ${badgeColors}`}
                            style={{ left: getPosition(realStart) + getWidth(realStart, realEnd) + 8 }}
                          >
                            {isRestricted && (
                              <span className="bg-emerald-900 text-white rounded-full w-3 h-3 flex items-center justify-center font-mono font-black text-[7.5px]" style={{ lineHeight: '1' }}>!</span>
                            )}
                            {micro.progress || 0}%
                          </div>
                        )}

                        {/* Due Date Indicator on Hover */}
                        {isPlannedVisible && (
                          <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(microEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
        <div className={`w-[320px] bg-white border-l border-slate-100 flex flex-col transition-all duration-300 no-print ${selectedActivity ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0'}`}>
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
