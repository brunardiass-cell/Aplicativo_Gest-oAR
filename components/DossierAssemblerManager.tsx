import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, 
  Task, 
  DossierContribution, 
  DossierChapterId,
  DossierContributionStatus,
  DossierContributionType,
  DDCMChapterDef
} from '../types';
import { DDCM_CHAPTERS, getProjectDossierChapters } from '../constants/dossier';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  AlignmentType 
} from 'docx';
import { 
  BookOpen, 
  Download, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  FolderKanban, 
  FileCheck2, 
  Layers, 
  ShieldCheck, 
  User, 
  Calendar,
  Search,
  Filter,
  Clock,
  AlertCircle,
  Paperclip,
  FormInput,
  History,
  Edit3,
  Save,
  X,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  MessageSquare,
  Building2,
  ExternalLink,
  ChevronRight,
  Settings
} from 'lucide-react';

interface DossierAssemblerManagerProps {
  projects: Project[];
  tasks: Task[];
  onUpdateProject?: (project: Project) => void;
  onUpdateTask?: (task: Task) => void;
  currentUser?: string;
}

export const DossierAssemblerManager: React.FC<DossierAssemblerManagerProps> = ({
  projects,
  tasks,
  onUpdateProject,
  onUpdateTask,
  currentUser = 'Usuário'
}) => {
  // Main Navigation Tabs: 'review' | 'consolidated' | 'structure'
  const [mainTab, setMainTab] = useState<'review' | 'consolidated' | 'structure'>('review');

  // --- TAB 1: REVIEW & APPROVAL STATES ---
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewProjectFilter, setReviewProjectFilter] = useState('todos');
  const [reviewChapterFilter, setReviewChapterFilter] = useState('todos');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('todos');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('todos');

  const [editingContribution, setEditingContribution] = useState<DossierContribution | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [statusSelect, setStatusSelect] = useState<DossierContributionStatus>('Rascunho');
  const [editContentInput, setEditContentInput] = useState('');

  // --- TAB 2: CONSOLIDATED DOSSIER STATES ---
  const [consolidatedProjectFilter, setConsolidatedProjectFilter] = useState<string>('todos');
  const [activeChapterTab, setActiveChapterTab] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // --- TAB 3: PROJECT CHAPTER STRUCTURE STATES ---
  const [selectedStructureProjectId, setSelectedStructureProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [chaptersEditState, setChaptersEditState] = useState<DDCMChapterDef[]>([]);
  const [saveStructureFeedback, setSaveStructureFeedback] = useState(false);

  // Selected project object for structure editing
  const currentStructureProject = useMemo(() => {
    return projects.find(p => p.id === selectedStructureProjectId);
  }, [projects, selectedStructureProjectId]);

  // Load project's chapters when selected project changes
  useEffect(() => {
    if (currentStructureProject) {
      setChaptersEditState(getProjectDossierChapters(currentStructureProject));
    } else {
      setChaptersEditState(DDCM_CHAPTERS);
    }
  }, [currentStructureProject]);

  // Handle saving modified chapters to project
  const handleSaveProjectChapters = () => {
    if (!currentStructureProject || !onUpdateProject) return;
    const updatedProject: Project = {
      ...currentStructureProject,
      dossierChapters: chaptersEditState
    };
    onUpdateProject(updatedProject);
    setSaveStructureFeedback(true);
    setTimeout(() => setSaveStructureFeedback(false), 3000);
  };

  const handleResetProjectChapters = () => {
    setChaptersEditState(DDCM_CHAPTERS);
  };

  const handleAddCustomChapter = () => {
    const newId = `cap_custom_${Date.now()}`;
    const nextCode = `${chaptersEditState.length + 1}.0`;
    const newChapter: DDCMChapterDef = {
      id: newId,
      code: nextCode,
      title: `Capítulo ${chaptersEditState.length + 1} - Novo Tópico Personalizado`,
      shortTitle: `Novo Tópico ${chaptersEditState.length + 1}`,
      description: 'Descreva os requisitos técnicos ou regulatórios deste capítulo ou seção.'
    };
    setChaptersEditState([...chaptersEditState, newChapter]);
  };

  const handleRemoveChapter = (chapterId: string) => {
    if (chaptersEditState.length <= 1) return;
    setChaptersEditState(chaptersEditState.filter(c => c.id !== chapterId));
  };

  const handleUpdateChapterField = (id: string, field: keyof DDCMChapterDef, value: string) => {
    setChaptersEditState(prev => prev.map(ch => {
      if (ch.id === id) {
        return { ...ch, [field]: value };
      }
      return ch;
    }));
  };

  // --- EXTRACT ALL CONTRIBUTIONS (PROJECTS & TASKS) ---
  const allContributions = useMemo(() => {
    const list: DossierContribution[] = [];

    projects.forEach(proj => {
      proj.macroActivities?.forEach(macro => {
        macro.microActivities?.forEach(micro => {
          if (micro.generatesRegulatoryContent && micro.dossierContribution) {
            list.push({
              ...micro.dossierContribution,
              projectId: proj.id,
              projectName: proj.name,
              macroActivityId: macro.id,
              macroActivityName: macro.name,
              activityId: micro.id,
              activityName: micro.name
            });
          }
        });
      });
    });

    tasks.forEach(t => {
      if (t.generatesRegulatoryContent && t.dossierContribution) {
        list.push({
          ...t.dossierContribution,
          projectId: 'task_' + t.id,
          projectName: t.project || 'Geral',
          activityId: t.id,
          activityName: t.activity
        });
      }
    });

    return list;
  }, [projects, tasks]);

  // Filtered contributions for Review Tab
  const filteredReviewContributions = useMemo(() => {
    return allContributions.filter(c => {
      if (reviewProjectFilter !== 'todos' && c.projectName !== reviewProjectFilter) return false;
      if (reviewChapterFilter !== 'todos' && c.chapterId !== reviewChapterFilter) return false;
      if (reviewStatusFilter !== 'todos' && c.status !== reviewStatusFilter) return false;
      if (reviewTypeFilter !== 'todos' && c.type !== reviewTypeFilter) return false;

      if (reviewSearchTerm.trim()) {
        const term = reviewSearchTerm.toLowerCase();
        const matchesName = c.activityName.toLowerCase().includes(term);
        const matchesProject = (c.projectName || '').toLowerCase().includes(term);
        const matchesContent = (c.content || '').toLowerCase().includes(term);
        const matchesAuthor = (c.author || '').toLowerCase().includes(term);
        const matchesTitle = (c.formFields?.title || '').toLowerCase().includes(term);
        if (!matchesName && !matchesProject && !matchesContent && !matchesAuthor && !matchesTitle) {
          return false;
        }
      }

      return true;
    });
  }, [
    allContributions,
    reviewProjectFilter,
    reviewChapterFilter,
    reviewStatusFilter,
    reviewTypeFilter,
    reviewSearchTerm
  ]);

  // Filtered Approved Contributions for Consolidated Tab
  const approvedContributions = useMemo(() => {
    return allContributions.filter(c => c.status === 'Aprovado');
  }, [allContributions]);

  const filteredApprovedContributions = useMemo(() => {
    if (consolidatedProjectFilter === 'todos') return approvedContributions;
    return approvedContributions.filter(c => c.projectName === consolidatedProjectFilter);
  }, [approvedContributions, consolidatedProjectFilter]);

  // Unique Project Names list for filters
  const uniqueProjectNames = useMemo(() => {
    const set = new Set<string>();
    allContributions.forEach(c => {
      if (c.projectName) set.add(c.projectName);
    });
    return Array.from(set);
  }, [allContributions]);

  // Active Chapters for Consolidated View (based on selected project or default)
  const activeConsolidatedProjectObj = useMemo(() => {
    if (consolidatedProjectFilter === 'todos') return projects[0];
    return projects.find(p => p.name === consolidatedProjectFilter);
  }, [projects, consolidatedProjectFilter]);

  const activeConsolidatedChapters = useMemo(() => {
    return getProjectDossierChapters(activeConsolidatedProjectObj);
  }, [activeConsolidatedProjectObj]);

  // Group approved contributions by chapter
  const chapterApprovedContributionsMap = useMemo(() => {
    const map: Record<string, DossierContribution[]> = {};
    activeConsolidatedChapters.forEach(ch => {
      map[ch.id] = [];
    });

    filteredApprovedContributions.forEach(c => {
      if (!map[c.chapterId]) {
        map[c.chapterId] = [];
      }
      map[c.chapterId].push(c);
    });

    return map;
  }, [activeConsolidatedChapters, filteredApprovedContributions]);

  // --- SAVE CONTRIBUTION CHANGES (REVIEW TAB) ---
  const handleSaveContributionChanges = (updatedContrib: DossierContribution) => {
    let updated = false;

    projects.forEach(proj => {
      let projModified = false;
      const newMacros = proj.macroActivities?.map(macro => {
        let macroModified = false;
        const newMicros = macro.microActivities?.map(micro => {
          if (micro.id === updatedContrib.activityId) {
            projModified = true;
            macroModified = true;
            return {
              ...micro,
              generatesRegulatoryContent: true,
              dossierContribution: updatedContrib
            };
          }
          return micro;
        });
        if (macroModified) {
          return { ...macro, microActivities: newMicros };
        }
        return macro;
      });

      if (projModified && onUpdateProject) {
        updated = true;
        onUpdateProject({
          ...proj,
          macroActivities: newMacros
        });
      }
    });

    if (!updated && onUpdateTask) {
      tasks.forEach(t => {
        if (t.id === updatedContrib.activityId) {
          onUpdateTask({
            ...t,
            generatesRegulatoryContent: true,
            dossierContribution: updatedContrib
          });
        }
      });
    }

    setEditingContribution(null);
  };

  const handleQuickStatusChange = (contrib: DossierContribution, newStatus: DossierContributionStatus) => {
    const updated: DossierContribution = {
      ...contrib,
      status: newStatus,
      reviewer: currentUser,
      updatedAt: new Date().toISOString(),
      versionsHistory: [
        {
          version: contrib.version + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser,
          type: contrib.type,
          content: contrib.content,
          attachmentUrl: contrib.attachmentUrl,
          attachmentName: contrib.attachmentName,
          formFields: contrib.formFields,
          status: newStatus,
          reviewNotes: contrib.reviewNotes
        },
        ...(contrib.versionsHistory || [])
      ],
      version: contrib.version + 1
    };
    handleSaveContributionChanges(updated);
  };

  // --- EXPORT TO WORD (.docx) ---
  const handleExportToWord = async () => {
    try {
      setIsExporting(true);

      const docChildren: any[] = [];

      // Title & Cover Header
      docChildren.push(
        new Paragraph({
          text: 'CENTRO DE TECNOLOGIA EM VACINAS - CTVACINAS',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `DOSSIÊ DE DESENVOLVIMENTO CLÍNICO DE MEDICAMENTO (DDCM)`,
              bold: true,
              size: 28,
              color: '0F172A'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Projeto: ${consolidatedProjectFilter === 'todos' ? 'Consolidado Geral de Projetos' : consolidatedProjectFilter}`,
              bold: true,
              size: 22,
              color: '0D9488'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Documento Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
              italics: true,
              size: 18,
              color: '64748B'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      // Iterate through active project chapters
      activeConsolidatedChapters.forEach((chDef) => {
        const contribs = chapterApprovedContributionsMap[chDef.id] || [];

        // Chapter Header
        docChildren.push(
          new Paragraph({
            text: `${chDef.code} - ${chDef.title}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 150 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: chDef.description,
                italics: true,
                size: 20,
                color: '475569'
              })
            ],
            spacing: { after: 200 }
          })
        );

        if (contribs.length === 0) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '[Nenhuma contribuição aprovada registrada para este capítulo até o momento]',
                  italics: true,
                  color: '94A3B8'
                })
              ],
              spacing: { after: 300 }
            })
          );
        } else {
          contribs.forEach((contrib, idx) => {
            // Activity Title
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${chDef.code}.${idx + 1} ${contrib.activityName}`,
                    bold: true,
                    size: 22,
                    color: '1E293B'
                  })
                ],
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Projeto: ${contrib.projectName || 'Geral'} | Autor: ${contrib.author || 'Não identificado'} | Atualizado em: ${new Date(contrib.updatedAt).toLocaleDateString('pt-BR')}`,
                    size: 18,
                    color: '64748B'
                  })
                ],
                spacing: { after: 150 }
              })
            );

            // Render Content based on type
            if (contrib.type === 'texto') {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: contrib.content || 'Sem texto preenchido.',
                      size: 21
                    })
                  ],
                  spacing: { after: 200 }
                })
              );
            } else if (contrib.type === 'documento') {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Documento Anexo: ${contrib.attachmentName || 'Documento sem nome'}\nURL: ${contrib.attachmentUrl || 'Não informada'}\n`,
                      size: 20
                    }),
                    new TextRun({
                      text: `Resumo: ${contrib.content || 'Sem resumo adicional'}`,
                      italics: true,
                      size: 20
                    })
                  ],
                  spacing: { after: 200 }
                })
              );
            } else if (contrib.type === 'formulario' && contrib.formFields) {
              const ff = contrib.formFields;
              const tableRows = [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Campo Técnico', bold: true })] })],
                      width: { size: 30, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Informação / Conteúdo Aprovado', bold: true })] })],
                      width: { size: 70, type: WidthType.PERCENTAGE }
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Título do Relatório' })] }),
                    new TableCell({ children: [new Paragraph({ text: ff.title || '-' })] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Resumo da Metodologia' })] }),
                    new TableCell({ children: [new Paragraph({ text: ff.methodologySummary || '-' })] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Principais Resultados' })] }),
                    new TableCell({ children: [new Paragraph({ text: ff.keyResults || '-' })] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Conclusão Regulatório' })] }),
                    new TableCell({ children: [new Paragraph({ text: ff.regulatoryConclusion || '-' })] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Especificações Técnicas' })] }),
                    new TableCell({ children: [new Paragraph({ text: ff.specifications || '-' })] })
                  ]
                })
              ];

              docChildren.push(
                new Table({
                  rows: tableRows,
                  width: { size: 100, type: WidthType.PERCENTAGE }
                }),
                new Paragraph({ text: '', spacing: { after: 200 } })
              );
            }

            if (contrib.reviewNotes) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Parecer de Aprovação: ${contrib.reviewNotes}`,
                      italics: true,
                      size: 18,
                      color: '15803D'
                    })
                  ],
                  spacing: { after: 250 }
                })
              );
            }
          });
        }
      });

      const doc = new Document({
        sections: [{ children: docChildren }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DDCM_Dossie_Consolidado_${consolidatedProjectFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar Word:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Main Banner with Title & Tab Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                <BookOpen size={24} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  Dossiê (DDCM)
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase border border-emerald-500/30">
                    Módulo Regulatório
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl">
              Gerencie a estrutura de módulos do dossiê por projeto, revise e aprove contribuições técnicas e visualize o documento consolidado para submissão à Anvisa.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="bg-slate-800/90 border border-slate-700 p-3 px-5 rounded-2xl flex items-center gap-5 self-start lg:self-auto">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contribuições</p>
              <p className="text-lg font-black text-white">{allContributions.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Aprovados</p>
              <p className="text-lg font-black text-emerald-400">
                {allContributions.filter(c => c.status === 'Aprovado').length}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Em Revisão</p>
              <p className="text-lg font-black text-amber-400">
                {allContributions.filter(c => c.status === 'Em Revisão').length}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-700/80">
          <button
            onClick={() => setMainTab('review')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              mainTab === 'review'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <FileCheck2 size={16} />
            <span>Revisar e Aprovar Contribuições</span>
            {allContributions.filter(c => c.status === 'Em Revisão').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-extrabold rounded-full">
                {allContributions.filter(c => c.status === 'Em Revisão').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('consolidated')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              mainTab === 'consolidated'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <BookOpen size={16} />
            <span>Dossiê Consolidado (Aprovados)</span>
          </button>

          <button
            onClick={() => setMainTab('structure')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              mainTab === 'structure'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Settings size={16} />
            <span>Estrutura e Tópicos por Projeto</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REVISAR E APROVAR CONTRIBUIÇÕES */}
      {/* ========================================================================= */}
      {mainTab === 'review' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={reviewSearchTerm}
                  onChange={(e) => setReviewSearchTerm(e.target.value)}
                  placeholder="Buscar por atividade, projeto, texto ou autor..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Project Filter */}
              <div>
                <select
                  value={reviewProjectFilter}
                  onChange={(e) => setReviewProjectFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="todos">Todos os Projetos</option>
                  {uniqueProjectNames.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={reviewStatusFilter}
                  onChange={(e) => setReviewStatusFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Rascunho">Rascunho</option>
                  <option value="Em Revisão">Em Revisão</option>
                  <option value="Aprovado">Aprovado</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={reviewTypeFilter}
                  onChange={(e) => setReviewTypeFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="todos">Todos os Formatos</option>
                  <option value="texto">Texto Técnico</option>
                  <option value="documento">Anexo PDF/Doc</option>
                  <option value="formulario">Formulário Estruturado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contribution Cards List */}
          {filteredReviewContributions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <FileCheck2 size={48} className="mx-auto text-slate-300" />
              <h3 className="text-base font-black text-slate-700">Nenhuma contribuição encontrada</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não há registros com os filtros selecionados ou nenhuma atividade foi marcada para gerar conteúdo regulatório no DDCM.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviewContributions.map((contrib) => {
                const statusColor = 
                  contrib.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  contrib.status === 'Em Revisão' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-slate-100 text-slate-700 border-slate-300';

                return (
                  <div 
                    key={contrib.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                            {contrib.status}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {contrib.chapterTitle}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {contrib.projectName || 'Geral'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          {contrib.activityName}
                        </h3>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {contrib.status !== 'Aprovado' && (
                          <button
                            onClick={() => handleQuickStatusChange(contrib, 'Aprovado')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                          >
                            <Check size={14} />
                            <span>Aprovar</span>
                          </button>
                        )}
                        {contrib.status !== 'Em Revisão' && (
                          <button
                            onClick={() => handleQuickStatusChange(contrib, 'Em Revisão')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition"
                          >
                            <Clock size={14} />
                            <span>Colocar em Revisão</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingContribution(contrib);
                            setReviewNotesInput(contrib.reviewNotes || '');
                            setStatusSelect(contrib.status);
                            setEditContentInput(contrib.content || '');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                        >
                          <Edit3 size={14} />
                          <span>Revisar / Detalhes</span>
                        </button>
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
                      {contrib.type === 'texto' && (
                        <p className="line-clamp-3 whitespace-pre-wrap font-medium">
                          {contrib.content || 'Sem texto preenchido.'}
                        </p>
                      )}
                      {contrib.type === 'documento' && (
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Paperclip size={14} className="text-indigo-600" />
                            {contrib.attachmentName || 'Anexo de documento'}
                          </p>
                          {contrib.content && (
                            <p className="text-slate-600 italic">{contrib.content}</p>
                          )}
                        </div>
                      )}
                      {contrib.type === 'formulario' && contrib.formFields && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div><span className="font-bold text-slate-900">Título:</span> {contrib.formFields.title || '-'}</div>
                          <div><span className="font-bold text-slate-900">Metodologia:</span> {contrib.formFields.methodologySummary || '-'}</div>
                          <div><span className="font-bold text-slate-900">Resultados:</span> {contrib.formFields.keyResults || '-'}</div>
                          <div><span className="font-bold text-slate-900">Conclusão:</span> {contrib.formFields.regulatoryConclusion || '-'}</div>
                        </div>
                      )}
                    </div>

                    {/* Footer Meta */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Autor: <strong className="text-slate-700">{contrib.author}</strong></span>
                      <span>Versão: <strong className="text-slate-700">v{contrib.version}</strong></span>
                      <span>Atualizado em: <strong className="text-slate-700">{new Date(contrib.updatedAt).toLocaleDateString('pt-BR')}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DOSSIÊ CONSOLIDADO (APROVADOS) */}
      {/* ========================================================================= */}
      {mainTab === 'consolidated' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Export & Project Selection Header Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
                <FolderKanban size={20} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Filtrar Dossiê por Projeto
                </label>
                <select
                  value={consolidatedProjectFilter}
                  onChange={(e) => setConsolidatedProjectFilter(e.target.value)}
                  className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Projetos (Consolidado)</option>
                  {uniqueProjectNames.map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportToWord}
              disabled={isExporting || approvedContributions.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition shadow-md ${
                isExporting || approvedContributions.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <Download size={16} />
              <span>{isExporting ? 'Gerando Documento Word...' : 'Exportar Dossiê em Word (.docx)'}</span>
            </button>
          </div>

          {/* Chapter Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            <button
              onClick={() => setActiveChapterTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap ${
                activeChapterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos os Capítulos
            </button>
            {activeConsolidatedChapters.map((ch) => {
              const count = (chapterApprovedContributionsMap[ch.id] || []).length;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapterTab(ch.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap ${
                    activeChapterTab === ch.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{ch.code} {ch.shortTitle}</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chapters List Content */}
          <div className="space-y-6">
            {activeConsolidatedChapters
              .filter(ch => activeChapterTab === 'all' || activeChapterTab === ch.id)
              .map(chDef => {
                const list = chapterApprovedContributionsMap[chDef.id] || [];

                return (
                  <div 
                    key={chDef.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Chapter Title Bar */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                            {chDef.code}
                          </span>
                          <h2 className="text-base font-black tracking-tight">{chDef.title}</h2>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 font-medium">{chDef.description}</p>
                      </div>
                      <div className="self-start sm:self-auto">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {list.length} {list.length === 1 ? 'seção aprovada' : 'seções aprovadas'}
                        </span>
                      </div>
                    </div>

                    {/* Chapter Items */}
                    <div className="p-6 space-y-4">
                      {list.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Nenhuma contribuição aprovada vinculada a este capítulo para o projeto selecionado.
                        </div>
                      ) : (
                        list.map((item, idx) => (
                          <div 
                            key={item.id}
                            className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                                  {chDef.code}.{idx + 1}
                                </span>
                                <h3 className="text-sm font-black text-slate-900">{item.activityName}</h3>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <span>Projeto: <strong className="text-slate-800">{item.projectName}</strong></span>
                                <span>•</span>
                                <span>Autor: <strong className="text-slate-800">{item.author}</strong></span>
                              </div>
                            </div>

                            {/* Item Content Render */}
                            {item.type === 'texto' && (
                              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                                {item.content}
                              </p>
                            )}
                            {item.type === 'documento' && (
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 font-bold text-indigo-700">
                                  <Paperclip size={14} />
                                  <span>{item.attachmentName || 'Documento Anexo'}</span>
                                  {item.attachmentUrl && (
                                    <a 
                                      href={item.attachmentUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                                    >
                                      Abrir Link <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                                {item.content && <p className="text-slate-600 italic">{item.content}</p>}
                              </div>
                            )}
                            {item.type === 'formulario' && item.formFields && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                                <div>
                                  <span className="font-bold text-slate-900 block">Título do Relatório:</span>
                                  <span className="text-slate-700">{item.formFields.title || '-'}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">Metodologia:</span>
                                  <span className="text-slate-700">{item.formFields.methodologySummary || '-'}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">Principais Resultados:</span>
                                  <span className="text-slate-700">{item.formFields.keyResults || '-'}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">Conclusão Regulatória:</span>
                                  <span className="text-slate-700">{item.formFields.regulatoryConclusion || '-'}</span>
                                </div>
                              </div>
                            )}

                            {item.reviewNotes && (
                              <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 font-medium">
                                <strong>Parecer de Aprovação:</strong> {item.reviewNotes}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ESTRUTURA E TÓPICOS POR PROJETO */}
      {/* ========================================================================= */}
      {mainTab === 'structure' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Project Selection & Save Toolbar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Selecione o Projeto para Personalizar os Módulos/Tópicos do Dossiê
                </label>
                <select
                  value={selectedStructureProjectId}
                  onChange={(e) => setSelectedStructureProjectId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 font-black text-sm p-3 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[280px]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleResetProjectChapters}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  title="Restaurar estrutura padrão da Anvisa (6 Capítulos)"
                >
                  <RotateCcw size={14} />
                  <span>Restaurar Padrão Anvisa</span>
                </button>

                <button
                  onClick={handleAddCustomChapter}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition"
                >
                  <Plus size={14} />
                  <span>Adicionar Tópico/Módulo</span>
                </button>

                <button
                  onClick={handleSaveProjectChapters}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md shadow-emerald-600/20"
                >
                  <Save size={15} />
                  <span>Salvar Estrutura do Projeto</span>
                </button>
              </div>
            </div>

            {saveStructureFeedback && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} />
                <span>Estrutura de módulos e tópicos salva com sucesso para o projeto!</span>
              </div>
            )}
          </div>

          {/* Chapter Editors List */}
          <div className="space-y-4">
            {chaptersEditState.map((ch, index) => (
              <div 
                key={ch.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      Editar Tópico/Seção do Dossiê
                    </h3>
                  </div>

                  {chaptersEditState.length > 1 && (
                    <button
                      onClick={() => handleRemoveChapter(ch.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Excluir este capítulo/seção do projeto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Code */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Código</label>
                    <input
                      type="text"
                      value={ch.code}
                      onChange={(e) => handleUpdateChapterField(ch.id, 'code', e.target.value)}
                      placeholder="ex: 1.0"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Title */}
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Nome / Título Completo do Capítulo</label>
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) => handleUpdateChapterField(ch.id, 'title', e.target.value)}
                      placeholder="ex: Capítulo 1 - Informações Gerais"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Short Title */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Rótulo Curto (Para Abas)</label>
                    <input
                      type="text"
                      value={ch.shortTitle}
                      onChange={(e) => handleUpdateChapterField(ch.id, 'shortTitle', e.target.value)}
                      placeholder="ex: Informações Gerais"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-12 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Descrição / Instrução Técnica Regulatória</label>
                    <textarea
                      rows={2}
                      value={ch.description}
                      onChange={(e) => handleUpdateChapterField(ch.id, 'description', e.target.value)}
                      placeholder="Descreva o escopo regulatório deste tópico..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW & DETAIL EDIT MODAL */}
      {/* ========================================================================= */}
      {editingContribution && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {editingContribution.chapterTitle}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Revisão Técnica: {editingContribution.activityName}
                </h2>
                <p className="text-xs text-slate-500">
                  Projeto: <strong>{editingContribution.projectName}</strong> • Autor: <strong>{editingContribution.author}</strong>
                </p>
              </div>

              <button
                onClick={() => setEditingContribution(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Edit Section */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 block">
                  Conteúdo da Contribuição (Edição e Validação)
                </label>
                {editingContribution.type === 'texto' && (
                  <textarea
                    rows={6}
                    value={editContentInput}
                    onChange={(e) => setEditContentInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                )}
                {editingContribution.type === 'documento' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <p className="font-bold text-slate-900">Anexo: {editingContribution.attachmentName || 'Documento sem nome'}</p>
                    {editingContribution.attachmentUrl && (
                      <a href={editingContribution.attachmentUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                        Abrir Documento Anexo
                      </a>
                    )}
                    <textarea
                      rows={3}
                      value={editContentInput}
                      onChange={(e) => setEditContentInput(e.target.value)}
                      placeholder="Observações do documento..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none"
                    />
                  </div>
                )}
                {editingContribution.type === 'formulario' && editingContribution.formFields && (
                  <div className="grid grid-cols-1 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">Título:</span>
                      <p className="p-2 bg-white rounded-lg border border-slate-200">{editingContribution.formFields.title || '-'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Metodologia:</span>
                      <p className="p-2 bg-white rounded-lg border border-slate-200">{editingContribution.formFields.methodologySummary || '-'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Resultados:</span>
                      <p className="p-2 bg-white rounded-lg border border-slate-200">{editingContribution.formFields.keyResults || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Selector & Parecer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 block">Status da Revisão</label>
                  <select
                    value={statusSelect}
                    onChange={(e) => setStatusSelect(e.target.value as DossierContributionStatus)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Aprovado">Aprovado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 block">Parecer / Notas do Revisor</label>
                  <input
                    type="text"
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    placeholder="Adicione observações ou justificativas para a equipe..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Version History Preview */}
              {editingContribution.versionsHistory && editingContribution.versionsHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History size={14} /> Histórico de Versões ({editingContribution.versionsHistory.length})
                  </h4>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 text-[11px] text-slate-600 pr-1">
                    {editingContribution.versionsHistory.map((v, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span>v{v.version} - {v.updatedBy} ({new Date(v.updatedAt).toLocaleDateString('pt-BR')})</span>
                        <span className="font-bold text-slate-800">{v.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingContribution(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  const updated: DossierContribution = {
                    ...editingContribution,
                    content: editContentInput,
                    status: statusSelect,
                    reviewNotes: reviewNotesInput,
                    reviewer: currentUser,
                    updatedAt: new Date().toISOString(),
                    version: editingContribution.version + 1,
                    versionsHistory: [
                      {
                        version: editingContribution.version + 1,
                        updatedAt: new Date().toISOString(),
                        updatedBy: currentUser,
                        type: editingContribution.type,
                        content: editContentInput,
                        attachmentUrl: editingContribution.attachmentUrl,
                        attachmentName: editingContribution.attachmentName,
                        formFields: editingContribution.formFields,
                        status: statusSelect,
                        reviewNotes: reviewNotesInput
                      },
                      ...(editingContribution.versionsHistory || [])
                    ]
                  };
                  handleSaveContributionChanges(updated);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md shadow-emerald-600/20"
              >
                <Save size={15} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
