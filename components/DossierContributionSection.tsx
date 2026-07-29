import React, { useState, useEffect } from 'react';
import { 
  DossierContribution, 
  DossierChapterId, 
  DossierContributionType, 
  DossierContributionStatus, 
  DossierFormFields,
  DossierContributionVersion 
} from '../types';
import { DDCM_CHAPTERS } from '../constants/dossier';
import { 
  FileCheck2, 
  BookOpen, 
  FileText, 
  Paperclip, 
  FormInput, 
  Clock, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  FileEdit, 
  Save, 
  X, 
  ExternalLink, 
  Sparkles,
  User,
  MessageSquare
} from 'lucide-react';

interface DossierContributionSectionProps {
  activityId: string;
  activityName: string;
  projectId?: string;
  projectName?: string;
  macroActivityId?: string;
  macroActivityName?: string;
  generatesRegulatoryContent: boolean;
  onToggleGeneratesRegulatoryContent: (value: boolean) => void;
  contribution?: DossierContribution;
  onSaveContribution: (contribution: DossierContribution) => void;
  currentUser?: string;
}

export const DossierContributionSection: React.FC<DossierContributionSectionProps> = ({
  activityId,
  activityName,
  projectId = 'geral',
  projectName = 'Geral',
  macroActivityId,
  macroActivityName,
  generatesRegulatoryContent,
  onToggleGeneratesRegulatoryContent,
  contribution,
  onSaveContribution,
  currentUser = 'Usuário'
}) => {
  const [chapterId, setChapterId] = useState<DossierChapterId>(
    contribution?.chapterId || 'cap_1'
  );
  const [type, setType] = useState<DossierContributionType>(
    contribution?.type || 'texto'
  );
  const [content, setContent] = useState<string>(
    contribution?.content || ''
  );
  const [attachmentUrl, setAttachmentUrl] = useState<string>(
    contribution?.attachmentUrl || ''
  );
  const [attachmentName, setAttachmentName] = useState<string>(
    contribution?.attachmentName || ''
  );
  const [status, setStatus] = useState<DossierContributionStatus>(
    contribution?.status || 'Rascunho'
  );
  const [reviewNotes, setReviewNotes] = useState<string>(
    contribution?.reviewNotes || ''
  );

  const [formFields, setFormFields] = useState<DossierFormFields>(
    contribution?.formFields || {
      title: '',
      methodologySummary: '',
      keyResults: '',
      regulatoryConclusion: '',
      specifications: '',
      customNotes: ''
    }
  );

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  useEffect(() => {
    if (contribution) {
      setChapterId(contribution.chapterId || 'cap_1');
      setType(contribution.type || 'texto');
      setContent(contribution.content || '');
      setAttachmentUrl(contribution.attachmentUrl || '');
      setAttachmentName(contribution.attachmentName || '');
      setStatus(contribution.status || 'Rascunho');
      setReviewNotes(contribution.reviewNotes || '');
      setFormFields(contribution.formFields || {
        title: '',
        methodologySummary: '',
        keyResults: '',
        regulatoryConclusion: '',
        specifications: '',
        customNotes: ''
      });
    }
  }, [contribution]);

  const selectedChapterDef = DDCM_CHAPTERS.find(c => c.id === chapterId) || DDCM_CHAPTERS[0];

  const handleSave = () => {
    const now = new Date().toISOString();
    const currentVersionNum = (contribution?.version || 0) + 1;

    const newVersionRecord: DossierContributionVersion = {
      version: currentVersionNum,
      updatedAt: now,
      updatedBy: currentUser,
      type,
      content,
      attachmentUrl,
      attachmentName,
      formFields,
      status,
      reviewNotes
    };

    const existingHistory = contribution?.versionsHistory || [];
    const updatedHistory = [newVersionRecord, ...existingHistory];

    const updatedContribution: DossierContribution = {
      id: contribution?.id || `dossier_contrib_${Math.random().toString(36).substring(2, 9)}`,
      projectId,
      projectName,
      macroActivityId,
      macroActivityName,
      activityId,
      activityName,
      chapterId,
      chapterTitle: selectedChapterDef.title,
      type,
      content,
      attachmentUrl,
      attachmentName,
      formFields,
      status,
      version: currentVersionNum,
      versionsHistory: updatedHistory,
      author: contribution?.author || currentUser,
      reviewer: status !== 'Rascunho' ? currentUser : contribution?.reviewer,
      reviewNotes,
      createdAt: contribution?.createdAt || now,
      updatedAt: now
    };

    onSaveContribution(updatedContribution);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 3000);
  };

  return (
    <div className="mt-6 p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl border border-slate-700 shadow-xl space-y-5">
      {/* Header / Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
            <FileCheck2 size={22} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
              Contribuição para o Dossiê (DDCM)
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase border border-emerald-500/30">
                Regulatório Anvisa
              </span>
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              Vincule documentação técnica regulatória aos capítulos do Dossiê de Desenvolvimento Clínico de Medicamento.
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-slate-800/80 hover:bg-slate-800 p-2.5 px-4 rounded-2xl border border-slate-700 transition">
          <input
            type="checkbox"
            checked={generatesRegulatoryContent}
            onChange={(e) => onToggleGeneratesRegulatoryContent(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-600 transition cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-200">
            {generatesRegulatoryContent ? 'Gera Conteúdo Regulatório' : 'Marcar para gerar conteúdo no DDCM'}
          </span>
        </label>
      </div>

      {generatesRegulatoryContent && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Chapter Selector & Type Selector Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Capítulo Dropdown */}
            <div className="md:col-span-7 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <BookOpen size={13} /> Capítulo do DDCM
              </label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value as DossierChapterId)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {DDCM_CHAPTERS.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 italic px-1">
                {selectedChapterDef.description}
              </p>
            </div>

            {/* Tipo de Contribuição Selector */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={13} /> Formato da Contribuição
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/90 border border-slate-700 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('texto')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition ${
                    type === 'texto'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FileText size={12} /> Texto
                </button>
                <button
                  type="button"
                  onClick={() => setType('documento')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition ${
                    type === 'documento'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Paperclip size={12} /> Documento
                </button>
                <button
                  type="button"
                  onClick={() => setType('formulario')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition ${
                    type === 'formulario'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FormInput size={12} /> Formulário
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content Inputs based on selected Type */}
          {type === 'texto' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                  <FileEdit size={13} /> Texto Técnico Regulatório
                </label>
                <span className="text-[9px] text-slate-400 font-medium">
                  {content.length} caracteres | {content.split(/\s+/).filter(Boolean).length} palavras
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva ou cole aqui a redação técnica para este capítulo do dossiê (ex: metodologias, resultados, especificações ou justificativas)..."
                className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 rounded-2xl p-4 text-xs font-normal leading-relaxed min-h-[140px] focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
          )}

          {type === 'documento' && (
            <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Nome do Documento / Título do Anexo
                </label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Ex: Relatório de Validação Analítica - Lote 2026.pdf"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Link para o Arquivo (SharePoint / Google Drive / Repositório)
                </label>
                <input
                  type="text"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://sharepoint.com/documents/relatorio.pdf"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Resumo / Sumário Executivo do Documento Anexado
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Breve descrição dos principais achados do documento para contextualizar no DDCM..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-3 text-xs font-normal min-h-[80px] outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          )}

          {type === 'formulario' && (
            <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-tight">
                <FormInput size={15} /> Formulário de Submissão Técnica ({selectedChapterDef.code})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Título da Contribuição
                  </label>
                  <input
                    type="text"
                    value={formFields.title || ''}
                    onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                    placeholder="Ex: Validação do Processo de Purificação"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Especificações Técnicas
                  </label>
                  <input
                    type="text"
                    value={formFields.specifications || ''}
                    onChange={(e) => setFormFields({ ...formFields, specifications: e.target.value })}
                    placeholder="Ex: Pureza >= 98%, Endotoxinas < 0.5 EU/mL"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Resumo Metodológico / Procedimento
                </label>
                <textarea
                  value={formFields.methodologySummary || ''}
                  onChange={(e) => setFormFields({ ...formFields, methodologySummary: e.target.value })}
                  placeholder="Descreva suscintamente o método ou ensaio empregado..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs min-h-[60px] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Resultados Chave Obtidos
                </label>
                <textarea
                  value={formFields.keyResults || ''}
                  onChange={(e) => setFormFields({ ...formFields, keyResults: e.target.value })}
                  placeholder="Apresente os dados quantitativos ou qualitativos obtidos..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs min-h-[60px] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Conclusão Regulatória / Parecer
                </label>
                <textarea
                  value={formFields.regulatoryConclusion || ''}
                  onChange={(e) => setFormFields({ ...formFields, regulatoryConclusion: e.target.value })}
                  placeholder="Conclusão e conformidade com as exigências da Anvisa para o DDCM..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs min-h-[60px] outline-none"
                />
              </div>
            </div>
          )}

          {/* Status & Review Notes Bar */}
          <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <Clock size={13} /> Status da Contribuição:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DossierContributionStatus)}
                className={`p-2 px-3 rounded-xl text-xs font-black uppercase border outline-none cursor-pointer ${
                  status === 'Aprovado'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : status === 'Em Revisão'
                    ? 'bg-blue-950 text-blue-300 border-blue-600'
                    : 'bg-amber-950 text-amber-300 border-amber-600'
                }`}
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Em Revisão">Em Revisão</option>
                <option value="Aprovado">Aprovado ✅</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                Versão Atual: <strong className="text-white bg-slate-700 px-2 py-0.5 rounded-md font-mono">v{contribution?.version || 1}</strong>
              </span>

              {contribution?.versionsHistory && contribution.versionsHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1.5 transition"
                >
                  <History size={12} /> Ver Histórico ({contribution.versionsHistory.length})
                </button>
              )}
            </div>
          </div>

          {/* Notes for Reviewer / Justification */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={12} /> Observações do Revisor / Parecer Regulatório
            </label>
            <input
              type="text"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Anotações de revisão, pendências ou motivo da aprovação..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/80">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <User size={12} /> Autor: <strong className="text-slate-200">{contribution?.author || currentUser}</strong>
              {contribution?.updatedAt && (
                <span>• Atualizado em {new Date(contribution.updatedAt).toLocaleDateString('pt-BR')}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isSavedFeedback && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 size={14} /> Salvo e vinculado ao DDCM!
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer"
              >
                <Save size={15} /> Salvar Contribuição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 text-emerald-400 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">
                    Histórico de Versões da Contribuição
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activityName} • {selectedChapterDef.shortTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {contribution?.versionsHistory?.map((ver, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded-md">
                        v{ver.version}
                      </span>
                      <span className="font-bold text-slate-200">
                        {ver.updatedBy || 'Usuário'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ver.updatedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        ver.status === 'Aprovado'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : ver.status === 'Em Revisão'
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}
                    >
                      {ver.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl font-normal leading-relaxed">
                    {ver.content || (ver.formFields?.title ? `Formulário: ${ver.formFields.title}` : ver.attachmentName || 'Sem conteúdo textual')}
                  </p>

                  {ver.reviewNotes && (
                    <p className="text-[11px] text-amber-300 italic">
                      Parecer: {ver.reviewNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
