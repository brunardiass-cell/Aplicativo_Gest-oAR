
import React, { useState } from 'react';
import { X, KeyRound, Save } from 'lucide-react';

interface PasswordSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetPassword: (password: string) => void;
  userName: string;
}

const PasswordSetModal: React.FC<PasswordSetModalProps> = ({ isOpen, onClose, onSetPassword, userName }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('A senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    onSetPassword(password);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="bg-white text-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <header className="p-8 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Definir Senha</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Para {userName}</p>
          </div>
        </header>

        <div className="p-8 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Nova Senha
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold"
            />
          </div>
          {error && <p className="text-center text-xs text-red-600 font-bold">{error}</p>}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-4 bg-teal-600 text-white rounded-2xl shadow-xl hover:bg-teal-700 transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <Save size={18} /> Salvar Nova Senha
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

export default PasswordSetModal;
