
import React from 'react';
import { Project, RegulatoryChecklistItem, TeamMember } from '../types';
import { X, CheckCircle2, Circle, Download, Save, ClipboardCheck } from 'lucide-react';

interface RegulatoryChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (project: Project) => void;
  currentUser: TeamMember | null;
}

const RegulatoryChecklistModal: React.FC<RegulatoryChecklistModalProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onUpdateProject,
  currentUser
}) => {
  if (!isOpen) return null;

  const checklist = project.regulatoryChecklist || [];

  const handleToggleItem = (itemId: string) => {
    const updatedChecklist = checklist.map(item => {
      if (item.id === itemId) {
        const isCompleting = !item.completed;
        return {
          ...item,
          completed: isCompleting,
          completedAt: isCompleting ? new Date().toISOString() : undefined,
          completedBy: isCompleting ? (currentUser?.name || 'Sistema') : undefined
        };
      }
      return item;
    });
    onUpdateProject({ ...project, regulatoryChecklist: updatedChecklist });
  };

  const handleDownload = () => {
    const content = `Checklist Regulatório - ${project.name}\n` +
      `Data de Exportação: ${new Date().toLocaleDateString()}\n\n` +
      checklist.map(item => 
        `[${item.completed ? 'X' : ' '}] ${item.item}${item.completed ? ` (Finalizado em ${new Date(item.completedAt!).toLocaleDateString()} por ${item.completedBy})` : ''}`
      ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Checklist_Regulatorio_${project.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <header className="p-6 sm:p-8 bg-brand-primary border-b border-brand-primary/10 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl text-white shadow-lg">
            <ClipboardCheck size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">Checklist Regulatório</h2>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{project.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
          {checklist.length > 0 ? (
            checklist.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleToggleItem(item.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition cursor-pointer group ${
                  item.completed 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-white border-slate-100 hover:border-brand-primary/30 hover:bg-slate-50'
                }`}
              >
                <div className={`mt-0.5 transition-colors ${item.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-brand-primary'}`}>
                  {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold transition-all ${item.completed ? 'text-emerald-900 line-through opacity-60' : 'text-slate-700'}`}>
                    {item.item}
                  </p>
                  {item.completed && (
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                      Finalizado por {item.completedBy} em {new Date(item.completedAt!).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
              <ClipboardCheck size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">
                Nenhum item regulatório definido para este plano.
              </p>
              <p className="text-[10px] text-slate-400 mt-2">
                Configure o checklist no template do projeto em "Gerenciar Planos".
              </p>
            </div>
          )}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {checklist.filter(i => i.completed).length} de {checklist.length} itens concluídos
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleDownload}
              disabled={checklist.length === 0}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14}/> Baixar
            </button>
            <button 
              onClick={onClose} 
              className="px-8 py-2.5 bg-brand-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-primary/20 hover:bg-brand-accent transition flex items-center gap-2"
            >
              <Save size={14}/> Concluído
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RegulatoryChecklistModal;
