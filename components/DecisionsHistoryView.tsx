import React, { useState, useMemo } from 'react';
import { Meeting, Project, RegulatoryStandard, RegulatorySubject } from '../types';
import { Search, Filter, ShieldCheck, Calendar, Users, FileText, ArrowUpRight, CheckCircle2, ChevronRight, Layers, Tag, Bookmark } from 'lucide-react';

interface DecisionsHistoryViewProps {
  meetings: Meeting[];
  projects: Project[];
  regulatoryStandards: RegulatoryStandard[];
  regulatorySubjects?: RegulatorySubject[];
  onOpenMeetingDetails: (meeting: Meeting) => void;
  onOpenMinutesModal?: (meeting: Meeting) => void;
}

export const DecisionsHistoryView: React.FC<DecisionsHistoryViewProps> = ({
  meetings,
  projects,
  regulatoryStandards,
  regulatorySubjects,
  onOpenMeetingDetails,
  onOpenMinutesModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  const [onlyRegulatoryImpact, setOnlyRegulatoryImpact] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('Todos');
  const [selectedStandard, setSelectedStandard] = useState('Todos');

  // Flatten all decisions/agenda items from all meetings for searchable indexing
  const flattenedDecisions = useMemo(() => {
    const list: {
      meeting: Meeting;
      agenda: Meeting['agendaItems'][0];
      projectName: string;
      agendaIndex: number;
    }[] = [];

    meetings.forEach(meeting => {
      const proj = projects.find(p => p.id === meeting.projectId);
      const projName = proj ? proj.name : (meeting.projectName || 'Projeto Geral');

      meeting.agendaItems.forEach((agenda, idx) => {
        list.push({
          meeting,
          agenda,
          projectName: projName,
          agendaIndex: idx + 1
        });
      });
    });

    return list;
  }, [meetings, projects]);

  const filteredItems = useMemo(() => {
    return flattenedDecisions.filter(item => {
      const { meeting, agenda, projectName } = item;

      // Project filter
      if (selectedProject !== 'Todos' && meeting.projectId !== selectedProject) {
        return false;
      }

      // Type filter
      if (selectedType !== 'Todos' && meeting.type !== selectedType) {
        return false;
      }

      // Regulatory impact filter
      if (onlyRegulatoryImpact && !agenda.hasRegulatoryImpact) {
        return false;
      }

      // Regulatory doc filter
      if (selectedDoc !== 'Todos' && agenda.regulatoryDocId !== selectedDoc) {
        return false;
      }

      // Regulatory standard filter
      if (selectedStandard !== 'Todos') {
        const hasStd = agenda.linkedRegulatoryStandardIds?.includes(selectedStandard);
        if (!hasStd) return false;
      }

      // Search term
      if (searchTerm.trim().length > 0) {
        const q = searchTerm.toLowerCase();
        const inTitle = agenda.title.toLowerCase().includes(q);
        const inDisc = (agenda.discussions || '').toLowerCase().includes(q);
        const inDec = (agenda.decisions || '').toLowerCase().includes(q);
        const inMeetingTitle = meeting.title.toLowerCase().includes(q);
        const inProj = projectName.toLowerCase().includes(q);
        const inImpact = (agenda.regulatoryImpactDetails || '').toLowerCase().includes(q);

        if (!inTitle && !inDisc && !inDec && !inMeetingTitle && !inProj && !inImpact) {
          return false;
        }
      }

      return true;
    });
  }, [flattenedDecisions, selectedProject, selectedType, onlyRegulatoryImpact, selectedDoc, selectedStandard, searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Search & Filters Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por pauta, decisão, projeto, participante ou palavra-chave..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Toggle Regulatory Impact */}
          <button
            type="button"
            onClick={() => setOnlyRegulatoryImpact(!onlyRegulatoryImpact)}
            className={`px-4 py-3 rounded-2xl font-bold text-xs transition flex items-center gap-2 border shadow-sm ${
              onlyRegulatoryImpact 
                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/20' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck size={16} className={onlyRegulatoryImpact ? 'text-amber-600' : 'text-slate-400'} />
            <span>Apenas com Impacto Regulatório</span>
          </button>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs font-bold">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Projeto</label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Todos">Todos os Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tipo de Reunião</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Técnica">Técnica</option>
              <option value="Regulatória">Regulatória</option>
              <option value="Desenvolvimento">Desenvolvimento</option>
              <option value="Alinhamento">Alinhamento</option>
              <option value="Comitê Gestor">Comitê Gestor</option>
              <option value="Qualidade">Qualidade</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Documento Regulatório</label>
            <select
              value={selectedDoc}
              onChange={e => setSelectedDoc(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Todos">Todos os Documentos</option>
              <option value="cap_1">Capítulo 1 - Informações Gerais</option>
              <option value="cap_2">Capítulo 2 - Matéria-Prima & Biológicos</option>
              <option value="cap_3">Capítulo 3 - Processo & Produção</option>
              <option value="cap_4">Capítulo 4 - Controle & Estabilidade</option>
              <option value="cap_5">Capítulo 5 - Estudos Não-Clínicos</option>
              <option value="cap_6">Capítulo 6 - Protocolo Clínico</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Norma Regulatória</label>
            <select
              value={selectedStandard}
              onChange={e => setSelectedStandard(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Todos">Todas as Normas</option>
              {regulatoryStandards.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
        <span>Mostrando <strong className="text-slate-900">{filteredItems.length}</strong> decisões/pautas registradas</span>
      </div>

      {/* Results List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 space-y-3">
          <FileText size={40} className="mx-auto text-slate-300" />
          <h4 className="text-slate-700 font-black text-sm uppercase">Nenhuma Decisão Encontrada</h4>
          <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
            Tente ajustar os termos de busca ou remover os filtros de projeto, tipo ou impacto regulatório.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(({ meeting, agenda, projectName, agendaIndex }) => {
            const dateFormatted = meeting.date ? meeting.date.split('-').reverse().join('/') : 'Data N/I';

            return (
              <div 
                key={`${meeting.id}_${agenda.id}`}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Decision Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 font-extrabold text-[10px] uppercase rounded-xl">
                      {projectName}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-xl flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" /> {dateFormatted}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-xl">
                      {meeting.type}
                    </span>
                    {agenda.hasRegulatoryImpact && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] uppercase rounded-xl flex items-center gap-1">
                        <ShieldCheck size={12} className="text-amber-600" /> Impacto Regulatório
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenMeetingDetails(meeting)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1 border border-slate-200"
                    >
                      <span>Ver Reunião</span>
                      <ChevronRight size={14} />
                    </button>
                    {onOpenMinutesModal && (
                      <button
                        type="button"
                        onClick={() => onOpenMinutesModal(meeting)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition border border-slate-200"
                        title="Abrir Ata da Reunião"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Decision Content */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {agendaIndex}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">{agenda.title}</h3>
                      {agenda.description && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{agenda.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Discussion & Decision Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {agenda.discussions && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Discussão Registrada</span>
                        <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap">{agenda.discussions}</p>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1">
                      <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider block flex items-center gap-1">
                        <CheckCircle2 size={12} /> Decisão / Conclusão
                      </span>
                      <p className="text-xs font-bold text-slate-800 whitespace-pre-wrap">
                        {agenda.decisions || 'Nenhuma decisão formal registrada.'}
                      </p>
                    </div>
                  </div>

                  {/* Regulatory Details box if impact */}
                  {agenda.hasRegulatoryImpact && agenda.regulatoryImpactDetails && (
                    <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-1 text-xs">
                      <span className="font-black text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-amber-600" /> Detalhes do Impacto Regulatório
                      </span>
                      <p className="font-medium text-amber-950">{agenda.regulatoryImpactDetails}</p>
                    </div>
                  )}

                  {/* Linked Action Items */}
                  {agenda.actionItems && agenda.actionItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Encaminhamentos Relacionados</span>
                      <div className="flex flex-wrap gap-2">
                        {agenda.actionItems.map(act => (
                          <div 
                            key={act.id} 
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2"
                          >
                            <span className="font-bold text-slate-900">{act.action}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-600 font-bold">
                              {act.responsible}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="pt-2 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Moderador: <strong className="text-slate-600">{meeting.moderator || 'N/I'}</strong></span>
                  <span>Participantes: <strong className="text-slate-600">{meeting.participants?.join(', ') || 'N/I'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
