import React from 'react';
import { X, ExternalLink, FileText, MessageSquare, Paperclip, ShieldCheck, CheckCircle2, Clock, Info } from 'lucide-react';
import { Task, MicroActivity } from '../types';

interface EvidenceDetailModalProps {
  item: Task | MicroActivity | any;
  onClose: () => void;
  onSaveEvidence?: (updated: { link?: string; obs?: string; hasEvidence?: boolean }) => void;
  isEditable?: boolean;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({
  item,
  onClose,
  onSaveEvidence,
  isEditable = false
}) => {
  const activityName = item.activity || item.name || 'Atividade';
  const projectName = item.project || item.projectName || 'Geral';
  const link = item.fileLocation || item.reportLink || item.evidenceLink || '';
  const obs = item.description || item.observations || item.evidenceObs || '';
  
  // Evidence status computation rule:
  // 🟢 Registrada if (link OR obs) exists and is non-empty
  // 🟡 Pendente if requested/flagged but link & obs are missing
  // Sem evidência if not requested
  const hasLinkOrObs = Boolean((link && link.trim().length > 0) || (obs && obs.trim().length > 0));
  const isFlagged = item.generatesRegulatoryContent || item.hasEvidence || item.useInRegulatoryDoc;

  const [editLink, setEditLink] = React.useState(link);
  const [editObs, setEditObs] = React.useState(obs);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = () => {
    if (onSaveEvidence) {
      onSaveEvidence({
        link: editLink,
        obs: editObs,
        hasEvidence: Boolean((editLink && editLink.trim()) || (editObs && editObs.trim()))
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-start relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-brand-primary/30 border border-brand-primary/50 text-teal-300 rounded-full text-[9px] font-black uppercase tracking-widest">
                {projectName}
              </span>
              {hasLinkOrObs ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 size={10} /> 🟢 Evidência Registrada
                </span>
              ) : isFlagged ? (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} /> 🟡 Evidência Pendente
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  Sem Evidência
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-snug">
              Detalhes da Evidência
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1">{activityName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            hasLinkOrObs ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <Info size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">
              {hasLinkOrObs ? (
                <span><strong>Evidência Válida:</strong> Registrada com sucesso. Contém suporte documental e/ou descrição técnica.</span>
              ) : (
                <span><strong>Evidência Pendente:</strong> Para validar esta evidência, adicione um link de documento ou insira uma observação técnica.</span>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-5">
              {/* Observações */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={12} className="text-brand-primary" /> Observações Técnicas
                </span>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 leading-relaxed min-h-[70px]">
                  {obs || <span className="text-slate-400 italic">Nenhuma observação técnica cadastrada.</span>}
                </div>
              </div>

              {/* Link do Documento */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <ExternalLink size={12} className="text-brand-primary" /> Link do Documento / Relatório
                </span>
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-teal-50/60 border border-teal-200 rounded-2xl text-xs font-bold text-brand-primary hover:bg-teal-100/60 transition group"
                  >
                    <span className="truncate max-w-[80%]">{link}</span>
                    <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-brand-primary group-hover:underline">
                      Acessar <ExternalLink size={12} />
                    </span>
                  </a>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-400 italic">
                    Nenhum link fornecido.
                  </div>
                )}
              </div>

              {/* Arquivos Futuros e Anexos */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Paperclip size={12} className="text-brand-primary" /> Arquivos Futuros e Anexos
                </span>
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 font-medium">
                  <p className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    Armazenamento integrado via repositório de documentos do projeto (SharePoint / Cloud Storage).
                  </p>
                </div>
              </div>

              {/* Utilização em Documento Regulatório */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Uso Regulatório</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Utilizada em Documento Regulatório?</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isFlagged ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isFlagged ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações Técnicas</label>
                <textarea
                  rows={4}
                  value={editObs}
                  onChange={e => setEditObs(e.target.value)}
                  placeholder="Descreva a evidência produzida nesta atividade..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link do Documento / Evidência</label>
                <input
                  type="text"
                  value={editLink}
                  onChange={e => setEditLink(e.target.value)}
                  placeholder="https://sharepoint.com/... ou link do arquivo"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {isEditable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition"
            >
              Editar Evidência
            </button>
          )}

          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition"
            >
              Cancelar Edição
            </button>
          )}

          <div className="ml-auto flex gap-2">
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-brand-accent transition"
              >
                Salvar Alterações
              </button>
            )}
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
