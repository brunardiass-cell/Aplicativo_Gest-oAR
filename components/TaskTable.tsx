
import React from 'react';
import { Task } from '../types';
import { Edit2, Trash2, MoreVertical, Eye } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, canEdit, onEdit, onViewDetails, onDelete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Alta': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Média': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-emerald-500/10 text-emerald-400';
      case 'Em Andamento': return 'bg-blue-500/10 text-blue-400';
      case 'Bloqueada': return 'bg-slate-700 text-slate-300';
      default: return 'bg-white/5 text-slate-400';
    }
  };

  return (
    <div className="bg-white/5 rounded-xl shadow-sm border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atividade / Projeto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-white/5 transition group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <button 
                      onClick={() => onViewDetails(task)}
                      className="text-left font-bold text-white group-hover:text-blue-400 transition truncate max-w-[250px] hover:underline decoration-2"
                    >
                      {task.activity}
                    </button>
                    <span className="text-[10px] font-black text-blue-500 uppercase mt-1 tracking-tight">{task.project}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[250px] mt-1 line-clamp-1">{task.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-400">
                      {task.projectLead.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-300">{task.projectLead}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                    <button 
                      onClick={() => onViewDetails(task)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition"
                      title="Ver Detalhes"
                    >
                      <Eye size={18} />
                    </button>
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => onEdit(task)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(task.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-slate-700 mb-4">
              <Eye size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium italic">Nenhuma atividade registrada neste filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTable;
