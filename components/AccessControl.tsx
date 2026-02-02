
import React, { useState } from 'react';
import { TeamMember } from '../types';
import { ShieldCheck, UserPlus, Trash2, Edit, User, Briefcase, X, Save } from 'lucide-react';

interface AccessControlProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
}

const AccessControl: React.FC<AccessControlProps> = ({ teamMembers, onUpdateTeamMembers }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveMember = (updatedMember: TeamMember) => {
    onUpdateTeamMembers(teamMembers.map(m => m.id === updatedMember.id ? updatedMember : m));
    setIsEditModalOpen(false);
    setEditingMember(null);
  };

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

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm("Tem certeza que deseja remover este membro da equipe? Isso não afetará o login, apenas a listagem no app.")) {
      onUpdateTeamMembers(teamMembers.filter(m => m.id !== memberId));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
        <header className="p-8 bg-white/5 border-b border-white/10">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gerenciar Equipe</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adicione, edite ou remova membros que podem ser atribuídos a tarefas.</p>
        </header>

        <form onSubmit={handleAddMember} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Integrante</label>
            <input value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Nome completo" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função</label>
            <input value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} placeholder="Ex: Equipe, Líder" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <button type="submit" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            <UserPlus size={16}/> Adicionar à Equipe
          </button>
        </form>

        <div className="p-8 border-t border-white/10 space-y-4">
          {teamMembers.map(member => (
            <div key={member.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${member.isLeader ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {member.name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter">{member.name}</h4>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400">{member.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.isLeader && <span title="Permissão de Administrador"><ShieldCheck size={16} className="text-amber-500"/></span>}
                <button onClick={() => handleOpenEditModal(member)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><Edit size={16}/></button>
                <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditModalOpen && editingMember && (
        <EditMemberModal 
          member={editingMember}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveMember}
        />
      )}
    </div>
  );
};


interface EditMemberModalProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSave }) => {
  const [formData, setFormData] = useState(member);

  const handleSave = () => {
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        <header className="p-8 bg-slate-900/50 border-b border-white/10 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20"><Edit size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Editar Integrante</h2>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Ajuste de dados e permissões</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition text-slate-400"><X size={20} /></button>
        </header>
        
        <div className="p-8 space-y-6">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={12}/> Nome</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Briefcase size={12}/> Função</label>
                <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
             <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Permissão de Líder/Admin?</label>
                <input 
                  type="checkbox" 
                  checked={formData.isLeader} 
                  onChange={e => setFormData({...formData, isLeader: e.target.checked})} 
                  className="w-5 h-5 accent-amber-500"
                />
             </div>
        </div>

        <footer className="p-6 bg-slate-900/50 border-t border-white/10 flex justify-end">
          <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2">
            <Save size={16} /> Salvar Alterações
          </button>
        </footer>
      </div>
    </div>
  );
};


export default AccessControl;
