import React, { useEffect, useState } from 'react';
import { BellRing, BellOff, Calendar, Mail, X, Check } from 'lucide-react';
import { validateEmail } from '../services/emailService';

export interface ActivityNotificationConfig {
  enabled: boolean;
  leadDays: number;
  recipientEmail: string;
}

interface ActivityNotificationModalProps {
  isOpen: boolean;
  activityTitle: string;
  dueDate?: string;
  initialEnabled?: boolean;
  initialLeadDays?: number;
  initialEmail?: string;
  suggestedEmail?: string;
  profileEmails: string[];
  allRegisteredEmails?: string[];
  onClose: () => void;
  onSave: (config: ActivityNotificationConfig) => void;
}

export const ActivityNotificationModal: React.FC<ActivityNotificationModalProps> = ({
  isOpen,
  activityTitle,
  dueDate,
  initialEnabled = false,
  initialLeadDays = 1,
  initialEmail = '',
  suggestedEmail = '',
  profileEmails,
  allRegisteredEmails = [],
  onClose,
  onSave
}) => {
  const [preset, setPreset] = useState<'1' | '7' | 'other'>('1');
  const [customDays, setCustomDays] = useState<string>('3');
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Monta lista única de e-mails (primeiro os do perfil, depois os demais cadastrados)
  const uniqueCandidateEmails = React.useMemo(() => {
    const map = new Map<string, { email: string; isProfileMatch: boolean }>();
    profileEmails.forEach(e => {
      if (e && validateEmail(e)) {
        map.set(e.toLowerCase(), { email: e.trim(), isProfileMatch: true });
      }
    });
    allRegisteredEmails.forEach(e => {
      if (e && validateEmail(e) && !map.has(e.toLowerCase())) {
        map.set(e.toLowerCase(), { email: e.trim(), isProfileMatch: false });
      }
    });
    if (initialEmail && validateEmail(initialEmail) && !map.has(initialEmail.toLowerCase())) {
      map.set(initialEmail.toLowerCase(), { email: initialEmail.trim(), isProfileMatch: true });
    }
    return Array.from(map.values());
  }, [profileEmails, allRegisteredEmails, initialEmail]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    const days = typeof initialLeadDays === 'number' && !Number.isNaN(initialLeadDays) ? initialLeadDays : 1;
    if (days === 1) {
      setPreset('1');
      setCustomDays('3');
    } else if (days === 7) {
      setPreset('7');
      setCustomDays('3');
    } else {
      setPreset('other');
      setCustomDays(String(Math.max(0, days)));
    }

    const defaultMail =
      (initialEmail && validateEmail(initialEmail) ? initialEmail.trim() : '') ||
      (suggestedEmail && validateEmail(suggestedEmail) ? suggestedEmail.trim() : '') ||
      uniqueCandidateEmails[0]?.email ||
      '';

    if (defaultMail && uniqueCandidateEmails.some(c => c.email.toLowerCase() === defaultMail.toLowerCase())) {
      setSelectedEmail(defaultMail);
      setUseCustomEmail(false);
      setCustomEmailInput('');
    } else if (defaultMail) {
      setSelectedEmail('');
      setUseCustomEmail(true);
      setCustomEmailInput(defaultMail);
    } else {
      setSelectedEmail('');
      setUseCustomEmail(uniqueCandidateEmails.length === 0);
      setCustomEmailInput('');
    }
  }, [isOpen, initialLeadDays, initialEmail, suggestedEmail, uniqueCandidateEmails]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalEmail = (useCustomEmail ? customEmailInput : selectedEmail).trim();
    if (!finalEmail || !validateEmail(finalEmail)) {
      setErrorMsg('Selecione ou informe um endereço de e-mail válido.');
      return;
    }

    let finalLeadDays = 1;
    if (preset === '1') {
      finalLeadDays = 1;
    } else if (preset === '7') {
      finalLeadDays = 7;
    } else {
      const parsed = parseInt(customDays, 10);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 365) {
        setErrorMsg('Informe um número válido de dias (entre 0 e 365).');
        return;
      }
      finalLeadDays = parsed;
    }

    onSave({
      enabled: true,
      leadDays: finalLeadDays,
      recipientEmail: finalEmail
    });
  };

  const handleDisable = () => {
    onSave({
      enabled: false,
      leadDays: initialLeadDays || 1,
      recipientEmail: selectedEmail || initialEmail || suggestedEmail || ''
    });
  };

  const formattedDueDate = dueDate ? dueDate.split('-').reverse().join('/') : null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/70 border-b border-amber-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <BellRing size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Configurar Notificação por E-mail
              </h3>
              <p className="text-xs font-semibold text-slate-600 line-clamp-2 mt-0.5">
                {activityTitle}
              </p>
              {formattedDueDate && (
                <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mt-1">
                  <Calendar size={11} /> Prazo: {formattedDueDate}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-5">
          {/* 1. Quando receber */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Quando receber a notificação?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset('1')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                  preset === '1'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50/60 hover:border-amber-200'
                }`}
              >
                1 dia antes
              </button>
              <button
                type="button"
                onClick={() => setPreset('7')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                  preset === '7'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50/60 hover:border-amber-200'
                }`}
              >
                7 dias antes
              </button>
              <button
                type="button"
                onClick={() => setPreset('other')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                  preset === 'other'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50/60 hover:border-amber-200'
                }`}
              >
                Outro
              </button>
            </div>

            {preset === 'other' && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-400/30"
                />
                <span className="text-xs font-semibold text-slate-600">
                  dia(s) antes do prazo <span className="text-slate-400">(0 = no dia)</span>
                </span>
              </div>
            )}
          </div>

          {/* 2. Para qual e-mail */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Mail size={12} className="text-teal-600" />
              E-mail para receber a notificação
            </label>

            {uniqueCandidateEmails.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                {uniqueCandidateEmails.map(item => {
                  const isSelected = !useCustomEmail && selectedEmail.toLowerCase() === item.email.toLowerCase();
                  const isSuggested = suggestedEmail && item.email.toLowerCase() === suggestedEmail.toLowerCase();
                  return (
                    <button
                      key={item.email}
                      type="button"
                      onClick={() => {
                        setSelectedEmail(item.email);
                        setUseCustomEmail(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 text-teal-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{item.email}</p>
                        {isSuggested && (
                          <span className="text-[10px] font-bold text-teal-700">Sugerido para o perfil</span>
                        )}
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setUseCustomEmail(true)}
              className={`w-full px-3.5 py-2 rounded-xl border text-left text-xs font-bold transition ${
                useCustomEmail
                  ? 'bg-teal-50 border-teal-400 text-teal-900'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              + Informar outro e-mail
            </button>

            {useCustomEmail && (
              <input
                type="email"
                required
                value={customEmailInput}
                onChange={e => setCustomEmailInput(e.target.value)}
                placeholder="nome@dominio.com"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-teal-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            )}
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
              {errorMsg}
            </p>
          )}

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            {initialEnabled ? (
              <button
                type="button"
                onClick={handleDisable}
                className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <BellOff size={13} /> Desativar
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black uppercase tracking-wider transition shadow-xs"
              >
                {initialEnabled ? 'Salvar' : 'Ativar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityNotificationModal;
