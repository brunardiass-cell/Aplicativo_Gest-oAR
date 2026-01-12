
import React, { useState, useEffect } from 'react';
import { Task, TaskUpdate } from '../types';
import { PRIORITIES, STATUSES } from '../constants';
import { X, Plus, ClipboardList, Trash2, UserPlus } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  initialData?: Task;
  availableProjects: string[];
  availablePeople: string[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialData, availableProjects, availablePeople }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    requestDate: new Date().toISOString().split('T')[0],
    project: availableProjects[0] || '',
    activity: '',
    description: '',
    projectLead: availablePeople[0] || '',
    collaborators: [],
    priority: 'Média',
    status: 'Não Iniciada',
    plannedStartDate: new Date().toISOString().split('T')[0],
    realStartDate: '',
    completionDate: '',
    progress: 0,
    nextStep: '',
    updates: [],
    emailOnJoin: true,
    emailOnDeadline: true
  });

  const [newUpdateNote, setNewUpdateNote] = useState('');
  const [customCollaborator, setCustomCollaborator] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        updates: initialData.updates || []
      });
    }
  }, [initialData]);

  const addCustomCollaborator = () => {
    if (!customCollaborator.trim()) return;
    const updated = [...(formData.collaborators || [])];
    if (!updated.includes(customCollaborator.trim())) {
      updated.push(customCollaborator.trim());
      setFormData(prev => ({ ...prev, collaborators: updated }));
    }
    setCustomCollaborator('');
  };

  const toggleCollaborator = (member: string) => {
    const current = formData.collaborators || [];
    const updated = current.includes(member) 
      ? current.filter(m => m !== member)
      : [...current, member];
    setFormData(prev => ({ ...prev, collaborators: updated }));
  };

  const handleAddUpdate = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newUpdateNote.trim()) return;

    const newUpdate: TaskUpdate = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split('T')[0],
      note: newUpdateNote.trim()
    };

    setFormData(prev => ({
      ...prev,
      updates: [newUpdate, ...(prev.updates || [])]
    }));
    setNewUpdateNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substring(2, 9),
    } as Task);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <header className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ClipboardList size={28} className="text-indigo-500" /> {initialData ? 'Editar Registro' : 'Novo Registro'}
            </h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Informações Primárias</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Projeto Mestre</label>
                  <select 
                    name="project" value={formData.project} onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  >
                    <option value="">Selecione...</option>
                    {availableProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Título da Atividade</label>
                  <input 
                    type="text" required value={formData.activity} onChange={(e) => setFormData({...formData, activity: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Descrição Completa</label>
                  <textarea 
                    rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  ></textarea>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Prazo e Notificação</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Solicitação</label>
                    <input type="date" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Prazo Final</label>
                    <input type="date" value={formData.completionDate} onChange={e => setFormData({...formData, completionDate: e.target.value})} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <input 
                    type="checkbox" checked={formData.emailOnDeadline} onChange={e => setFormData({...formData, emailOnDeadline: e.target.checked})}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <label className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Habilitar lembrete de e-mail por proximidade de prazo</label>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Equipe Responsável</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Líder da Atividade</label>
                  <select 
                    value={formData.projectLead} onChange={e => setFormData({...formData, projectLead: e.target.value})}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold"
                  >
                    {availablePeople.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Colaboradores de Apoio</label>
                   <div className="flex flex-wrap gap-1.5 mb-3">
                    {availablePeople.map(m => (
                      <button 
                        key={m} type="button" onClick={() => toggleCollaborator(m)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border transition ${formData.collaborators?.includes(m) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Status e Evolução</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="p-3 bg-slate-50 border rounded-xl text-sm font-bold"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select 
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
                    className="p-3 bg-slate-50 border rounded-xl text-sm font-bold"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-600 mb-2 uppercase tracking-widest">Próxima Ação Planejada</label>
                  <input 
                    type="text" value={formData.nextStep} onChange={(e) => setFormData({...formData, nextStep: e.target.value})}
                    className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none text-sm font-bold"
                  />
                </div>
              </section>
            </div>
          </div>
        </form>

        <footer className="px-10 py-6 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} className="px-12 py-3 bg-slate-900 text-white rounded-xl shadow-xl hover:bg-slate-800 transition font-black uppercase text-[10px] tracking-widest">Salvar Atividade</button>
        </footer>
      </div>
    </div>
  );
};

export default TaskModal;
