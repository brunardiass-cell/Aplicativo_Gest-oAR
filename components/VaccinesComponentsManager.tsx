import React, { useState } from 'react';
import { 
  VaccineCandidate, 
  VaccineComponent, 
  FormulationBatch, 
  VaccinePhase, 
  VaccinePlatform, 
  VaccineStatus, 
  ComponentCategory, 
  ComponentGrade 
} from '../types';
import { 
  Syringe, 
  Dna, 
  TestTube, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Layers, 
  Box, 
  Sparkles, 
  FileText, 
  Tag, 
  X, 
  Filter, 
  ExternalLink,
  ChevronRight,
  BarChart2,
  CheckSquare
} from 'lucide-react';

interface VaccinesComponentsManagerProps {
  candidates: VaccineCandidate[];
  components: VaccineComponent[];
  formulationBatches: FormulationBatch[];
  onUpdateCandidates: (candidates: VaccineCandidate[]) => void;
  onUpdateComponents: (components: VaccineComponent[]) => void;
  onUpdateBatches: (batches: FormulationBatch[]) => void;
  projects?: any[];
  currentUser?: any;
}

export const VaccinesComponentsManager: React.FC<VaccinesComponentsManagerProps> = ({
  candidates,
  components,
  formulationBatches,
  onUpdateCandidates,
  onUpdateComponents,
  onUpdateBatches,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'components' | 'batches' | 'pipeline'>('candidates');
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('Todos');
  const [platformFilter, setPlatformFilter] = useState<string>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [gradeFilter, setGradeFilter] = useState<string>('Todos');

  // Modals state
  const [candidateModal, setCandidateModal] = useState<Partial<VaccineCandidate> | null>(null);
  const [viewCandidate, setViewCandidate] = useState<VaccineCandidate | null>(null);
  const [componentModal, setComponentModal] = useState<Partial<VaccineComponent> | null>(null);
  const [viewComponent, setViewComponent] = useState<VaccineComponent | null>(null);
  const [batchModal, setBatchModal] = useState<Partial<FormulationBatch> | null>(null);

  // Statistics
  const totalCandidates = candidates.length;
  const clinicalCandidates = candidates.filter(c => c.phase.includes('Clínico') || c.phase.includes('Registro')).length;
  const totalComponents = components.length;
  const totalBatches = formulationBatches.length;

  // Filtered lists
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetPathogen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leadResearcher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = phaseFilter === 'Todos' || c.phase === phaseFilter;
    const matchesPlatform = platformFilter === 'Todos' || c.platform === platformFilter;
    return matchesSearch && matchesPhase && matchesPlatform;
  });

  const filteredComponents = components.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || comp.category === categoryFilter;
    const matchesGrade = gradeFilter === 'Todos' || comp.grade === gradeFilter;
    return matchesSearch && matchesCategory && matchesGrade;
  });

  const filteredBatches = formulationBatches.filter(b => {
    const matchesSearch = b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.responsibleTechnician.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Candidate Save Handler
  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateModal?.name || !candidateModal.targetPathogen) {
      alert('Por favor, preencha os campos obrigatórios (Nome e Patógeno-Alvo).');
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    if (candidateModal.id) {
      // Edit
      const updated = candidates.map(c => c.id === candidateModal.id ? {
        ...(candidateModal as VaccineCandidate),
        updatedDate: now
      } : c);
      onUpdateCandidates(updated);
    } else {
      // Add new
      const newCand: VaccineCandidate = {
        id: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: candidateModal.name.trim(),
        codeName: candidateModal.codeName?.trim() || '',
        platform: candidateModal.platform || 'Proteína Recombinante',
        targetPathogen: candidateModal.targetPathogen.trim(),
        phase: candidateModal.phase || 'Pesquisa Básica',
        status: candidateModal.status || 'Em Desenvolvimento',
        leadResearcher: candidateModal.leadResearcher?.trim() || 'Equipe CTVacinas',
        description: candidateModal.description?.trim() || '',
        associatedComponentIds: candidateModal.associatedComponentIds || [],
        anvisaStatus: candidateModal.anvisaStatus?.trim() || 'Em Estudo Pré-Clínico',
        technicalNotes: candidateModal.technicalNotes?.trim() || '',
        createdDate: now,
        updatedDate: now
      };
      onUpdateCandidates([...candidates, newCand]);
    }
    setCandidateModal(null);
  };

  const handleDeleteCandidate = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a vacina candidato "${name}"?`)) {
      onUpdateCandidates(candidates.filter(c => c.id !== id));
    }
  };

  // Component Save Handler
  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentModal?.name || !componentModal.code) {
      alert('Por favor, preencha os campos obrigatórios (Nome e Código do Insumo).');
      return;
    }

    if (componentModal.id) {
      const updated = components.map(c => c.id === componentModal.id ? {
        ...(componentModal as VaccineComponent)
      } : c);
      onUpdateComponents(updated);
    } else {
      const newComp: VaccineComponent = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: componentModal.name.trim(),
        code: componentModal.code.trim().toUpperCase(),
        category: componentModal.category || 'Antígeno',
        originHostSystem: componentModal.originHostSystem?.trim() || 'E. coli',
        grade: componentModal.grade || 'Grau Científico / Pesquisa',
        storageTemperature: componentModal.storageTemperature?.trim() || '-80°C',
        batchNumber: componentModal.batchNumber?.trim() || `LOT-${Date.now().toString().slice(-4)}`,
        stockQuantity: componentModal.stockQuantity?.trim() || '1.000',
        unit: componentModal.unit?.trim() || 'doses',
        expiryDate: componentModal.expiryDate || '',
        description: componentModal.description?.trim() || '',
        safetyDataSheetLink: componentModal.safetyDataSheetLink?.trim() || ''
      };
      onUpdateComponents([...components, newComp]);
    }
    setComponentModal(null);
  };

  const handleDeleteComponent = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o componente "${name}"?`)) {
      onUpdateComponents(components.filter(c => c.id !== id));
    }
  };

  // Batch Save Handler
  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchModal?.batchCode || !batchModal.vaccineId) {
      alert('Por favor, informe o código do lote e selecione a vacina vinculada.');
      return;
    }

    if (batchModal.id) {
      const updated = formulationBatches.map(b => b.id === batchModal.id ? {
        ...(batchModal as FormulationBatch)
      } : b);
      onUpdateBatches(updated);
    } else {
      const newBatch: FormulationBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        batchCode: batchModal.batchCode.trim().toUpperCase(),
        vaccineId: batchModal.vaccineId,
        preparationDate: batchModal.preparationDate || new Date().toISOString().split('T')[0],
        expiryDate: batchModal.expiryDate || '',
        componentsUsed: batchModal.componentsUsed || [],
        qualityControlStatus: batchModal.qualityControlStatus || 'Em Análise',
        sterilityStatus: batchModal.sterilityStatus?.trim() || 'Estéril (Aprovado)',
        potencyResult: batchModal.potencyResult?.trim() || 'Conforme especificação',
        responsibleTechnician: batchModal.responsibleTechnician?.trim() || 'Técnico de Garantia da Qualidade',
        notes: batchModal.notes?.trim() || ''
      };
      onUpdateBatches([...formulationBatches, newBatch]);
    }
    setBatchModal(null);
  };

  const handleDeleteBatch = (id: string, code: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o lote "${code}"?`)) {
      onUpdateBatches(formulationBatches.filter(b => b.id !== id));
    }
  };

  const getPhaseBadgeColor = (phase: VaccinePhase) => {
    switch (phase) {
      case 'Pesquisa Básica': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Pré-clínico In Vitro': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Pré-clínico In Vivo': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Ensaio Clínico Fase 1': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Ensaio Clínico Fase 2': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Ensaio Clínico Fase 3': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Registro / Produção': return 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryBadgeColor = (cat: ComponentCategory) => {
    switch (cat) {
      case 'Antígeno': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Adjuvante': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Vetor de Expressão': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Tampão / Estabilizante': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Linhagem Celular': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const phasesList: VaccinePhase[] = [
    'Pesquisa Básica',
    'Pré-clínico In Vitro',
    'Pré-clínico In Vivo',
    'Ensaio Clínico Fase 1',
    'Ensaio Clínico Fase 2',
    'Ensaio Clínico Fase 3',
    'Registro / Produção'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              <Syringe size={12} /> Módulo Especializado CTVacinas
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              Gestão de Vacinas e Componentes
            </h1>
            <p className="text-xs sm:text-sm font-medium text-emerald-100/80 max-w-2xl mt-1 leading-relaxed">
              Plataforma para monitoramento de candidatos vacinais, controle de estoque de insumos biológicos (antígenos, adjuvantes, vetores), lotes de formulação e rastreabilidade regulatória do pipeline de biotecnologia.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 block">Candidatos Vacinais</span>
              <span className="text-2xl font-black text-white">{totalCandidates}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 block">Fase Clínica / Registro</span>
              <span className="text-2xl font-black text-white">{clinicalCandidates}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 block">Insumos Biológicos</span>
              <span className="text-2xl font-black text-white">{totalComponents}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 block">Lotes de Formulação</span>
              <span className="text-2xl font-black text-white">{totalBatches}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs & Action Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'candidates' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Syringe size={15} className={activeTab === 'candidates' ? 'text-emerald-600' : ''} />
            Candidatos Vacinais ({candidates.length})
          </button>

          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'components' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Dna size={15} className={activeTab === 'components' ? 'text-emerald-600' : ''} />
            Componentes & Insumos ({components.length})
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'batches' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TestTube size={15} className={activeTab === 'batches' ? 'text-emerald-600' : ''} />
            Lotes de Formulação ({formulationBatches.length})
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'pipeline' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart2 size={15} className={activeTab === 'pipeline' ? 'text-emerald-600' : ''} />
            Pipeline & Relatório
          </button>
        </div>

        {/* Action Button depending on tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'candidates' && (
            <button
              onClick={() => setCandidateModal({})}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus size={16} /> Novo Candidato Vacinal
            </button>
          )}

          {activeTab === 'components' && (
            <button
              onClick={() => setComponentModal({})}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus size={16} /> Novo Insumo / Componente
            </button>
          )}

          {activeTab === 'batches' && (
            <button
              onClick={() => setBatchModal({ componentsUsed: [] })}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus size={16} /> Novo Lote de Formulação
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, código, responsável ou patógeno..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        {/* Tab-specific Filters */}
        {activeTab === 'candidates' && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fase:</span>
              <select
                value={phaseFilter}
                onChange={e => setPhaseFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todas as Fases</option>
                {phasesList.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plataforma:</span>
              <select
                value={platformFilter}
                onChange={e => setPlatformFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todas as Plataformas</option>
                <option value="Proteína Recombinante">Proteína Recombinante</option>
                <option value="mRNA / RNAm">mRNA / RNAm</option>
                <option value="Vetor Viral">Vetor Viral</option>
                <option value="Vírus Inativado">Vírus Inativado</option>
                <option value="Subunidade / Quimérica">Subunidade / Quimérica</option>
                <option value="Sintético / Peptídeo">Sintético / Peptídeo</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Categoria:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todas as Categorias</option>
                <option value="Antígeno">Antígeno</option>
                <option value="Adjuvante">Adjuvante</option>
                <option value="Vetor de Expressão">Vetor de Expressão</option>
                <option value="Tampão / Estabilizante">Tampão / Estabilizante</option>
                <option value="Proteína Carrier">Proteína Carrier</option>
                <option value="Linhagem Celular">Linhagem Celular</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grau Limpeza:</span>
              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todos os Graus</option>
                <option value="Grau Científico / Pesquisa">Grau Científico / Pesquisa</option>
                <option value="Pre-GMP">Pre-GMP</option>
                <option value="GMP / Grau Clínico">GMP / Grau Clínico</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB CONTENT: 1. CANDIDATES */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center space-y-3">
              <Syringe size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">Nenhum candidato vacinal encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente ajustar os termos de busca ou filtros, ou cadastre um novo candidato a vacina no botão acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map(candidate => {
                const linkedComps = components.filter(comp => candidate.associatedComponentIds?.includes(comp.id));

                return (
                  <div 
                    key={candidate.id}
                    className="bg-white rounded-[2rem] border border-slate-200/90 hover:border-emerald-500/40 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Header Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPhaseBadgeColor(candidate.phase)}`}>
                          {candidate.phase}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewCandidate(candidate)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Ver detalhes completos"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setCandidateModal(candidate)}
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Editar candidato"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Pathogen */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition line-clamp-1">
                          {candidate.name}
                        </h3>
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                          <Sparkles size={12} /> Alvo: {candidate.targetPathogen}
                        </p>
                      </div>

                      {/* Specs info */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-[10px] font-black uppercase text-slate-400">Plataforma:</span>
                          <span className="font-bold text-slate-800">{candidate.platform}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-[10px] font-black uppercase text-slate-400">Líder do Projeto:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[150px]">{candidate.leadResearcher}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-[10px] font-black uppercase text-slate-400">Status ANVISA:</span>
                          <span className="font-bold text-emerald-800">{candidate.anvisaStatus || 'Em Estudo'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {candidate.description || 'Sem descrição detalhada cadastrada.'}
                      </p>

                      {/* Associated Components Chips */}
                      {linkedComps.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                            Insumos/Componentes Vinculados ({linkedComps.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {linkedComps.map(comp => (
                              <span key={comp.id} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                {comp.code} - {comp.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-400">
                      <span>Atualizado: {candidate.updatedDate}</span>
                      <button
                        onClick={() => setViewCandidate(candidate)}
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        Ver Ficha <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. COMPONENTS */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          {filteredComponents.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center space-y-3">
              <Dna size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">Nenhum insumo ou componente encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente ajustar os termos de busca ou cadastrar novos componentes para o estoque biológico no botão acima.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="p-4 pl-6">Código / Insumo</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Sistema Hospedeiro / Origem</th>
                      <th className="p-4">Grau de Limpeza</th>
                      <th className="p-4">Temp. Armazenamento</th>
                      <th className="p-4">Nº do Lote</th>
                      <th className="p-4">Estoque Atual</th>
                      <th className="p-4 text-right pr-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredComponents.map(comp => (
                      <tr key={comp.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-800 border border-slate-200">
                              {comp.code}
                            </span>
                            {comp.name}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(comp.category)}`}>
                            {comp.category}
                          </span>
                        </td>

                        <td className="p-4 text-slate-600 italic">
                          {comp.originHostSystem}
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          {comp.grade}
                        </td>

                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                            {comp.storageTemperature}
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-800">
                          {comp.batchNumber}
                        </td>

                        <td className="p-4 font-bold text-emerald-800">
                          {comp.stockQuantity} {comp.unit}
                        </td>

                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewComponent(comp)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Ver Detalhes"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => setComponentModal(comp)}
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteComponent(comp.id, comp.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. FORMULATION BATCHES */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {filteredBatches.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center space-y-3">
              <TestTube size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">Nenhum lote de formulação registrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Registre os lotes preparados para ensaios pré-clínicos ou clínicos no botão acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBatches.map(batch => {
                const linkedVaccine = candidates.find(c => c.id === batch.vaccineId);

                return (
                  <div key={batch.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Código do Lote</span>
                        <h4 className="text-lg font-black text-slate-900 font-mono">{batch.batchCode}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          batch.qualityControlStatus === 'Conforme' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          batch.qualityControlStatus === 'Em Análise' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          Controle CQ: {batch.qualityControlStatus}
                        </span>

                        <button
                          onClick={() => setBatchModal(batch)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          title="Editar Lote"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch.id, batch.batchCode)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir Lote"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Vacina Vinculada:</span>
                        <span className="font-bold text-slate-900">{linkedVaccine?.name || 'Não informada'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Data de Preparação:</span>
                        <span className="font-bold text-slate-800">{batch.preparationDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Esterilidade:</span>
                        <span className="font-bold text-emerald-700">{batch.sterilityStatus || 'Estéril'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Responsável Técnico:</span>
                        <span className="font-bold text-slate-800">{batch.responsibleTechnician}</span>
                      </div>
                    </div>

                    {batch.notes && (
                      <div className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                        <strong className="text-amber-900 font-bold block mb-0.5 text-[10px] uppercase">Observações de CQ:</strong>
                        {batch.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. PIPELINE OVERVIEW */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pipeline de Desenvolvimento de Vacinas</h2>
            <p className="text-xs text-slate-500 mt-1">Acompanhamento do progresso de cada candidato pelas etapas da cadeia de inovação biotecnológica.</p>
          </div>

          <div className="space-y-6">
            {phasesList.map((phase, idx) => {
              const phaseCandidates = candidates.filter(c => c.phase === phase);

              return (
                <div key={phase} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {phase}
                    </h3>

                    <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600 uppercase">
                      {phaseCandidates.length} Candidato(s)
                    </span>
                  </div>

                  {phaseCandidates.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-8">Nenhum candidato nesta fase atualmente.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-8">
                      {phaseCandidates.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{c.name}</h4>
                          <p className="text-[10px] font-bold text-emerald-700">Alvo: {c.targetPathogen}</p>
                          <p className="text-[10px] text-slate-500">Líder: {c.leadResearcher}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CANDIDATE */}
      {candidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {candidateModal.id ? 'Editar Candidato Vacinal' : 'Novo Candidato Vacinal'}
                </h3>
                <p className="text-xs text-slate-400">Preencha os dados de pesquisa, plataforma e componentes.</p>
              </div>
              <button onClick={() => setCandidateModal(null)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome do Candidato / Vacina *</label>
                  <input
                    type="text"
                    required
                    value={candidateModal.name || ''}
                    onChange={e => setCandidateModal({ ...candidateModal, name: e.target.value })}
                    placeholder="Ex: SpiN-UTG, Leishtec, ChagasVac"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Patógeno / Doença Alvo *</label>
                  <input
                    type="text"
                    required
                    value={candidateModal.targetPathogen || ''}
                    onChange={e => setCandidateModal({ ...candidateModal, targetPathogen: e.target.value })}
                    placeholder="Ex: SARS-CoV-2, Leishmania, Trypanosoma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Plataforma Tecnológica</label>
                  <select
                    value={candidateModal.platform || 'Proteína Recombinante'}
                    onChange={e => setCandidateModal({ ...candidateModal, platform: e.target.value as VaccinePlatform })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Proteína Recombinante">Proteína Recombinante</option>
                    <option value="mRNA / RNAm">mRNA / RNAm</option>
                    <option value="Vetor Viral">Vetor Viral</option>
                    <option value="Vírus Inativado">Vírus Inativado</option>
                    <option value="Subunidade / Quimérica">Subunidade / Quimérica</option>
                    <option value="Sintético / Peptídeo">Sintético / Peptídeo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Fase de Desenvolvimento</label>
                  <select
                    value={candidateModal.phase || 'Pesquisa Básica'}
                    onChange={e => setCandidateModal({ ...candidateModal, phase: e.target.value as VaccinePhase })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    {phasesList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Pesquisador Líder / Equipe</label>
                  <input
                    type="text"
                    value={candidateModal.leadResearcher || ''}
                    onChange={e => setCandidateModal({ ...candidateModal, leadResearcher: e.target.value })}
                    placeholder="Ex: Dr. Ricardo Gazzinelli"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Status Regulatório / ANVISA</label>
                  <input
                    type="text"
                    value={candidateModal.anvisaStatus || ''}
                    onChange={e => setCandidateModal({ ...candidateModal, anvisaStatus: e.target.value })}
                    placeholder="Ex: DDCM Aprovado, Em Estudo Pré-Clínico"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Descrição do Candidato</label>
                <textarea
                  rows={3}
                  value={candidateModal.description || ''}
                  onChange={e => setCandidateModal({ ...candidateModal, description: e.target.value })}
                  placeholder="Detalhamento do mecanismo de ação, antígeno e estratégia da vacina..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Componentes / Insumos Associados</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {components.map(comp => {
                    const isChecked = candidateModal.associatedComponentIds?.includes(comp.id);
                    return (
                      <label key={comp.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer hover:bg-emerald-50/50 transition text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={e => {
                            const current = candidateModal.associatedComponentIds || [];
                            if (e.target.checked) {
                              setCandidateModal({ ...candidateModal, associatedComponentIds: [...current, comp.id] });
                            } else {
                              setCandidateModal({ ...candidateModal, associatedComponentIds: current.filter((id: string) => id !== comp.id) });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-slate-800">{comp.code} - {comp.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCandidateModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
                >
                  Salvar Candidato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPONENT */}
      {componentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {componentModal.id ? 'Editar Insumo / Componente' : 'Novo Insumo / Componente'}
                </h3>
                <p className="text-xs text-slate-400">Cadastre o componente biológico, lote e condições de guarda.</p>
              </div>
              <button onClick={() => setComponentModal(null)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome do Insumo *</label>
                  <input
                    type="text"
                    required
                    value={componentModal.name || ''}
                    onChange={e => setComponentModal({ ...componentModal, name: e.target.value })}
                    placeholder="Ex: Proteína SpiN, Adjuvante Alumínio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Código / Sigla *</label>
                  <input
                    type="text"
                    required
                    value={componentModal.code || ''}
                    onChange={e => setComponentModal({ ...componentModal, code: e.target.value })}
                    placeholder="Ex: PROT-SPIN-01, ADJ-MPLA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Categoria</label>
                  <select
                    value={componentModal.category || 'Antígeno'}
                    onChange={e => setComponentModal({ ...componentModal, category: e.target.value as ComponentCategory })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Antígeno">Antígeno</option>
                    <option value="Adjuvante">Adjuvante</option>
                    <option value="Vetor de Expressão">Vetor de Expressão</option>
                    <option value="Tampão / Estabilizante">Tampão / Estabilizante</option>
                    <option value="Proteína Carrier">Proteína Carrier</option>
                    <option value="Linhagem Celular">Linhagem Celular</option>
                    <option value="Outro Insumo">Outro Insumo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Grau de Limpeza / Qualidade</label>
                  <select
                    value={componentModal.grade || 'Grau Científico / Pesquisa'}
                    onChange={e => setComponentModal({ ...componentModal, grade: e.target.value as ComponentGrade })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Grau Científico / Pesquisa">Grau Científico / Pesquisa</option>
                    <option value="Pre-GMP">Pre-GMP</option>
                    <option value="GMP / Grau Clínico">GMP / Grau Clínico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Hospedeiro / Origem</label>
                  <input
                    type="text"
                    value={componentModal.originHostSystem || ''}
                    onChange={e => setComponentModal({ ...componentModal, originHostSystem: e.target.value })}
                    placeholder="Ex: Pichia pastoris, E. coli"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Temp. Guarda</label>
                  <input
                    type="text"
                    value={componentModal.storageTemperature || ''}
                    onChange={e => setComponentModal({ ...componentModal, storageTemperature: e.target.value })}
                    placeholder="Ex: -80°C, 2-8°C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nº do Lote</label>
                  <input
                    type="text"
                    value={componentModal.batchNumber || ''}
                    onChange={e => setComponentModal({ ...componentModal, batchNumber: e.target.value })}
                    placeholder="Ex: LOTE-2026-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Quantidade em Estoque</label>
                  <input
                    type="text"
                    value={componentModal.stockQuantity || ''}
                    onChange={e => setComponentModal({ ...componentModal, stockQuantity: e.target.value })}
                    placeholder="Ex: 500, 10.000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Unidade de Medida</label>
                  <input
                    type="text"
                    value={componentModal.unit || ''}
                    onChange={e => setComponentModal({ ...componentModal, unit: e.target.value })}
                    placeholder="Ex: doses, mL, frascos, mg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setComponentModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
                >
                  Salvar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW CANDIDATE DETAILS */}
      {viewCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Ficha do Candidato Vacinal</span>
                <h3 className="text-xl font-black uppercase tracking-tight">{viewCandidate.name}</h3>
              </div>
              <button onClick={() => setViewCandidate(null)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Patógeno Alvo</span>
                  <span className="font-black text-slate-900 text-sm">{viewCandidate.targetPathogen}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Fase Atual</span>
                  <span className="font-black text-emerald-800 text-sm">{viewCandidate.phase}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Plataforma</span>
                  <span className="font-bold text-slate-800">{viewCandidate.platform}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Pesquisador Responsável</span>
                  <span className="font-bold text-slate-800">{viewCandidate.leadResearcher}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Descrição e Estratégia Vacinal</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {viewCandidate.description || 'Nenhuma descrição cadastrada.'}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Insumos e Componentes Biológicos Associados</h4>
                <div className="space-y-2">
                  {components.filter(c => viewCandidate.associatedComponentIds?.includes(c.id)).map(comp => (
                    <div key={comp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-slate-900 mr-2">{comp.code}</span>
                        <span className="font-bold text-slate-800">{comp.name}</span>
                        <span className="text-slate-500 text-[10px] block">Lote: {comp.batchNumber} | Temp: {comp.storageTemperature}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {comp.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinesComponentsManager;
