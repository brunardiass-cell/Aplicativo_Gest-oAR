
import React from 'react';
import { ActivityLog } from '../types';
import { History, ShieldAlert, User, Calendar, MessageSquare } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs }) => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <History size={28} className="text-teal-500" /> Registro de Auditoria
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Histórico de ações críticas e exclusões</p>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {logs.length} Registros encontrados
          </div>
        </header>

        <div className="divide-y divide-slate-100">
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-200">
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

                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                    <div className="flex items-center gap-2 mb-2">
                       <MessageSquare size={14} className="text-red-400"/>
                       <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Justificativa de Exclusão</p>
                    </div>
                    <p className="text-sm font-medium text-slate-700 italic">"{log.reason}"</p>
                  </div>
                </div>
                
                <div className="text-right hidden md:block">
                  <ShieldAlert size={48} className="text-slate-100 group-hover:text-red-100 transition-colors"/>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center space-y-4">
              <History size={48} className="mx-auto text-slate-100" />
              <p className="text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhum registro crítico encontrado no histórico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;
