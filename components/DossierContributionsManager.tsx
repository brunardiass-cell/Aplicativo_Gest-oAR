import React, { useState, useMemo } from 'react';
import { 
  DossierContribution, 
  DossierChapterId, 
  DossierContributionStatus, 
  DossierContributionType, 
  Project, 
  Task 
} from '../types';
import { DDCM_CHAPTERS } from '../constants/dossier';
import { 
  FileCheck2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Paperclip, 
  FormInput, 
  History, 
  Edit3, 
  FolderKanban, 
  BookOpen, 
  User, 
  Save, 
  X, 
  Sparkles, 
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
  Building2,
  Check
} from 'lucide-react';

interface DossierContributionsManagerProps {
  projects: Project[];
  tasks: Task[];
  onUpdateProject: (project: Project) => void;
  onUpdateTask: (task: Task) => void;
  onNavigateToActivity?: (projectId: string, activityId: string) => void;
  currentUser?: string;
}

export const DossierContributionsManager: React.FC<DossierContributionsManagerProps> = ({
  projects,
  tasks,
  onUpdateProject,
  onUpdateTask,
  onNavigateToActivity,
  currentUser = 'Usuário'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('todos');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('todos');

  const [editingContribution, setEditingContribution] = useState<DossierContribution | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [statusSelect, setStatusSelect] = useState<DossierContributionStatus>('Rascunho');

  // Extract all contributions from projects (microActivities) and standalone tasks
  const allContributions = useMemo(() => {
    const list: DossierContribution[] = [];

    // From Projects -> MacroActivities -> MicroActivities
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

    // From Tasks
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

  // Unique Project List for dropdown
  const uniqueProjectNames = useMemo(() => {
    const set = new Set<string>();
    allContributions.forEach(c => {
      if (c.projectName) set.add(c.projectName);
    });
    return Array.from(set);
  }, [allContributions]);

  // Filtered list
  const filteredContributions = useMemo(() => {
    return allContributions.filter(c => {
      if (selectedProjectFilter !== 'todos' && c.projectName !== selectedProjectFilter) return false;
      if (selectedChapterFilter !== 'todos' && c.chapterId !== selectedChapterFilter) return false;
      if (selectedStatusFilter !== 'todos' && c.status !== selectedStatusFilter) return false;
      if (selectedTypeFilter !== 'todos' && c.type !== selectedTypeFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
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
    selectedProjectFilter,
    selectedChapterFilter,
    selectedStatusFilter,
    selectedTypeFilter,
    searchTerm
  ]);

  // Save changes to contribution (from manager view)
  const handleSaveContributionChanges = (updatedContrib: DossierContribution) => {
    // Locate and update in Projects or Tasks
    let updated = false;

    // Search in projects
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

      if (projModified) {
        updated = true;
        onUpdateProject({
          ...proj,
          macroActivities: newMacros
        });
      }
    });

    // Search in tasks
    if (!updated) {
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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-700/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <FileCheck2 size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Gestão de Contribuições do Dossiê
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl">
              Central de revisão e aprovação técnica para todo o conteúdo regulatório vinculado ao Dossiê de Desenvolvimento Clínico de Medicamento (DDCM).
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-5 py-3 rounded-2xl flex items-center gap-6">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
              <p className="text-xl font-black text-white">{allContributions.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Aprovados</p>
              <p className="text-xl font-black text-emerald-400">
                {allContributions.filter(c => c.status === 'Aprovado').length}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Em Revisão</p>
              <p className="text-xl font-black text-amber-400">
                {allContributions.filter(c => c.status === 'Em Revisão').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por atividade, projeto, texto ou autor..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="todos">Todos os Projetos</option>
              {uniqueProjectNames.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <select
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="todos">Todos os Capítulos</option>
              {DDCM_CHAPTERS.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.code} - {ch.shortTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Em Revisão">Em Revisão</option>
              <option value="Aprovado">Aprovado ✅</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contributions Grid */}
      {filteredContributions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl text-slate-400 flex items-center justify-center mx-auto">
            <FileCheck2 size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma contribuição regulatória encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Marque a opção "Gera Conteúdo Regulatório" nas atividades dos seus projetos para gerar contribuições automaticamente para este painel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContributions.map((contrib) => {
            const chapterDef = DDCM_CHAPTERS.find(c => c.id === contrib.chapterId) || DDCM_CHAPTERS[0];

            return (
              <div
                key={contrib.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      {chapterDef.code} • {chapterDef.shortTitle}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        contrib.status === 'Aprovado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : contrib.status === 'Em Revisão'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {contrib.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                    {contrib.activityName}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <FolderKanban size={13} className="text-slate-400" />
                    <span>Projeto: <strong className="text-slate-700">{contrib.projectName}</strong></span>
                  </div>
                </div>

                {/* Body Content Preview */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-slate-400">
                    {contrib.type === 'texto' && <FileText size={13} className="text-indigo-500" />}
                    {contrib.type === 'documento' && <Paperclip size={13} className="text-indigo-500" />}
                    {contrib.type === 'formulario' && <FormInput size={13} className="text-indigo-500" />}
                    <span>Formato: {contrib.type}</span>
                    <span className="text-slate-300">•</span>
                    <span>v{contrib.version}</span>
                  </div>

                  {contrib.type === 'texto' && (
                    <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                      "{contrib.content || 'Sem texto preenchido'}"
                    </p>
                  )}

                  {contrib.type === 'documento' && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {contrib.attachmentName || 'Documento sem nome'}
                      </p>
                      {contrib.attachmentUrl && (
                        <a
                          href={contrib.attachmentUrl.startsWith('http') ? contrib.attachmentUrl : `https://${contrib.attachmentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Abrir Arquivo Anexo
                        </a>
                      )}
                    </div>
                  )}

                  {contrib.type === 'formulario' && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-700">
                      <p className="font-bold text-slate-900 truncate">
                        {contrib.formFields?.title || 'Formulário Técnico'}
                      </p>
                      {contrib.formFields?.specifications && (
                        <p className="text-[11px] text-slate-500 truncate">
                          Espec: {contrib.formFields.specifications}
                        </p>
                      )}
                    </div>
                  )}

                  {contrib.reviewNotes && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 font-medium italic flex items-start gap-1.5">
                      <MessageSquare size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{contrib.reviewNotes}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {contrib.author}
                    </span>
                    <span>{new Date(contrib.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(contrib, 'Rascunho')}
                      className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition ${
                        contrib.status === 'Rascunho'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      Rascunho
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(contrib, 'Em Revisão')}
                      className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition ${
                        contrib.status === 'Em Revisão'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      Em Revisão
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(contrib, 'Aprovado')}
                      className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition ${
                        contrib.status === 'Aprovado'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      Aprovar ✅
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingContribution(contrib);
                      setStatusSelect(contrib.status);
                      setReviewNotesInput(contrib.reviewNotes || '');
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <Edit3 size={13} /> Revisar / Editar Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingContribution && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                    Revisão de Contribuição Regulatórias
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingContribution.activityName} • {editingContribution.projectName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingContribution(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Status da Revisão
                </label>
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value as DossierContributionStatus)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Em Revisão">Em Revisão</option>
                  <option value="Aprovado">Aprovado ✅</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Parecer do Revisor / Observações
                </label>
                <textarea
                  value={reviewNotesInput}
                  onChange={(e) => setReviewNotesInput(e.target.value)}
                  placeholder="Comentários de revisão ou justificativas técnicas..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-slate-800 outline-none min-h-[80px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Conteúdo da Contribuição (Texto)
                </label>
                <textarea
                  value={editingContribution.content}
                  onChange={(e) => setEditingContribution({ ...editingContribution, content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-slate-800 outline-none min-h-[120px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingContribution(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold uppercase transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveContributionChanges({
                    ...editingContribution,
                    status: statusSelect,
                    reviewNotes: reviewNotesInput,
                    reviewer: currentUser,
                    updatedAt: new Date().toISOString()
                  });
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-900/20"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
