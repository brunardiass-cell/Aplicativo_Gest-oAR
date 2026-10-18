
import React from 'react';
import { Task } from '../types';
import { X, Calendar, User, Tag, ArrowRight, MessageCircle, Clock, History, ExternalLink, UserCheck } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 border-b border-slate-100 relative bg-gradient-to-br from-teal-50/50 to-white">
          <button 
            onClick={onClose} 
            className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 hover:bg-slate-200 rounded-full transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
            <span className="px-3 py-1 bg-brand-primary text-white rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-sm">
              {task.project}
            </span>
            <span className={`px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${
              task.status === 'Concluída' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 bg-white`}>
              Prioridade {task.priority || 'Sem prioridade'}
            </span>
            <span className={`px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${
              task.activityType === 'meeting' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              task.activityType === 'report' || task.isReport ? 'bg-purple-50 text-purple-700 border-purple-200' :
              task.activityType === 'note' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {task.activityType === 'meeting' ? 'REUNIÃO' :
               task.activityType === 'report' || task.isReport ? 'RELATÓRIO' :
               task.activityType === 'note' ? 'NOTA' : 'ATIVIDADE GERAL'}
            </span>
          </div>
          
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 mb-2 leading-tight tracking-tighter uppercase">
            {task.activity}
          </h2>
          
          {task.description && (
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
              {task.description}
            </p>
          )}
        </div>

        <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <InfoBlock label="Solicitação" value={task.requestDate} icon={<Calendar size={14}/>} />
            <InfoBlock label="Prazo Final" value={task.completionDate || 'Sem prazo'} icon={<Clock size={14}/>} highlight />
            <InfoBlock label="Responsável" value={task.projectLead} icon={<User size={14}/>} />
            {task.activityType !== 'note' ? (
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso</span>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-brand-primary" style={{width: `${task.progress}%`}}></div>
                </div>
                <p className="text-[10px] font-black text-brand-primary mt-1">{task.progress}% concluído</p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <p className="text-sm font-black text-emerald-600 mt-1">Concluída (Nota)</p>
              </div>
            )}
          </div>

          {/* Reunião Details if type is meeting */}
          {task.activityType === 'meeting' && (
            <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                <Clock size={14} /> Dados da Reunião
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {task.meetingTime && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Horário</span>
                    <span className="font-bold text-slate-800">{task.meetingTime}</span>
                  </div>
                )}
                {(task.meetingParticipants || task.collaborators) && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Participantes</span>
                    <span className="font-bold text-slate-800">
                      {(task.meetingParticipants || task.collaborators || []).join(', ') || 'Nenhum participante listado'}
                    </span>
                  </div>
                )}
              </div>
              {(task.meetingLink || task.fileLocation) && (
                <div className="pt-2">
                  <a
                    href={task.meetingLink || task.fileLocation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition"
                  >
                    <ExternalLink size={14} /> Acessar Link da Reunião
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Histórico de Alterações de Prazo (Requirement 5) */}
          {task.deadlineHistory && task.deadlineHistory.length > 0 && (
            <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <History size={14} /> Histórico de Alterações de Prazo ({task.deadlineHistory.length})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {task.deadlineHistory.map(dh => (
                  <div key={dh.id} className="p-2.5 bg-white rounded-xl border border-amber-200/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-slate-500">De <strong>{dh.previousDate || 'Sem prazo'}</strong> para <strong className="text-amber-800">{dh.newDate}</strong></span>
                      {dh.reason && <p className="text-[11px] text-slate-600 italic mt-0.5">Motivo: "{dh.reason}"</p>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold shrink-0">
                      {dh.changedBy} • {new Date(dh.changedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.isReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <InfoBlock label="Etapa de Revisão" value={task.reportStage || 'N/A'} icon={<History size={14}/>} />
              {task.reportStage === 'Próximo Revisor (equipe AR)' && task.currentReviewer && (
                <InfoBlock label="Revisor (Equipe AR)" value={task.currentReviewer} icon={<UserCheck size={14}/>} />
              )}
              {task.reportStage === 'Em Elaboração' && task.elaboratorName && (
                <InfoBlock label="Responsável pela Elaboração" value={task.elaboratorName} icon={<UserCheck size={14}/>} />
              )}
              {task.reportStage === 'Revisão Colaboradores' && task.collaboratorReviewerName && (
                <InfoBlock label="Revisor Colaborador" value={task.collaboratorReviewerName} icon={<UserCheck size={14}/>} />
              )}
              {task.reportStage === 'Revisão Comitê Gestor' && task.committeeReviewerName && (
                <InfoBlock label="Revisor Comitê Gestor" value={task.committeeReviewerName} icon={<UserCheck size={14}/>} />
              )}
            </div>
          )}
          
          {task.fileLocation && (
            <div className="space-y-4">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                <ExternalLink size={12} /> Arquivo para Revisão
              </span>
              <a href={task.fileLocation} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full p-6 bg-amber-500 text-white rounded-3xl font-bold shadow-xl shadow-amber-200 text-sm uppercase tracking-widest hover:bg-amber-600 transition">
                <ExternalLink size={18}/>
                Acessar Documento
              </a>
            </div>
          )}

          <div className="space-y-4">
             <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1">
                <ArrowRight size={12} /> Próximo Passo Estratégico
              </span>
              <div className="p-6 bg-slate-900 text-white rounded-3xl font-bold shadow-xl shadow-slate-200 text-sm italic">
                "{task.nextStep || 'Não definido'}"
              </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <History size={14} className="text-brand-primary" /> Linha do Tempo de Atualizações
            </h3>
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {task.updates && task.updates.length > 0 ? [...task.updates].reverse().map((update, idx) => (
                <div key={update.id} className="relative">
                  <div className={`absolute -left-[33px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
                    update.isImportant ? 'bg-amber-500 ring-2 ring-amber-300' : idx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-slate-300'
                  }`}></div>
                  <div className={`p-5 rounded-2xl border transition shadow-sm ${
                    update.isImportant ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/30' : 'bg-slate-50 border-slate-100 hover:border-teal-100'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${update.isImportant ? 'text-amber-700 font-black' : 'text-brand-primary'}`}>
                          {new Date(update.date).toLocaleDateString('pt-BR')}
                        </span>
                        {update.isImportant && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-wider">
                            ⭐ Importante
                          </span>
                        )}
                      </div>
                      {update.user && <span className="text-[9px] font-bold text-slate-400 uppercase italic">Por {update.user}</span>}
                    </div>
                    <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{update.note}</p>
                    {update.isImportant && update.acknowledgedBy && update.acknowledgedBy.length > 0 && (
                      <p className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                        ✓ Ciente por: {update.acknowledgedBy.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Sem registros no histórico</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
           <button 
            onClick={onClose}
            className="px-16 py-4 bg-slate-900 text-white rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition active:scale-95"
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
    <p className={`font-bold text-sm ${highlight ? 'text-brand-primary' : 'text-slate-900'}`}>
      {label.includes('Data') || label.includes('Prazo') || label.includes('Solicitação') ? (value ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR') : '-') : value}
    </p>
  </div>
);

export default TaskDetailsModal;
