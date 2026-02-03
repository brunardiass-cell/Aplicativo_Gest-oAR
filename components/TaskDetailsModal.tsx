
import React from 'react';
import { Task } from '../types';
import { X, Calendar, User, Tag, ArrowRight, MessageCircle, Clock, History, ExternalLink } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] text-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10">
        <div className="p-8 border-b border-white/10 relative bg-gradient-to-br from-slate-900/50 to-[#1e293b]">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
              {task.project}
            </span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              task.status === 'Concluída' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 text-slate-300 bg-white/5`}>
              Prioridade {task.priority}
            </span>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2 leading-tight tracking-tighter uppercase">
            {task.activity}
          </h2>
          
          <p className="text-slate-400 text-lg leading-relaxed font-medium">
            {task.description}
          </p>
        </div>

        <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoBlock label="Solicitação" value={task.requestDate} icon={<Calendar size={14}/>} />
            <InfoBlock label="Prazo Final" value={task.completionDate} icon={<Clock size={14}/>} highlight />
            <InfoBlock label="Líder" value={task.projectLead} icon={<User size={14}/>} />
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso</span>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-teal-500" style={{width: `${task.progress}%`}}></div>
              </div>
              <p className="text-[10px] font-black text-teal-400 mt-1">{task.progress}% concluído</p>
            </div>
          </div>
          
          {task.fileLocation && (
            <div className="space-y-4">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <ExternalLink size={12} /> Arquivo para Revisão
              </span>
              <a href={task.fileLocation} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full p-6 bg-amber-500 text-white rounded-3xl font-bold shadow-xl shadow-amber-500/20 text-sm uppercase tracking-widest hover:bg-amber-600 transition">
                <ExternalLink size={18}/>
                Acessar Documento
              </a>
            </div>
          )}

          <div className="space-y-4">
             <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1">
                <ArrowRight size={12} /> Próximo Passo Estratégico
              </span>
              <div className="p-6 bg-slate-900/50 text-white rounded-3xl font-bold shadow-xl border border-white/10 text-sm italic">
                "{task.nextStep || 'Não definido'}"
              </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
              <History size={14} className="text-teal-500" /> Linha do Tempo de Atualizações
            </h3>
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
              {task.updates && task.updates.length > 0 ? [...task.updates].reverse().map((update, idx) => (
                <div key={update.id} className="relative">
                  <div className={`absolute -left-[33px] top-1 w-5 h-5 rounded-full border-4 border-[#1e293b] shadow-sm ${idx === 0 ? 'bg-teal-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-teal-500/20 transition shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                        {new Date(update.date).toLocaleDateString('pt-BR')}
                      </span>
                      {update.user && <span className="text-[9px] font-bold text-slate-400 uppercase italic">Por {update.user}</span>}
                    </div>
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">{update.note}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Sem registros no histórico</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-white/10 flex justify-center">
           <button 
            onClick={onClose}
            className="px-16 py-4 bg-teal-600 text-white rounded-2xl shadow-xl shadow-teal-500/20 font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 transition active:scale-95"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoBlock: React.FC<{ label: string; value: string; icon: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
  <div className="space-y-1">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
      {icon} {label}
    </span>
    <p className={`font-bold text-sm ${highlight ? 'text-teal-400' : 'text-white'}`}>
      {label.includes('Data') || label.includes('Prazo') || label.includes('Solicitação') ? (value ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR') : '-') : value}
    </p>
  </div>
);

export default TaskDetailsModal;
