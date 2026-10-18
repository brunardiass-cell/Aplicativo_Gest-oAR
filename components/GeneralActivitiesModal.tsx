import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { X, Search, FileText, CheckCircle, Clock, AlertTriangle, Filter, ArrowRight } from 'lucide-react';

interface GeneralActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onViewTask: (task: Task) => void;
}

export const GeneralActivitiesModal: React.FC<GeneralActivitiesModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onViewTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const generalTasks = useMemo(() => {
    return tasks.filter(t => !t.deleted && (!t.activityType || t.activityType === 'general'));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return generalTasks.filter(t => {
      const matchesSearch = 
        t.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.projectLead.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (statusFilter === 'pending') return t.status !== 'Concluída';
      if (statusFilter === 'completed') return t.status === 'Concluída';
      return true;
    });
  }, [generalTasks, searchTerm, statusFilter]);

  if (!isOpen) return null;

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return 'N/D';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <header className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">Todas as Atividades Gerais</h3>
              <p className="text-[10px] text-slate-400 font-semibold">{filteredTasks.length} de {generalTasks.length} atividades cadastradas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={16} />
          </button>
        </header>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome da atividade, projeto ou responsável..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Concluídas
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'Concluída';
            return (
              <div
                key={task.id}
                onClick={() => {
                  onViewTask(task);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted 
                    ? 'bg-emerald-50/60 border-emerald-200/90' 
                    : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100">
                      {task.project}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.status}
                    </span>
                    {task.priority && task.priority !== 'Sem prioridade' && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        task.priority === 'Alta' || task.priority === 'Urgente'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'Média'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        Prioridade {task.priority}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                    {task.activity}
                  </h4>
                  {task.description && (
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Prazo</span>
                    <span className="font-bold text-slate-700">{formatDateBR(task.completionDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Responsável</span>
                    <span className="font-bold text-slate-700">{task.projectLead}</span>
                  </div>
                  <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle className="mx-auto mb-2 text-slate-300" size={32} />
              <p className="text-xs font-bold uppercase tracking-wider">Nenhuma atividade geral encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
