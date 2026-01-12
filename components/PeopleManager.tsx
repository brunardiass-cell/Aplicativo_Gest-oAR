
import React, { useState } from 'react';
import { Person } from '../types';
import { Plus, Trash2, Mail, Bell, BellOff, User, Search } from 'lucide-react';

interface PeopleManagerProps {
  people: Person[];
  canEdit: boolean;
  onUpdate: (people: Person[]) => void;
}

const PeopleManager: React.FC<PeopleManagerProps> = ({ people, canEdit, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const addPerson = () => {
    if (!newName.trim() || !newEmail.trim() || !canEdit) return;
    const newPerson: Person = {
      id: Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      email: newEmail.trim(),
      notificationsEnabled: true
    };
    onUpdate([...people, newPerson]);
    setNewName('');
    setNewEmail('');
  };

  const removePerson = (id: string) => {
    if (!canEdit) return;
    if (confirm('Remover este membro da equipe?')) {
      onUpdate(people.filter(p => p.id !== id));
    }
  };

  const toggleNotifications = (id: string) => {
    if (!canEdit) return;
    onUpdate(people.map(p => p.id === id ? { ...p, notificationsEnabled: !p.notificationsEnabled } : p));
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <User size={28} className="text-indigo-500" /> Gestão da Equipe
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Controle de acessos e notificações de prazos</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {canEdit && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" placeholder="Ex: Maria Silva" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
                <input 
                  type="email" placeholder="email@empresa.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={addPerson}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Plus size={18} /> Adicionar Membro
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {people.map(person => (
              <div key={person.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl group hover:border-indigo-500/30 transition shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{person.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Mail size={12}/> {person.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleNotifications(person.id)}
                    disabled={!canEdit}
                    className={`p-2.5 rounded-xl transition flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border ${person.notificationsEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'} ${!canEdit ? 'cursor-default' : ''}`}
                    title={person.notificationsEnabled ? "Notificações Ativas" : "Notificações Desligadas"}
                  >
                    {person.notificationsEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
                    {person.notificationsEnabled ? "ON" : "OFF"}
                  </button>
                  {canEdit && (
                    <button onClick={() => removePerson(person.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleManager;
