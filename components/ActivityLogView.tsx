
import React from 'react';
import { ActivityLog } from '../types';
import { History, ShieldAlert, User, Calendar, MessageSquare, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onRestoreItem: (refId: string, refType: 'task' | 'project') => void;
  onClearLog: (logId: string) => void;
  onClearAllLogs: () => void;
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onRestoreItem, onClearLog, onClearAllLogs }) => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <History size={28} className="text-indigo-500" /> Registro de Auditoria
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Histórico de ações críticas e exclusões</p>
          </div>
          <div className="flex items-center gap-4">
             {logs.length > 0 && (
                 <button onClick={onClearAllLogs} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/40 transition flex items-center gap-2">
                     <Trash2 size={14}/> Limpar Tudo
                 </button>
             )}
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {logs.length} Registros
             </div>
          </div>
        </header>

        <div className="divide-y divide-slate-100">
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        log.action === 'EXCLUSÃO' ? 'bg-red-100 text-red-700 border-red-200' :
                        log.action === 'RESTAURAÇÃO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {log.action}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{log.taskTitle}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><User size={16}/></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Solicitante</p>
                        <p className="text-sm font-bold text-slate-700">{log.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Calendar size={16}/></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Data/Hora</p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')} às {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${
                      log.action === 'EXCLUSÃO' ? 'bg-red-50/50 border-red-100/50' : 'bg-slate-50 border-slate-200/80'
                  } p-4 rounded-2xl`}>
                    <div className="flex items-center gap-2 mb-2">
                       <MessageSquare size={14} className={`${log.action === 'EXCLUSÃO' ? 'text-red-400' : 'text-slate-400'}`}/>
                       <p className={`text-[9px] font-black uppercase tracking-widest ${log.action === 'EXCLUSÃO' ? 'text-red-400' : 'text-slate-400'}`}>{log.action === 'EXCLUSÃO' ? 'Justificativa de Exclusão' : 'Motivo'}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-700 italic">"{log.reason}"</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        {log.action === 'EXCLUSÃO' && log.refId && log.refType && (
                            <button onClick={() => onRestoreItem(log.refId!, log.refType!)} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-200 transition">
                                <RotateCcw size={14}/> Restaurar
                            </button>
                        )}
                        <button onClick={() => onClearLog(log.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Limpar registro">
                            <Trash2 size={16}/>
                        </button>
                   </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center space-y-4">
              <History size={48} className="mx-auto text-slate-100" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">Nenhum registro crítico encontrado no histórico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;