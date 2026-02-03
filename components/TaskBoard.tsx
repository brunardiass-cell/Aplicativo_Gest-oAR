
import React from 'react';
import { Task, AppNotification } from '../types';
import { 
  ArrowRight, 
  MessageSquare, 
  FileSignature, 
  Clock, 
  X,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  currentUser: string;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  notifications: AppNotification[];
  onNotificationClick: (notification: AppNotification) => void;
  onClearNotifications: () => void;
  hasFullAccess: boolean;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  onEdit, 
  onView,
  onDelete, 
  notifications,
  onNotificationClick,
  onClearNotifications,
  hasFullAccess
}) => {
  const activeTasks = tasks.filter(t => !t.deleted);
  const activeReviews = notifications.filter(n => !n.read && n.type === 'REVIEW_ASSIGNED');

  return (
    <div className="space-y-10">
      {activeReviews.length > 0 && (
        <div className="animate-in fade-in-5 slide-in-from-top-2 duration-500 space-y-4">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-bold text-xs">
                <FileSignature size={16}/>
                <span>{activeReviews.length} RELATÓRIOS PARA VOCÊ ANALISAR</span>
             </div>
             <button onClick={onClearNotifications} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                LIMPAR NOTIFICAÇÕES
             </button>
          </div>
          <div className="bg-[#0f172a] rounded-xl p-4 shadow-lg">
             <div className="border-b border-teal-400/20 pb-2 mb-2">
                <h3 className="text-white font-black uppercase text-sm tracking-tighter flex items-center gap-2">
                   <FileSignature size={18} className="text-teal-400"/>
                   Relatórios Pendentes para sua Revisão
                </h3>
                <p className="text-teal-400/50 text-[9px] font-bold uppercase tracking-widest">Ação necessária em {activeReviews.length} documentos</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeReviews.map(notif => (
                  <div key={notif.id} className="bg-white/5 border border-white/10 p-2.5 rounded-lg flex items-center justify-between group hover:bg-white/10 transition text-left w-full relative">
                    <button onClick={() => onNotificationClick(notif)} className="flex-1 flex items-center justify-between pr-6">
                      <p className="text-white text-[10px] font-bold uppercase truncate">{notif.message}</p>
                      <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-1 transition shrink-0" />
                    </button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeTasks.map(task => (
          <div key={task.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:border-slate-200 transition-all group flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  task.status === 'Concluída' ? 'bg-emerald-100 text-emerald-700' : 
                  task.status === 'Bloqueada' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {task.status}
                </span>
                {task.isReport && (
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    task.reportStage?.includes('Concluído') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {task.reportStage || 'Relatório'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onView(task)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition" title="Visualizar"><Eye size={18}/></button>
                {hasFullAccess && (
                  <>
                    <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-100 rounded-xl transition" title="Editar"><Edit2 size={18}/></button>
                    <button onClick={() => onDelete(task)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-xl transition" title="Excluir"><Trash2 size={18}/></button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">{task.project}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">{task.activity}</h3>
              <p className="text-sm font-medium text-slate-500 mt-2 line-clamp-2">{task.description}</p>
            </div>

            <div className="space-y-2 mb-8">
               <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avanço</span>
                  <span className="text-[11px] font-black text-slate-800">{task.progress}%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-teal-600'}`} style={{width: `${task.progress}%`}}></div>
               </div>
            </div>

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Líder</span>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black uppercase">{task.projectLead[0]}</div>
                     <span className="text-[10px] font-bold text-slate-600 uppercase">{task.projectLead}</span>
                  </div>
               </div>
               {task.reportStage === 'Próximo Revisor' && task.currentReviewer && (
                 <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Em Revisão Com</span>
                    <span className="text-[10px] font-black text-amber-600 uppercase mt-1">{task.currentReviewer}</span>
                 </div>
               )}
            </div>

            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 mt-auto">
               <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <ArrowRight size={12} /> Próximo Passo
               </p>
               <p className="text-xs font-bold text-slate-700 leading-tight italic">
                 "{task.nextStep || 'Não definido'}"
               </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                 <Clock size={14} />
                 <span className="text-[9px] font-bold uppercase">Prazo: {task.completionDate ? new Date(task.completionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}</span>
              </div>
              {task.updates.length > 0 && (
                <div className="flex items-center gap-1.5 text-teal-500">
                   <MessageSquare size={14} />
                   <span className="text-[10px] font-black">{task.updates.length}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {activeTasks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest italic">Nenhuma atividade ativa no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
