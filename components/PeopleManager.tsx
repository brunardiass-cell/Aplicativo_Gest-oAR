
import React, { useState } from 'react';
import { Person } from '../types';
import { Plus, Trash2, Mail, Bell, BellOff, User, Search, Edit2, Check, X, Shield, ShieldOff, ToggleLeft, ToggleRight } from 'lucide-react';
import DeletionModal from './DeletionModal';

interface PeopleManagerProps {
  people: Person[];
  canEdit: boolean;
  onUpdate: (people: Person[]) => void;
  onAddLog: (id: string, title: string, reason: string) => void;
}

const PeopleManager: React.FC<PeopleManagerProps> = ({ people, canEdit, onUpdate, onAddLog }) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');

  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  const addPerson = () => {
    if (!newName.trim() || !newEmail.trim() || !canEdit) return;
    const newPerson: Person = {
      id: Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      email: newEmail.trim(),
      notificationsEnabled: true,
      active: true
    };
    onUpdate([...people, newPerson]);
    setNewName('');
    setNewEmail('');
  };

  const handleStartEdit = (person: Person) => {
    setEditingId(person.id);
    setEditEmail(person.email);
  };

  const handleSaveEdit = (id: string) => {
    if (!editEmail.trim()) return;
    onUpdate(people.map(p => p.id === id ? { ...p, email: editEmail.trim() } : p));
    setEditingId(null);
  };

  const toggleActive = (id: string) => {
    if (!canEdit) return;
    onUpdate(people.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const toggleNotifications = (id: string) => {
    if (!canEdit) return;
    onUpdate(people.map(p => p.id === id ? { ...p, notificationsEnabled: !p.notificationsEnabled } : p));
  };

  const handleConfirmDeletion = (reason: string) => {
    if (!personToDelete || !canEdit) return;
    onAddLog(personToDelete.id, `INTEGRANTE: ${personToDelete.name}`, reason);
    onUpdate(people.filter(p => p.id !== personToDelete.id));
    setPersonToDelete(null);
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
              <div key={person.id} className={`flex flex-col p-5 bg-white border rounded-2xl group transition shadow-sm ${!person.active ? 'opacity-60 bg-slate-50' : 'hover:border-indigo-500/30 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${person.active ? 'bg-slate-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight flex items-center gap-2">
                        {person.name}
                        {!person.active && <span className="text-[8px] px-1.5 bg-slate-200 text-slate-500 rounded uppercase font-bold">Inativo</span>}
                      </h4>
                      {editingId === person.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="email" 
                            value={editEmail} 
                            onChange={e => setEditEmail(e.target.value)}
                            className="text-xs px-2 py-1 border border-indigo-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(person.id)} className="text-emerald-500 hover:text-emerald-600"><Check size={16}/></button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600"><X size={16}/></button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Mail size={12}/> {person.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => handleStartEdit(person)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Editar Email"
                        >
                          <Edit2 size={16}/>
                        </button>
                        <button 
                          onClick={() => setPersonToDelete(person)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleActive(person.id)}
                      disabled={!canEdit}
                      className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition ${person.active ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {person.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {person.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <button 
                    onClick={() => toggleNotifications(person.id)}
                    disabled={!canEdit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-[10px] font-black uppercase tracking-widest border ${person.notificationsEnabled ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                    title={person.notificationsEnabled ? "Notificações Ativas" : "Notificações Desligadas"}
                  >
                    {person.notificationsEnabled ? <Bell size={14}/> : <BellOff size={14}/>}
                    {person.notificationsEnabled ? "Notificações On" : "Off"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {personToDelete && (
        <DeletionModal 
          taskName={personToDelete.name} 
          onClose={() => setPersonToDelete(null)} 
          onConfirm={handleConfirmDeletion} 
        />
      )}
    </div>
  );
};

export default PeopleManager;
