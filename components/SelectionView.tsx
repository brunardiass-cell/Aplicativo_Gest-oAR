
import React, { useState } from 'react';
import { AppUser } from '../types';
import { User, ArrowRight, Lock, LogIn, ShieldCheck, Database, Cloud } from 'lucide-react';

interface SelectionViewProps {
  onSelect: (member: string | 'Todos') => void;
  onLogin: (user: AppUser) => void;
  users: AppUser[];
  msAccount: any;
  onMsLogin: () => void;
  hasClientId: boolean;
}

const SelectionView: React.FC<SelectionViewProps> = ({ onLogin, users, msAccount, onMsLogin }) => {
  const [showLogin, setShowLogin] = useState<AppUser | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showLogin && showLogin.passwordHash === password) {
      onLogin(showLogin);
    } else {
      setError('Senha incorreta.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      
      {!showLogin ? (
        <>
          <div className="text-center mb-12 space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${msAccount ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {msAccount ? <Cloud size={16} /> : <Database size={16} />}
              {msAccount ? `Conectado: ${msAccount.username}` : 'Modo Offline'}
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Acessar <span className="text-indigo-600">Painel AR</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Plataforma de Assuntos Regulatórios - CTVacinas
            </p>
          </div>

          {!msAccount && (
            <div className="w-full max-w-2xl mb-12 p-8 bg-indigo-600 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-indigo-200 border border-indigo-500">
               <div className="p-4 bg-white/10 text-white rounded-2xl">
                 <Cloud size={32} />
               </div>
               <div className="flex-1 text-center md:text-left text-white">
                 <h4 className="text-lg font-black uppercase tracking-tight">Ativar Sincronização em Nuvem</h4>
                 <p className="text-xs font-medium opacity-80 mt-1">
                   Conecte sua conta Microsoft para compartilhar os dados com toda a equipe via SharePoint automaticamente.
                 </p>
               </div>
               <button 
                onClick={onMsLogin}
                className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition flex items-center gap-2 shadow-xl"
               >
                 <LogIn size={20} /> Conectar Agora
               </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            {users.map((user) => (
              <button
                key={user.username}
                onClick={() => setShowLogin(user)}
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 transition-all hover:-translate-y-1 flex flex-col items-start text-left relative overflow-hidden"
              >
                <div className={`p-4 rounded-2xl mb-8 ${user.role === 'admin' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                  <User size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight flex items-center gap-2">
                  {user.username}
                  {user.role === 'admin' && <ShieldCheck size={16} className="text-amber-500" />}
                </h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                  {user.role === 'admin' ? 'Administradora' : 'Equipe PAR'}
                </p>
                <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Acessar Perfil <ArrowRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
                <Lock size={36} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center leading-none">Credenciais</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3">Perfil: {showLogin.username}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha do Painel</label>
                <input 
                  type="password"
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`w-full px-6 py-4 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold transition-all`}
                />
                {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 ml-1">{error}</p>}
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"
              >
                <LogIn size={20} /> Entrar no Sistema
              </button>

              <button 
                type="button"
                onClick={() => setShowLogin(null)}
                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition"
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionView;
