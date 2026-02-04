
import React, { useState } from 'react';
import { TeamMember, AppUser } from '../types';
import { ShieldCheck, UserPlus, Trash2, Edit, User, Briefcase, X, Save, CheckCircle, Ban, Clock, Mail, ShieldAlert } from 'lucide-react';

interface AccessControlProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  appUsers: AppUser[];
  onUpdateAppUsers: (users: AppUser[]) => void;
}

const AccessControl: React.FC<AccessControlProps> = ({ teamMembers, onUpdateTeamMembers, appUsers, onUpdateAppUsers }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'users'>('users');
  
  // States para Usuários (AppUsers)
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'user' as const });
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // States para Membros da Equipe (TeamMembers)
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  // Funções para Gerenciamento de AppUsers (Contas)
  const handleAddAppUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.email.trim()) return;
    
    const user: AppUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      username: newUser.username.trim(),
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      status: 'active',
      joinedAt: new Date().toISOString()
    };
    
    onUpdateAppUsers([...appUsers, user]);
    setNewUser({ username: '', email: '', role: 'user' });
    setIsAddingUser(false);
  };

  const handleUpdateUserStatus = (userId: string, newStatus: AppUser['status']) => {
    onUpdateAppUsers(appUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const handleUpdateUserRole = (userId: string, newRole: AppUser['role']) => {
    onUpdateAppUsers(appUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = (userId: string) => {
    const user = appUsers.find(u => u.id === userId);
    if (confirm(`Tem certeza que deseja excluir permanentemente a conta de "${user?.username}"? Esta ação não pode ser desfeita.`)) {
      onUpdateAppUsers(appUsers.filter(u => u.id !== userId));
    }
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateAppUsers(appUsers.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  // Funções para Membros da Equipe
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.role.trim()) return;
    const member: TeamMember = {
      id: 'tm_' + Math.random().toString(36).substr(2, 9),
      name: newMember.name.trim(),
      role: newMember.role.trim(),
      isLeader: false,
    };
    onUpdateTeamMembers([...teamMembers, member]);
    setNewMember({ name: '', role: '' });
  };

  const handleDeleteMember = (id: string) => {
    const member = teamMembers.find(m => m.id === id);
    if (confirm(`Remover "${member?.name}" da estrutura oficial?`)) {
      onUpdateTeamMembers(teamMembers.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2 w-fit">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
           <ShieldCheck size={14} /> Contas de Acesso
        </button>
        <button 
          onClick={() => setActiveTab('team')} 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
           <Briefcase size={14} /> Estrutura de Equipe
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        {activeTab === 'users' ? (
          <>
            <header className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Gestão de Usuários</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de login, permissões e status das contas.</p>
              </div>
              <button 
                onClick={() => setIsAddingUser(!isAddingUser)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${isAddingUser ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
              >
                {isAddingUser ? <X size={16} /> : <UserPlus size={16} />} 
                {isAddingUser ? 'Cancelar' : 'Nova Conta'}
              </button>
            </header>

            {isAddingUser && (
              <form onSubmit={handleAddAppUser} className="p-8 bg-blue-50/30 border-b border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in slide-in-from-top duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: Priscila Passos" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Institucional</label>
                  <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="usuario@ctvacinas.org" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Papel</label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none">
                    <option value="user">Usuário Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button type="submit" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
                  <CheckCircle size={16}/> Criar Conta
                </button>
              </form>
            )}

            <div className="p-8 divide-y divide-slate-100">
              {appUsers.map(user => (
                <div key={user.id} className="py-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : user.status === 'blocked' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {user.username?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{user.username}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Controles de Status */}
                    <div className="flex items-center gap-2">
                      {user.status === 'pending' && (
                        <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-100">
                          <CheckCircle size={14}/> Aprovar
                        </button>
                      )}
                      
                      {user.status === 'active' && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select 
                            value={user.role} 
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as any)}
                            className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase text-slate-600 outline-none"
                          >
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                          </select>
                          <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar Dados">
                            <Edit size={16}/>
                          </button>
                          <button onClick={() => handleUpdateUserStatus(user.id, 'blocked')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Bloquear Acesso">
                            <Ban size={16}/>
                          </button>
                        </div>
                      )}

                      {user.status === 'blocked' && (
                        <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                          Desbloquear
                        </button>
                      )}

                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="Excluir Permanentemente">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    
                    {/* Badge de Status */}
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                      user.status === 'blocked' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {user.status}
                    </div>
                  </div>
                </div>
              ))}
              {appUsers.length === 0 && (
                <div className="p-20 text-center">
                  <ShieldAlert size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhuma conta de acesso registrada.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <header className="p-8 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Estrutura de Equipe</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Integrantes que podem ser vinculados a atividades e lideranças.</p>
            </header>
            <form onSubmit={handleAddMember} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50/50 border-b border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Integrante</label>
                <input required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Nome completo" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-600"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Função / Cargo</label>
                <input required value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} placeholder="Ex: Gestor de Projetos, Biólogo" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-600"/>
              </div>
              <button type="submit" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
                <UserPlus size={16}/> Criar Perfil
              </button>
            </form>
            <div className="p-8 space-y-4">
              {teamMembers.map(member => (
                <div key={member.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-100 transition shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-indigo-50 text-indigo-600`}>
                      {member.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{member.name}</h4>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-400">{member.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhum membro na estrutura da equipe.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <form onSubmit={handleSaveUserEdit} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
                  <Edit size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Editar Usuário</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atualize os dados cadastrais</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
            </header>

            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Exibido</label>
                <input required value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-600"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-600"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Papel no Sistema</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none">
                  <option value="user">Usuário Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <footer className="p-8 bg-slate-50 border-t flex gap-3">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 rounded-2xl transition">Descartar</button>
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition">Salvar Alterações</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccessControl;