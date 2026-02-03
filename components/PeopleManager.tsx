
import React, { useState } from 'react';
import { Person, AppUser } from '../types';
import { Plus, Trash2, Mail, User, Shield, Info } from 'lucide-react';

interface PeopleManagerProps {
  people: Person[];
  users: AppUser[];
  canEdit: boolean;
  onUpdate: (people: Person[], users: AppUser[]) => void;
  onAddLog: (id: string, title: string, reason: string) => void;
}

const PeopleManager: React.FC<PeopleManagerProps> = ({ people, users, canEdit, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const addPerson = () => {
    if (!newName.trim() || !newEmail.trim() || !canEdit) return;
    const newPerson: Person = {
      id: Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      email: newEmail.trim(),
      notificationsEnabled: true,
      active: true
    };
    onUpdate([...people, newPerson], users);
    setNewName(''); setNewEmail('');
  };

  const removePerson = (id: string) => {
    if (!canEdit) return;
    if (confirm("Deseja remover este integrante da listagem oficial?")) {
      onUpdate(people.filter(p => p.id !== id), users);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
        <header className="p-8 bg-slate-900/50 text-white flex justify-between items-center border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <User size={28} className="text-blue-500" /> Integrantes do Setor
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Listagem institucional para atribuição de tarefas</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {people.length} Membros
          </div>
        </header>

        <div className="p-8 space-y-8">
          {canEdit && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
              <input type="text" placeholder="Nome do Membro..." value={newName} onChange={e => setNewName(e.target.value)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none text-white focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email institucional..." value={newEmail} onChange={e => setNewEmail(e.target.value)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none text-white focus:ring-2 focus:ring-blue-500" />
              <button onClick={addPerson} className="py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"><Plus size={16}/> Adicionar Membro</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map(person => {
              const hasSystemAccess = users.some(u => u.username === person.name);
              return (
                <div key={person.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:shadow-md transition-shadow hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-blue-400 uppercase">
                      {person.name[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                        {person.name}
                        {hasSystemAccess && <Shield size={12} className="text-emerald-500" />}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[150px]">{person.email}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => removePerson(person.id)} className="p-2 text-slate-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex gap-4 items-center">
             <Info className="text-blue-400 shrink-0" size={20} />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               Para habilitar o login de um membro no sistema e definir sua senha, acesse a aba <span className="text-blue-400">Controle de Acesso</span> no menu lateral.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleManager;