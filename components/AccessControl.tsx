
import React, { useState } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, UserPlus, Trash2, 
  User, Lock, Cloud, MailPlus
} from 'lucide-react';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user' });
  const [newAuthEmail, setNewAuthEmail] = useState('');
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

  const handleAddAuthEmail = () => {
    if (!newAuthEmail.trim() || !newAuthEmail.includes('@')) return;
    const email = newAuthEmail.trim().toLowerCase();
    
    if (config.authorizedEmails.includes(email)) {
      setMessage({ type: 'error', text: 'E-mail já está autorizado.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    onUpdateConfig({
      ...config,
      authorizedEmails: [...config.authorizedEmails, email]
    });
    setNewAuthEmail('');
    setMessage({ type: 'success', text: 'E-mail liberado para Cloud!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const removeAuthEmail = (email: string) => {
    if (confirm(`Remover autorização Cloud de "${email}"?`)) {
      onUpdateConfig({
        ...config,
        authorizedEmails: config.authorizedEmails.filter(e => e !== email)
      });
    }
  };

  const removeUser = (username: string) => {
    if (username === currentUser.username) return;
    if (confirm(`Remover o acesso de "${username}"?`)) {
      onUpdateConfig({ ...config, users: config.users.filter(u => u.username !== username) });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-10 bg-slate-900 text-white">
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck size={32} className="text-indigo-500" /> Controle de Acesso
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gerenciamento de permissões e usuários autorizados</p>
        </header>

        <div className="p-10 space-y-12">
          
          {/* Sessão de Autorização Cloud (NOVO) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={18} className="text-indigo-600" /> Autorização Microsoft Cloud (Sincronização)
              </h3>
              <span className="text-[9px] font-black text-slate-300 uppercase">Whitelist de Segurança</span>
            </div>
            
            <div className="bg-indigo-50/30 p-8 rounded-3xl border border-indigo-100/50 space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                    Liberar novo e-mail (Pessoal ou Corporativo)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      value={newAuthEmail} 
                      onChange={e => setNewAuthEmail(e.target.value)} 
                      placeholder="exemplo@email.com" 
                      className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                    <button 
                      onClick={handleAddAuthEmail}
                      className="px-6 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <MailPlus size={16}/> Autorizar Cloud
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {config.authorizedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-indigo-200 transition">
                    <span className="text-xs font-bold text-slate-600 truncate mr-2">{email}</span>
                    <button onClick={() => removeAuthEmail(email)} className="text-slate-300 hover:text-red-500 transition">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sessão de Adição de Usuário Local */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
              <UserPlus size={18} className="text-slate-600" /> Usuários com Acesso ao Painel (Login Local)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <User size={12}/> Nome de Usuário
                </label>
                <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: Bruna..." className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Lock size={12}/> Senha de Acesso
                </label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Senha..." className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={newUser.role === 'admin'} onChange={e => setNewUser({...newUser, role: e.target.checked ? 'admin' : 'user'})} className="w-5 h-5 accent-indigo-600 rounded" />
                  <span className="text-[10px] font-black text-slate-900 uppercase">Perfil Administrador</span>
                </label>
                <button onClick={handleAddUser} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition shadow-xl">Conceder Acesso</button>
              </div>
            </div>
          </section>

          {/* Lista de Usuários */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
               Membros Ativos no Painel ({config.users.length})
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
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  {u.username !== currentUser.username && (
                    <button onClick={() => removeUser(u.username)} className="p-3 text-slate-300 hover:text-red-500 rounded-xl transition"><Trash2 size={20}/></button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {message && (
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-10 py-4 rounded-2xl text-[10px] font-black uppercase text-center shadow-2xl z-[100] animate-in slide-in-from-bottom-4 ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
