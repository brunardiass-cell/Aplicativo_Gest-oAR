
import React, { useState } from 'react';
import { TeamMember, AppUser } from '../types';
import { UserPlus, Trash2, KeyRound, Crown, ShieldOff, ShieldCheck, Users2, UserCog, PlusCircle } from 'lucide-react';
import PasswordSetModal from './PasswordSetModal';

// --- PROPS INTERFACE ---
interface AccessControlProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  appUsers: AppUser[];
  onUpdateAppUsers: (users: AppUser[]) => void;
}

// --- TAB BUTTON COMPONENT ---
const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
      active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
    }`}
  >
    {icon}
    {label}
  </button>
);

// --- USER ACCOUNTS COMPONENT ---
const UserAccounts = ({ users }: { users: AppUser[] }) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <header className="p-8 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-3">
            <UserCog size={20} className="text-slate-600" />
            Gestão de Usuários
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Controle de login, permissões e status das contas.
          </p>
        </div>
        <button className="px-5 py-3 bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition shadow-lg flex items-center gap-2">
          <UserPlus size={16} /> Nova Conta
        </button>
      </header>
      <div className="p-4 divide-y divide-slate-100">
        {users.map(user => (
          <div key={user.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                {getInitials(user.username)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 uppercase text-sm">{user.username}</h4>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-500 text-white">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{user.email.toLowerCase()}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
              {user.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
         {users.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhuma conta de acesso criada.</div>
         )}
      </div>
    </div>
  );
};


// --- TEAM STRUCTURE COMPONENT (Existing Logic) ---
const TeamStructure: React.FC<Pick<AccessControlProps, 'teamMembers' | 'onUpdateTeamMembers'>> = ({ teamMembers, onUpdateTeamMembers }) => {
    const [newMember, setNewMember] = useState({ name: '', role: '' });
    const [isPasswordSetModalOpen, setIsPasswordSetModalOpen] = useState(false);
    const [memberToSetPassword, setMemberToSetPassword] = useState<TeamMember | null>(null);

    const handleSetPassword = (memberId: string, password: string) => {
        onUpdateTeamMembers(teamMembers.map(m => m.id === memberId ? { ...m, password } : m));
        setIsPasswordSetModalOpen(false);
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
    
    const handleDeleteMember = (id: string) => {
        const member = teamMembers.find(m => m.id === id);
        if (confirm(`Remover "${member?.name}" da estrutura oficial?`)) {
          onUpdateTeamMembers(teamMembers.filter(m => m.id !== id));
        }
    };
    
    const handleToggleLeader = (memberId: string) => {
        const targetMember = teamMembers.find(m => m.id === memberId);
        if (!targetMember) return;

        const leaderCount = teamMembers.filter(m => m.isLeader).length;
        if (targetMember.isLeader && leaderCount <= 1) {
            alert('Não é possível remover o último administrador do sistema.');
            return;
        }

        onUpdateTeamMembers(
            teamMembers.map(m => 
            m.id === memberId ? { ...m, isLeader: !m.isLeader } : m
            )
        );
    };


    return (
        <>
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <header className="p-8 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-3">
                    Estrutura de Equipe
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Integrantes para atribuição de tarefas e senhas de acesso restrito.</p>
            </header>
            <form onSubmit={handleAddMember} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50/50 border-b border-slate-100">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Integrante</label>
                    <input required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Nome completo" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-teal-600"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Função / Cargo</label>
                    <input required value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} placeholder="Ex: Gestor de Projetos, Biólogo" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-teal-600"/>
                </div>
                <button type="submit" className="px-6 py-3.5 bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition shadow-lg flex items-center justify-center gap-2">
                    <UserPlus size={16}/> Criar Perfil
                </button>
            </form>
            <div className="p-8 space-y-4">
            {teamMembers.map(member => (
              <div key={member.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-teal-100 transition shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${member.isLeader ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-600'}`}>
                    {member.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{member.name}</h4>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${member.isLeader ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{member.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleToggleLeader(member.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title={member.isLeader ? "Rebaixar para Membro" : "Promover para Admin"}>
                      {member.isLeader ? <ShieldOff size={16}/> : <Crown size={16}/>}
                   </button>
                   <button onClick={() => {setMemberToSetPassword(member); setIsPasswordSetModalOpen(true);}} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Definir Senha">
                     <KeyRound size={16}/>
                   </button>
                  <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remover da Equipe">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhum membro na estrutura da equipe.</div>
            )}
            </div>
        </div>
        {isPasswordSetModalOpen && memberToSetPassword && (
            <PasswordSetModal
            isOpen={isPasswordSetModalOpen}
            onClose={() => setIsPasswordSetModalOpen(false)}
            onSetPassword={(password) => handleSetPassword(memberToSetPassword.id, password)}
            userName={memberToSetPassword.name}
            />
        )}
        </>
    );
};


// --- MAIN ACCESS CONTROL COMPONENT ---
const AccessControl: React.FC<AccessControlProps> = ({ teamMembers, onUpdateTeamMembers, appUsers, onUpdateAppUsers }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'team'>('accounts');

  return (
    <div className="space-y-8">
      {/* Tab Buttons */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-md">
        <TabButton
          active={activeTab === 'accounts'}
          onClick={() => setActiveTab('accounts')}
          icon={<ShieldCheck size={16} />}
          label="Contas de Acesso"
        />
        <TabButton
          active={activeTab === 'team'}
          onClick={() => setActiveTab('team')}
          icon={<Users2 size={16} />}
          label="Estrutura de Equipe"
        />
      </div>

      {/* Conditional Content */}
      {activeTab === 'accounts' && <UserAccounts users={appUsers} />}
      {activeTab === 'team' && <TeamStructure teamMembers={teamMembers} onUpdateTeamMembers={onUpdateTeamMembers} />}
    </div>
  );
};

export default AccessControl;
