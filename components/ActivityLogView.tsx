
import React from 'react';
import { ActivityLog, Task } from '../types';
import { History, ShieldAlert, User, Calendar, MessageSquare, RotateCcw } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  tasks: Task[];
  onRestoreTask: (taskId: string) => void;
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, tasks, onRestoreTask }) => {

  const findDeletedTaskIdByTitle = (title: string, timestamp: string) => {
    // A simple match by activity name might not be unique.
    // A better approach would be to store the taskId in the log.
    // For now, let's find the most recently deleted task that matches.
    const deletedTasks = tasks.filter(t => t.deleted && t.activity === title);
    if (deletedTasks.length === 0) return null;
    // This is not perfect but a reasonable heuristic without a stable ID in the log
    return deletedTasks.sort((a,b) => new Date(b.deletionDate!).getTime() - new Date(a.deletionDate!).getTime())[0].id;
  }

  return (
    <div className="space-y-10">
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
        <header className="p-8 bg-white/5 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <History size={28} className="text-blue-500" /> Registro de Auditoria
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Histórico de ações críticas e exclusões</p>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {logs.length} Registros
          </div>
        </header>

        <div className="divide-y divide-white/10">
          {logs.length > 0 ? logs.map(log => {
            const isDeletion = log.action === 'EXCLUSÃO';
            const deletedTaskId = isDeletion ? findDeletedTaskIdByTitle(log.taskTitle, log.timestamp) : null;
            
            return (
              <div key={log.id} className="p-8 hover:bg-white/5 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        isDeletion ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {log.action}
                      </span>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">{log.taskTitle}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg text-slate-400"><User size={16}/></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">Usuário</p>
                          <p className="text-sm font-bold text-slate-300">{log.user}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg text-slate-400"><Calendar size={16}/></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">Data/Hora</p>
                          <p className="text-sm font-bold text-slate-300">
                            {new Date(log.timestamp).toLocaleDateString('pt-BR')} às {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                         <MessageSquare size={14} className="text-slate-400"/>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Justificativa Registrada</p>
                      </div>
                      <p className="text-sm font-medium text-slate-300 italic">"{log.reason}"</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-4">
                     <ShieldAlert size={48} className="text-slate-800 group-hover:text-red-900 transition-colors"/>
                     {isDeletion && deletedTaskId && (
                        <button onClick={() => onRestoreTask(deletedTaskId)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2">
                           <RotateCcw size={14} /> Restaurar Atividade
                        </button>
                     )}
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="p-20 text-center space-y-4">
              <History size={48} className="mx-auto text-slate-700" />
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest italic">Nenhum registro crítico encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;
