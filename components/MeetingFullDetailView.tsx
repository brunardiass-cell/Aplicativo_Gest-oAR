import React, { useState, useEffect, useRef } from 'react';
import { Meeting, MeetingAgendaItem, MeetingActionItem, Project, TeamMember, RegulatoryStandard, DossierContribution } from '../types';
import { 
  ArrowLeft, Copy, Download, Printer, Send, Mail, Image as ImageIcon, Settings, 
  Check, RefreshCw, FileText, Sparkles, BookOpen, UserCheck, UserX, Plus, Trash2, 
  Calendar, Clock, MapPin, Users, CheckCircle2, MessageSquare, AlertCircle, 
  Paperclip, ExternalLink, ChevronLeft, ChevronRight, Monitor, Share2, FileSpreadsheet, File
} from 'lucide-react';

interface MeetingFullDetailViewProps {
  meeting: Meeting;
  projects: Project[];
  teamMembers: TeamMember[];
  regulatoryStandards: RegulatoryStandard[];
  currentUser?: string;
  onBack: () => void;
  onSaveMeeting: (updatedMeeting: Meeting, createdContributions?: DossierContribution[]) => void;
  onConvertToActivity?: (projectId: string, macroActivityId: string, actionItem: MeetingActionItem) => void;
}

export const MeetingFullDetailView: React.FC<MeetingFullDetailViewProps> = ({
  meeting,
  projects,
  teamMembers,
  regulatoryStandards,
  currentUser = 'Usuário',
  onBack,
  onSaveMeeting,
  onConvertToActivity
}) => {
  const [meetingState, setMeetingState] = useState<Meeting>({ ...meeting });
  const [activeTab, setActiveTab] = useState<'pauta_notas' | 'ata_final'>('pauta_notas');
  const [copiedPauta, setCopiedPauta] = useState(false);
  const [copiedWord, setCopiedWord] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Projection mode state
  const [isProjecting, setIsProjecting] = useState(false);
  const [projectionIndex, setProjectionIndex] = useState(0);

  // Header and Footer custom image & text
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string>(meeting.headerLogoUrl || '');
  const [headerTitle, setHeaderTitle] = useState<string>(meeting.headerText || 'CTVACINAS / GESTORPRO - ATA OFICIAL DE REUNIÃO');
  const [headerSubtitle, setHeaderSubtitle] = useState<string>('Comitê Gestor & Governança de Projetos de Pesquisa e Desenvolvimento');
  const [footerText, setFooterText] = useState<string>(meeting.footerText || 'Documento gerado pelo GestorPro CTVacinas. Todos os direitos reservados.');
  const [isHeaderConfigOpen, setIsHeaderConfigOpen] = useState(false);

  // Comments inputs per agenda item
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentAuthors, setCommentAuthors] = useState<Record<string, string>>({});

  // Action item inputs per agenda item
  const [newActionText, setNewActionText] = useState<Record<string, string>>({});
  const [newActionResp, setNewActionResp] = useState<Record<string, string>>({});
  const [newActionDate, setNewActionDate] = useState<Record<string, string>>({});

  // Email modal and saved state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`[Ata de Reunião] ${meetingState.title} - ${meetingState.projectName || 'CTVacinas'}`);
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    meetingState.participantEmails || ['coordenacao@ctvacinas.ufmg.br', 'qualidade@ctvacinas.ufmg.br']
  );
  const [newEmailInput, setNewEmailInput] = useState('');
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // File Upload Ref for Logo
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load saved email list
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

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setHeaderLogoUrl(base64);
        setMeetingState(prev => ({ ...prev, headerLogoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save
  const handleSaveAll = () => {
    const updated: Meeting = {
      ...meetingState,
      headerText: headerTitle,
      footerText: footerText,
      headerLogoUrl: headerLogoUrl,
      updatedAt: new Date().toISOString()
    };

    const createdContributions: DossierContribution[] = [];
    meetingState.agendaItems.forEach(agenda => {
      if (agenda.hasRegulatoryImpact) {
        const contrib: DossierContribution = {
          id: `contrib_mtg_${updated.id}_${agenda.id}`,
          projectId: updated.projectId,
          projectName: updated.projectName || 'Projeto',
          macroActivityId: agenda.macroActivityId,
          macroActivityName: agenda.phase,
          activityId: agenda.id,
          activityName: `[Reunião: ${updated.title}] ${agenda.title}`,
          chapterId: 'cap_1',
          chapterTitle: 'Registro de Decisão de Reunião com Impacto Regulatório',
          type: 'texto',
          content: `Decisão tomada na reunião "${updated.title}" em ${updated.date}:\n\n${agenda.decisions || agenda.description || ''}\n\nDetalhes Regulatórios: ${agenda.regulatoryImpactDetails || ''}`,
          status: 'Em Revisão',
          version: 1,
          author: updated.moderator || currentUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        createdContributions.push(contrib);
      }
    });

    onSaveMeeting(updated, createdContributions);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Add Comment to Discussion
  const handleAddComment = (agendaId: string, customAuthor?: string, customText?: string) => {
    const text = (customText !== undefined ? customText : commentInputs[agendaId])?.trim();
    if (!text) return;

    const author = customAuthor || commentAuthors[agendaId] || currentUser || 'Participante';
    const newNote = {
      id: 'note_' + Date.now() + Math.random().toString(36).substr(2, 4),
      author: author,
      time: '', // Sem exibição de horário na ata oficial
      text: text
    };

    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          const existingNotes = ag.discussionNotes || [];
          const updatedDiscussions = (ag.discussions ? ag.discussions + '\n' : '') + `${newNote.author}: ${newNote.text}`;
          return {
            ...ag,
            discussionNotes: [...existingNotes, newNote],
            discussions: updatedDiscussions
          };
        }
        return ag;
      })
    }));

    if (customText === undefined) {
      setCommentInputs(prev => ({ ...prev, [agendaId]: '' }));
    }
  };

  // Delete comment from discussion
  const handleDeleteComment = (agendaId: string, noteId: string) => {
    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          const updatedNotes = (ag.discussionNotes || []).filter(n => n.id !== noteId);
          const updatedDiscussions = updatedNotes.map(n => `${n.author}: ${n.text}`).join('\n');
          return {
            ...ag,
            discussionNotes: updatedNotes,
            discussions: updatedDiscussions
          };
        }
        return ag;
      })
    }));
  };

  // Handle Real File Upload for Pauta
  const handleFileUploadForPauta = (agendaId: string, filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    Array.from(filesList).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const sizeFormatted = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        const newFileObj = {
          id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: file.name,
          size: sizeFormatted,
          type: file.type || file.name.split('.').pop() || 'documento',
          dataUrl: dataUrl
        };

        setMeetingState(prev => ({
          ...prev,
          agendaItems: prev.agendaItems.map(ag => {
            if (ag.id === agendaId) {
              const currentFiles = ag.attachedFiles || [];
              return {
                ...ag,
                attachedFiles: [...currentFiles, newFileObj]
              };
            }
            return ag;
          })
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Rename attached file
  const handleRenamePautaFile = (agendaId: string, fileId: string, newName: string) => {
    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          return {
            ...ag,
            attachedFiles: (ag.attachedFiles || []).map(f => f.id === fileId ? { ...f, name: newName } : f)
          };
        }
        return ag;
      })
    }));
  };

  // Delete attached file
  const handleDeletePautaFile = (agendaId: string, fileId: string) => {
    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          return {
            ...ag,
            attachedFiles: (ag.attachedFiles || []).filter(f => f.id !== fileId)
          };
        }
        return ag;
      })
    }));
  };

  // Add Encaminhamento (Action Item)
  const handleAddActionItem = (agendaId: string) => {
    const action = newActionText[agendaId]?.trim();
    if (!action) return;

    const resp = newActionResp[agendaId]?.trim() || currentUser || 'Responsável';
    const dateVal = newActionDate[agendaId] || new Date().toISOString().split('T')[0];

    const newAction: MeetingActionItem = {
      id: 'act_' + Date.now(),
      action: action,
      responsible: resp,
      dueDate: dateVal,
      status: 'Pendente'
    };

    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          const currentActions = ag.actionItems || [];
          return {
            ...ag,
            actionItems: [...currentActions, newAction]
          };
        }
        return ag;
      })
    }));

    setNewActionText(prev => ({ ...prev, [agendaId]: '' }));
    setNewActionResp(prev => ({ ...prev, [agendaId]: '' }));
    setNewActionDate(prev => ({ ...prev, [agendaId]: '' }));
  };

  // Toggle Action Status
  const handleToggleActionStatus = (agendaId: string, actionId: string) => {
    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          return {
            ...ag,
            actionItems: (ag.actionItems || []).map(act => {
              if (act.id === actionId) {
                return {
                  ...act,
                  status: act.status === 'Concluído' ? 'Pendente' : 'Concluído'
                };
              }
              return act;
            })
          };
        }
        return ag;
      })
    }));
  };

  // Add New Pauta Item
  const handleAddNewPauta = () => {
    const newAg: MeetingAgendaItem = {
      id: 'ag_' + Date.now(),
      title: 'Nova Pauta de Discussão',
      description: 'Descreva os pontos a serem abordados...',
      linkedRegulatoryStandardIds: [],
      discussionNotes: [],
      actionItems: []
    };

    setMeetingState(prev => ({
      ...prev,
      agendaItems: [...prev.agendaItems, newAg]
    }));
  };

  // Link / Unlink Norm to Pauta
  const handleToggleNormLink = (agendaId: string, normId: string) => {
    setMeetingState(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(ag => {
        if (ag.id === agendaId) {
          const norms = ag.linkedRegulatoryStandardIds || [];
          const exists = norms.includes(normId);
          return {
            ...ag,
            linkedRegulatoryStandardIds: exists ? norms.filter(id => id !== normId) : [...norms, normId]
          };
        }
        return ag;
      })
    }));
  };

  // Copy Pauta to Clipboard
  const handleCopyPautaSummary = () => {
    let summary = `PAUTA DA REUNIÃO: ${meetingState.title}\nData: ${meetingState.date} ${meetingState.time ? 'às ' + meetingState.time : ''}\n\n`;
    meetingState.agendaItems.forEach((ag, i) => {
      summary += `${i + 1}. ${ag.title.toUpperCase()}\n`;
      if (ag.description) summary += `   ${ag.description}\n`;
      if (ag.linkedRegulatoryStandardIds && ag.linkedRegulatoryStandardIds.length > 0) {
        summary += `   Normas Vinculadas: ${ag.linkedRegulatoryStandardIds.length}\n`;
      }
      summary += `\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopiedPauta(true);
    setTimeout(() => setCopiedPauta(false), 2000);
  };

  // Copy to ChatGPT / AI helper
  const handleCopyForChatGPT = () => {
    let promptText = `Por favor, atue como secretário executivo especialista em governança e redação técnica. Organize, corrija a gramática e estruture em tópicos formais a seguinte ata de reunião:\n\n`;
    promptText += `Título da Reunião: ${meetingState.title}\n`;
    promptText += `Projeto: ${meetingState.projectName || 'CTVacinas'}\n`;
    promptText += `Data: ${meetingState.date}\n`;
    promptText += `Moderador: ${meetingState.moderator}\n`;
    promptText += `Participantes: ${(meetingState.presentParticipants || meetingState.participants).join(', ')}\n\n`;
    promptText += `PAUTAS DISCUTIDAS:\n`;

    meetingState.agendaItems.forEach((ag, idx) => {
      promptText += `\nPAUTA ${idx + 1}: ${ag.title}\n`;
      promptText += `Discussões e Notas: ${ag.discussions || 'Sem notas'}\n`;
      promptText += `Decisão Tomada: ${ag.decisions || 'Pendente'}\n`;
    });

    navigator.clipboard.writeText(promptText);
    alert('Prompt e dados da reunião copiados para a área de transferência! Cole diretamente no ChatGPT.');
  };

  // Copy for Word
  const handleCopyForWord = () => {
    const textHtml = buildOfficialAtaText(meetingState, headerTitle, headerSubtitle, footerText);
    navigator.clipboard.writeText(textHtml);
    setCopiedWord(true);
    setTimeout(() => setCopiedWord(false), 2000);
  };

  // Print PDF
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const ataText = buildOfficialAtaText(meetingState, headerTitle, headerSubtitle, footerText);
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ata Oficial - ${meetingState.title}</title>
            <style>
              @page { 
                size: A4; 
                margin-top: 3.5cm; 
                margin-bottom: 3.0cm; 
                margin-left: 2.5cm; 
                margin-right: 2.5cm; 
              }
              body { 
                font-family: 'Times New Roman', Times, serif; 
                padding: 0; 
                margin: 0; 
                color: #111827; 
                line-height: 1.6; 
                font-size: 11pt; 
              }
              .header-box { 
                position: fixed; 
                top: -3.0cm; 
                left: 0; 
                right: 0; 
                height: 2.5cm; 
                border-bottom: 2px solid #0f172a; 
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
              }
              .header-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a; }
              .header-sub { font-size: 9pt; color: #475569; text-transform: uppercase; }
              .logo-img { max-height: 50px; max-width: 140px; object-fit: contain; }
              .footer-box { 
                position: fixed; 
                bottom: -2.5cm; 
                left: 0; 
                right: 0; 
                height: 2.0cm; 
                border-top: 1px solid #cbd5e1; 
                text-align: center; 
                font-size: 8pt; 
                color: #64748b; 
                padding-top: 8px;
              }
              .content { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <div class="header-box">
              <div>
                <div class="header-title">${headerTitle}</div>
                <div class="header-sub">${headerSubtitle}</div>
              </div>
              ${headerLogoUrl ? `<img src="${headerLogoUrl}" class="logo-img" />` : ''}
            </div>
            <div class="content">${ataText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="footer-box">${footerText}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 600);
    }
  };

  // Helper to build full official text with Norms Reference section at bottom
  function buildOfficialAtaText(m: Meeting, hTitle: string, hSub: string, fText: string): string {
    const dateFormatted = m.date ? m.date.split('-').reverse().join('/') : 'Data N/I';
    const presentList = (m.presentParticipants && m.presentParticipants.length > 0) ? m.presentParticipants.join(', ') : (m.participants.join(', ') || 'Não especificados');
    const absentList = (m.absentParticipants && m.absentParticipants.length > 0) ? m.absentParticipants.join(', ') : 'Nenhum participante ausente registrado';

    let body = `ATA DA REUNIÃO DO ${m.projectName ? m.projectName.toUpperCase() : 'COMITÊ GESTOR'}\n\n`;
    body += `Data: ${dateFormatted}\n`;
    body += `Horário: ${m.time || '10:00'} | Local: ${m.location || 'CTVacinas'}\n`;
    body += `Moderador: ${m.moderator || 'Não informado'}\n`;
    body += `Participantes Presentes: ${presentList}\n`;
    body += `Ausências Justificadas: ${absentList}\n\n`;
    body += `========================================================================\n`;
    body += `DELIBERAÇÕES E ENCAMINHAMENTOS POR PAUTA\n`;
    body += `========================================================================\n\n`;

    const allReferencedNormsMap = new Map<string, { std: RegulatoryStandard; pautaTitles: string[] }>();

    m.agendaItems.forEach((agenda, idx) => {
      body += `PAUTA ${idx + 1}: ${agenda.title.toUpperCase()}\n`;
      if (agenda.description) body += `Objetivo: ${agenda.description}\n`;
      
      // Collect discussion notes
      if (agenda.discussionNotes && agenda.discussionNotes.length > 0) {
        body += `Discussões / Anotações:\n`;
        agenda.discussionNotes.forEach(n => {
          body += `   • [${n.time}] ${n.author}: ${n.text}\n`;
        });
      } else if (agenda.discussions) {
        body += `Discussões: ${agenda.discussions}\n`;
      } else {
        body += `Discussões: Sem notas registradas.\n`;
      }

      body += `Decisão Final: ${agenda.decisions || 'Sem decisão final registrada.'}\n`;

      if (agenda.actionItems && agenda.actionItems.length > 0) {
        body += `Encaminhamentos:\n`;
        agenda.actionItems.forEach(act => {
          body += `   [ ] Ação: ${act.action} | Responsável: ${act.responsible || 'A definir'} | Prazo: ${act.dueDate || 'S/P'}\n`;
        });
      }

      // Collect norms for reference section
      if (agenda.linkedRegulatoryStandardIds && agenda.linkedRegulatoryStandardIds.length > 0) {
        agenda.linkedRegulatoryStandardIds.forEach(normId => {
          const std = regulatoryStandards.find(s => s.id === normId);
          if (std) {
            if (!allReferencedNormsMap.has(std.id)) {
              allReferencedNormsMap.set(std.id, { std, pautaTitles: [agenda.title] });
            } else {
              allReferencedNormsMap.get(std.id)?.pautaTitles.push(agenda.title);
            }
          }
        });
      }

      body += `\n------------------------------------------------------------------------\n\n`;
    });

    if (m.generalConclusions) {
      body += `CONCLUSÕES GERAIS E PRÓXIMOS PASSOS:\n${m.generalConclusions}\n\n`;
    }

    // SECTION FOR REFERENCED NORMS AT THE END OF ATA
    body += `========================================================================\n`;
    body += `REFERÊNCIAS DE NORMAS REGULATÓRIAS UTILIZADAS NESTA REUNIÃO\n`;
    body += `========================================================================\n`;

    if (allReferencedNormsMap.size === 0) {
      body += `Nenhuma norma regulatória especificamente vinculada às pautas desta reunião.\n`;
    } else {
      Array.from(allReferencedNormsMap.values()).forEach(({ std, pautaTitles }, i) => {
        body += `${i + 1}. [${std.type || 'Norma'}] ${std.name}\n`;
        if (std.summary) body += `   Resumo: ${std.summary}\n`;
        if (std.theme) body += `   Tema: ${std.theme}\n`;
        body += `   Aplicada nas pautas: ${pautaTitles.join(', ')}\n\n`;
      });
    }

    return body;
  }

  // All linked norms in this meeting for quick reference panel
  const allMeetingNormIds = Array.from(
    new Set(meetingState.agendaItems.flatMap(ag => ag.linkedRegulatoryStandardIds || []))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* TOP HEADER BAR (Matching Reference Image) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Title Area */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            title="Voltar para lista de reuniões"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">{meetingState.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                meetingState.status === 'Concluída' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {meetingState.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
              <Calendar size={12} className="text-indigo-600" />
              <span>{meetingState.date} {meetingState.time ? `, ${meetingState.time}` : ''}</span>
              <span>•</span>
              <span>{meetingState.projectName || 'Projeto'}</span>
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons (Matching Screenshot) */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleCopyPautaSummary}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            {copiedPauta ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-indigo-600" />}
            <span>{copiedPauta ? 'Pauta Copiada!' : 'Copiar Pauta'}</span>
          </button>

          <button
            onClick={() => setIsProjecting(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Monitor size={14} className="text-indigo-600" />
            <span>Projetar Pauta</span>
          </button>

          <button
            onClick={handleSaveAll}
            className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-md ${
              saveSuccess ? 'bg-emerald-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            {saveSuccess ? <Check size={16} /> : <CheckCircle2 size={16} />}
            <span>{saveSuccess ? 'Salvo!' : 'Salvar Alterações'}</span>
          </button>

        </div>
      </header>

      {/* MAIN TAB SWITCHER (PAUTA E NOTAS vs ATA FINAL) */}
      <div className="bg-slate-200/60 border-b border-slate-300 px-6 py-2.5 flex justify-center">
        <div className="p-1 bg-slate-300/80 rounded-2xl flex items-center gap-1">
          
          <button
            onClick={() => setActiveTab('pauta_notas')}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'pauta_notas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} className={activeTab === 'pauta_notas' ? 'text-teal-600' : ''} />
            <span>PAUTA E NOTAS</span>
          </button>

          <button
            onClick={() => setActiveTab('ata_final')}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'ata_final'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} />
            <span>ATA FINAL (COLE AQUI)</span>
          </button>

        </div>
      </div>

      {/* VIEW 1: PAUTA E NOTAS */}
      {activeTab === 'pauta_notas' && (
        <div className="p-6 max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: PAUTAS DA REUNIÃO (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Pautas da Reunião ({meetingState.agendaItems.length})
              </h2>

              <button
                onClick={handleAddNewPauta}
                className="px-3.5 py-1.5 text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-xs flex items-center gap-1 transition"
              >
                <Plus size={14} />
                <span>Nova Pauta</span>
              </button>
            </div>

            {/* List of Pautas */}
            <div className="space-y-6">
              {meetingState.agendaItems.map((agenda, idx) => {
                const notes = agenda.discussionNotes || [];
                const actions = agenda.actionItems || [];
                const files = agenda.attachedFiles || [];

                return (
                  <div key={agenda.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
                    
                    {/* Pauta Title & Badges */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 font-black text-sm flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={agenda.title}
                            onChange={e => {
                              const val = e.target.value;
                              setMeetingState(prev => ({
                                ...prev,
                                agendaItems: prev.agendaItems.map(ag => ag.id === agenda.id ? { ...ag, title: val } : ag)
                              }));
                            }}
                            className="text-base font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full"
                          />
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">Moderador: {meetingState.moderator || 'Não informado'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                          <MessageSquare size={12} /> {notes.length}
                        </span>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                          <Paperclip size={12} /> {files.length}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {agenda.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                        {agenda.description}
                      </p>
                    )}

                    {/* TWO COLUMNS INSIDE PAUTA: DISCUSSÕES (LEFT) vs DECISÃO FINAL & ENCAMINHAMENTOS (RIGHT) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                      
                      {/* Left Sub-Column: Discussões sobre a pauta */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Discussões sobre a pauta</h4>
                        
                        {/* Discussion Notes list */}
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {notes.map(note => (
                            <div key={note.id} className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs space-y-1 relative group">
                              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                                <span className="font-black text-emerald-900">{note.author}</span>
                                <button
                                  onClick={() => handleDeleteComment(agenda.id, note.id)}
                                  className="text-slate-400 hover:text-rose-600 transition p-0.5 rounded opacity-0 group-hover:opacity-100"
                                  title="Excluir comentário"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <p className="text-slate-700 leading-snug">{note.text}</p>
                            </div>
                          ))}
                          {notes.length === 0 && (
                            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl">
                              Nenhum comentário adicionado ainda. Digite abaixo para registrar as notas de discussão.
                            </p>
                          )}
                        </div>

                        {/* Input Box to add Comment with Author List Selector */}
                        <div className="flex items-center gap-2 pt-1">
                          <select
                            value={commentAuthors[agenda.id] || currentUser}
                            onChange={e => setCommentAuthors({ ...commentAuthors, [agenda.id]: e.target.value })}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none max-w-[130px] shrink-0 cursor-pointer"
                            title="Selecione quem está fazendo este comentário"
                          >
                            <option value={currentUser}>{currentUser} (Você)</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                            {meetingState.participants.filter(p => p !== currentUser && !teamMembers.some(tm => tm.name === p)).map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Adicionar comentário..."
                            value={commentInputs[agenda.id] || ''}
                            onChange={e => setCommentInputs({ ...commentInputs, [agenda.id]: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddComment(agenda.id);
                            }}
                            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                          <button
                            onClick={() => handleAddComment(agenda.id)}
                            className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition shadow-sm shrink-0"
                            title="Enviar Comentário"
                          >
                            <Send size={14} />
                          </button>
                        </div>

                        {/* Linked Regulatory Standards Section with Post-it and Access Links */}
                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <h5 className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                            <BookOpen size={13} className="text-indigo-600" /> Normas Regulatórias Vinculadas
                          </h5>

                          <div className="flex flex-wrap items-center gap-2">
                            {(agenda.linkedRegulatoryStandardIds || []).map(normId => {
                              const std = regulatoryStandards.find(s => s.id === normId);
                              if (!std) return null;

                              const hasPostIt = Boolean(std.keyNotes && std.keyNotes.trim().length > 0) || Boolean(std.summary && std.summary.trim().length > 0);
                              const normLink = std.documentLink || std.notebookLMLink;

                              return (
                                <div key={normId} className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-amber-900 shadow-xs">
                                  {hasPostIt ? (
                                    <span
                                      className="px-2 py-0.5 bg-amber-300 text-amber-950 font-black text-[10px] rounded-md flex items-center gap-1 shrink-0"
                                      title={std.keyNotes || std.summary}
                                    >
                                      📌 {std.keyNotes || std.summary}
                                    </span>
                                  ) : (
                                    <span>[{std.type || 'Norma'}] {std.name}</span>
                                  )}

                                  {normLink && (
                                    <a
                                      href={normLink.startsWith('http') ? normLink : `https://${normLink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-0.5 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg transition inline-flex items-center gap-1 text-[10px] font-black"
                                      title="Acessar documento da norma"
                                    >
                                      <ExternalLink size={10} />
                                      <span>Link de Acesso</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}

                            {(!agenda.linkedRegulatoryStandardIds || agenda.linkedRegulatoryStandardIds.length === 0) && (
                              <span className="text-[11px] text-slate-400 italic">Nenhuma norma especificamente vinculada.</span>
                            )}
                          </div>
                        </div>

                        {/* Attached Files Section */}
                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                              <Paperclip size={13} className="text-teal-600" /> Arquivos da Pauta ({(agenda.attachedFiles || []).length})
                            </h5>

                            <label className="cursor-pointer px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-bold text-[10px] flex items-center gap-1 transition">
                              <Plus size={12} />
                              <span>Anexar Arquivo</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={e => handleFileUploadForPauta(agenda.id, e.target.files)}
                              />
                            </label>
                          </div>

                          <div className="space-y-1.5">
                            {(agenda.attachedFiles || []).map(file => (
                              <div key={file.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                  <FileText size={14} className="text-teal-600 shrink-0" />
                                  <input
                                    type="text"
                                    value={file.name}
                                    onChange={e => handleRenamePautaFile(agenda.id, file.id, e.target.value)}
                                    className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 outline-none truncate w-full text-xs"
                                    title="Clique para editar nome do arquivo"
                                  />
                                  {file.size && <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {file.dataUrl && (
                                    <a
                                      href={file.dataUrl}
                                      download={file.name}
                                      className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                                      title="Baixar arquivo"
                                    >
                                      <Download size={13} />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleDeletePautaFile(agenda.id, file.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Excluir arquivo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {(!agenda.attachedFiles || agenda.attachedFiles.length === 0) && (
                              <p className="text-[11px] text-slate-400 italic">Nenhum arquivo anexado a esta pauta ainda.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right Sub-Column: Decisão Final & Encaminhamentos */}
                      <div className="space-y-4">
                        
                        {/* Decisão Final */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Decisão Final</h4>
                          <textarea
                            rows={3}
                            value={agenda.decisions || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setMeetingState(prev => ({
                                ...prev,
                                agendaItems: prev.agendaItems.map(ag => ag.id === agenda.id ? { ...ag, decisions: val } : ag)
                              }));
                            }}
                            placeholder="Aprovado com ajustes, pendente de homologação..."
                            className="w-full p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl text-xs text-slate-800 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Encaminhamentos */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Encaminhamentos</h4>
                          
                          <div className="space-y-2">
                            {actions.map(act => (
                              <div key={act.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={act.status === 'Concluído'}
                                    onChange={() => handleToggleActionStatus(agenda.id, act.id)}
                                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span className={`font-medium ${act.status === 'Concluído' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {act.action}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                  {act.responsible} • {act.dueDate}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Add Encaminhamento row */}
                          <div className="p-2.5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                            <input
                              type="text"
                              placeholder="Novo encaminhamento..."
                              value={newActionText[agenda.id] || ''}
                              onChange={e => setNewActionText({ ...newActionText, [agenda.id]: e.target.value })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Responsável"
                                value={newActionResp[agenda.id] || ''}
                                onChange={e => setNewActionResp({ ...newActionResp, [agenda.id]: e.target.value })}
                                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                              />
                              <input
                                type="date"
                                value={newActionDate[agenda.id] || ''}
                                onChange={e => setNewActionDate({ ...newActionDate, [agenda.id]: e.target.value })}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                              />
                              <button
                                onClick={() => handleAddActionItem(agenda.id)}
                                className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition shrink-0"
                              >
                                + Adicionar
                              </button>
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* RIGHT COLUMN: SIDEBAR PANELS (1 Col) */}
          <div className="space-y-6">
            
            {/* Quick Actions (ChatGPT / Draft) */}
            <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-3 shadow-md">
              <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider block">Inteligência & Auxílio</span>
              
              <button
                onClick={handleCopyForChatGPT}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Sparkles size={16} />
                <span>Copiar Dados p/ ChatGPT</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ata_final');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                <FileText size={16} className="text-teal-400" />
                <span>Gerar Rascunho Interno</span>
              </button>
            </div>

            {/* NORMAS VINCULADAS PANEL */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <BookOpen size={16} className="text-indigo-600" /> Normas Vinculadas
                </h3>
              </div>

              <div className="space-y-2">
                {allMeetingNormIds.map(normId => {
                  const std = regulatoryStandards.find(s => s.id === normId);
                  if (!std) return null;
                  return (
                    <div key={normId} className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                      <span className="font-black text-amber-900 block">[{std.type || 'Norma'}] {std.name}</span>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{std.summary || 'Instrução normativa técnica aplicada ao projeto.'}</p>
                    </div>
                  );
                })}
                {allMeetingNormIds.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nenhuma norma regulatória vinculada às pautas desta reunião ainda.</p>
                )}
              </div>
            </div>

            {/* ARQUIVOS DA PAUTA PANEL */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Paperclip size={16} className="text-indigo-600" /> Arquivos da Pauta
                </h3>
              </div>

              <div className="space-y-2">
                {meetingState.agendaItems.flatMap(ag => ag.attachedFiles || []).map(file => (
                  <div key={file.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-teal-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{file.name}</span>
                    </div>
                    {file.size && <span className="text-[10px] text-slate-400 shrink-0">{file.size}</span>}
                  </div>
                ))}
                {meetingState.agendaItems.flatMap(ag => ag.attachedFiles || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nenhum arquivo anexado a nenhuma pauta ainda.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: ATA FINAL (COLE AQUI) */}
      {activeTab === 'ata_final' && (
        <div className="p-6 max-w-5xl mx-auto w-full flex-1 space-y-6">
          
          {/* Action Toolbar for Official Document */}
          <div className="bg-slate-900 text-white p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyForWord}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
              >
                {copiedWord ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedWord ? 'Copiado para Word!' : 'Copiar para Word'}</span>
              </button>

              <button
                onClick={() => logoInputRef.current?.click()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
              >
                <ImageIcon size={14} className="text-teal-400" />
                <span>Anexar Logo/Imagem no Cabeçalho</span>
              </button>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPdf}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-md"
              >
                <Printer size={14} />
                <span>GERAR E BAIXAR ATA OFICIAL (PDF)</span>
              </button>

              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-md"
              >
                <Mail size={14} />
                <span>Enviar por E-mail</span>
              </button>
            </div>

          </div>

          {/* Header/Footer Configuration Collapsible Bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Settings size={16} className="text-indigo-600" /> Margens & Cabeçalho / Rodapé Oficial (3,5 cm Cabeçalho | 3,0 cm Rodapé)
              </span>
              {headerLogoUrl && (
                <button
                  onClick={() => setHeaderLogoUrl('')}
                  className="text-rose-600 hover:underline font-bold text-[11px]"
                >
                  Remover Logo do Cabeçalho
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Título do Cabeçalho</label>
                <input
                  type="text"
                  value={headerTitle}
                  onChange={e => setHeaderTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Rodapé Oficial</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* A4 OFFICIAL DOCUMENT MOCKUP (Matching Screenshot) */}
          <div className="bg-slate-300 p-8 rounded-3xl flex justify-center shadow-inner overflow-x-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl min-h-[900px] p-12 flex flex-col justify-between border border-slate-200 text-slate-900 font-serif relative">
              
              {/* CABEÇALHO OFICIAL (3.5 cm spacing) */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">{headerTitle}</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{headerSubtitle}</p>
                  <p className="text-[9px] font-bold text-teal-700 tracking-wider mt-1">CABEÇALHO OFICIAL (3,5 cm)</p>
                </div>

                {/* Uploaded Company Logo (like the green "G" logo in image 1) */}
                {headerLogoUrl ? (
                  <img src={headerLogoUrl} alt="Logo" className="h-14 w-auto object-contain rounded-lg shrink-0 shadow-sm border border-slate-100" />
                ) : (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 cursor-pointer transition"
                    title="Clique para enviar logo da empresa"
                  >
                    <ImageIcon size={20} />
                    <span className="text-[8px] font-bold">Logo</span>
                  </div>
                )}
              </div>

              {/* DOCUMENT CONTENT */}
              <div className="flex-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-900 text-justify">
                {buildOfficialAtaText(meetingState, headerTitle, headerSubtitle, footerText)}
              </div>

              {/* RODAPÉ OFICIAL (3.0 cm spacing) */}
              <div className="border-t border-slate-300 pt-4 mt-8 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{footerText}</p>
                <p className="text-[9px] font-bold text-teal-700 tracking-wider">RODAPÉ OFICIAL (3,0 cm) • PÁGINA 1 DE 1</p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* PROJECTION MODE OVERLAY (Projetar Pauta Editável) */}
      {isProjecting && (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col text-white p-6 md:p-8 animate-in fade-in duration-200 overflow-y-auto">
          <header className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-teal-400 block">Modo Projeção em Reunião</span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{meetingState.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">
                Pauta {projectionIndex + 1} de {meetingState.agendaItems.length}
              </span>
              <button
                onClick={() => setIsProjecting(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition"
              >
                Sair da Projeção
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto w-full py-6 space-y-6">
            {meetingState.agendaItems[projectionIndex] ? (
              (() => {
                const projAg = meetingState.agendaItems[projectionIndex];
                const projNotes = projAg.discussionNotes || [];

                return (
                  <div className="p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl">
                    
                    {/* Header Badge & Title */}
                    <div className="space-y-2">
                      <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-xs font-black uppercase">
                        Pauta N.º {projectionIndex + 1}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                        {projAg.title}
                      </h3>
                      {projAg.description && (
                        <p className="text-sm md:text-base text-slate-300 font-light">
                          {projAg.description}
                        </p>
                      )}
                    </div>

                    {/* Linked Norms in Projection */}
                    {(projAg.linkedRegulatoryStandardIds && projAg.linkedRegulatoryStandardIds.length > 0) && (
                      <div className="pt-4 border-t border-slate-800 space-y-2">
                        <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                          <BookOpen size={15} /> Normas Regulatórias Aplicadas nesta Pauta
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {projAg.linkedRegulatoryStandardIds.map(normId => {
                            const std = regulatoryStandards.find(s => s.id === normId);
                            if (!std) return null;
                            const hasPostIt = Boolean(std.keyNotes && std.keyNotes.trim().length > 0) || Boolean(std.summary && std.summary.trim().length > 0);
                            const normLink = std.documentLink || std.notebookLMLink;

                            return (
                              <div key={normId} className="flex items-center gap-2 bg-amber-950/60 border border-amber-800/80 px-3 py-1.5 rounded-2xl text-xs font-bold text-amber-200">
                                {hasPostIt ? (
                                  <span className="px-2 py-0.5 bg-amber-400 text-amber-950 font-black text-[10px] rounded flex items-center gap-1">
                                    📌 {std.keyNotes || std.summary}
                                  </span>
                                ) : (
                                  <span>[{std.type || 'Norma'}] {std.name}</span>
                                )}

                                {normLink && (
                                  <a
                                    href={normLink.startsWith('http') ? normLink : `https://${normLink}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg transition inline-flex items-center gap-1 text-[10px] font-bold"
                                  >
                                    <ExternalLink size={10} />
                                    <span>Link de Acesso</span>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Two Column Interactive Projection Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                      
                      {/* Left: Discussions/Comments */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-teal-400" /> Discussões em Tempo Real
                        </h4>

                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                          {projNotes.map(n => (
                            <div key={n.id} className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-xs space-y-1">
                              <span className="font-bold text-teal-300 block">{n.author}</span>
                              <p className="text-slate-200 leading-snug">{n.text}</p>
                            </div>
                          ))}
                          {projNotes.length === 0 && (
                            <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-2xl">
                              Nenhum comentário registrado nesta pauta. Adicione abaixo durante a discussão.
                            </p>
                          )}
                        </div>

                        {/* Comment Input in Projection Mode */}
                        <div className="flex items-center gap-2 pt-1">
                          <select
                            value={commentAuthors[projAg.id] || currentUser}
                            onChange={e => setCommentAuthors({ ...commentAuthors, [projAg.id]: e.target.value })}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none max-w-[120px] shrink-0"
                          >
                            <option value={currentUser}>{currentUser}</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                            {meetingState.participants.filter(p => p !== currentUser && !teamMembers.some(tm => tm.name === p)).map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Registrar fala/comentário..."
                            value={commentInputs[projAg.id] || ''}
                            onChange={e => setCommentInputs({ ...commentInputs, [projAg.id]: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddComment(projAg.id);
                            }}
                            className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => handleAddComment(projAg.id)}
                            className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shrink-0"
                          >
                            + Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Right: Decisão Final Live Textarea */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400" /> Decisão Final do Comitê
                        </h4>
                        <textarea
                          rows={6}
                          value={projAg.decisions || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setMeetingState(prev => ({
                              ...prev,
                              agendaItems: prev.agendaItems.map(ag => ag.id === projAg.id ? { ...ag, decisions: val } : ag)
                            }));
                          }}
                          placeholder="Digite aqui o texto da decisão final da pauta..."
                          className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-emerald-300 font-medium outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                        />
                      </div>

                    </div>

                  </div>
                );
              })()
            ) : (
              <p className="text-center text-slate-500">Nenhuma pauta cadastrada nesta reunião.</p>
            )}
          </main>

          <footer className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
            <button
              disabled={projectionIndex === 0}
              onClick={() => setProjectionIndex(prev => Math.max(0, prev - 1))}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-2xl font-bold text-sm flex items-center gap-2 transition"
            >
              <ChevronLeft size={18} /> Pauta Anterior
            </button>

            <button
              disabled={projectionIndex >= meetingState.agendaItems.length - 1}
              onClick={() => setProjectionIndex(prev => Math.min(meetingState.agendaItems.length - 1, prev + 1))}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 rounded-2xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-teal-600/30"
            >
              <span>Próxima Pauta</span> <ChevronRight size={18} />
            </button>
          </footer>
        </div>
      )}

      {/* EMAIL MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <header className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail size={20} className="text-teal-400" />
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-300 tracking-wider block">Envio de Ata</span>
                  <h3 className="text-base font-black uppercase tracking-tight">Notificar Participantes</h3>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300">
                ✕
              </button>
            </header>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs"
                />
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-black uppercase text-slate-500 block">
                  Destinatários ({selectedEmails.length})
                </label>

                <select
                  onChange={e => {
                    if (e.target.value && !selectedEmails.includes(e.target.value)) {
                      setSelectedEmails([...selectedEmails, e.target.value]);
                      e.target.value = '';
                    }
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="">+ Selecionar e-mail utilizado recentemente...</option>
                  {savedEmails.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="email"
                    placeholder="Novo e-mail (ex: diretor@ctvacinas.br)..."
                    value={newEmailInput}
                    onChange={e => setNewEmailInput(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newEmailInput.includes('@')) {
                        if (!selectedEmails.includes(newEmailInput)) setSelectedEmails([...selectedEmails, newEmailInput]);
                        if (!savedEmails.includes(newEmailInput)) setSavedEmails([...savedEmails, newEmailInput]);
                        setNewEmailInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedEmails.map(em => (
                    <span key={em} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-[11px] font-bold flex items-center gap-1">
                      <span>{em}</span>
                      <button onClick={() => setSelectedEmails(selectedEmails.filter(e => e !== em))} className="text-slate-400 hover:text-rose-600">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {emailSentSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <Check size={18} className="text-emerald-600" />
                  <span>Ata enviada com sucesso para os destinatários!</span>
                </div>
              )}
            </div>

            <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs">
                Cancelar
              </button>
              <button
                disabled={emailSending}
                onClick={() => {
                  setEmailSending(true);
                  setTimeout(() => {
                    setEmailSending(false);
                    setEmailSentSuccess(true);
                    setTimeout(() => {
                      setEmailSentSuccess(false);
                      setIsEmailModalOpen(false);
                    }, 1800);
                  }, 1200);
                }}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md"
              >
                {emailSending ? 'Enviando...' : 'Enviar Ata'}
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
};
