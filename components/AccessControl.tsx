
import React, { useState } from 'react';
import { TeamMember, AccessUser } from '../types';
import { ShieldCheck, UserPlus, Trash2, Edit, User, Briefcase, X, Save, KeyRound, Building, Mail } from 'lucide-react';

// Main Props
interface AccessControlProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  accessUsers: AccessUser[];
  onUpdateAccessUsers: (users: AccessUser[]) => void;
}

// Main Component
const AccessControl: React.FC<AccessControlProps> = ({ 
  teamMembers, 
  onUpdateTeamMembers, 
  accessUsers, 
  onUpdateAccessUsers 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'team'>('accounts');
  
  return (
    <div className="space-y-8">
      <div className="p-1.5 bg-white/5 rounded-2xl inline-flex gap-2 border border-white/10">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition ${activeTab === 'accounts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <KeyRound size={16}/> Contas de Acesso
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Building size={16}/> Estrutura de Equipe
        </button>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'accounts' && (
          <AccessAccountsManager 
            accessUsers={accessUsers} 
            onUpdateAccessUsers={onUpdateAccessUsers} 
          />
        )}
        {activeTab === 'team' && (
          <TeamStructureManager 
            teamMembers={teamMembers} 
            onUpdateTeamMembers={onUpdateTeamMembers} 
          />
        )}
      </div>
    </div>
  );
};

// --- Access Accounts Tab Component ---
interface AccessAccountsManagerProps {
  accessUsers: AccessUser[];
  onUpdateAccessUsers: (users: AccessUser[]) => void;
}

const AccessAccountsManager: React.FC<AccessAccountsManagerProps> = ({ accessUsers, onUpdateAccessUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AccessUser | null>(null);

  const handleSave = (userToSave: AccessUser) => {
    const isEditing = accessUsers.some(u => u.id === userToSave.id);
    const updatedUsers = isEditing
      ? accessUsers.map(u => u.id === userToSave.id ? userToSave : u)
      : [...accessUsers, userToSave];
    onUpdateAccessUsers(updatedUsers);
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleDelete = (userId: string) => {
    if (confirm("Tem certeza que deseja remover o acesso deste usuário?")) {
      onUpdateAccessUsers(accessUsers.filter(u => u.id !== userId));
    }
  }

  return (
    <>
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
        <header className="p-8 flex justify-between items-center bg-white/5 border-b border-white/10">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gestão de Usuários</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de login, permissões e status das contas.</p>
          </div>
          <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            <UserPlus size={16}/> Nova Conta
          </button>
        </header>

        <div className="p-4 divide-y divide-white/10">
          {accessUsers.map(user => (
            <div key={user.id} className="p-4 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-black text-lg text-white">
                  {user.name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    {user.name}
                    {user.role === 'admin' && <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[8px] font-black uppercase">Admin</span>}
                  </h4>
                  <span className="text-xs text-slate-400">{user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><Edit size={16}/></button>
                   <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && <AccessUserModal user={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
    </>
  );
};

// --- Team Structure Tab Component ---
const TeamStructureManager: React.FC<Omit<AccessControlProps, 'accessUsers' | 'onUpdateAccessUsers'>> = ({ teamMembers, onUpdateTeamMembers }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  const handleSaveMember = (updatedMember: TeamMember) => {
    onUpdateTeamMembers(teamMembers.map(m => m.id === updatedMember.id ? updatedMember : m));
    setIsEditModalOpen(false); setEditingMember(null);
  };
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault(); if (!newMember.name.trim() || !newMember.role.trim()) return;
    onUpdateTeamMembers([...teamMembers, { id: 'tm_' + Math.random().toString(36).substr(2, 9), ...newMember, isLeader: false }]);
    setNewMember({ name: '', role: '' });
  };
  const handleDeleteMember = (memberId: string) => {
    if (window.confirm("Remover este membro da estrutura da equipe?")) onUpdateTeamMembers(teamMembers.filter(m => m.id !== memberId));
  };
  
  return (
    <>
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
        <header className="p-8 bg-white/5 border-b border-white/10">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Estrutura de Equipe</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie os membros que podem ser atribuídos a tarefas e projetos.</p>
        </header>
        <form onSubmit={handleAddMember} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label><input value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Nome completo" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função</label><input value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} placeholder="Ex: Equipe, Líder" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <button type="submit" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"><UserPlus size={16}/> Adicionar</button>
        </form>
        <div className="p-8 border-t border-white/10 space-y-4">
          {teamMembers.map(member => (
            <div key={member.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition">
              <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${member.isLeader ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>{member.name[0]}</div><div><h4 className="text-sm font-black text-white uppercase tracking-tighter">{member.name}</h4><span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400">{member.role}</span></div></div>
              <div className="flex items-center gap-2">{member.isLeader && <span title="Permissão de Admin"><ShieldCheck size={16} className="text-amber-500"/></span>}<button onClick={() => { setEditingMember(member); setIsEditModalOpen(true); }} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><Edit size={16}/></button><button onClick={() => handleDeleteMember(member.id)} className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button></div>
            </div>
          ))}
        </div>
      </div>
      {isEditModalOpen && editingMember && <EditMemberModal member={editingMember} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveMember} />}
    </>
  );
};

// --- Modals ---
interface EditMemberModalProps { member: TeamMember; onClose: () => void; onSave: (member: TeamMember) => void; }
const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSave }) => {
  const [formData, setFormData] = useState(member);
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10"><header className="p-8 bg-slate-900/50 border-b border-white/10 flex items-center gap-4"><div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20"><Edit size={24} /></div><div><h2 className="text-xl font-black text-white uppercase tracking-tighter">Editar Membro da Equipe</h2><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Ajuste de dados da estrutura</p></div><button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition text-slate-400"><X size={20} /></button></header><div className="p-8 space-y-6"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={12}/> Nome</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Briefcase size={12}/> Função</label><input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/></div><div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3"><label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Líder de Equipe?</label><input type="checkbox" checked={formData.isLeader} onChange={e => setFormData({...formData, isLeader: e.target.checked})} className="w-5 h-5 accent-amber-500"/></div></div><footer className="p-6 bg-slate-900/50 border-t border-white/10 flex justify-end"><button onClick={() => onSave(formData)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2"><Save size={16} /> Salvar</button></footer></div>
    </div>
  );
};

interface AccessUserModalProps { user: AccessUser | null; onClose: () => void; onSave: (user: AccessUser) => void; }
const AccessUserModal: React.FC<AccessUserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<AccessUser>>(user || { name: '', email: '', role: 'user', status: 'active' });
  const handleSubmit = () => onSave({ ...formData, id: formData.id || 'au_' + Math.random().toString(36).substr(2, 9) } as AccessUser);
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10"><header className="p-8 bg-slate-900/50 border-b border-white/10 flex items-center gap-4"><div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20"><UserPlus size={24} /></div><div><h2 className="text-xl font-black text-white uppercase tracking-tighter">{user ? 'Editar Conta' : 'Nova Conta de Acesso'}</h2><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Gerenciamento de login e permissões</p></div><button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition text-slate-400"><X size={20} /></button></header><div className="p-8 space-y-6"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={12}/> Nome</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Mail size={12}/> E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><ShieldCheck size={12}/> Função</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none"><option value="user" className="bg-slate-800">User</option><option value="admin" className="bg-slate-800">Admin</option></select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none"><option value="active" className="bg-slate-800">Active</option><option value="inactive" className="bg-slate-800">Inactive</option></select></div></div></div><footer className="p-6 bg-slate-900/50 border-t border-white/10 flex justify-end"><button onClick={handleSubmit} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2"><Save size={16} /> Salvar</button></footer></div>
    </div>
  );
};

export default AccessControl;
