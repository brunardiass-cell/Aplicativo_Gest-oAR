
import React, { useState, useEffect } from 'react';
import { KeyRound, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  userName: string;
  error?: string | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onConfirm, userName, error }) => {
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Limpa a senha quando o modal é reaberto para um novo usuário
    setPassword('');
  }, [isOpen, userName]);
  
  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm text-center">
        <div className="inline-block p-4 bg-white/10 rounded-2xl mb-6">
          <KeyRound size={32} className="text-teal-400" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Restrito</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Bem-vindo(a), {userName}. Digite sua senha.</p>
        
        <form onSubmit={handleConfirm} className="mt-8 space-y-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-5 py-4 bg-slate-800/80 border rounded-2xl outline-none text-white text-lg font-bold text-center tracking-widest transition-all ${error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700 focus:ring-2 focus:ring-teal-500'}`}
          />
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 p-2">
                <AlertCircle size={16} />
                <p className="text-xs font-bold">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full py-4 bg-teal-600 text-white rounded-2xl shadow-xl hover:bg-teal-700 transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <LogIn size={18} /> Acessar Painel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-white/5 rounded-2xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16}/> Voltar
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
