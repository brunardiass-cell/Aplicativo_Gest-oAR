
import React, { useMemo } from 'react';
import { MicroActivityStatus } from '../types';
import { AugmentedMicroActivity } from '../App';
import { SlidersHorizontal, AlertTriangle, User, Clock, CheckCircle, ArrowRight, Eye, ListTodo, DollarSign, X } from 'lucide-react';
import { useState } from 'react';

interface ProjectTaskBoardProps {
  microTasks: AugmentedMicroActivity[];
  onNavigateToProject: (projectId: string) => void;
  projectFilter: string;
  onProjectFilterChange: (project: string) => void;
  uniqueProjects: string[];
  statusFilter: 'Todos' | MicroActivityStatus;
  onStatusFilterChange: (status: 'Todos' | MicroActivityStatus) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (assignee: string) => void;
  uniqueAssignees: string[];
  dateFilterType: 'all' | 'dueDate';
  onDateFilterTypeChange: (type: 'all' | 'dueDate') => void;
  startDateFilter: string;
  onStartDateFilterChange: (date: string) => void;
  endDateFilter: string;
  onEndDateFilterChange: (date: string) => void;
}

const ProjectTaskBoard: React.FC<ProjectTaskBoardProps> = ({
  microTasks,
  onNavigateToProject,
  projectFilter,
  onProjectFilterChange,
  uniqueProjects,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  uniqueAssignees,
  dateFilterType,
  onDateFilterTypeChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [detailType, setDetailType] = useState<'prerequisites' | 'budget' | null>(null);

  const sortedMicroTasks = useMemo(() => {
    return [...microTasks].sort((a, b) => {
      const aIsCompleted = a.status === 'Concluído e aprovado';
      const bIsCompleted = b.status === 'Concluído e aprovado';
      if (aIsCompleted !== bIsCompleted) return aIsCompleted ? 1 : -1;

      const dateA = a.dueDate ? new Date(a.dueDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ? new Date(b.dueDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
      if (dateA === dateB) return 0;
      return dateA - dateB;
    });
  }, [microTasks]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pr-4 self-center shrink-0">
            <SlidersHorizontal size={14}/> Filtros
          </h3>
          <div className="flex-1 min-w-[150px]">
              <label className="text-[9px] font-bold text-slate-500">Projeto</label>
              <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  {uniqueProjects.map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
          </div>
          <div className="flex-1 min-w-[150px]">
              <label className="text-[9px] font-bold text-slate-500">Status</label>
              <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as any)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  <option value="Todos">Todos</option>
                  <option value="Planejado">Planejado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído com restrições">Concluído com restrições</option>
                  <option value="A repetir / retrabalho">A repetir / retrabalho</option>
                  <option value="Concluído e aprovado">Concluído e aprovado</option>
              </select>
          </div>
           <div className="flex-1 min-w-[150px]">
                <label className="text-[9px] font-bold text-slate-500">Atribuído a</label>
                <select value={assigneeFilter} onChange={(e) => onAssigneeFilterChange(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                    {uniqueAssignees.map(a => (<option key={a} value={a}>{a}</option>))}
                </select>
            </div>
          <div className="flex-1 min-w-[150px]">
              <label className="text-[9px] font-bold text-slate-500">Data de Entrega</label>
              <select value={dateFilterType} onChange={(e) => onDateFilterTypeChange(e.target.value as any)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  <option value="all">Não filtrar</option><option value="dueDate">Filtrar por Prazo</option>
              </select>
          </div>
          <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] font-bold text-slate-500">De</label>
              <input type="date" value={startDateFilter} onChange={(e) => onStartDateFilterChange(e.target.value)} disabled={dateFilterType === 'all'} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none disabled:opacity-50"/>
          </div>
          <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] font-bold text-slate-500">Até</label>
              <input type="date" value={endDateFilter} onChange={(e) => onEndDateFilterChange(e.target.value)} disabled={dateFilterType === 'all'} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none disabled:opacity-50"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMicroTasks.map(micro => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isCompleted = micro.status === 'Concluído e aprovado';
          const isOverdue = !isCompleted && micro.dueDate && new Date(micro.dueDate + 'T00:00:00') < today;
          
          let cardClasses = 'rounded-3xl border p-6 shadow-sm transition-all group flex flex-col h-full relative';
          if (isCompleted) cardClasses += ' bg-slate-50 opacity-80 border-slate-200';
          else if (isOverdue) cardClasses += ' bg-white border-red-400 ring-2 ring-red-200';
          else cardClasses += ' bg-white border-slate-200 hover:shadow-lg hover:border-teal-100';

          return (
            <div key={micro.id} className={cardClasses}>
              {isCompleted && (<div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full p-1.5 z-10"><CheckCircle size={16} /></div>)}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    isCompleted ? 'bg-emerald-100 text-emerald-700' : 
                    micro.status === 'A repetir / retrabalho' ? 'bg-red-100 text-red-700' :
                    micro.status === 'Concluído com restrições' ? 'bg-amber-100 text-amber-700' :
                    micro.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>{micro.status}</span>
                </div>
                <div className="flex items-center gap-1">
                  {(() => {
                    if (!micro.prerequisites || micro.prerequisites.length === 0 || !micro.dueDate) return null;
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const hasAlert = micro.prerequisites.some(pre => {
                      if (pre.status === 'concluído' || pre.completed) return false;
                      const dueDate = new Date(micro.dueDate + 'T00:00:00');
                      const startDate = new Date(dueDate);
                      startDate.setDate(dueDate.getDate() - pre.leadTimeDays);
                      return today >= startDate;
                    });
                    return hasAlert ? (
                      <div title="Pré-requisito pendente!" className="animate-bounce">
                        <AlertTriangle size={14} className="text-red-500" />
                      </div>
                    ) : null;
                  })()}
                  {micro.prerequisites && micro.prerequisites.length > 0 && (
                    <button 
                      onClick={() => { setExpandedTaskId(expandedTaskId === micro.id ? null : micro.id); setDetailType('prerequisites'); }}
                      className={`p-1.5 rounded-lg transition ${expandedTaskId === micro.id && detailType === 'prerequisites' ? 'bg-teal-100 text-teal-600' : 'text-teal-500 hover:bg-teal-50'}`}
                      title="Ver pré-requisitos"
                    >
                      <ListTodo size={16}/>
                    </button>
                  )}
                  {micro.budget && (
                    <button 
                      onClick={() => { setExpandedTaskId(expandedTaskId === micro.id ? null : micro.id); setDetailType('budget'); }}
                      className={`p-1.5 rounded-lg transition ${expandedTaskId === micro.id && detailType === 'budget' ? 'bg-emerald-100 text-emerald-600' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      title="Ver orçamento"
                    >
                      <DollarSign size={16}/>
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{micro.projectName}</p>
                <h3 className="text-sm font-black text-slate-900 tracking-tight leading-tight uppercase">{micro.name}</h3>
                <p className="text-[10px] font-medium text-brand-primary mt-1 line-clamp-2">Macro: {micro.macroName}</p>
              </div>

              {expandedTaskId === micro.id && (
                <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs animate-in slide-in-from-top-2 duration-300">
                  {detailType === 'prerequisites' && micro.prerequisites && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                        <span className="font-black uppercase text-teal-600 tracking-widest text-[10px]">Pré-requisitos</span>
                        <button onClick={() => setExpandedTaskId(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                      </div>
                      {micro.prerequisites.map(pre => (
                        <div key={pre.id} className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${pre.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className={`flex-1 ${pre.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-bold'}`}>{pre.name}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase shrink-0">{pre.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailType === 'budget' && micro.budget && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                        <span className="font-black uppercase text-emerald-600 tracking-widest text-[10px]">Orçamento</span>
                        <button onClick={() => setExpandedTaskId(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-black block">Valor</span>
                          <span className="font-bold text-slate-800">R$ {micro.budget.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-black block">Status</span>
                          <span className="font-bold text-slate-800 uppercase">{micro.budget.status}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 uppercase text-[9px] font-black block">Fornecedor</span>
                          <span className="font-bold text-slate-800">{micro.budget.supplier || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1 mb-6">
                 <div className="flex justify-between items-end"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avanço</span><span className="text-[10px] font-black text-slate-900">{micro.progress || 0}%</span></div>
                 <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${micro.progress === 100 ? 'bg-emerald-500' : 'bg-brand-primary'}`} style={{width: `${micro.progress || 0}%`}}></div></div>
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={10}/> Atribuído a</span>
                    <span className="text-[9px] font-bold text-slate-700 uppercase mt-1">{micro.assignee}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 justify-end ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                        <Clock size={10}/> Prazo
                    </span>
                    <span className="text-[9px] font-bold text-slate-700 uppercase mt-1">{micro.dueDate ? new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}</span>
                  </div>
                </div>
                <button onClick={() => onNavigateToProject(micro.projectId)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-black transition">
                  <Eye size={14}/> Ver no Projeto
                </button>
              </div>
            </div>
          )
        })}
        {sortedMicroTasks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Nenhuma microatividade encontrada para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTaskBoard;
