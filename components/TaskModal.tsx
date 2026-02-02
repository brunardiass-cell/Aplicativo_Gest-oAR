
import React, { useState, useEffect } from 'react';
import { Task, Priority, Status, TaskNote, ReportStage, TeamMember } from '../types';
import { X, Calendar, Users, Info, MessageSquare, ClipboardList, PlusCircle, FileText, UserCheck, Link } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  projects: string[];
  initialData?: Task | null;
  teamMembers: TeamMember[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, projects, initialData, teamMembers }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    activity: '',
    project: projects[0] || 'Geral',
    description: '',
    projectLead: teamMembers[0].name,
    collaborators: [],
    priority: 'Média',
    status: 'Planejada',
    requestDate: new Date().toISOString().split('T')[0],
    plannedStartDate: new Date().toISOString().split('T')[0],
    actualStartDate: '',
    completionDate: '',
    progress: 0,
    nextStep: '',
    isReport: false,
    reportStage: 'Em Elaboração',
    fileLocation: '',
    updates: []
  });

  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        activity: '',
        project: projects[0] || 'Geral',
        description: '',
        projectLead: teamMembers[0].name,
        collaborators: [],
        priority: 'Média',
        status: 'Planejada',
        requestDate: new Date().toISOString().split('T')[0],
        plannedStartDate: new Date().toISOString().split('T')[0],
        actualStartDate: '',
        completionDate: '',
        progress: 0,
        nextStep: '',
        isReport: false,
        reportStage: 'Em Elaboração',
        fileLocation: '',
        updates: []
      });
    }
  }, [initialData, isOpen, teamMembers, projects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskToSave: Task = {
      ...(formData as Task),
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updates: formData.updates || []
    };
    onSave(taskToSave);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const newNote: TaskNote = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      user: 'Usuário',
      note: note.trim()
    };
    setFormData({ ...formData, updates: [...(formData.updates || []), newNote] });
    setNote('');
  };

  const toggleCollaborator = (name: string) => {
    const current = formData.collaborators || [];
    if (current.includes(name)) {
      setFormData({ ...formData, collaborators: current.filter(c => c !== name) });
    } else {
      setFormData({ ...formData, collaborators: [...current, name] });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col text-white">
        <header className="bg-slate-900/50 px-10 py-8 flex justify-between items-center shrink-0 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {initialData ? 'Editar Atividade' : 'Nova Atividade Setorial'}
            </h2>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Garantindo a integridade dos dados regulatórios</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><ClipboardList size={14}/> Dados Básicos</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atividade / Documento</label>
                <input required value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Projeto Relacionado</label>
                <select value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none appearance-none">
                  {projects.map(p => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><Users size={14}/> Atribuição</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Líder do Processo</label>
                <select value={formData.projectLead} onChange={e => setFormData({...formData, projectLead: e.target.value})} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none appearance-none">
                  {teamMembers.map(m => <option key={m.id} value={m.name} className="bg-slate-800">{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipe de Apoio</label>
                <div className="flex flex-wrap gap-2 p-2 border border-white/10 rounded-2xl min-h-[100px]">
                  {teamMembers.map(m => (
                    <button type="button" key={m.id} onClick={() => toggleCollaborator(m.name)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition ${formData.collaborators?.includes(m.name) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'}`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Prioridade</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none appearance-none">
                  <option value="Baixa" className="bg-slate-800">Baixa</option>
                  <option value="Média" className="bg-slate-800">Média</option>
                  <option value="Alta" className="bg-slate-800">Alta</option>
                  <option value="Urgente" className="bg-slate-800">Urgente</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><Calendar size={14}/> Controle de Prazos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Solicitação</label>
                  <input type="date" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white outline-none [color-scheme:dark]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Prometida</label>
                  <input type="date" value={formData.completionDate} onChange={e => setFormData({...formData, completionDate: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1 pt-4">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">% de Progresso</label>
                    <span className="text-sm font-black text-blue-300">{formData.progress}%</span>
                 </div>
                 <input type="range" min="0" max="100" step="5" value={formData.progress} onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Atual</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none appearance-none">
                  <option value="Planejada" className="bg-slate-800">Planejada</option>
                  <option value="Em Andamento" className="bg-slate-800">Em Andamento</option>
                  <option value="Concluída" className="bg-slate-800">Concluída</option>
                  <option value="Bloqueada" className="bg-slate-800">Bloqueada</option>
                  <option value="Não Aplicável" className="bg-slate-800">Não Aplicável</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-950/20 p-8 rounded-[3rem] border border-blue-500/10 space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${formData.isReport ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'}`}>
                    <FileText size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">Fluxo de Relatório</h4>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ativar controle de revisão e assinatura</p>
                  </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer scale-125">
                  <input type="checkbox" checked={formData.isReport} onChange={e => setFormData({...formData, isReport: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
               </label>
            </div>

            {formData.isReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Etapa do Relatório</label>
                  <select 
                    value={formData.reportStage} 
                    onChange={e => setFormData({...formData, reportStage: e.target.value as ReportStage})}
                    className="w-full px-6 py-4 bg-white/5 border border-blue-500/20 rounded-2xl text-sm font-black text-white outline-none shadow-sm appearance-none"
                  >
                    <option value="Em Elaboração" className="bg-slate-800">Em Elaboração</option>
                    <option value="Próximo Revisor" className="bg-slate-800">Revisão (Próximo Revisor)</option>
                    <option value="Revisão Colaboradores" className="bg-slate-800">Revisão Colaboradores</option>
                    <option value="Revisão Comitê Gestor" className="bg-slate-800">Revisão Comitê Gestor</option>
                    <option value="Concluído" className="bg-slate-800">Concluído</option>
                    <option value="Concluído e Assinado" className="bg-slate-800">Concluído e Assinado</option>
                  </select>
                </div>
                {formData.reportStage === 'Próximo Revisor' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14}/> Selecionar Revisor</label>
                    <select 
                      value={formData.currentReviewer} 
                      onChange={e => setFormData({...formData, currentReviewer: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-amber-500/20 rounded-2xl text-sm font-black text-amber-400 outline-none shadow-sm appearance-none"
                    >
                      <option value="" className="bg-slate-800">Selecione um revisor...</option>
                      {teamMembers.map(m => <option key={m.id} value={m.name} className="bg-slate-800">{m.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Link size={14}/> Localização do Arquivo (Link)</label>
                  <input
                    type="text"
                    value={formData.fileLocation}
                    onChange={e => setFormData({...formData, fileLocation: e.target.value})}
                    placeholder="Cole o link do SharePoint, Drive, etc."
                    className="w-full px-6 py-4 bg-white/5 border border-blue-500/20 rounded-2xl text-sm font-bold text-white outline-none shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-white/10">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><MessageSquare size={14}/> Notas de Atualização</h3>
                <div className="flex gap-2">
                   <input value={note} onChange={e => setNote(e.target.value)} placeholder="Adicionar nota ao histórico..." className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none" />
                   <button type="button" onClick={addNote} className="px-6 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"><PlusCircle size={24}/></button>
                </div>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-4 custom-scrollbar">
                   {formData.updates?.map(u => (
                     <div key={u.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex justify-between mb-1">
                           <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{u.user}</span>
                           <span className="text-[8px] font-bold text-slate-400">{new Date(u.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-300">{u.note}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><Info size={14}/> Próximo Passo Estratégico</h3>
                <textarea rows={6} value={formData.nextStep} onChange={e => setFormData({...formData, nextStep: e.target.value})} placeholder="Defina a próxima ação necessária..." className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
             </div>
          </div>
        </form>

        <footer className="px-10 py-8 bg-slate-900/50 border-t border-white/10 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 rounded-2xl">Cancelar</button>
          <button onClick={handleSubmit} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition active:scale-95">
            {initialData ? 'Atualizar Atividade' : 'Publicar Atividade'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TaskModal;
