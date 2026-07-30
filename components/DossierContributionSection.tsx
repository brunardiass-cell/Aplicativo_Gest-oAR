import React from 'react';
import { DossierContribution } from '../types';
import { ShieldCheck, Info } from 'lucide-react';

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
  onSaveContribution?: (contribution: DossierContribution) => void;
  currentUser?: string;
  customChapters?: any[];
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
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    onToggleGeneratesRegulatoryContent(isChecked);
    
    if (isChecked && onSaveContribution) {
      const minimalContribution: DossierContribution = contribution || {
        id: `contrib_${activityId}_${Date.now()}`,
        projectId: projectId,
        projectName: projectName,
        macroActivityId: macroActivityId,
        macroActivityName: macroActivityName,
        activityId: activityId,
        activityName: activityName,
        chapterId: 'cap_1',
        chapterTitle: 'Informações Gerais',
        type: 'texto',
        content: '',
        status: 'Rascunho',
        version: 1,
        author: currentUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSaveContribution(minimalContribution);
    }
  };

  return (
    <div className="p-5 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 border border-teal-200/80 rounded-2xl transition-all">
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          id={`reg_content_${activityId}`}
          checked={generatesRegulatoryContent}
          onChange={handleToggle}
          className="w-5 h-5 mt-0.5 rounded-md text-brand-primary border-slate-300 focus:ring-brand-primary cursor-pointer accent-brand-primary"
        />
        <div className="flex-1 space-y-1">
          <label htmlFor={`reg_content_${activityId}`} className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 cursor-pointer select-none">
            <ShieldCheck size={16} className="text-brand-primary" />
            Esta atividade gera conteúdo regulatório
          </label>
          <p className="text-xs text-slate-500 font-medium">
            Ao marcar esta opção, o sistema registrará automaticamente uma contribuição pendente no <strong className="text-brand-primary font-bold">Módulo Regulatório</strong>, permitindo vincular a evidência aos documentos oficiais sem preencher textos aqui.
          </p>
        </div>
      </div>
      
      {generatesRegulatoryContent && (
        <div className="mt-3 pt-3 border-t border-teal-200/50 flex items-center gap-2 text-xs text-teal-800 font-bold bg-white/70 p-2.5 rounded-xl">
          <Info size={14} className="text-brand-primary shrink-0" />
          <span>Contribuição pendente registrada para o módulo Regulatório. O detalhamento do texto e aprovações ocorrerão no Documento Regulatório.</span>
        </div>
      )}
    </div>
  );
};
