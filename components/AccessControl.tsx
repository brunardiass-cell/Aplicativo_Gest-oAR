import React, { useState, useEffect } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, Lock, User, Save, Cloud, 
  UserPlus, Trash2, Key, ShieldAlert,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  Database, RefreshCw, Loader2, ExternalLink
} from 'lucide-react';
import { MicrosoftGraphService } from '../services/microsoftGraphService';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const InfoItem = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex flex-col">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-[10px] font-bold ${mono ? 'font-mono text-slate-500' : 'text-slate-700'}`}>{value}</span>
  </div>
);

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [msAccount, setMsAccount] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user' });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  // Fix: Replaced call to non-existent 'getAccessToken' with 'getUserInfo'.
  // 'getUserInfo' handles token acquisition internally and serves as a check for an active session.
  const checkConnection = async () => {
    setIsLoading(true);
    await MicrosoftGraphService.initialize();
    const info = await MicrosoftGraphService.getUserInfo();
    if (info) {
      setMsAccount(info);
      const access = await MicrosoftGraphService.checkAccess();
      setHasAccess(access);
    }
    setIsLoading(false);
  };

  // Fix: Correctly handle the result object from `login()` and fetch user info after successful authentication.
  const handleMsConnect = async () => {
    setIsLoading(true);
    const result = await MicrosoftGraphService.login();
    if (result.success && result.account) {
      const info = await MicrosoftGraphService.getUserInfo();
      setMsAccount(info);
      const access = await MicrosoftGraphService.checkAccess();
      setHasAccess(access);
      if (access) {
        setMessage({ type: 'success', text: 'Conectado ao SharePoint corporativo!' });
      } else {
        setMessage({ type: 'error', text: 'Sua conta não tem acesso ao site "regulatorios".' });
      }
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMsDisconnect = async () => {
    await MicrosoftGraphService.logout();
    setMsAccount(null);
    setHasAccess(false);
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
              <ShieldCheck size={32} className="text-indigo-500" /> Segurança e SharePoint
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Atividades PAR - Configurações de Nuvem</p>
          </div>
        </header>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* CONFIGURAÇÃO DE NUVEM */}
          <div className="lg:col-span-5 space-y-6">
            <section className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={16} className="text-sky-500" /> Sincronização Microsoft 365
              </h3>
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${msAccount ? 'bg-indigo-600' : 'bg-slate-300'} text-white shadow-lg`}>
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Cloud size={24} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">
                    {msAccount ? msAccount.displayName || msAccount.name : 'Acesso Restrito'}
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    ctvacinas974.sharepoint.com
                  </p>
                </div>
              </div>

              {msAccount ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${hasAccess ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {hasAccess ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-tight">
                        {hasAccess ? 'Conectado ao Site: /regulatorios' : 'Acesso Negado ao Site SharePoint'}
                      </p>
                      <p className="text-[8px] opacity-70">
                        {hasAccess ? 'Destino: Documentos/Sistema/database.json' : 'Verifique se você tem permissão no site corporativo.'}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleMsDisconnect} className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition">Desconectar Conta</button>
                </div>
              ) : (
                <button onClick={handleMsConnect} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">
                  Autenticar via Microsoft
                </button>
              )}
            </section>

            <div className="p-6 bg-slate-900/5 rounded-3xl border border-slate-100 space-y-4">
               <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                 <Database size={14} /> Identificação do Aplicativo (Azure)
               </h4>
               <div className="space-y-3">
                 <InfoItem label="Nome de Exibição" value="Gestão de Atividades PAR" />
                 <InfoItem label="ID do Aplicativo (Cliente)" value="609422c2-d648-4b50-b1fe-ca614b77ffb5" mono />
                 <InfoItem label="ID do Diretório (Locatário)" value="f51c2ea8-6e50-4e8f-a3e3-30c69e99d323" mono />
               </div>
               <a 
                href="https://ctvacinas974.sharepoint.com/sites/regulatorios" 
                target="_blank" 
                className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline pt-2"
              >
                Abrir SharePoint <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* GERENCIAMENTO DE USUÁRIOS */}
          <div className="lg:col-span-7 space-y-10">
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                <UserPlus size={18} className="text-indigo-600" /> Cadastro de Membros Locais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Login (Nome Exato no SharePoint)</label>
                  <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: Graziella" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha do Painel</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={newUser.role === 'admin'} onChange={e => setNewUser({...newUser, role: e.target.checked ? 'admin' : 'user'})} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Perfil Administrador</span>
                  </label>
                  <button onClick={handleAddUser} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition">Adicionar Membro</button>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {config.users.map(u => (
                  <div key={u.username} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-100 transition shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {u.username[0]}
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{u.username}</span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{u.role === 'admin' ? 'Admin' : 'Usuário'}</p>
                      </div>
                    </div>
                    {u.username !== currentUser.username && (
                      <button onClick={() => onUpdateConfig({...config, users: config.users.filter(usr => usr.username !== u.username)})} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
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
