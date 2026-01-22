
import React, { useState } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, UserPlus, Trash2, 
  Info, User, Lock, ShieldAlert
} from 'lucide-react';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user' });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return;
    
    if (config.users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      setMessage({ type: 'error', text: 'Este nome de usuário já existe.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    onUpdateConfig({ 
      ...config, 
      users: [...config.users, { 
        username: newUser.username.trim(), 
        role: newUser.role, 
        passwordHash: newUser.password, 
        canViewAll: newUser.role === 'admin' 
      }] 
    });
    
    setNewUser({ username: '', password: '', role: 'user' });
    setMessage({ type: 'success', text: 'Usuário autorizado com sucesso!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const removeUser = (username: string) => {
    if (username === currentUser.username) return;
    if (confirm(`Remover o acesso de "${username}"?`)) {
      onUpdateConfig({
        ...config,
        users: config.users.filter(u => u.username !== username)
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-10 bg-slate-900 text-white">
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck size={32} className="text-indigo-500" /> Controle de Acesso Local
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gerencie quem pode acessar o painel de atividades</p>
        </header>

        <div className="p-10 space-y-12">
          {/* Sessão de Adição */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
              <UserPlus size={18} className="text-indigo-600" /> Autorizar Novo Acesso
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <User size={12}/> Nome de Usuário
                </label>
                <input 
                  type="text" 
                  value={newUser.username} 
                  onChange={e => setNewUser({...newUser, username: e.target.value})} 
                  placeholder="Nome do integrante..." 
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Lock size={12}/> Senha de Acesso
                </label>
                <input 
                  type="password" 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  placeholder="Defina uma senha..." 
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={newUser.role === 'admin'} 
                    onChange={e => setNewUser({...newUser, role: e.target.checked ? 'admin' : 'user'})} 
                    className="w-5 h-5 accent-indigo-600 rounded" 
                  />
                  <div>
                    <span className="text-[10px] font-black text-slate-900 uppercase">Perfil Administrador</span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Pode gerenciar usuários e deletar tarefas</p>
                  </div>
                </label>
                <button 
                  onClick={handleAddUser} 
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition shadow-xl"
                >
                  Conceder Acesso
                </button>
              </div>
              {message && (
                <div className={`md:col-span-2 p-3 rounded-xl text-[10px] font-black uppercase text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                </div>
              )}
            </div>
          </section>

          {/* Lista de Usuários */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
               Lista de Membros Ativos ({config.users.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.users.map(u => (
                <div key={u.username} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 transition shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {u.username[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{u.username}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                          {u.role}
                        </span>
                        {u.username === currentUser.username && (
                          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">• Você</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {u.username !== currentUser.username && (
                    <button 
                      onClick={() => removeUser(u.username)} 
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={20}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-5 items-center">
             <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                <Info size={24} />
             </div>
             <div>
               <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Nota de Privacidade Local</p>
               <p className="text-xs text-blue-700 leading-relaxed font-medium">
                 O sistema não está mais conectado à nuvem. Todas as alterações feitas aqui são salvas <b>apenas neste navegador</b>. Para usar em outro computador, os dados não serão sincronizados automaticamente.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
