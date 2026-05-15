
import React, { useState } from 'react';
import { Project, TeamMember, AppUser } from '../types';
import { X, UserPlus, Shield, User } from 'lucide-react';

interface ProjectSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (project: Project) => void;
  teamMembers: TeamMember[];
  appUsers: AppUser[];
}

const ProjectSharingModal: React.FC<ProjectSharingModalProps> = ({ isOpen, onClose, project, onUpdateProject, teamMembers, appUsers }) => {
  const [selectedUser, setSelectedUser] = useState('');

  if (!isOpen) return null;

  const sharedWith = project.sharedWith || [];

  const handleAddUser = () => {
    if (selectedUser && !sharedWith.includes(selectedUser)) {
      onUpdateProject({
        ...project,
        sharedWith: [...sharedWith, selectedUser]
      });
      setSelectedUser('');
    }
  };

  const handleRemoveUser = (userName: string) => {
    onUpdateProject({
      ...project,
      sharedWith: sharedWith.filter(u => u !== userName)
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-primary rounded-xl text-white shadow-lg"><UserPlus size={20}/></div>
             <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Compartilhar Projeto</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Shield size={14}/> Autorizar Acesso
            </label>
            <div className="flex gap-2">
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
              >
                <option value="">Selecione um usuário...</option>
                {teamMembers.filter(m => m.name !== project.responsible).map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAddUser}
                disabled={!selectedUser}
                className="px-4 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoas com Acesso</p>
             <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                            {project.responsible?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-black text-teal-900 uppercase tracking-tight">{project.responsible}</p>
                            <p className="text-[8px] font-bold text-teal-600 uppercase">Responsável (Proprietário)</p>
                        </div>
                    </div>
                </div>

                {sharedWith.map(userName => (
                    <div key={userName} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-black shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                {userName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{userName}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Acesso Compartilhado</p>
                            </div>
                        </div>
                        <button onClick={() => handleRemoveUser(userName)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                            <X size={14}/>
                        </button>
                    </div>
                ))}
             </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
             <Shield size={20} className="text-amber-600 shrink-0" />
             <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                <span className="font-black uppercase block mb-1">Nota de Permissão:</span>
                Usuários compartilhados podem visualizar todo o projeto, mas só podem alterar campos de microatividades das quais são responsáveis diretos.
             </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition active:scale-95">Concluir</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSharingModal;
