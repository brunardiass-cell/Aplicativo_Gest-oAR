
import React, { useState } from 'react';
import { X, KeyRound, LogIn } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  userName: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onConfirm, userName }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleConfirm} className="bg-[#1e293b] text-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        <header className="p-8 bg-slate-900/50 border-b border-white/10 flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Acesso Restrito</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Olá, {userName}</p>
          </div>
        </header>

        <div className="p-8 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Digite sua senha para continuar
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white text-lg font-bold text-center tracking-widest"
          />
        </div>

        <footer className="p-6 bg-slate-900/50 border-t border-white/10 flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <LogIn size={18} /> Entrar no Painel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-white/10 rounded-2xl transition"
          >
            Cancelar
          </button>
        </footer>
      </form>
    </div>
  );
};

export default PasswordModal;