
import React, { useState, useEffect } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, Lock, User, Save, Cloud, 
  UserPlus, Trash2, Key, ShieldAlert,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  Database, RefreshCw, Loader2
} from 'lucide-react';
import { MicrosoftGraphService } from '../services/microsoftGraphService';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [msAccount, setMsAccount] = useState<any>(null);
  const [storageType, setStorageType] = useState<'none' | 'personal' | 'corporate'>('none');
  const [isLoading, setIsLoading] = useState(false);
  
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user' });
  const [editingPasswordFor, setEditingPasswordFor] = useState<string | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    await MicrosoftGraphService.initialize();
    const token = await MicrosoftGraphService.getAccessToken();
    if (token) {
      const info = await MicrosoftGraphService.getUserInfo();
      setMsAccount(info);
      const siteId = await MicrosoftGraphService.getSiteId();
      setStorageType(siteId ? 'corporate' : 'personal');
    }
    setIsLoading(false);
  };

  const handleMsConnect = async () => {
    setIsLoading(true);
    const account = await MicrosoftGraphService.login();
    if (account) {
      setMsAccount(account);
      const siteId = await MicrosoftGraphService.getSiteId();
      setStorageType(siteId ? 'corporate' : 'personal');
      setMessage({ type: 'success', text: 'Conectado com sucesso!' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMsDisconnect = async () => {
    await MicrosoftGraphService.logout();
    setMsAccount(null);
    setStorageType('none');
  };

  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      setMessage({ type: 'error', text: 'Nome e senha são obrigatórios.' });
      return;
    }
    onUpdateConfig({ ...config, users: [...config.users, { ...newUser, passwordHash: newUser.password, canViewAll: newUser.role === 'admin' }] });
    setNewUser({ username: '', password: '', role: 'user' });
    setMessage({ type: 'success', text: 'Membro cadastrado!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-10 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ShieldCheck size={32} className="text-indigo-500" /> Segurança e Nuvem
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Armazenamento Híbrido (Pessoal/Corporativo)</p>
          </div>
        </header>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* CONFIGURAÇÃO DE NUVEM */}
          <div className="lg:col-span-5 space-y-6">
            <section className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={16} className="text-sky-500" /> Conectividade Microsoft
              </h3>
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${msAccount ? 'bg-indigo-600' : 'bg-slate-300'} text-white shadow-lg`}>
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Cloud size={24} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">
                    {msAccount ? msAccount.displayName || msAccount.name : 'Desconectado'}
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {storageType === 'corporate' ? 'SharePoint Corporativo' : storageType === 'personal' ? 'OneDrive Pessoal' : 'Sem Nuvem'}
                  </p>
                </div>
              </div>

              {msAccount ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${storageType === 'corporate' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                    {storageType === 'corporate' ? <CheckCircle2 size={16}/> : <Database size={16}/>}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-tight">
                        Armazenado em: {storageType === 'corporate' ? 'SharePoint /sites/regulatorios' : 'Seu OneDrive Pessoal'}
                      </p>
                      <p className="text-[8px] opacity-70">Pasta: /Documentos/Sistema/database.json</p>
                    </div>
                  </div>
                  <button onClick={handleMsDisconnect} className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition">Desconectar Conta</button>
                </div>
              ) : (
                <button onClick={handleMsConnect} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition shadow-xl">Conectar com Microsoft</button>
              )}
            </section>

            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4 items-start">
               <AlertCircle className="text-amber-600 shrink-0" size={20} />
               <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                 Ao usar sua conta pessoal, os dados serão salvos no seu OneDrive. Para migrar para a empresa depois, basta mover o arquivo para o SharePoint.
               </p>
            </div>
          </div>

          {/* GERENCIAMENTO DE USUÁRIOS */}
          <div className="lg:col-span-7 space-y-10">
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                <UserPlus size={18} className="text-indigo-600" /> Cadastro de Membros
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Login</label>
                  <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Nome" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={newUser.role === 'admin'} onChange={e => setNewUser({...newUser, role: e.target.checked ? 'admin' : 'user'})} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Perfil Administrador</span>
                  </label>
                  <button onClick={handleAddUser} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition">Adicionar</button>
                </div>
              </div>

              <div className="space-y-3">
                {config.users.map(u => (
                  <div key={u.username} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {u.username[0]}
                      </div>
                      <span className="text-sm font-black text-slate-800">{u.username}</span>
                    </div>
                    {u.username !== currentUser.username && (
                      <button onClick={() => onUpdateConfig({...config, users: config.users.filter(usr => usr.username !== u.username)})} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccessControl;
