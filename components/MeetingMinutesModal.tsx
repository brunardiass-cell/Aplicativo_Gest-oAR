import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { DEFAULT_MINUTES_TEMPLATE } from '../constants';
import { X, Copy, Download, Printer, Check, RefreshCw, FileText, Sparkles } from 'lucide-react';

interface MeetingMinutesModalProps {
  meeting: Meeting;
  onClose: () => void;
  onSaveMinutes: (minutesText: string) => void;
}

export const generateMinutesText = (meeting: Meeting, templateText: string = DEFAULT_MINUTES_TEMPLATE): string => {
  const dateFormatted = meeting.date ? meeting.date.split('-').reverse().join('/') : 'Data não informada';
  const participantsText = meeting.participants && meeting.participants.length > 0 ? meeting.participants.join(', ') : 'Nenhum informado';

  let pautasDecisoesText = '';
  let impactosRegulatoriosText = '';
  let encaminhamentosText = '';

  meeting.agendaItems.forEach((agenda, idx) => {
    pautasDecisoesText += `PAUTA ${idx + 1}: ${agenda.title.toUpperCase()}\n`;
    if (agenda.description) pautasDecisoesText += `   Descrição: ${agenda.description}\n`;
    if (agenda.phase) pautasDecisoesText += `   Fase Vinculada: ${agenda.phase}\n`;
    pautasDecisoesText += `   Discussão: ${agenda.discussions || 'Sem discussões registradas.'}\n`;
    pautasDecisoesText += `   Decisões/Conclusões: ${agenda.decisions || 'Sem decisões registradas.'}\n\n`;

    if (agenda.hasRegulatoryImpact) {
      impactosRegulatoriosText += `• Pauta ${idx + 1} (${agenda.title}):\n`;
      impactosRegulatoriosText += `  ${agenda.regulatoryImpactDetails || agenda.decisions || 'Impacto regulatório assinalado.'}\n\n`;
    }

    if (agenda.actionItems && agenda.actionItems.length > 0) {
      agenda.actionItems.forEach((act, aIdx) => {
        const prazo = act.dueDate ? act.dueDate.split('-').reverse().join('/') : 'Sem prazo';
        encaminhamentosText += `• [Pauta ${idx + 1}] Ação: ${act.action}\n  Responsável: ${act.responsible || 'A definir'} | Prazo: ${prazo} | Status: ${act.status}\n\n`;
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
        <html>
          <head>
            <title>Ata de Reunião - ${meeting.title}</title>
            <style>
              body { font-family: monospace, sans-serif; padding: 40px; line-height: 1.5; font-size: 13px; color: #111; white-space: pre-wrap; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${minutesText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
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

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <header className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <FileText size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} /> Ata de Reunião Gerada Automática
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
              O texto abaixo é totalmente editável antes de salvar.
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
              <Printer size={14} className="text-indigo-600" /> Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="p-6 flex-1 bg-slate-900/5 overflow-hidden flex flex-col">
          <textarea
            value={minutesText}
            onChange={(e) => setMinutesText(e.target.value)}
            className="w-full h-full p-6 bg-white border border-slate-300 rounded-2xl font-mono text-xs leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none custom-scrollbar"
            placeholder="Ata de Reunião..."
          />
        </div>

        {/* Footer */}
        <footer className="p-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            A ata salva fica vinculada permanentemente ao histórico da reunião.
          </p>
          <div className="flex items-center gap-3">
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
              Salvar Ata de Reunião
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
