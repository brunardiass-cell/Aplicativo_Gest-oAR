
import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeletionModalProps {
  itemName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const DeletionModal: React.FC<DeletionModalProps> = ({ itemName, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('O motivo da exclusão é obrigatório para o registro de auditoria.');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10 text-white">
        <header className="p-8 bg-red-950/40 border-b border-red-500/20 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-2xl text-white shadow-lg shadow-red-500/20">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-red-300 uppercase tracking-tighter">Ação Sensível</h2>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Protocolo de Exclusão</p>
          </div>
        </header>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-medium">
              Tem certeza que deseja excluir este item?
            </p>
            <p className="text-white font-black uppercase text-lg leading-tight border-l-4 border-red-500 pl-4 py-1">
              {itemName}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Motivo da Exclusão (Obrigatório)
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="Ex: Tarefa duplicada, erro de cadastro, projeto cancelado..."
              className={`w-full px-4 py-3 bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-2xl outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-white transition-all resize-none`}
            ></textarea>
            {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{error}</p>}
          </div>
        </div>

        <footer className="p-8 bg-slate-900/50 border-t border-white/10 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-500/20 hover:bg-red-700 transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> Confirmar Exclusão e Logar
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-white/10 rounded-2xl transition"
          >
            Cancelar e Manter Item
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DeletionModal;