
import React, { useState } from 'react';
import { AppConfig, AppUser } from '../types';
import { ShieldCheck, Lock, User, Key, Save, AlertCircle, CheckCircle2, UserPlus, RefreshCw, Trash2, Eye } from 'lucide-react';

interface AccessControlProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  currentUser: AppUser;
}

const AccessControl: React.FC<AccessControlProps> = ({ config, onUpdateConfig, currentUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [newUser, setNewUser] = useState({ username: '', role: 'user' as 'admin' | 'user', password: '', canViewAll: false });
  
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [adminAssignedPass, setAdminAssignedPass] = useState('');

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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    const newUserObj: AppUser = {
      username: newUser.username,
      role: newUser.role,
      passwordHash: newUser.password,
      canViewAll: newUser.canViewAll
    };
    onUpdateConfig({ ...config, users: [...config.users, newUserObj] });
    setNewUser({ username: '', role: 'user', password: '', canViewAll: false });
  };

  const toggleGlobalView = (username: string) => {
    const updatedUsers = config.users.map(u => 
      u.username === username ? { ...u, canViewAll: !u.canViewAll } : u
    );
    onUpdateConfig({ ...config, users: updatedUsers });
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ShieldCheck size={28} className="text-indigo-500" /> Controle de Acesso
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de credenciais e visibilidade setorial</p>
          </div>
        </header>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <Lock size={16} className="text-indigo-500" /> Minha Senha
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input type="password" placeholder="Senha Atual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold" />
              <input type="password" placeholder="Nova Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold" />
              <input type="password" placeholder="Confirmar" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold" />
              {message && <div className={`p-3 rounded-lg text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{message.text}</div>}
              <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Salvar Senha</button>
            </form>
          </div>

          {isAdmin && (
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><UserPlus size={16} className="text-indigo-500" /> Novo Usuário</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold" placeholder="Usuário" />
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold">
                      <option value="user">Membro Equipe</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <label className="flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer">
                      <input type="checkbox" checked={newUser.canViewAll} onChange={e => setNewUser({...newUser, canViewAll: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Permitir Visão Global</span>
                    </label>
                    <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold" placeholder="Senha Inicial" />
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Criar Acesso</button>
                  </form>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><User size={16} className="text-indigo-500" /> Credenciais</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {config.users.map(user => (
                      <div key={user.username} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{user.username.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{user.username}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{user.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => toggleGlobalView(user.username)} className={`p-1.5 rounded-lg transition ${user.canViewAll || user.role === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:bg-slate-50'}`} title="Visão Global"><Eye size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
