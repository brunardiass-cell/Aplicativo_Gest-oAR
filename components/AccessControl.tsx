
import React, { useState } from 'react';
import { AppConfig, AppUser } from '../types';
import { ShieldCheck, Lock, User, Key, Save, AlertCircle, CheckCircle2, UserPlus, RefreshCw, Trash2 } from 'lucide-react';

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

  // New User Form State
  const [newUser, setNewUser] = useState({ username: '', role: 'user' as 'admin' | 'user', password: '' });
  
  // Edit Password for other user
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
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }

    const updatedUsers = config.users.map(u => 
      u.username === currentUser.username ? { ...u, passwordHash: newPassword } : u
    );

    onUpdateConfig({ ...config, users: updatedUsers });
    setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert('Preencha todos os campos do novo usuário.');
      return;
    }
    if (config.users.some(u => u.username === newUser.username)) {
      alert('Este usuário já existe.');
      return;
    }

    const newUserObj: AppUser = {
      username: newUser.username,
      role: newUser.role,
      passwordHash: newUser.password
    };

    onUpdateConfig({ ...config, users: [...config.users, newUserObj] });
    setNewUser({ username: '', role: 'user', password: '' });
  };

  const handleUpdateOtherUserPassword = (username: string) => {
    if (!adminAssignedPass) return;
    const updatedUsers = config.users.map(u => 
      u.username === username ? { ...u, passwordHash: adminAssignedPass } : u
    );
    onUpdateConfig({ ...config, users: updatedUsers });
    setEditingUser(null);
    setAdminAssignedPass('');
    alert(`Senha de ${username} atualizada com sucesso!`);
  };

  const handleRemoveUser = (username: string) => {
    if (username === 'Graziella') return; // Cannot delete main admin
    if (confirm(`Remover credenciais de ${username}?`)) {
      onUpdateConfig({ ...config, users: config.users.filter(u => u.username !== username) });
    }
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
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de credenciais e segurança do sistema</p>
          </div>
          <div className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
            Logado como: {currentUser.username} ({currentUser.role})
          </div>
        </header>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Section 1: My Password (Any user) */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <Lock size={16} className="text-indigo-500" /> Minha Senha
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" />
              </div>
              {message && <div className={`p-3 rounded-lg text-xs font-bold uppercase ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{message.text}</div>}
              <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition">Salvar Minha Senha</button>
            </form>
          </div>

          {/* Section 2: Manage Users (Admin Only) */}
          {isAdmin && (
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create User Form */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <UserPlus size={16} className="text-indigo-500" /> Novo Usuário
                  </h3>
                  <form onSubmit={handleCreateUser} className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
                      <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Nome do membro" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Papel</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold">
                        <option value="user">Membro da Equipe</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Inicial</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Senha mestre" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition shadow-lg">Criar Acesso</button>
                  </form>
                </div>

                {/* User List & Password Management */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <User size={16} className="text-indigo-500" /> Credenciais Ativas
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {config.users.map(user => (
                      <div key={user.username} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">{user.username.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{user.username}</p>
                              <p className="text-[9px] font-bold text-indigo-500 uppercase">{user.role}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingUser(user.username)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Redefinir Senha"><RefreshCw size={14}/></button>
                            {user.username !== 'Graziella' && (
                              <button onClick={() => handleRemoveUser(user.username)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover"><Trash2 size={14}/></button>
                            )}
                          </div>
                        </div>
                        {editingUser === user.username && (
                          <div className="pt-2 flex gap-2 animate-in slide-in-from-top-1">
                            <input 
                              type="password" 
                              placeholder="Nova senha" 
                              value={adminAssignedPass} 
                              onChange={e => setAdminAssignedPass(e.target.value)} 
                              className="flex-1 px-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-bold" 
                            />
                            <button onClick={() => handleUpdateOtherUserPassword(user.username)} className="px-3 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase">OK</button>
                            <button onClick={() => setEditingUser(null)} className="px-3 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase">X</button>
                          </div>
                        )}
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
