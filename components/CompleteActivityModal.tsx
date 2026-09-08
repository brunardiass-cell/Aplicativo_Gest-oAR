import React, { useState } from 'react';
import { X, Link2, CheckCircle2 } from 'lucide-react';
import { MicroActivity } from '../types';

interface CompleteActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  microActivity: MicroActivity | null;
  onConfirm: (microId: string, documentLink?: string) => void;
}

export const CompleteActivityModal: React.FC<CompleteActivityModalProps> = ({
  isOpen,
  onClose,
  microActivity,
  onConfirm
}) => {
  const [docLink, setDocLink] = useState('');

  if (!isOpen || !microActivity) return null;

  const handleComplete = () => {
    onConfirm(microActivity.id, docLink.trim() || undefined);
    setDocLink('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Concluir atividade
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {microActivity.code ? `${microActivity.code} ` : ''}{microActivity.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-slate-700 block">
            Link do documento (opcional)
          </label>
          <div className="relative flex items-center">
            <Link2 size={16} className="absolute left-3 text-blue-600 pointer-events-none" />
            <input 
              type="text"
              value={docLink}
              onChange={e => setDocLink(e.target.value)}
              placeholder="Cole aqui o link do documento ou informe a referência..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleComplete();
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            O link será salvo apenas no momento da conclusão da atividade.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 size={14} />
            Concluir atividade
          </button>
        </div>
      </div>
    </div>
  );
};
