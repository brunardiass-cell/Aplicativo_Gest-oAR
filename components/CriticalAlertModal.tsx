import React, { useState, useEffect, useMemo } from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, ShieldCheck, Mail, Calendar, User, Clock, Trash2, Send } from 'lucide-react';
import { TeamMember, AppUser } from '../types';
import { calculateAlertDate, validateEmail } from '../services/emailService';

interface CriticalAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityTitle: string;
  projectName?: string;
  dueDate?: string;
  isCritical?: boolean;
  initialLeadDays?: number;
  initialRecipientEmail?: string;
  initialRecipientName?: string;
  alertScheduledFor?: string;
  alertSentAt?: string;
  alertStatus?: 'agendado' | 'enviado' | 'cancelado' | 'erro';
  alertError?: string;
  teamMembers?: TeamMember[];
  appUsers?: AppUser[];
  onSave: (config: {
    isCritical: boolean;
    leadDays: number;
    recipientEmail: string;
    recipientName: string;
  }) => void;
  onRemoveCritical?: () => void;
}

export const CriticalAlertModal: React.FC<CriticalAlertModalProps> = ({
  isOpen,
  onClose,
  activityTitle,
  projectName = 'Projeto CTVacinas',
  dueDate = '',
  isCritical = false,
  initialLeadDays = 2,
  initialRecipientEmail = '',
  initialRecipientName = '',
  alertScheduledFor,
  alertSentAt,
  alertStatus = 'agendado',
  alertError,
  teamMembers = [],
  appUsers = [],
  onSave,
  onRemoveCritical
}) => {
  const [leadOption, setLeadOption] = useState<'1' | '2' | '7' | 'custom'>(() => {
    if (initialLeadDays === 1) return '1';
    if (initialLeadDays === 2) return '2';
    if (initialLeadDays === 7) return '7';
    return initialLeadDays ? 'custom' : '2';
  });

  const [customDays, setCustomDays] = useState<number>(() => {
    return (initialLeadDays && ![1, 2, 7].includes(initialLeadDays)) ? initialLeadDays : 3;
  });

  // Lista de pessoas do módulo Regulatório ou administradoras
  const regulatoryCandidates = useMemo(() => {
    const list: Array<{ name: string; email: string; role: string }> = [];
    const seenEmails = new Set<string>();

    // 1. AppUsers com papel admin ou da regulatória
    appUsers.forEach(u => {
      if (u.email && !seenEmails.has(u.email.toLowerCase())) {
        seenEmails.add(u.email.toLowerCase());
        list.push({
          name: u.username,
          email: u.email,
          role: u.role === 'admin' ? 'Administradora / Regulatória' : 'Equipe Regulatória'
        });
      }
    });

    // 2. TeamMembers
    teamMembers.forEach(m => {
      const email = (m as any).email || (m.name.toLowerCase().includes('bruna') ? 'brunadias@ctvacinas.org' : `${m.name.toLowerCase().replace(/\s+/g, '')}@ctvacinas.org`);
      if (email && !seenEmails.has(email.toLowerCase())) {
        seenEmails.add(email.toLowerCase());
        list.push({
          name: m.name,
          email,
          role: m.isLeader ? 'Líder Regulatória' : 'Membro da Equipe'
        });
      }
    });

    // Fallbacks padrão do CTVacinas se lista vazia
    if (!seenEmails.has('brunadias@ctvacinas.org')) {
      list.unshift({
        name: 'Bruna Dias',
        email: 'brunadias@ctvacinas.org',
        role: 'Gestão Regulatória (Lead)'
      });
    }

    if (!seenEmails.has('graziellarivelli@ctvacinas.org')) {
      list.push({
        name: 'Graziella Rivelli',
        email: 'graziellarivelli@ctvacinas.org',
        role: 'Administradora'
      });
    }

    return list;
  }, [appUsers, teamMembers]);

  // Responsável regulatório selecionado
  const [selectedRecipientEmail, setSelectedRecipientEmail] = useState<string>(() => {
    if (initialRecipientEmail && validateEmail(initialRecipientEmail)) {
      return initialRecipientEmail;
    }
    const defaultBruna = regulatoryCandidates.find(c => c.email === 'brunadias@ctvacinas.org');
    return defaultBruna ? defaultBruna.email : regulatoryCandidates[0]?.email || 'brunadias@ctvacinas.org';
  });

  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (initialRecipientEmail && validateEmail(initialRecipientEmail)) {
      setSelectedRecipientEmail(initialRecipientEmail);
    }
  }, [initialRecipientEmail]);

  if (!isOpen) return null;

  const currentLeadDays = leadOption === 'custom' ? Math.max(1, customDays || 1) : parseInt(leadOption, 10);
  const calculatedScheduledDate = dueDate ? calculateAlertDate(dueDate, currentLeadDays) : null;
  const hasDueDate = Boolean(dueDate && dueDate.trim());

  const handleSave = () => {
    setFormError('');

    if (!hasDueDate) {
      setFormError('Esta atividade não possui prazo definido. É obrigatório registrar uma data de entrega antes de ativar o alerta crítico.');
      return;
    }

    if (!selectedRecipientEmail || !validateEmail(selectedRecipientEmail)) {
      setFormError('Selecione uma pessoa responsável válida com endereço de e-mail cadastrado no sistema.');
      return;
    }

    const recipientObj = regulatoryCandidates.find(c => c.email.toLowerCase() === selectedRecipientEmail.toLowerCase());
    const recipientName = recipientObj?.name || initialRecipientName || 'Responsável Regulatória';

    onSave({
      isCritical: true,
      leadDays: currentLeadDays,
      recipientEmail: selectedRecipientEmail,
      recipientName
    });

    onClose();
  };

  const handleRemove = () => {
    if (onRemoveCritical) {
      onRemoveCritical();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4">
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Gestão Regulatória
                </span>
                {isCritical && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    Atividade Crítica Ativa
                  </span>
                )}
              </div>
              <h2 className="text-base font-black tracking-tight mt-0.5">
                Configurar Atividade Crítica & Alertas por E-mail
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Activity Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Atividade Selecionada
            </span>
            <p className="text-sm font-black text-slate-900 leading-snug">
              {activityTitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck size={13} className="text-blue-600" /> Projeto: <strong>{projectName}</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Calendar size={13} className={hasDueDate ? 'text-emerald-600' : 'text-rose-500'} /> Prazo Final: 
                <strong className={hasDueDate ? 'text-slate-900' : 'text-rose-600'}>
                  {hasDueDate ? dueDate.split('-').reverse().join('/') : 'Sem prazo definido'}
                </strong>
              </span>
            </div>
          </div>

          {/* Warning if no due date */}
          {!hasDueDate && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-rose-900">Prazo Obrigatório Não Definido</p>
                <p className="text-[11px] leading-relaxed text-rose-700">
                  Não é permitido agendar alertas de antecedência para atividades sem prazo de entrega. 
                  Por favor, feche esta tela, insira o prazo no campo correspondente da atividade e tente novamente.
                </p>
              </div>
            </div>
          )}

          {/* Configuração de Antecedência */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" />
              Quando o alerta deverá ser enviado antes do prazo?
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '1', label: '1 dia antes' },
                { id: '2', label: '2 dias antes' },
                { id: '7', label: '7 dias antes' },
                { id: 'custom', label: 'Personalizado' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLeadOption(opt.id as any)}
                  className={`p-3 rounded-2xl border text-center transition font-bold select-none cursor-pointer ${
                    leadOption === opt.id
                      ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-400/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-black">{opt.label}</p>
                </button>
              ))}
            </div>

            {leadOption === 'custom' && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-600 font-semibold">Notificar com</span>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={customDays}
                  onChange={e => setCustomDays(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-black text-center text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-slate-600 font-semibold">dia(s) de antecedência do vencimento.</span>
              </div>
            )}

            {hasDueDate && calculatedScheduledDate && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pl-1">
                <Calendar size={13} className="text-teal-600" />
                Data programada para o disparo do e-mail: <strong className="text-slate-800">{calculatedScheduledDate.split('-').reverse().join('/')}</strong>
              </p>
            )}
          </div>

          {/* Seleção do Responsável Regulatória (E-mail cadastrado no Perfil) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-blue-600" />
                Pessoa Responsável do Módulo Regulatório (Destinatário)
              </label>
              <span className="text-[10px] font-bold text-slate-400">E-mail corporativo do perfil</span>
            </div>

            <div className="space-y-2">
              <select
                value={selectedRecipientEmail}
                onChange={e => setSelectedRecipientEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {regulatoryCandidates.map(cand => (
                  <option key={cand.email} value={cand.email}>
                    {cand.name} — {cand.email} ({cand.role})
                  </option>
                ))}
              </select>

              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={14} className="text-blue-600 shrink-0" />
                  <span className="text-slate-600 truncate">
                    E-mail validado no perfil: <strong className="text-blue-900 font-bold">{selectedRecipientEmail}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 shrink-0">
                  Cadastrado
                </span>
              </div>
            </div>
          </div>

          {/* Dados de Remetente & Regras */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center justify-between font-semibold">
              <span>Remetente do e-mail:</span>
              <strong className="text-slate-800">brunadias@ctvacinas.org (Gestão Regulatória)</strong>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              • Se o prazo da atividade for modificado, o momento do alerta será recalculado automaticamente.<br/>
              • Se a atividade for concluída antes do prazo, os alertas futuros serão cancelados imediatamente.<br/>
              • Todos os disparos e status de entrega são registrados para fins de auditoria e conformidade.
            </p>
          </div>

          {/* Histórico / Status do Alerta Atual */}
          {(alertStatus || alertSentAt || alertError) && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 uppercase text-[10px]">Status da Notificação:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  alertStatus === 'enviado' ? 'bg-emerald-100 text-emerald-800' :
                  alertStatus === 'cancelado' ? 'bg-slate-200 text-slate-600' :
                  alertStatus === 'erro' ? 'bg-rose-100 text-rose-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  {alertStatus || 'Agendado'}
                </span>
              </div>
              {alertSentAt && (
                <p className="text-slate-600">Disparado em: {new Date(alertSentAt).toLocaleString('pt-BR')}</p>
              )}
              {alertError && (
                <p className="text-rose-700 font-semibold">Falha registrada: {alertError}</p>
              )}
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
              {formError}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            {isCritical && onRemoveCritical && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Desmarcar como crítica
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!hasDueDate}
              onClick={handleSave}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{isCritical ? 'Salvar Alterações do Alerta' : 'Ativar Alerta Crítico'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
