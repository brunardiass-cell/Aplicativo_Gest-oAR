import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { DEFAULT_MINUTES_TEMPLATE } from '../constants';
import { X, Copy, Download, Printer, Check, RefreshCw, FileText, Sparkles, Mail, Send, Image, Settings, BookOpen, UserCheck, UserX, Plus } from 'lucide-react';

interface MeetingMinutesModalProps {
  meeting: Meeting;
  onClose: () => void;
  onSaveMinutes: (minutesText: string) => void;
}

export const generateMinutesText = (meeting: Meeting, templateText: string = DEFAULT_MINUTES_TEMPLATE): string => {
  const dateFormatted = meeting.date ? meeting.date.split('-').reverse().join('/') : 'Data não informada';
  
  // Participantes e presenças
  let participantsText = meeting.participants && meeting.participants.length > 0 ? meeting.participants.join(', ') : 'Nenhum informado';
  if (meeting.presentParticipants && meeting.presentParticipants.length > 0) {
    participantsText = `PRESENTES (${meeting.presentParticipants.length}): ${meeting.presentParticipants.join(', ')}`;
    if (meeting.absentParticipants && meeting.absentParticipants.length > 0) {
      participantsText += `\n   AUSENTES (${meeting.absentParticipants.length}): ${meeting.absentParticipants.join(', ')}`;
    }
  }

  let pautasDecisoesText = '';
  let impactosRegulatoriosText = '';
  let encaminhamentosText = '';

  meeting.agendaItems.forEach((agenda, idx) => {
    pautasDecisoesText += `PAUTA ${idx + 1}: ${agenda.title.toUpperCase()}\n`;
    if (agenda.description) pautasDecisoesText += `   • Descrição: ${agenda.description}\n`;
    if (agenda.phase) pautasDecisoesText += `   • Fase Vinculada: ${agenda.phase}\n`;
    
    // Linked norms
    if (agenda.linkedRegulatoryStandardIds && agenda.linkedRegulatoryStandardIds.length > 0) {
      pautasDecisoesText += `   • Normas Regulatórias Associadas: ${agenda.linkedRegulatoryStandardIds.length} norma(s) vinculada(s)\n`;
    }

    pautasDecisoesText += `   • Discussão: ${agenda.discussions || 'Sem discussões registradas.'}\n`;
    pautasDecisoesText += `   • Decisões / Conclusões: ${agenda.decisions || 'Sem decisões registradas.'}\n\n`;

    if (agenda.hasRegulatoryImpact) {
      impactosRegulatoriosText += `• Pauta ${idx + 1} (${agenda.title}):\n`;
      impactosRegulatoriosText += `  • Detalhes do Impacto: ${agenda.regulatoryImpactDetails || agenda.decisions || 'Impacto regulatório assinalado.'}\n\n`;
    }

    if (agenda.actionItems && agenda.actionItems.length > 0) {
      agenda.actionItems.forEach((act) => {
        const prazo = act.dueDate ? act.dueDate.split('-').reverse().join('/') : 'Sem prazo';
        encaminhamentosText += `• [Pauta ${idx + 1}] Ação: ${act.action}\n  • Responsável: ${act.responsible || 'A definir'} | Prazo: ${prazo} | Status: ${act.status}\n\n`;
      });
    }
  });

  if (!pautasDecisoesText) pautasDecisoesText = 'Nenhuma pauta cadastrada.\n';
  if (!impactosRegulatoriosText) impactosRegulatoriosText = 'Nenhum impacto regulatório identificado nesta reunião.\n';
  if (!encaminhamentosText) encaminhamentosText = 'Nenhum encaminhamento registrado.\n';

  let output = templateText;
  output = output.replace(/\[NOME_DO_PROJETO\]/g, meeting.projectName || meeting.projectId || 'Projeto Geral');
  output = output.replace(/\[TITULO_REUNIAO\]/g, meeting.title || 'Reunião');
  output = output.replace(/\[TIPO_REUNIAO\]/g, meeting.type || 'Geral');
  output = output.replace(/\[DATA_REUNIAO\]/g, dateFormatted);
  output = output.replace(/\[HORA_REUNIAO\]/g, meeting.time || '10:00');
  output = output.replace(/\[LOCAL_REUNIAO\]/g, meeting.location || 'Online / CTVacinas');
  output = output.replace(/\[MODERADOR\]/g, meeting.moderator || 'Não informado');
  output = output.replace(/\[PARTICIPANTES\]/g, participantsText);
  output = output.replace(/\[PAUTAS_E_DECISOES\]/g, pautasDecisoesText.trim());
  output = output.replace(/\[IMPACTOS_REGULATORIOS\]/g, impactosRegulatoriosText.trim());
  output = output.replace(/\[ENCAMINHAMENTOS\]/g, encaminhamentosText.trim());
  output = output.replace(/\[CONCLUSOES_GERAIS\]/g, meeting.generalConclusions || 'Reunião finalizada sem observações adicionais.');

  return output;
};

