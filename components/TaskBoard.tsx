
import React from 'react';
import { Task } from '../types';
import { Edit2, Trash2, Eye, Calendar, ArrowRight, User, Circle } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onViewDetails: (task: Task) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, canEdit, onEdit, onDelete, onViewDetails }) => {
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'Urgente': return { color: 'bg-red-500', text: 'Urgente' };
      case 'Alta': return { color: 'bg-orange-500', text: 'Alta' };
      case 'Média': return { color: 'bg-amber-500', text: 'Média' };
      default: return { color: 'bg-blue-500', text: 'Baixa' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Em Andamento': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Bloqueada': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {tasks.map((task) => {
        const priority = getPriorityInfo(task.priority);
        return (
          <div key={task.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden">
            {/* Top Bar */}
            <div className={`h-1.5 w-full ${priority.color}`}></div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded border border-indigo-100">
                  {task.project}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${getStatusStyle(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2">
                {task.activity}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium italic">
                {task.description}
              </p>

              {/* Progress */}
              <div className="space-y-1 mb-6">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Progresso</span>
                  <span className="text-indigo-600">{task.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000" 
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Next Step - Highlighted */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <ArrowRight size={10} /> Próximo Passo
                </p>
                <p className="text-xs font-bold text-slate-700 leading-tight">
                  {task.nextStep || 'Não definido'}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {task.projectLead.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Responsável</p>
                    <p className="text-xs font-bold text-slate-800">{task.projectLead}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onViewDetails(task)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                  {canEdit && (
                    <>
                      <button 
                        onClick={() => onEdit(task)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(task.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium italic">Nenhuma atividade encontrada com os filtros atuais.</p>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
