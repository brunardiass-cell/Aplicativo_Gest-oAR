import React, { useState } from 'react';
import { Task } from '../types';
import { Edit2, Trash2, Eye, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { EvidenceDetailModal } from './EvidenceDetailModal';

interface TaskTableProps {
  tasks: Task[];
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, canEdit, onEdit, onViewDetails, onDelete }) => {
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState<Task | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-emerald-100 text-emerald-800 font-bold';
      case 'Em Andamento': return 'bg-teal-100 text-teal-800 font-bold';
      case 'Pausado': return 'bg-amber-100 text-amber-800 font-bold';
      case 'Não Aplicável': return 'bg-slate-200 text-slate-600 font-bold';
      default: return 'bg-slate-100 text-slate-600 font-bold';
    }
  };

  const getEvidenceStatus = (task: Task) => {
    const hasLink = Boolean(task.fileLocation && task.fileLocation.trim());
    const hasObs = Boolean(task.description && task.description.trim());
    
    // If has link or obs -> Registered (🟢)
    if (hasLink || hasObs) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={11} className="text-emerald-600" />
          🟢 Evidência registrada
        </span>
      );
    }

    // If flagged for regulatory or evidence but missing link & obs -> Pending (🟡)
    if (task.generatesRegulatoryContent) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
          <Clock size={11} className="text-amber-600" />
          🟡 Evidência pendente
        </span>
      );
    }

    // Otherwise: Sem evidência
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
        Sem evidência
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividade / Projeto</th>
              <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
              <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidência</th>
              <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc. Regulatório?</th>
              <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/80 transition group">
                {/* Atividade / Projeto */}
                <td className="px-6 py-3.5">
                  <div className="flex flex-col">
                    <button 
                      onClick={() => onViewDetails(task)}
                      className="text-left font-bold text-slate-900 group-hover:text-brand-primary transition truncate max-w-[280px] hover:underline"
                    >
                      {task.activity}
                    </button>
                    <span className="text-[10px] font-black text-brand-primary uppercase mt-0.5">{task.project}</span>
                  </div>
                </td>

                {/* Responsável */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-black text-teal-800">
                      {(task.projectLead || 'U').charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{task.projectLead}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </td>

                {/* Evidência */}
                <td className="px-6 py-3.5">
                  <button
                    onClick={() => setSelectedTaskForEvidence(task)}
                    className="hover:opacity-80 transition cursor-pointer text-left"
                    title="Clique para visualizar detalhes da evidência"
                  >
                    {getEvidenceStatus(task)}
                  </button>
                </td>

                {/* Utilizada em Documento Regulatório? */}
                <td className="px-6 py-3.5">
                  {task.generatesRegulatoryContent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-teal-50 text-teal-800 border border-teal-200">
                      <ShieldCheck size={12} className="text-brand-primary" />
                      Sim
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400">
                      Não
                    </span>
                  )}
                </td>

                {/* Ações */}
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => setSelectedTaskForEvidence(task)}
                      className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-teal-50 rounded-lg transition"
                      title="Visualizar Detalhes da Evidência (Olho)"
                    >
                      <Eye size={18} />
                    </button>
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => onEdit(task)}
                          className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-teal-50 rounded-lg transition"
                          title="Editar Atividade"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir Atividade"
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
          <div className="p-12 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Nenhuma atividade cadastrada neste projeto.</p>
          </div>
        )}
      </div>

      {selectedTaskForEvidence && (
        <EvidenceDetailModal
          item={selectedTaskForEvidence}
          onClose={() => setSelectedTaskForEvidence(null)}
        />
      )}
    </div>
  );
};

export default TaskTable;
