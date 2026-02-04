
import React, { useState } from 'react';
import { X, KeyRound, LogIn } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  userName: string;
  // FIX: Add 'error' prop to accept and display password validation messages.
  error?: string | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onConfirm, userName, error }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleConfirm} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-2xl text-white shadow-lg">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Acesso Restrito</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Olá, {userName}</p>
          </div>
        </header>

        <div className="p-8 space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Digite sua senha para continuar
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary text-slate-900 text-lg font-bold text-center tracking-widest"
          />
          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        </div>

        <footer className="p-6 bg-slate-50 border-t flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-4 bg-brand-primary text-white rounded-2xl shadow-xl hover:bg-brand-accent transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <LogIn size={18} /> Entrar no Painel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-200 rounded-2xl transition"
          >
            Cancelar
          </button>
        </footer>
      </form>
    </div>
  );
};

export default PasswordModal;