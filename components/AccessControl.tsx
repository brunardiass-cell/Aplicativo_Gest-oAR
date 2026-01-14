
import React, { useState, useEffect } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, Lock, User, Save, Cloud, 
  UserPlus, Trash2, Key, ShieldAlert,
  CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { MicrosoftGraphService } from '../services/microsoftGraphService';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [msAccount, setMsAccount] = useState<any>(null);
  const [hasSharepointAccess, setHasSharepointAccess] = useState<boolean | null>(null);
  
  // Estados para Gerenciamento de Usuários
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user' });
  const [editingPasswordFor, setEditingPasswordFor] = useState<string | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    await MicrosoftGraphService.initialize();
    const token = await MicrosoftGraphService.getAccessToken();
    if (token) {
      const info = await MicrosoftGraphService.getUserInfo();
      setMsAccount(info);
      const access = await MicrosoftGraphService.checkAccess();
      setHasSharepointAccess(access);
    }
  };

  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      setMessage({ type: 'error', text: 'Nome e senha são obrigatórios.' });
      return;
    }
    
    if (config.users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      setMessage({ type: 'error', text: 'Membro já cadastrado com este nome.' });
      return;
    }

    const createdUser: AppUser = {
      username: newUser.username.trim(),
      passwordHash: newUser.password.trim(),
      role: newUser.role,
      canViewAll: newUser.role === 'admin'
    };

    onUpdateConfig({ ...config, users: [...config.users, createdUser] });
    setNewUser({ username: '', password: '', role: 'user' });
    setMessage({ type: 'success', text: 'Membro cadastrado com sucesso!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveUser = (username: string) => {
    if (username === currentUser.username) {
      setMessage({ type: 'error', text: 'Você não pode remover seu próprio acesso.' });
      return;
    }
    if (confirm(`Remover permanentemente o acesso de ${username}?`)) {
      onUpdateConfig({ ...config, users: config.users.filter(u => u.username !== username) });
    }
  };

  const handleResetPassword = () => {
    if (!editingPasswordFor || !newTempPassword.trim()) return;
    const updatedUsers = config.users.map(u => 
      u.username === editingPasswordFor ? { ...u, passwordHash: newTempPassword.trim() } : u
    );
    onUpdateConfig({ ...config, users: updatedUsers });
    setEditingPasswordFor(null);
    setNewTempPassword('');
    setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-10 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ShieldCheck size={32} className="text-indigo-500" /> Controle de Acesso
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Equipe e Permissões - Administradora</p>
          </div>
        </header>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* CADASTRO DE MEMBROS */}
          <div className="lg:col-span-7 space-y-10">
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                <UserPlus size={18} className="text-indigo-600" /> Cadastrar Novo Membro
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Login</label>
                  <input 
                    type="text" 
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Ex: Bruna" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <input 
                      type={showPass ? "text" : "password"}
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={newUser.role === 'admin'} onChange={e => setNewUser({...newUser, role: e.target.checked ? 'admin' : 'user'})} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase group-hover:text-indigo-600 transition">Perfil Administrador</span>
                  </label>
                  <button 
                    onClick={handleAddUser}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2"
                  >
                    <UserPlus size={16} /> Salvar Membro
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Membros Cadastrados</h4>
                <div className="grid grid-cols-1 gap-3">
                  {config.users.map(u => (
                    <div key={u.username} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl group hover:border-indigo-200 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {u.username[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.username}</span>
                            {u.role === 'admin' && <ShieldCheck size={14} className="text-amber-500" />}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role === 'admin' ? 'Líder / Admin' : 'Integrante Equipe'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setEditingPasswordFor(u.username); setNewTempPassword(''); }}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                        >
                          <Key size={14} /> Mudar Senha
                        </button>
                        <button 
                          onClick={() => handleRemoveUser(u.username)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* STATUS CONEXÃO */}
          <div className="lg:col-span-5 space-y-8">
            <section className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={16} className="text-sky-500" /> Sincronização Online
              </h3>
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${msAccount ? 'bg-emerald-500' : 'bg-slate-300'} text-white shadow-lg`}>
                  <Cloud size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">
                    {msAccount ? msAccount.displayName : 'Banco Local'}
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">SharePoint PAR</p>
                </div>
              </div>

              {msAccount ? (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${hasSharepointAccess ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                  {hasSharepointAccess ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                  <p className="text-[9px] font-black uppercase tracking-tight">{hasSharepointAccess ? 'Dados Sincronizados com a Nuvem' : 'Erro nas Permissões do SharePoint'}</p>
                </div>
              ) : (
                <button onClick={() => MicrosoftGraphService.login()} className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-500 transition shadow-xl shadow-sky-100">Ficar Online (Conectar)</button>
              )}
            </section>

            <section className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
              <div className="flex gap-4">
                <ShieldAlert className="text-indigo-600 shrink-0" size={24} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase">Segurança Interna</h4>
                  <p className="text-[10px] text-indigo-700/70 leading-relaxed font-medium italic">Senhas definidas aqui são válidas apenas para este sistema e não alteram sua senha Microsoft.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MODAL MUDAR SENHA */}
      {editingPasswordFor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-4"><Key size={32}/></div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Redefinir Senha</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{editingPasswordFor}</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                autoFocus
                value={newTempPassword} 
                onChange={e => setNewTempPassword(e.target.value)} 
                placeholder="Nova senha temporária..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <div className="flex gap-2 pt-4">
                <button onClick={() => setEditingPasswordFor(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={handleResetPassword} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALERTAS */}
      {message && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-right border ${message.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'}`}>
          <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default AccessControl;
