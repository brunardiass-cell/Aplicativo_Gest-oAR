
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
  currentUser: string | 'Todos';
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAssignReview: (taskId: string, reviewer: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
  onClearSingleNotification: (notificationId: string) => void;
  notifications: AppNotification[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  currentUser, 
  onEdit, 
  onView,
  onDelete, 
  onAssignReview,
  onNotificationClick,
  onClearSingleNotification,
  notifications
}) => {
  const activeTasks = tasks.filter(t => !t.deleted);
  const activeReviews = notifications.filter(n => n.userId === currentUser && !n.read && n.type === 'REVIEW_ASSIGNED');

  return (
    <div className="space-y-10">
      {activeReviews.length > 0 && currentUser !== 'Todos' && (
        <div className="bg-amber-50 rounded-[2rem] p-6 shadow-sm border border-amber-100 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                 <FileSignature size={24} />
              </div>
              <div>
                 <h3 className="text-amber-900 font-black uppercase text-sm tracking-tighter">Relatórios Pendentes para Sua Revisão</h3>
                 <p className="text-amber-600/60 text-[9px] font-bold uppercase tracking-widest">Ação necessária em {activeReviews.length} documentos</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeReviews.map(notif => (
                <div 
                  key={notif.id} 
                  className="bg-white border border-amber-200 p-4 rounded-2xl flex items-center justify-between group hover:bg-amber-100/50 transition text-left w-full relative shadow-sm"
                >
                  <button 
                    onClick={() => onNotificationClick(notif)}
                    className="flex-1 flex items-center justify-between pr-8"
                  >
                    <p className="text-amber-900 text-[10px] font-bold uppercase truncate">{notif.message}</p>
                    <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-1 transition shrink-0" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClearSingleNotification(notif.id); }}
                    className="absolute top-2 right-2 p-1 text-amber-300 hover:text-amber-600 hover:bg-amber-100 rounded-full transition-colors"
                    title="Limpar notificação"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeTasks.map(task => (
          <div key={task.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  task.status === 'Concluída' ? 'bg-emerald-50 text-emerald-600' : 
                  task.status === 'Bloqueada' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  {task.status}
                </span>
                {task.isReport && (
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    task.reportStage?.includes('Concluído') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {task.reportStage || 'Relatório'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onView(task)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Visualizar"><Eye size={18}/></button>
                <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Editar"><Edit2 size={18}/></button>
                <button onClick={() => onDelete(task)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition" title="Excluir"><Trash2 size={18}/></button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{task.project}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">{task.activity}</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-2 line-clamp-2">{task.description}</p>
            </div>

            <div className="space-y-2 mb-8">
               <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avanço</span>
                  <span className="text-[11px] font-black text-slate-900">{task.progress}%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{width: `${task.progress}%`}}></div>
               </div>
            </div>

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Líder</span>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black uppercase">{task.projectLead[0]}</div>
                     <span className="text-[10px] font-bold text-slate-700 uppercase">{task.projectLead}</span>
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
               <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <ArrowRight size={12} /> Próximo Passo
               </p>
               <p className="text-[11px] font-bold text-slate-600 leading-tight italic">
                 "{task.nextStep || 'Não definido'}"
               </p>
            </div>

            {!task.isReport && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                   <Clock size={14} />
                   <span className="text-[9px] font-bold uppercase">Prazo: {task.completionDate ? new Date(task.completionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}</span>
                </div>
                {task.updates.length > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-600">
                     <MessageSquare size={14} />
                     <span className="text-[10px] font-black">{task.updates.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {activeTasks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Nenhuma atividade ativa no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;