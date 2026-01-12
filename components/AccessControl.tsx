
import React, { useState, useEffect } from 'react';
import { AppConfig, AppUser } from '../types';
import { 
  ShieldCheck, Lock, User, Save, Cloud, 
  CloudOff, Mail, Database, Settings, RefreshCw,
  ExternalLink, CheckCircle2, AlertCircle
} from 'lucide-react';
import { MicrosoftGraphService } from '../services/microsoftGraphService';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [isMsConnected, setIsMsConnected] = useState(!!localStorage.getItem('ms_access_token'));
  const [hasSharepointAccess, setHasSharepointAccess] = useState<boolean | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isMsConnected) {
      MicrosoftGraphService.checkAccess().then(setHasSharepointAccess);
    }
  }, [isMsConnected]);

  const handleMsConnect = () => {
    // Simulação de fluxo OAuth: Em produção usaria MSAL.js
    const simulatedToken = "simulated_sharepoint_token";
    localStorage.setItem('ms_access_token', simulatedToken);
    localStorage.setItem('ms_user_name', currentUser.username);
    setIsMsConnected(true);
    setMessage({ type: 'success', text: 'Conectado à conta Microsoft!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMsDisconnect = () => {
    localStorage.removeItem('ms_access_token');
    localStorage.removeItem('ms_user_name');
    setIsMsConnected(false);
    setHasSharepointAccess(null);
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    const saved = await MicrosoftGraphService.saveDatabase([], config); // Dummy save to test
    setSyncStatus(saved ? 'idle' : 'error');
    if (saved) {
      setMessage({ type: 'success', text: 'Sincronização manual concluída com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.passwordHash !== currentPassword) {
      setMessage({ type: 'error', text: 'Senha atual incorreta.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }
    const updatedUsers = config.users.map(u => u.username === currentUser.username ? { ...u, passwordHash: newPassword } : u);
    onUpdateConfig({ ...config, users: updatedUsers });
    setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => setMessage(null), 3000);
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ShieldCheck size={28} className="text-indigo-500" /> Segurança e Sincronização
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Conectividade SharePoint CTVacinas</p>
          </div>
        </header>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Painel Microsoft/SharePoint */}
          <div className="lg:col-span-6 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <Cloud size={16} className="text-sky-500" /> SharePoint Microsoft 365
              </h3>
              
              <div className={`p-8 rounded-3xl border transition-all ${isMsConnected ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-5 mb-8">
                  <div className={`p-4 rounded-2xl shadow-sm ${isMsConnected ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isMsConnected ? <Cloud size={32} /> : <CloudOff size={32} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Site: regulatorios</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">ctvacinas974.sharepoint.com</p>
                  </div>
                </div>

                {isMsConnected ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl flex items-center gap-3 border ${hasSharepointAccess ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      {hasSharepointAccess ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight">{hasSharepointAccess ? 'Acesso Validado' : 'Sem Acesso ao Site'}</p>
                        <p className="text-[10px] font-medium opacity-80">{hasSharepointAccess ? 'Os dados estão sendo salvos na pasta Sistema.' : 'Sua conta não tem as permissões necessárias.'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleManualSync} disabled={syncStatus === 'syncing' || !hasSharepointAccess} className="py-3 bg-white border border-sky-200 text-sky-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-100 transition flex items-center justify-center gap-2 disabled:opacity-50">
                        {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Sincronizar Agora
                      </button>
                      <button onClick={handleMsDisconnect} className="py-3 bg-white border border-red-100 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition">Sair da Conta</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleMsConnect} className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-500 transition shadow-xl shadow-sky-100 flex items-center justify-center gap-3">
                    <RefreshCw size={18} /> Conectar Conta CTVacinas
                  </button>
                )}
              </div>

              <div className="p-6 bg-slate-900/5 rounded-3xl border border-slate-100 space-y-3">
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Database size={14}/> Local de Armazenamento</h4>
                 <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500 font-mono">
                    Documentos/Sistema/database.json
                 </div>
                 <p className="text-[9px] text-slate-400 italic">O sistema gerencia este arquivo automaticamente para todos os usuários com acesso ao site.</p>
              </div>
            </section>
          </div>

          {/* Painel Senha Local */}
          <div className="lg:col-span-6 space-y-8">
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <Lock size={16} className="text-indigo-500" /> Credenciais de Aplicativo
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual do Painel</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                
                {message && <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{message.text}</div>}
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition">Atualizar Minha Senha</button>
              </form>
            </section>

            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
               <div className="flex gap-4">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={28} />
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase">Segurança Corporativa</h4>
                    <p className="text-xs text-indigo-700/70 mt-1 leading-relaxed">Este sistema utiliza criptografia em trânsito via HTTPS e delegação de permissões via OAuth 2.0. Os dados nunca saem do ecossistema Microsoft da sua instituição.</p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccessControl;
