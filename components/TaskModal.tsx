
import React, { useState, useEffect } from 'react';
import { Task, TaskUpdate } from '../types';
import { PRIORITIES, STATUSES } from '../constants';
import { X, Plus, ClipboardList, Trash2, MessageCircle, Mail, Bell, Target, Activity, Flag } from 'lucide-react';

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

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, updates: initialData.updates || [] });
    }
  }, [initialData]);

  const handleAddUpdate = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newUpdateNote.trim()) return;
    const newUpdate: TaskUpdate = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split('T')[0],
      note: newUpdateNote.trim()
    };
    setFormData(prev => ({ ...prev, updates: [newUpdate, ...(prev.updates || [])] }));
    setNewUpdateNote('');
  };

  const removeUpdate = (id: string) => {
    setFormData(prev => ({ ...prev, updates: prev.updates?.filter(u => u.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: formData.id || Math.random().toString(36).substring(2, 9) } as Task);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <header className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <ClipboardList size={28} className="text-indigo-500" /> {initialData ? 'Editar Atividade' : 'Nova Atividade'}
          </h2>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Coluna 1: Informações de Contexto */}
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Informações Gerais</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Projeto</label>
                  <select 
                    value={formData.project} onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  >
                    <option value="">Selecione...</option>
                    {availableProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Atividade</label>
                  <input 
                    type="text" required value={formData.activity} onChange={(e) => setFormData({...formData, activity: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Descrição</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"></textarea>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Alertas e Protocolos</h3>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-indigo-50/30 transition">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Mail size={18} className="text-indigo-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase">Notificar Início</span>
                        <span className="text-[9px] text-slate-400">Ao salvar a atividade</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={formData.emailOnJoin} onChange={e => setFormData({...formData, emailOnJoin: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-indigo-50/30 transition">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Bell size={18} className="text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase">Alerta de Prazo</span>
                        <span className="text-[9px] text-slate-400">3 dias antes do final</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={formData.emailOnDeadline} onChange={e => setFormData({...formData, emailOnDeadline: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  </label>
                </div>
              </section>
            </div>

            {/* Coluna 2: Status, Prioridade e Progresso */}
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Controle de Execução</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase flex items-center gap-1"><Flag size={12}/> Prioridade</label>
                    <select 
                      value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase flex items-center gap-1"><Activity size={12}/> Status</label>
                    <select 
                      value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Progresso da Atividade</label>
                    <span className="text-xs font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-200">{formData.progress}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5"
                    value={formData.progress} onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-2 text-[8px] font-bold text-indigo-300 uppercase">
                    <span>Início</span>
                    <span>Concluído</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase flex items-center gap-1"><Target size={12}/> Próximo Passo Estratégico</label>
                  <input 
                    type="text" placeholder="Qual a próxima ação imediata?"
                    value={formData.nextStep} onChange={(e) => setFormData({...formData, nextStep: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Responsáveis e Prazos</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Líder</label>
                  <select value={formData.projectLead} onChange={e => setFormData({...formData, projectLead: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                    {availablePeople.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Solicitação</label>
                    <input type="date" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Conclusão Alvo</label>
                    <input type="date" value={formData.completionDate} onChange={e => setFormData({...formData, completionDate: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                  </div>
                </div>
              </section>
            </div>

            {/* Coluna 3: Histórico de Atualizações */}
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <MessageCircle size={14} className="text-indigo-500" /> Log de Atualizações
                </h3>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Adicionar nota de progresso..." 
                    value={newUpdateNote} 
                    onChange={e => setNewUpdateNote(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUpdate())} 
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <button type="button" onClick={handleAddUpdate} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg"><Plus size={18} /></button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.updates?.map(update => (
                    <div key={update.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start group">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-indigo-400 uppercase">{new Date(update.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{update.note}</p>
                      </div>
                      <button type="button" onClick={() => removeUpdate(update.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition ml-2"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {(!formData.updates || formData.updates.length === 0) && (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Nenhum registro histórico.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

          </div>
        </form>

        <footer className="px-10 py-6 bg-slate-50 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-8 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">Cancelar</button>
          <button type="button" onClick={handleSubmit} className="px-12 py-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition font-black uppercase text-[10px] tracking-widest active:scale-95">Gravar Alterações</button>
        </footer>
      </div>
    </div>
  );
};

export default TaskModal;
