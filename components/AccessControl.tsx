
import React, { useState } from 'react';
import { TeamMember, UserRole } from '../types';
import { ShieldCheck, UserPlus, Trash2, Edit, Save, X, User, Briefcase, KeyRound } from 'lucide-react';

interface AccessControlProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
}

const UserEditModal: React.FC<{
  user: Partial<TeamMember>;
  onSave: (user: TeamMember) => void;
  onClose: () => void;
  teamMembers: TeamMember[];
}> = ({ user, onSave, onClose, teamMembers }) => {
  const [localUser, setLocalUser] = useState(user);
  const isEditing = !!user.id;

  const isEmailTaken = (email: string) => {
    return teamMembers.some(member => member.email.toLowerCase() === email.toLowerCase() && member.id !== localUser.id);
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUser.name || !localUser.email || !localUser.jobTitle || !localUser.role) return;
    if (isEmailTaken(localUser.email)) {
      alert("Este e-mail já está em uso.");
      return;
    }
    
    const userToSave: TeamMember = {
      id: localUser.id || `tm_${Date.now()}`,
      status: localUser.status || 'active',
      ...localUser
    } as TeamMember;
    onSave(userToSave);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary p-3 rounded-2xl text-white shadow-lg">
              {isEditing ? <Edit size={24} /> : <UserPlus size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gerencie os dados de acesso</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
        </header>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required value={localUser.name || ''} onChange={e => setLocalUser({...localUser, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black"/>
            </div>
            <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <input required type="email" value={localUser.email || ''} onChange={e => setLocalUser({...localUser, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black"/>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo</label>
                <input required value={localUser.jobTitle || ''} onChange={e => setLocalUser({...localUser, jobTitle: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black"/>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Permissão</label>
                <select value={localUser.role || 'Usuario'} onChange={e => setLocalUser({...localUser, role: e.target.value as UserRole})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black">
                    <option value="Admin">Admin</option>
                    <option value="Membro">Membro</option>
                    <option value="Usuario">Usuário</option>
                </select>
            </div>
            <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha (Opcional)</label>
                <input type="password" placeholder="Deixe em branco para não alterar" value={localUser.password || ''} onChange={e => setLocalUser({...localUser, password: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black"/>
            </div>
          </div>
        </div>
        <footer className="p-6 bg-slate-50 border-t flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 rounded-2xl transition">Descartar</button>
            <button type="submit" className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-accent transition">Salvar Alterações</button>
        </footer>
      </form>
    </div>
  );
};


const AccessControl: React.FC<AccessControlProps> = ({ teamMembers, onUpdateTeamMembers }) => {
  const [editingUser, setEditingUser] = useState<Partial<TeamMember> | null>(null);

  const handleSaveUser = (userToSave: TeamMember) => {
    const isEditing = teamMembers.some(u => u.id === userToSave.id);
    const updatedMembers = isEditing
      ? teamMembers.map(u => u.id === userToSave.id ? userToSave : u)
      : [...teamMembers, userToSave];
    onUpdateTeamMembers(updatedMembers);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const user = teamMembers.find(u => u.id === userId);
    if (confirm(`Deseja remover o acesso de "${user?.name}"? A pessoa não poderá mais logar no sistema.`)) {
      onUpdateTeamMembers(teamMembers.filter(u => u.id !== userId));
    }
  };

  const getRoleStyling = (role: UserRole) => {
    switch(role) {
      case 'Admin': return 'bg-brand-dark text-white';
      case 'Membro': return 'bg-brand-primary/20 text-brand-primary';
      case 'Usuario': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <header className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Gestão de Usuários</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de login, permissões e cargos.</p>
        </div>
        <button
          onClick={() => setEditingUser({})}
          className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 bg-brand-dark text-white shadow-lg"
        >
          <UserPlus size={16} /> Novo Usuário
        </button>
      </header>

      <div className="p-8 space-y-4">
        {teamMembers.map(user => (
          <div key={user.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-brand-primary/20 transition shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {user.name[0]}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{user.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.jobTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${getRoleStyling(user.role)}`}>
                <ShieldCheck size={12} />
                <span>{user.role}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {user.status}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition" title="Editar">
                  <Edit size={16}/>
                </button>
                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          </div>
        ))}
        {teamMembers.length === 0 && (
          <div className="p-20 text-center">
            <ShieldCheck size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhuma conta de acesso registrada.</p>
          </div>
        )}
      </div>

      {editingUser && (
        <UserEditModal 
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setEditingUser(null)}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
};

export default AccessControl;
