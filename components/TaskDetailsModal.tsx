
import React from 'react';
import { Task } from '../types';
import { X, Calendar, User, Tag, ArrowRight, MessageCircle, Clock } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 relative bg-gradient-to-br from-indigo-50/30 to-white">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 hover:bg-slate-200 rounded-full transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
              {task.project}
            </span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              task.status === 'Concluída' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {task.status}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
              ID: {task.id.toUpperCase()}
            </span>
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
            {task.activity}
          </h2>
          
          <p className="text-slate-500 text-lg leading-relaxed font-medium">
            {task.description}
          </p>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Timeline Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solicitação</span>
              <p className="text-slate-900 font-bold text-sm">{task.requestDate ? new Date(task.requestDate).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início Planejado</span>
              <p className="text-slate-900 font-bold text-sm">{task.plannedStartDate ? new Date(task.plannedStartDate).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Início Real</span>
              <p className="text-emerald-700 font-bold text-sm">{task.realStartDate ? new Date(task.realStartDate).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conclusão Alvo</span>
              <p className="text-slate-900 font-bold text-sm">{task.completionDate ? new Date(task.completionDate).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <User size={12} /> Responsável Principal
              </span>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {task.projectLead.charAt(0)}
                </div>
                <p className="text-slate-900 font-bold">{task.projectLead}</p>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} /> Progresso Atual
              </span>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{width: `${task.progress}%`}}></div>
              </div>
              <p className="text-xs font-black text-indigo-600 mt-1">{task.progress}% concluído</p>
            </div>
          </div>

          <div className="space-y-3">
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <ArrowRight size={12} /> Próximo Passo Estratégico
              </span>
              <div className="p-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">
                {task.nextStep || 'Nenhum próximo passo definido.'}
              </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <MessageCircle size={12} /> Histórico de Atualizações
            </span>
            <div className="space-y-3">
              {task.updates.length > 0 ? task.updates.map(update => (
                <div key={update.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    {new Date(update.date).toLocaleDateString('pt-BR')}
                  </span>
                  <p className="text-slate-700 text-sm font-medium">{update.note}</p>
                </div>
              )) : (
                <p className="text-slate-400 text-sm italic text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nenhuma atualização registrada até o momento.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
           <button 
            onClick={onClose}
            className="px-16 py-3 bg-slate-900 text-white rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition active:scale-95"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