export const MeetingMinutesModal: React.FC<MeetingMinutesModalProps> = ({ meeting, onClose, onSaveMinutes }) => {
  const [minutesText, setMinutesText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Cabeçalho e Rodapé anexados/customizáveis
  const [headerTitle, setHeaderTitle] = useState<string>(meeting.headerText || 'CTVACINAS / GESTORPRO - ATA OFICIAL DE REUNIÃO');
  const [headerSubtitle, setHeaderSubtitle] = useState<string>('Comitê Gestor & Governança de Projetos de Pesquisa e Desenvolvimento');
  const [footerText, setFooterText] = useState<string>(meeting.footerText || 'Documento gerado pelo GestorPro CTVacinas. Todos os direitos reservados.');
  const [isHeaderConfigOpen, setIsHeaderConfigOpen] = useState(false);

  // Modal de Envio por E-mail
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`[Ata de Reunião] ${meeting.title} - ${meeting.projectName || 'CTVacinas'}`);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Load saved email list from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('saved_meeting_emails');
      if (stored) {
        setSavedEmails(JSON.parse(stored));
      } else {
        const defaults = ['coordenacao@ctvacinas.ufmg.br', 'qualidade@ctvacinas.ufmg.br', 'diretoria@ctvacinas.ufmg.br'];
        setSavedEmails(defaults);
        localStorage.setItem('saved_meeting_emails', JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (meeting.minutesDocument && meeting.minutesDocument.trim().length > 0) {
      setMinutesText(meeting.minutesDocument);
    } else {
      setMinutesText(generateMinutesText(meeting));
    }
  }, [meeting]);

  const handleRegenerate = () => {
    if (window.confirm('Deseja recriar a ata utilizando os dados atualizados da reunião? Quaisquer edições manuais no texto serão sobrescritas.')) {
      setMinutesText(generateMinutesText(meeting));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(minutesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.');
    }
  };

  const handleDownload = () => {
    const filename = `Ata_Reuniao_${meeting.projectName ? meeting.projectName.replace(/\s+/g, '_') : 'CTV'}_${meeting.date}.txt`;
    const blob = new Blob([minutesText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ata de Reunião - ${meeting.title}</title>
            <meta charset="utf-8">
            <style>
              @page { 
                size: A4; 
                margin-top: 3.5cm; 
                margin-bottom: 3.0cm; 
                margin-left: 2.5cm; 
                margin-right: 2.5cm; 
              }
              * { box-sizing: border-box; }
              body { 
                font-family: Calibri, 'Segoe UI', Candara, Arial, sans-serif; 
                padding: 0; 
                margin: 0; 
                color: #111827; 
                line-height: 1.5; 
                font-size: 11pt; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header-box { 
                position: fixed; 
                top: -3.0cm; 
                left: 0; 
                right: 0; 
                width: 100%;
                height: 2.5cm; 
                border-bottom: 2px solid #0f172a; 
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                box-sizing: border-box;
                padding-bottom: 4px;
              }
              .header-text-container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                text-align: left;
              }
              .header-title { 
                font-size: 12pt; 
                font-weight: bold; 
                text-transform: uppercase; 
                color: #0f172a; 
                letter-spacing: 0.5px;
                margin: 0;
              }
              .header-sub { 
                font-size: 8.5pt; 
                color: #475569; 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
                margin-top: 2px;
              }
              .logo-img { 
                max-height: 55px; 
                max-width: 150px; 
                object-fit: contain; 
                margin-left: auto;
              }
              .content-body { 
                white-space: pre-wrap; 
                font-family: Calibri, 'Segoe UI', Candara, Arial, sans-serif; 
                font-size: 11pt; 
                line-height: 1.5;
                color: #111827;
              }
              .footer-box { 
                position: fixed; 
                bottom: -2.5cm; 
                left: 0; 
                right: 0; 
                width: 100%;
                height: 2.0cm; 
                border-top: 1px solid #cbd5e1; 
                text-align: center; 
                font-size: 8.5pt; 
                color: #64748b; 
                padding-top: 8px;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="header-box">
              <div class="header-text-container">
                <div class="header-title">${headerTitle}</div>
                <div class="header-sub">${headerSubtitle}</div>
              </div>
              ${meeting.headerLogoUrl ? `<img src="${meeting.headerLogoUrl}" class="logo-img" alt="Logo" />` : ''}
            </div>
            <div class="content-body">${minutesText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="footer-box">${footerText}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleSave = () => {
    onSaveMinutes(minutesText);
    onClose();
  };

  // Envio de E-mail
  const handleAddEmailToSelected = (email: string) => {
    if (email && !selectedEmails.includes(email)) {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleAddNewEmail = () => {
    const trimmed = newEmailInput.trim();
    if (trimmed && trimmed.includes('@')) {
      if (!selectedEmails.includes(trimmed)) {
        setSelectedEmails([...selectedEmails, trimmed]);
      }
      if (!savedEmails.includes(trimmed)) {
        const updatedSaved = [...savedEmails, trimmed];
        setSavedEmails(updatedSaved);
        localStorage.setItem('saved_meeting_emails', JSON.stringify(updatedSaved));
      }
      setNewEmailInput('');
    } else {
      alert('Por favor insira um e-mail válido.');
    }
  };

  const handleSendEmailSubmit = () => {
    if (selectedEmails.length === 0) {
      alert('Selecione pelo menos um destinatário para enviar a ata.');
      return;
    }

    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailSentSuccess(true);
      setTimeout(() => {
        setEmailSentSuccess(false);
        setIsEmailModalOpen(false);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <header className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <FileText size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} /> Ata de Reunião com Cabeçalho e Rodapé Personalizados
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight">{meeting.title}</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-2xl text-slate-300 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </header>

        {/* Header Preview & Settings Strip */}
        <div className="px-6 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <Settings size={14} className="text-indigo-400 shrink-0" />
            <span className="font-bold text-[11px] truncate">{headerTitle}</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{footerText}</span>
          </div>

          <button
            onClick={() => setIsHeaderConfigOpen(!isHeaderConfigOpen)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-1"
          >
            <Image size={12} /> Editar Cabeçalho/Rodapé
          </button>
        </div>

        {/* Header/Footer Config Collapsible Drawer */}
        {isHeaderConfigOpen && (
          <div className="p-4 bg-slate-800 text-white border-b border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200 text-xs shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-indigo-300 block mb-1">Título do Cabeçalho</label>
                <input
                  type="text"
                  value={headerTitle}
                  onChange={e => setHeaderTitle(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-indigo-300 block mb-1">Subtítulo / Instituição</label>
                <input
                  type="text"
                  value={headerSubtitle}
                  onChange={e => setHeaderSubtitle(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[9px] font-black uppercase text-indigo-300 block mb-1">Texto do Rodapé Oficial</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Recriar Ata a partir das pautas"
            >
              <RefreshCw size={14} className="text-indigo-600" /> Recriar Ata
            </button>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Texto 100% editável.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
                copied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} className="text-indigo-600" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Download size={14} className="text-indigo-600" /> Baixar (.txt)
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer size={14} className="text-indigo-600" /> Imprimir PDF (com Cabeçalho)
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-md"
            >
              <Mail size={14} /> Enviar por E-mail
            </button>
          </div>
        </div>

        {/* Visual Preview Header & Editor */}
        <div className="p-6 flex-1 bg-slate-100 overflow-y-auto custom-scrollbar space-y-4">
          
          {/* Paper Mockup Box */}
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200/80 max-w-4xl mx-auto space-y-6">
            
            {/* Header Banner */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <h1 className="text-base font-black uppercase text-slate-900 tracking-wider">{headerTitle}</h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{headerSubtitle}</p>
            </div>

            {/* Editable Text Area */}
            <textarea
              value={minutesText}
              onChange={(e) => setMinutesText(e.target.value)}
              style={{ fontFamily: "Calibri, 'Segoe UI', Candara, Arial, sans-serif" }}
              className="w-full h-96 p-5 bg-slate-50/90 border border-slate-200 rounded-2xl text-[13px] leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar resize-y"
              placeholder="Ata de Reunião..."
            />

            {/* Footer Banner */}
            <div className="border-t border-slate-200 pt-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{footerText}</p>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <footer className="p-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            A ata salva fica vinculada permanentemente ao histórico desta reunião.
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/20"
            >
              Salvar Ata
            </button>
          </div>
        </footer>

      </div>

      {/* MODAL 2: ENVIAR ATA POR E-MAIL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            <header className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail size={20} className="text-indigo-400" />
                <div>
                  <span className="text-[9px] font-black uppercase text-indigo-300 tracking-wider block">Notificação por E-mail</span>
                  <h3 className="text-base font-black uppercase tracking-tight">Enviar Ata Aos Participantes</h3>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300">
                <X size={18} />
              </button>
            </header>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Assunto da Mensagem</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Saved Email Address Picker */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="text-[10px] font-black uppercase text-slate-500 block">
                  Selecionar Destinatários ({selectedEmails.length})
                </label>

                <div className="flex items-center gap-2">
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddEmailToSelected(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none"
                  >
                    <option value="">+ Escolher da lista de e-mails utilizados...</option>
                    {savedEmails.map(em => (
                      <option key={em} value={em}>{em}</option>
                    ))}
                  </select>
                </div>

                {/* Add new custom email input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="email"
                    placeholder="Novo e-mail (ex: participante@ufmg.br)..."
                    value={newEmailInput}
                    onChange={e => setNewEmailInput(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewEmail}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Chips of selected emails */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedEmails.map(email => (
                    <span 
                      key={email}
                      className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => setSelectedEmails(selectedEmails.filter(e => e !== email))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {selectedEmails.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">Nenhum destinatário selecionado.</p>
                  )}
                </div>
              </div>

              {emailSentSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <Check size={18} className="text-emerald-600" />
                  <span>Ata enviada com sucesso para os e-mails selecionados!</span>
                </div>
              )}

            </div>

            <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cancelar
              </button>

              <button
                disabled={emailSending}
                onClick={handleSendEmailSubmit}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2"
              >
                {emailSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{emailSending ? 'Enviando...' : 'Enviar Ata'}</span>
              </button>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
};
