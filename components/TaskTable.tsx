
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
      case 'Urgente': return 'bg-red-100 text-red-700 border-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Média': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-emerald-100 text-emerald-700';
      case 'Em Andamento': return 'bg-teal-100 text-teal-700';
      case 'Bloqueada': return 'bg-slate-200 text-slate-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atividade / Projeto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <button 
                      onClick={() => onViewDetails(task)}
                      className="text-left font-bold text-slate-900 group-hover:text-brand-primary transition truncate max-w-[250px] hover:underline decoration-2"
                    >
                      {task.activity}
                    </button>
                    <span className="text-[10px] font-black text-brand-primary uppercase mt-1 tracking-tight">{task.project}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[250px] mt-1 line-clamp-1">{task.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-black text-teal-600">
                      {task.projectLead.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-600">{task.projectLead}</span>
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
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-teal-50 rounded-lg transition"
                      title="Ver Detalhes"
                    >
                      <Eye size={18} />
                    </button>
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => onEdit(task)}
                          className="p-2 text-slate-400 hover:text-brand-primary hover:bg-teal-50 rounded-lg transition"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-300 mb-4">
              <Eye size={24} />
            </div>
            <p className="text-slate-400 text-sm font-medium italic">Nenhuma atividade registrada neste filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTable;