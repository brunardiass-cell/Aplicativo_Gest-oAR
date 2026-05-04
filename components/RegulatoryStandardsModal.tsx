
import React from 'react';
import { RegulatoryStandard } from '../types';
import { 
  ShieldCheck, 
  X, 
  FileText, 
  BookOpen, 
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface RegulatoryStandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  standards: RegulatoryStandard[];
}

const RegulatoryStandardsModal: React.FC<RegulatoryStandardsModalProps> = ({
  isOpen,
  onClose,
  activityName,
  standards
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vigente': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'vigente com alteração': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Alterador': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'À Entrar em Vigor': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'obsoleto': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 uppercase tracking-tight leading-tight">Normas Aplicáveis</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activityName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {standards.length > 0 ? (
            standards.map(standard => (
              <div key={standard.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(standard.status)}`}>
                        {standard.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Versão {standard.version}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{standard.name}</h3>
                    <p className="text-brand-primary text-[10px] font-bold uppercase tracking-wider">{standard.theme}</p>
                    
                    {standard.appliesTo && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Se aplica a:</span>
                        <span className="text-[10px] font-bold text-slate-700">{standard.appliesTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  {standard.summary}
                </p>

                {standard.keywords && standard.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {standard.keywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-tight">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  {standard.documentLink && (
                    <a 
                      href={standard.documentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-500 hover:text-brand-primary text-[10px] font-bold uppercase tracking-tight transition"
                    >
                      <FileText size={14} /> Documento <ExternalLink size={10} />
                    </a>
                  )}
                  {standard.notebookLMLink && (
                    <a 
                      href={standard.notebookLMLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-[10px] font-bold uppercase tracking-tight transition"
                    >
                      <BookOpen size={14} /> NotebookLM <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ShieldCheck size={24} />
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Nenhuma norma vinculada a esta atividade.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryStandardsModal;
