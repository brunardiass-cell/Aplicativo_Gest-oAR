
import React, { useState, useEffect } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, Lock, User, Save, Cloud, 
  UserPlus, Trash2, ShieldAlert,
  CheckCircle2, AlertCircle, RefreshCw, Loader2, ExternalLink, Info
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

  const checkConnection = async () => {
    setIsLoading(true);
    await MicrosoftGraphService.init();
    const info = await MicrosoftGraphService.getAccount();
    if (info) {
      setMsAccount(info);
      try {
        const access = await MicrosoftGraphService.checkAccess();
        setHasAccess(access);
      } catch {
        setHasAccess(false);
      }
    }
    setIsLoading(false);
  };

  const handleMsConnect = async () => {
    setIsLoading(true);
    const result = await MicrosoftGraphService.login();
    if (result.success && result.account) {
      setMsAccount(result.account);
      const access = await MicrosoftGraphService.checkAccess();
      setHasAccess(access);
      setMessage({ type: access ? 'success' : 'error', text: access ? 'SharePoint Conectado!' : 'Sem acesso à pasta /regulatorios' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return;
    onUpdateConfig({ 
      ...config, 
      users: [...config.users, { ...newUser, passwordHash: newUser.password, canViewAll: newUser.role === 'admin' }] 
    });
    setNewUser({ username: '', password: '', role: 'user' });
    setMessage({ type: 'success', text: 'Membro autorizado!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-10 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ShieldCheck size={32} className="text-indigo-500" /> Segurança e Membros
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configurações de Identidade e Acesso à Nuvem</p>
          </div>
        </header>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-6">
            <section className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={16} className="text-sky-500" /> Sincronização Microsoft
              </h3>
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${msAccount ? 'bg-indigo-600' : 'bg-slate-300'} text-white shadow-lg`}>
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Cloud size={24} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase truncate max-w-[150px]">
                    {msAccount ? msAccount.username || msAccount.name : 'Desconectado'}
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">SharePoint Regulatorios</p>
                </div>
              </div>

              {msAccount ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${hasAccess ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {hasAccess ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                    <p className="text-[9px] font-black uppercase tracking-tight">
                      {hasAccess ? 'Acesso Validado ao Site' : 'Acesso Negado à Pasta'}
                    </p>
                  </div>
                  <button onClick={() => MicrosoftGraphService.logout()} className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition">Sair da Conta</button>
                </div>
              ) : (
                <button onClick={handleMsConnect} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100">Autenticar Microsoft</button>
              )}
            </section>

            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
               <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                 <Info size={14} /> Nota para Convidados
               </h4>
               <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                 E-mails pessoais (Gmail/Outlook) funcionam se o App estiver como <b>Multilocatário</b> no Azure AD. Certifique-se de aceitar o convite do SharePoint antes de logar aqui.
               </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-10">
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                <UserPlus size={18} className="text-indigo-600" /> Autorizar Novo Membro
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Nome (Exato do Microsoft)</label>
                  <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: usuario@gmail.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso Local</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={newUser.role === 'admin'} onChange={e => setNewUser({...newUser, role: e.target.checked ? 'admin' : 'user'})} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Perfil Administrador</span>
                  </label>
                  <button onClick={handleAddUser} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition">Autorizar</button>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {config.users.map(u => (
                  <div key={u.username} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-100 transition shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {u.username[0]}
                      </div>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tighter truncate max-w-[200px]">{u.username}</span>
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
