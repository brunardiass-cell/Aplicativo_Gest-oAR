
import React, { useState, useEffect } from 'react';
import { AppUser } from '../types';
// Fix: Added missing CheckCircle2 import
import { User, ArrowRight, ShieldCheck, Lock, LogIn, Cloud, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MicrosoftGraphService } from '../services/microsoftGraphService';

interface SelectionViewProps {
  onSelect: (member: string | 'Todos') => void;
  onLogin: (user: AppUser) => void;
  users: AppUser[];
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect, onLogin, users }) => {
  const [showLogin, setShowLogin] = useState<AppUser | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [msConnected, setMsConnected] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [msError, setMsError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      await MicrosoftGraphService.initialize();
      const token = await MicrosoftGraphService.getAccessToken();
      if (token) {
        const hasAccess = await MicrosoftGraphService.checkAccess();
        setMsConnected(hasAccess);
        if (!hasAccess) setMsError("Acesso restrito ao SharePoint de Assuntos Regulatórios.");
      }
    };
    checkStatus();
  }, []);

  const handleMsAuth = async () => {
    setMsLoading(true);
    setMsError(null);
    try {
      const account = await MicrosoftGraphService.login();
      if (account) {
        const access = await MicrosoftGraphService.checkAccess();
        if (access) {
          setMsConnected(true);
        } else {
          setMsError("Acesso negado: Sua conta não tem permissão no site 'regulatorios'.");
          await MicrosoftGraphService.logout();
        }
      }
    } catch (e) {
      setMsError("Erro ao conectar com a Microsoft.");
    } finally {
      setMsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 overflow-hidden relative">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
      </div>

      {!msConnected ? (
        <div className="max-w-md w-full animate-in zoom-in-95 duration-500 z-10">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-sky-100 text-sky-600 rounded-3xl flex items-center justify-center mb-6">
                <Cloud size={40} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Acesso Restrito</h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3">Autenticação Corporativa Necessária</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Este sistema é integrado ao SharePoint <b>ctvacinas974</b>. Para prosseguir, valide sua identidade institucional.
              </p>
            </div>

            {msError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-left">
                <ShieldAlert className="text-red-500 shrink-0" size={20} />
                <p className="text-[10px] font-bold text-red-600 uppercase leading-tight">{msError}</p>
              </div>
            )}

            <button 
              onClick={handleMsAuth}
              disabled={msLoading}
              className="w-full py-5 bg-sky-600 text-white rounded-2xl shadow-xl hover:bg-sky-700 transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {msLoading ? <RefreshCw className="animate-spin" size={20} /> : <LogIn size={20} />} 
              Validar com Microsoft
            </button>
            
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">ID do App: 609422c2...ffb5</p>
          </div>
        </div>
      ) : (
        <>
          {!showLogin ? (
            <>
              <div className="max-w-5xl w-full text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                  <CheckCircle2 size={16} />
                  Conexão SharePoint Validada
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">
                  Quem está <span className="text-indigo-500">Acessando?</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
                  Acesse com seu perfil cadastrado pela liderança.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 z-10">
                {users.map((user) => (
                  <button
                    key={user.username}
                    onClick={() => setShowLogin(user)}
                    className="group bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 flex flex-col items-start text-left relative overflow-hidden"
                  >
                    <div className={`p-4 rounded-2xl mb-8 ${user.role === 'admin' ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'}`}>
                      <User size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight flex items-center gap-2">
                      {user.username}
                      {user.role === 'admin' && <ShieldCheck size={16} className="text-amber-500" />}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">
                      {user.role === 'admin' ? 'Administradora' : 'Equipe PAR'}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar <ArrowRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="w-full max-w-md animate-in zoom-in-95 duration-300 z-10">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
                    <Lock size={36} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center leading-none">Autenticação</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3">Perfil: {showLogin.username}</p>
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
                    <LogIn size={20} /> Confirmar Entrada
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
        </>
      )}
    </div>
  );
};

export default SelectionView;
