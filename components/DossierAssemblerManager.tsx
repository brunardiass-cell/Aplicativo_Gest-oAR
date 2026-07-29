import React, { useState, useMemo } from 'react';
import { 
  Project, 
  Task, 
  DossierContribution, 
  DossierChapterId 
} from '../types';
import { DDCM_CHAPTERS } from '../constants/dossier';
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
  Printer, 
  FolderKanban, 
  FileCheck2, 
  ExternalLink, 
  ChevronRight, 
  Layers, 
  ShieldCheck, 
  User, 
  Calendar 
} from 'lucide-react';

interface DossierAssemblerManagerProps {
  projects: Project[];
  tasks: Task[];
}

export const DossierAssemblerManager: React.FC<DossierAssemblerManagerProps> = ({
  projects,
  tasks
}) => {
  const [activeChapterTab, setActiveChapterTab] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);

  // Extract ALL approved contributions
  const approvedContributions = useMemo(() => {
    const list: DossierContribution[] = [];

    // Projects -> Macro -> Micro
    projects.forEach(proj => {
      proj.macroActivities?.forEach(macro => {
        macro.microActivities?.forEach(micro => {
          if (
            micro.generatesRegulatoryContent &&
            micro.dossierContribution &&
            micro.dossierContribution.status === 'Aprovado'
          ) {
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

    // Standalone Tasks
    tasks.forEach(t => {
      if (
        t.generatesRegulatoryContent &&
        t.dossierContribution &&
        t.dossierContribution.status === 'Aprovado'
      ) {
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

  // Filtered by project if needed
  const filteredApprovedContributions = useMemo(() => {
    if (selectedProjectFilter === 'todos') return approvedContributions;
    return approvedContributions.filter(c => c.projectName === selectedProjectFilter);
  }, [approvedContributions, selectedProjectFilter]);

  // Unique Project List
  const uniqueProjectNames = useMemo(() => {
    const set = new Set<string>();
    approvedContributions.forEach(c => {
      if (c.projectName) set.add(c.projectName);
    });
    return Array.from(set);
  }, [approvedContributions]);

  // Group approved contributions by chapter
  const chapterContributionsMap = useMemo(() => {
    const map: Record<DossierChapterId, DossierContribution[]> = {
      cap_1: [],
      cap_2: [],
      cap_3: [],
      cap_4: [],
      cap_5: [],
      cap_6: []
    };

    filteredApprovedContributions.forEach(c => {
      if (map[c.chapterId]) {
        map[c.chapterId].push(c);
      }
    });

    return map;
  }, [filteredApprovedContributions]);

  // Export to Word (.docx) using docx library
  const handleExportToWord = async () => {
    try {
      setIsExporting(true);

      const docChildren: any[] = [];

      // Title & Cover Section
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
              text: 'DOSSIÊ DE DESENVOLVIMENTO CLÍNICO DE MEDICAMENTO (DDCM)',
              bold: true,
              size: 28,
              color: '1E293B'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Compilação Regulatória Consolidada • Anvisa`,
              italics: true,
              size: 20,
              color: '475569'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} | Exportado via Sistema de Gestão CTVacinas`,
              size: 18,
              color: '64748B'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 600 }
        })
      );

      // Chapter Iteration
      DDCM_CHAPTERS.forEach((chDef) => {
        const chapterContribs = chapterContributionsMap[chDef.id] || [];

        // Chapter Heading
        docChildren.push(
          new Paragraph({
            text: `${chDef.code} ${chDef.title}`,
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
            spacing: { before: 0, after: 250 }
          })
        );

        if (chapterContribs.length === 0) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '[Nenhuma contribuição aprovada registrada para este capítulo até o momento]',
                  italics: true,
                  color: '94A3B8'
                })
              ],
              spacing: { before: 100, after: 300 }
            })
          );
        } else {
          chapterContribs.forEach((contrib, index) => {
            // Section item heading
            docChildren.push(
              new Paragraph({
                text: `${chDef.code}.${index + 1} ${contrib.activityName} (${contrib.projectName})`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Autor: ${contrib.author} | Revisor: ${contrib.reviewer || 'Comitê Regulatório'} | Data: ${new Date(contrib.updatedAt).toLocaleDateString('pt-BR')} | Versão: v${contrib.version}`,
                    size: 18,
                    color: '0F766E',
                    bold: true
                  })
                ],
                spacing: { before: 0, after: 150 }
              })
            );

            // Text Content
            if (contrib.type === 'texto' && contrib.content) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: contrib.content,
                      size: 22
                    })
                  ],
                  spacing: { before: 100, after: 200 }
                })
              );
            }

            // Document Attachment
            if (contrib.type === 'documento') {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Documento Anexo: ${contrib.attachmentName || 'Documento Técnico'}\n`,
                      bold: true,
                      size: 20
                    }),
                    new TextRun({
                      text: `URL de Acesso: ${contrib.attachmentUrl || 'Link registrado na base de dados'}\n`,
                      color: '2563EB',
                      size: 18
                    }),
                    new TextRun({
                      text: `Resumo: ${contrib.content || 'Sem resumo adicional'}`,
                      italics: true,
                      size: 20
                    })
                  ],
                  spacing: { before: 100, after: 200 }
                })
              );
            }

            // Structured Form Table
            if (contrib.type === 'formulario' && contrib.formFields) {
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
                    new TableCell({ children: [new Paragraph('Título da Submissão')] }),
                    new TableCell({ children: [new Paragraph(ff.title || '-')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('Especificações')] }),
                    new TableCell({ children: [new Paragraph(ff.specifications || '-')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('Resumo Metodológico')] }),
                    new TableCell({ children: [new Paragraph(ff.methodologySummary || '-')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('Resultados Chave')] }),
                    new TableCell({ children: [new Paragraph(ff.keyResults || '-')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('Conclusão Regulatória')] }),
                    new TableCell({ children: [new Paragraph(ff.regulatoryConclusion || '-')] })
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
                  spacing: { before: 50, after: 200 }
                })
              );
            }
          });
        }
      });

      const doc = new Document({
        sections: [
          {
            children: docChildren
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dossie_DDCM_CTVacinas_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar documento Word:', err);
      alert('Ocorreu um erro ao gerar o documento Word. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-emerald-800/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <BookOpen size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Dossiê (DDCM) • Compilação Consolidada
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl">
              Estrutura automática do Dossiê de Desenvolvimento Clínico de Medicamento, montada exclusivamente a partir das contribuições aprovadas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportToWord}
              disabled={isExporting}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-950/50 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download size={16} />
              <span>{isExporting ? 'Gerando Word...' : 'Exportar para Word (.docx)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FolderKanban size={18} className="text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Filtrar Por Projeto:</span>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none min-w-[200px]"
          >
            <option value="todos">Todos os Projetos</option>
            {uniqueProjectNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>
            <strong className="text-slate-900">{filteredApprovedContributions.length}</strong> contribuições aprovadas incorporadas
          </span>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveChapterTab('all')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition ${
            activeChapterTab === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Visão Completa
        </button>
        {DDCM_CHAPTERS.map((ch) => {
          const count = chapterContributionsMap[ch.id]?.length || 0;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChapterTab(ch.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 flex items-center gap-2 transition ${
                activeChapterTab === ch.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{ch.code} {ch.shortTitle}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                activeChapterTab === ch.id ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chapters Document View */}
      <div className="space-y-8">
        {DDCM_CHAPTERS.filter(ch => activeChapterTab === 'all' || activeChapterTab === ch.id).map((chDef) => {
          const list = chapterContributionsMap[chDef.id] || [];

          return (
            <div
              key={chDef.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
            >
              {/* Chapter Header */}
              <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                      Capítulo {chDef.code}
                    </span>
                    <h2 className="text-lg font-black tracking-tight uppercase text-white">
                      {chDef.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {chDef.description}
                  </p>
                </div>

                <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-extrabold text-emerald-400 shrink-0">
                  {list.length} Aprovados
                </span>
              </div>

              {/* Chapter Content Items */}
              <div className="p-6 space-y-6">
                {list.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                    Nenhuma contribuição aprovada vinculada a este capítulo ainda.
                  </div>
                ) : (
                  list.map((contrib, idx) => (
                    <div
                      key={contrib.id}
                      className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                            {chDef.code}.{idx + 1} Subseção Regulatória
                          </span>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">
                            {contrib.activityName}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-200 rounded-md text-slate-700">
                            v{contrib.version}
                          </span>
                          <span>• {contrib.projectName}</span>
                          <span>• {contrib.author}</span>
                        </div>
                      </div>

                      {/* Content Body */}
                      {contrib.type === 'texto' && (
                        <div className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200">
                          {contrib.content}
                        </div>
                      )}

                      {contrib.type === 'documento' && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <p className="text-xs font-bold text-slate-900">
                            Anexo: {contrib.attachmentName || 'Documento Anexado'}
                          </p>
                          {contrib.attachmentUrl && (
                            <a
                              href={contrib.attachmentUrl.startsWith('http') ? contrib.attachmentUrl : `https://${contrib.attachmentUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                            >
                              <ExternalLink size={14} /> Acessar Documento Completo
                            </a>
                          )}
                          <p className="text-xs text-slate-600 italic">
                            {contrib.content}
                          </p>
                        </div>
                      )}

                      {contrib.type === 'formulario' && contrib.formFields && (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="p-3 w-1/3">Campo Técnico</th>
                                <th className="p-3">Informação Registrada</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="p-3 font-bold text-slate-700">Título</td>
                                <td className="p-3 text-slate-900">{contrib.formFields.title || '-'}</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold text-slate-700">Especificações</td>
                                <td className="p-3 text-slate-900">{contrib.formFields.specifications || '-'}</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold text-slate-700">Metodologia</td>
                                <td className="p-3 text-slate-900">{contrib.formFields.methodologySummary || '-'}</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold text-slate-700">Resultados Chave</td>
                                <td className="p-3 text-slate-900">{contrib.formFields.keyResults || '-'}</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold text-slate-700">Conclusão Regulatória</td>
                                <td className="p-3 text-slate-900">{contrib.formFields.regulatoryConclusion || '-'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {contrib.reviewNotes && (
                        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs italic font-medium">
                          <strong>Parecer de Aprovação:</strong> {contrib.reviewNotes}
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
  );
};
