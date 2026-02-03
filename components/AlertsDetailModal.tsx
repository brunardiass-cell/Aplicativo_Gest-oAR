
import React from 'react';
import { Task } from '../types';
import { X, AlertTriangle, ChevronRight } from 'lucide-react';

interface AlertItemType {
  id: string;
  name: string;
  activity?: string;
  project?: string;
  completionDate?: string;
}

interface AlertsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: AlertItemType[];
  onItemClick: (item: Task) => void;
}

const AlertsDetailModal: React.FC<AlertsDetailModalProps> = ({ isOpen, onClose, title, items, onItemClick }) => {
  if (!isOpen) return null;

  const isTask = (item: any): item is Task => 'activity' in item;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] text-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-white/10">
        <header className="p-8 bg-slate-900/50 border-b border-white/10 flex items-center gap-4">
          <div className="bg-red-500/10 p-3 rounded-2xl text-red-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} item(s) requerem atenção</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-white/10">
            {items.map(item => (
              <button 
                key={item.id} 
                onClick={() => isTask(item) && onItemClick(item)} 
                disabled={!isTask(item)}
                className="w-full text-left p-4 hover:bg-white/5 rounded-lg transition flex justify-between items-center disabled:pointer-events-none group"
              >
                <div>
                  <p className="font-bold text-slate-200">{isTask(item) ? item.activity : item.name}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-slate-500 mt-1">
                    {isTask(item) && <span>PROJETO: <span className="text-blue-400">{item.project}</span></span>}
                    {isTask(item) && item.completionDate && <span>VENCIMENTO: <span className="text-red-400">{new Date(item.completionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span></span>}
                  </div>
                </div>
                {isTask(item) && <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform"/>}
              </button>
            ))}
             {items.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nenhum item encontrado.</p>
                </div>
             )}
          </div>
        </div>

        <footer className="p-6 bg-slate-900/50 border-t border-white/10 flex justify-end">
          <button onClick={onClose} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition">
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AlertsDetailModal;