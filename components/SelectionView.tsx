
import React, { useState } from 'react';
import { Person, AppUser } from '../types';
import { Users, User, ArrowRight, ShieldCheck, Lock, LogIn } from 'lucide-react';

interface SelectionViewProps {
  onSelect: (member: string | 'Todos') => void;
  onLogin: (user: AppUser) => void;
  people: Person[];
  users: AppUser[];
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect, onLogin, people, users }) => {
  const [showLogin, setShowLogin] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === showLogin);
    if (user && user.passwordHash === password) {
      onLogin(user);
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  const handlePersonClick = (name: string) => {
    const isUser = users.some(u => u.username === name);
    if (isUser) {
      setShowLogin(name);
      setError('');
    } else {
      onSelect(name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 overflow-hidden relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
      </div>

      {!showLogin ? (
        <>
          <div className="max-w-5xl w-full text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-black uppercase tracking-widest mb-8">
              <ShieldCheck size={16} />
              Assuntos Regulatórios CTVacinas
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">
              Controle de <span className="text-indigo-500">Acesso</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              Identifique-se para acessar o painel de gestão setorial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 z-10">
            <button
              onClick={() => onSelect('Todos')}
              className="group relative bg-indigo-600 p-8 rounded-3xl shadow-2xl shadow-indigo-900/50 hover:shadow-indigo-500/30 transition-all hover:-translate-y-2 flex flex-col items-start text-left overflow-hidden border border-indigo-400/20"
            >
              <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-110 transition-transform">
                <Users size={120} />
              </div>
              <div className="bg-white/10 p-4 rounded-2xl text-white mb-8 border border-white/20">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Visitante</h3>
              <p className="text-indigo-100/70 mb-8 max-w-[200px] text-sm font-medium">Acesso rápido apenas para visualização geral.</p>
              <div className="mt-auto flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                Entrar como Convidado <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {people.map((person) => {
              const isAdmin = users.find(u => u.username === person.name)?.role === 'admin';
              return (
                <button
                  key={person.id}
                  onClick={() => handlePersonClick(person.name)}
                  className="group bg-slate-800/50 p-8 rounded-3xl shadow-sm border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 flex flex-col items-start text-left relative overflow-hidden"
                >
                  <div className={`p-4 rounded-2xl mb-8 ${isAdmin ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20' : 'bg-slate-700/50 text-slate-500 border border-slate-700'}`}>
                    <User size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight flex items-center gap-2">
                    {person.name}
                    {isAdmin && <ShieldCheck size={16} className="text-amber-500" />}
                  </h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium italic">{person.email}</p>
                  <div className="mt-auto flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {users.some(u => u.username === person.name) ? 'Autenticar' : 'Ver Atividades'} <ArrowRight size={18} />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="w-full max-w-md animate-in zoom-in-95 duration-300 z-10">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
                <Lock size={36} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center">Acesso Restrito</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Olá, {showLogin}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
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
                Voltar à seleção
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionView;
