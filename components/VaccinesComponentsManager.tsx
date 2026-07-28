import React, { useState } from 'react';
import { 
  VaccineCandidate, 
  VaccineComponent, 
  FormulationBatch, 
  VaccinePhase, 
  VaccinePlatform, 
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
  Clock, 
  X, 
  ChevronRight,
  BarChart2,
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  FileUp,
  Compass,
  Sparkles,
  Upload,
  CheckCircle2,
  Layers,
  Copy,
  ExternalLink,
  Info,
  Shield,
  Activity,
  Box
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
  activeTab?: 'dashboard' | 'manual_inclusion' | 'import_spreadsheet' | 'import_pdf' | 'explorer' | 'catalog';
  onTabChange?: (tab: 'dashboard' | 'manual_inclusion' | 'import_spreadsheet' | 'import_pdf' | 'explorer' | 'catalog') => void;
}

export const VaccinesComponentsManager: React.FC<VaccinesComponentsManagerProps> = ({
  candidates,
  components,
  formulationBatches,
  onUpdateCandidates,
  onUpdateComponents,
  onUpdateBatches,
  currentUser,
  activeTab,
  onTabChange
}) => {
  // Main Module Tabs
  const [internalMainTab, setInternalMainTab] = useState<'dashboard' | 'manual_inclusion' | 'import_spreadsheet' | 'import_pdf' | 'explorer' | 'catalog'>('dashboard');
  const mainTab = activeTab || internalMainTab;
  const setMainTab = onTabChange || setInternalMainTab;
  
  // Dashboard Subtab
  const [dashboardSubTab, setDashboardSubTab] = useState<'vaccines' | 'components'>('vaccines');

  // Catalog Subtab
  const [catalogSubTab, setCatalogSubTab] = useState<'candidates' | 'components' | 'batches' | 'pipeline'>('candidates');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('Todos');
  const [platformFilter, setPlatformFilter] = useState<string>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [gradeFilter, setGradeFilter] = useState<string>('Todos');

  // Manual Inclusion Form State
  const [manualName, setManualName] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualPlatform, setManualPlatform] = useState<VaccinePlatform>('Proteína Recombinante');
  const [manualPathogen, setManualPathogen] = useState('');
  const [manualSafetyText, setManualSafetyText] = useState('');
  const [manualOtherText, setManualOtherText] = useState('');
  const [manualDocLink, setManualDocLink] = useState('');
  const [antigensList, setAntigensList] = useState<{ name: string; qty: string }[]>([{ name: '', qty: '' }]);
  const [excipientsList, setExcipientsList] = useState<{ name: string; qty: string }[]>([{ name: '', qty: '' }]);
  const [impuritiesList, setImpuritiesList] = useState<{ name: string; limit: string }[]>([]);

  // Spreadsheet Import State
  const [spreadsheetText, setSpreadsheetText] = useState('');
  const [spreadsheetStatus, setSpreadsheetStatus] = useState<'idle' | 'success'>('idle');

  // PDF Import State
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfResult, setPdfResult] = useState<string | null>(null);

  // Explorer State
  const [explorerFilter, setExplorerFilter] = useState('');
  const [selectedSubstance, setSelectedSubstance] = useState<VaccineComponent | null>(null);

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
      const updated = candidates.map(c => c.id === candidateModal.id ? {
        ...(candidateModal as VaccineCandidate),
        updatedDate: now
      } : c);
      onUpdateCandidates(updated);
    } else {
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

  // Submit Manual Inclusion Dossiê
  const handleSaveManualDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPathogen.trim()) {
      alert('Preencha o nome do candidato e o patógeno-alvo.');
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    const newCand: VaccineCandidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: manualName.trim(),
      codeName: manualCode.trim(),
      platform: manualPlatform,
      targetPathogen: manualPathogen.trim(),
      phase: 'Pesquisa Básica',
      status: 'Em Desenvolvimento',
      leadResearcher: currentUser?.name || 'Equipe CTVacinas',
      description: `Estudos de Segurança: ${manualSafetyText}\n\nOutros Estudos: ${manualOtherText}`,
      associatedComponentIds: [],
      anvisaStatus: 'Dossiê em Preenchimento',
      technicalNotes: manualDocLink ? `Bula PDF / Link: ${manualDocLink}` : '',
      createdDate: now,
      updatedDate: now
    };
    onUpdateCandidates([...candidates, newCand]);
    alert('Registro gravado com sucesso no Catálogo Nacional!');
    setManualName('');
    setManualCode('');
    setManualPathogen('');
    setManualSafetyText('');
    setManualOtherText('');
    setManualDocLink('');
    setAntigensList([{ name: '', qty: '' }]);
    setExcipientsList([{ name: '', qty: '' }]);
    setImpuritiesList([]);
    setMainTab('dashboard');
  };

  // Example Spreadsheet Loader
  const handleLoadExampleSpreadsheet = () => {
    const example = [
      "Comirnaty\tVacina de RNAm contra COVID-19\tPfizer / BioNTech\tmRNA\tImunização ativa contra COVID-19\t12/2020\tTozinameran:30 mcg\tHidróxido de Alumínio:0.5 mg\tCloreto de Sódio:4.4 mg\tDNA residual:<10 ng",
      "SpiN-CTVacinas\tVacina Recombinante contra COVID-19\tCTVacinas / UFMG\tSubunidade Proteica (VLP)\tImunização e reforço contra variante COVID-19\t2023\tProteína SpiN:50 mcg\tSaponina QS-21:50 mcg\tPBS Tampão:1 mL\tEndotoxinas:<0.05 EU/mL"
    ].join('\n');
    setSpreadsheetText(example);
  };

  // Process Spreadsheet Batch
  const handleProcessSpreadsheet = () => {
    if (!spreadsheetText.trim()) {
      alert('Cole os dados da planilha na caixa de texto primeiro.');
      return;
    }
    const lines = spreadsheetText.trim().split('\n');
    let addedCount = 0;
    const now = new Date().toISOString().split('T')[0];

    lines.forEach(line => {
      const cols = line.split('\t');
      if (cols.length >= 2) {
        const name = cols[0]?.trim();
        const formula = cols[1]?.trim() || name;
        const producer = cols[2]?.trim() || 'CTVacinas';
        const platform = (cols[3]?.trim() as VaccinePlatform) || 'Proteína Recombinante';
        const pathogen = cols[4]?.trim() || 'Infecção Viral';

        if (name) {
          const newCand: VaccineCandidate = {
            id: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            codeName: formula,
            platform: platform || 'Proteína Recombinante',
            targetPathogen: pathogen,
            phase: 'Ensaio Clínico Fase 1',
            status: 'Em Desenvolvimento',
            leadResearcher: producer,
            description: `Importado via Planilha | Indicação: ${cols[4] || 'N/A'} | Data Aprovação: ${cols[5] || 'N/A'}`,
            associatedComponentIds: [],
            anvisaStatus: 'Em Análise Regulatória',
            technicalNotes: `Antígenos: ${cols[6] || 'N/A'} | Adjuvantes: ${cols[7] || 'N/A'}`,
            createdDate: now,
            updatedDate: now
          };
          candidates.push(newCand);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      onUpdateCandidates([...candidates]);
      setSpreadsheetStatus('success');
      alert(`Sucesso! ${addedCount} vacinas foram importadas e cadastradas no catálogo.`);
      setSpreadsheetText('');
    } else {
      alert('Nenhum registro no formato correto foi identificado. Verifique os dados e tente novamente.');
    }
  };

  // Process PDF with Gemini mock
  const handleProcessPdfWithGemini = () => {
    if (pdfFiles.length === 0) {
      alert('Selecione ou solte ao menos um arquivo PDF de bula.');
      return;
    }
    setPdfProcessing(true);
    setTimeout(() => {
      setPdfProcessing(false);
      setPdfResult(`Bula Analisada com Sucesso pelo Gemini AI:\n- Candidato Vacinal: SpiN-CTVacinas v2\n- Antígeno Recombinante: 50 mcg/dose\n- Adjuvante: Alumínio + QS21\n- Pureza por HPLC: >98%\n- Endotoxinas: <0.01 EU/dose`);
    }, 1500);
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
      {/* Navigation Header / Main Tabs */}
      <div className="bg-slate-900 rounded-[2.5rem] p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-black text-lg shadow-inner">
              G
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                GESTÃO REGULATÓRIA DE VACINAS
              </h1>
              <p className="text-xs font-bold text-slate-400 tracking-wider">
                Módulo Especializado de Vacinas & Componentes Biológicos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck size={13} /> Anvisa OK
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Activity size={13} /> {totalCandidates} Vacinas
            </span>
          </div>
        </div>
      </div>

      {/* ==================== 1. DASHBOARD VIEW ==================== */}
      {mainTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top Banner Header as in Image 1 */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            {/* Background DNA Watermark Illustration */}
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10">
              <svg width="300" height="200" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20,10 Q50,50 80,90 M80,10 Q50,50 20,90" />
                <line x1="30" y1="23" x2="70" y2="23" />
                <line x1="38" y1="35" x2="62" y2="35" />
                <line x1="45" y1="46" x2="55" y2="46" />
                <line x1="38" y1="65" x2="62" y2="65" />
                <line x1="30" y1="77" x2="70" y2="77" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                  Gestão Regulatória de Vacinas
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
                  Módulo especializado no desenvolvimento e controle de vacinas e componentes biológicos
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xs">
                  <ShieldCheck size={14} className="text-emerald-400" /> ANVISA OK
                </span>
                <span className="px-3.5 py-1.5 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xs">
                  <Activity size={14} className="text-teal-400" /> 3 VACINAS ATIVAS
                </span>
              </div>
            </div>
          </div>

          {/* 5 Metric Cards as in Image 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Vacinas Cadastradas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  VACINAS CADASTRADAS
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {totalCandidates || 3} <span className="text-xs font-bold text-slate-500 font-normal">Ativas</span>
                </span>
              </div>
              <div className="w-full h-1 bg-emerald-500 rounded-full mt-4" />
            </div>

            {/* Card 2: Componentes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  COMPONENTES
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {totalComponents || 12} <span className="text-xs font-bold text-slate-500 font-normal">Cadastrados</span>
                </span>
              </div>
              <div className="w-full h-1 bg-blue-500 rounded-full mt-4" />
            </div>

            {/* Card 3: Ensaios Ativos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  ENSAIOS ATIVOS
                </span>
                <span className="text-2xl font-black text-slate-900">
                  8 <span className="text-xs font-bold text-slate-500 font-normal">Em andamento</span>
                </span>
              </div>
              <div className="w-full h-1 bg-purple-500 rounded-full mt-4" />
            </div>

            {/* Card 4: Lotes Produzidos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  LOTES PRODUZIDOS
                </span>
                <span className="text-2xl font-black text-slate-900">
                  25 <span className="text-xs font-bold text-slate-500 font-normal">Este ano</span>
                </span>
              </div>
              <div className="w-full h-1 bg-amber-500 rounded-full mt-4" />
            </div>

            {/* Card 5: Dossiês em Andamento */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  DOSSIÊS EM ANDAMENTO
                </span>
                <span className="text-2xl font-black text-slate-900">
                  3 <span className="text-xs font-bold text-slate-500 font-normal">Regulatórios</span>
                </span>
              </div>
              <div className="w-full h-1 bg-emerald-500 rounded-full mt-4" />
            </div>

          </div>

          {/* Search & Filter Bar as in Image 1 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-1/2">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por vacina, componente, antígeno, código ou lote..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select 
                value={phaseFilter}
                onChange={e => setPhaseFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="Todos">Todas as vacinas</option>
                {phasesList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select 
                value={platformFilter}
                onChange={e => setPlatformFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="Todos">Todos os status</option>
                <option value="Proteína Recombinante">Proteína Recombinante</option>
                <option value="Vetor Viral">Vetor Viral</option>
                <option value="RNA/mRNA">RNA/mRNA</option>
              </select>

              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                <Plus size={14} /> FILTROS
              </button>
            </div>
          </div>

          {/* 3-Column Main Content Grid as in Image 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: VACINAS EM DESENVOLVIMENTO */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-5">
                  VACINAS EM DESENVOLVIMENTO
                </h3>

                <div className="space-y-4">
                  {/* Item 1: SpiN-UTG */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">SpiN-UTG</h4>
                        <p className="text-[10px] text-slate-500 font-bold">COVID-19</p>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[9px] font-black uppercase">
                        ENSAIO CLÍNICO FASE 1
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">SARS-CoV-2 / Proteína Recombinante</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Progresso</span>
                        <span>65%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Item 2: Leishtec */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Leishtec</h4>
                        <p className="text-[10px] text-slate-500 font-bold">Leishmaniose Visceral</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[9px] font-black uppercase">
                        REGISTRO / PRODUÇÃO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">Leishmania infantum / Proteína Recombinante</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Progresso</span>
                        <span>40%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Item 3: ChagasVac */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">ChagasVac</h4>
                        <p className="text-[10px] text-slate-500 font-bold">Doença de Chagas</p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[9px] font-black uppercase">
                        PRÉ-CLÍNICO IN VIVO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">Trypanosoma cruzi / Vetor Viral</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Progresso</span>
                        <span>20%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <button 
                onClick={() => setMainTab('catalog')}
                className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start transition"
              >
                Ver todas as vacinas &rarr;
              </button>
            </div>

            {/* Column 2: ESTÁGIO DE DESENVOLVIMENTO */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-5">
                  ESTÁGIO DE DESENVOLVIMENTO
                </h3>

                {/* Donut Chart Visual Representation */}
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-emerald-200"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-teal-600"
                        strokeDasharray="33, 100"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray="34, 100"
                        strokeDashoffset="-33"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-500"
                        strokeDasharray="33, 100"
                        strokeDashoffset="-67"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-black text-slate-900 block leading-none">3</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Total de vacinas</span>
                    </div>
                  </div>

                  {/* Donut Chart Legend */}
                  <div className="w-full mt-6 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="font-bold text-slate-700">Pré-clínico</span>
                      </div>
                      <span className="font-mono font-bold text-slate-600">33% (1)</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-600" />
                        <span className="font-bold text-slate-700">Ensaio clínico</span>
                      </div>
                      <span className="font-mono font-bold text-slate-600">33% (1)</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-700">Registro / Produção</span>
                      </div>
                      <span className="font-mono font-bold text-slate-600">34% (1)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setMainTab('catalog')}
                className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start transition"
              >
                Ver relatório completo &rarr;
              </button>
            </div>

            {/* Column 3: ATIVIDADES RECENTES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-5">
                  ATIVIDADES RECENTES
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Event 1 */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Novo lote produzido</span>
                      <span className="text-[9px] font-bold text-slate-400">Hoje, 09:32</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Lote #L25-0007 registrado com sucesso</p>
                  </div>

                  {/* Event 2 */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Ensaio concluído</span>
                      <span className="text-[9px] font-bold text-slate-400">Ontem, 16:45</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Ensaio de potência - SpiN-UTG</p>
                  </div>

                  {/* Event 3 */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Vacina atualizada</span>
                      <span className="text-[9px] font-bold text-slate-400">12/05/2024</span>
                    </div>
                    <p className="text-[11px] text-slate-600">SpiN-UTG - Atualização de formulação</p>
                  </div>

                  {/* Event 4 */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Dossiê enviado</span>
                      <span className="text-[9px] font-bold text-slate-400">10/05/2024</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Dossiê regulatório - Leishtec</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setMainTab('catalog')}
                className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start transition"
              >
                Ver todas as atividades &rarr;
              </button>
            </div>

          </div>

          {/* Bottom Section: ACESSO RÁPIDO - COMPONENTES PRINCIPAIS as in Image 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              ACESSO RÁPIDO - COMPONENTES PRINCIPAIS
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              
              {/* Category Card 1: Antígenos */}
              <div 
                onClick={() => setMainTab('explorer')}
                className="p-4 bg-slate-50/80 hover:bg-emerald-50/60 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                  <Dna size={18} />
                </div>
                <h4 className="font-black text-slate-900 text-xs">Antígenos</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">5 cadastrados</p>
              </div>

              {/* Category Card 2: Adjuvantes */}
              <div 
                onClick={() => setMainTab('explorer')}
                className="p-4 bg-slate-50/80 hover:bg-emerald-50/60 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <Sparkles size={18} />
                </div>
                <h4 className="font-black text-slate-900 text-xs">Adjuvantes</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">3 cadastrados</p>
              </div>

              {/* Category Card 3: Excipientes */}
              <div 
                onClick={() => setMainTab('explorer')}
                className="p-4 bg-slate-50/80 hover:bg-emerald-50/60 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <TestTube size={18} />
                </div>
                <h4 className="font-black text-slate-900 text-xs">Excipientes</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">4 cadastrados</p>
              </div>

              {/* Category Card 4: Vetores */}
              <div 
                onClick={() => setMainTab('explorer')}
                className="p-4 bg-slate-50/80 hover:bg-emerald-50/60 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <Box size={18} />
                </div>
                <h4 className="font-black text-slate-900 text-xs">Vetores</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">2 cadastrados</p>
              </div>

              {/* Category Card 5: Estabilizantes */}
              <div 
                onClick={() => setMainTab('explorer')}
                className="p-4 bg-slate-50/80 hover:bg-emerald-50/60 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-black text-slate-900 text-xs">Estabilizantes</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">2 cadastrados</p>
              </div>

            </div>

            <button 
              onClick={() => setMainTab('explorer')}
              className="mt-4 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
            >
              Ver todos os componentes &rarr;
            </button>
          </div>

        </div>
      )}

      {/* ==================== 2. INCLUSÃO MANUAL VIEW ==================== */}
      {mainTab === 'manual_inclusion' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">INCLUSÃO MANUAL</h2>
            <p className="text-xs font-bold text-slate-400">Cadastro e preenchimento de dossiês regulatórios</p>
          </div>

          <form onSubmit={handleSaveManualDossier} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome Comercial / Código *</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Ex: SpiN-CTVacinas v2"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Patógeno Alvo *</label>
                <input
                  type="text"
                  required
                  value={manualPathogen}
                  onChange={e => setManualPathogen(e.target.value)}
                  placeholder="Ex: SARS-CoV-2 / Leishmaniose"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estudos de Segurança & Toxicologia</label>
                <textarea
                  rows={3}
                  value={manualSafetyText}
                  onChange={e => setManualSafetyText(e.target.value)}
                  placeholder="Ex: Estudos fase III indicando efeitos colaterais leves..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Outros Estudos (Eficácia e Estabilidade)</label>
                <textarea
                  rows={3}
                  value={manualOtherText}
                  onChange={e => setManualOtherText(e.target.value)}
                  placeholder="Ex: Eficácia de 95% contra hospitalização. Conservação a -70°C..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Link para o Documento Oficial / Bula PDF</label>
              <input
                type="text"
                value={manualDocLink}
                onChange={e => setManualDocLink(e.target.value)}
                placeholder="Ex: https://anvisa.gov.br/bula-exemplo"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
                COMPOSIÇÃO QUÍMICA E IMUNOBIOLÓGICOS
              </h3>

              {/* 1. Antígenos / IFA */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800">1. ANTÍGENOS / IFA</span>
                  <button
                    type="button"
                    onClick={() => setAntigensList([...antigensList, { name: '', qty: '' }])}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition"
                  >
                    + Adicionar Antígeno
                  </button>
                </div>
                {antigensList.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => {
                        const copy = [...antigensList];
                        copy[idx].name = e.target.value;
                        setAntigensList(copy);
                      }}
                      placeholder="Nome químico (Ex: Tozinameran)"
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={item.qty}
                      onChange={e => {
                        const copy = [...antigensList];
                        copy[idx].qty = e.target.value;
                        setAntigensList(copy);
                      }}
                      placeholder="Ex: 30 mcg"
                      className="w-32 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* 2. Excipientes e Inativos */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800">2. EXCIPIENTES E INATIVOS</span>
                  <button
                    type="button"
                    onClick={() => setExcipientsList([...excipientsList, { name: '', qty: '' }])}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition"
                  >
                    + Adicionar Excipiente
                  </button>
                </div>
                {excipientsList.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => {
                        const copy = [...excipientsList];
                        copy[idx].name = e.target.value;
                        setExcipientsList(copy);
                      }}
                      placeholder="Ex: Polissorbato 80"
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={item.qty}
                      onChange={e => {
                        const copy = [...excipientsList];
                        copy[idx].qty = e.target.value;
                        setExcipientsList(copy);
                      }}
                      placeholder="Ex: q.s.p 0,5 mL"
                      className="w-32 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* 3. Impurezas Reguladas */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800">3. IMPUREZAS REGULADAS</span>
                  <button
                    type="button"
                    onClick={() => setImpuritiesList([...impuritiesList, { name: '', limit: '' }])}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase transition"
                  >
                    + Adicionar Impureza
                  </button>
                </div>
                {impuritiesList.length === 0 ? (
                  <p className="text-[10px] italic text-slate-400">Nenhum teor limites de impurezas mapeados ainda.</p>
                ) : (
                  impuritiesList.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const copy = [...impuritiesList];
                          copy[idx].name = e.target.value;
                          setImpuritiesList(copy);
                        }}
                        placeholder="Nome do resíduo (Ex: DNA residual)"
                        className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={item.limit}
                        onChange={e => {
                          const copy = [...impuritiesList];
                          copy[idx].limit = e.target.value;
                          setImpuritiesList(copy);
                        }}
                        placeholder="Ex: <10 ng/dose"
                        className="w-32 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none font-mono"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-slate-900 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg"
              >
                Gravar Registro no Catálogo Nacional
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. IMPORTAR PLANILHA VIEW ==================== */}
      {mainTab === 'import_spreadsheet' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">IMPORTAR PLANILHA</h2>
              <p className="text-xs font-bold text-slate-400">Ingestão em lote de vacinas via cópia de planilha</p>
            </div>

            <button
              onClick={handleLoadExampleSpreadsheet}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 self-start"
            >
              <Copy size={14} /> Carregar Dados de Exemplo
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
            <p className="font-bold text-slate-700 flex items-center gap-2">
              <Info size={14} className="text-teal-600" /> Instruções para o Formato da Planilha:
            </p>
            <p className="text-[11px] text-slate-500">
              Sua planilha ou arquivo CSV deve conter exatamente <strong>10 colunas</strong> na ordem indicada abaixo, separadas por tabulações (padrão de cópia do Excel e Google Sheets) ou por ponto e vírgula/vírgula:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-black">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Nome Coluna</th>
                    <th className="py-2">Formato / Exemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  <tr><td className="py-1.5 font-mono">COL 1</td><td className="font-bold">Nome Comercial</td><td>Ex: Comirnaty (Nome comercial principal)</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 2</td><td className="font-bold">Fórmula / Nome Técnico</td><td>Ex: Vacina de RNAm contra COVID-19</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 3</td><td className="font-bold">Fabricante</td><td>Ex: Pfizer / BioNTech</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 4</td><td className="font-bold">Plataforma</td><td>mRNA, Vírus Inativado, Vetor Viral, Subunidade Proteica</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 5</td><td className="font-bold">Indicação Principal</td><td>Ex: Imunização ativa contra COVID-19</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 6</td><td className="font-bold">Data Aprovação</td><td>Ex: 12/2020 ou Ano</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 7</td><td className="font-bold">Antígenos</td><td>Nome:Quantidade (Ex: Tozinameran:30 mcg)</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 8</td><td className="font-bold">Adjuvantes</td><td>Nome:Quantidade (Ex: Hidróxido de Alumínio:0.5 mg)</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 9</td><td className="font-bold">Excipientes</td><td>Nome:Quantidade (Ex: Cloreto de Sódio:4.4 mg)</td></tr>
                  <tr><td className="py-1.5 font-mono">COL 10</td><td className="font-bold">Impurezas</td><td>Nome:Limite (Ex: DNA residual:&lt;10 ng)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-2">
              Cole aqui os dados de sua Planilha (Excel, Sheets, ou arquivo CSV) ou use dados manuais:
            </label>
            <textarea
              rows={8}
              value={spreadsheetText}
              onChange={e => setSpreadsheetText(e.target.value)}
              placeholder="Nome Comercial [Tab] Nome Vacina [Tab] Fabricante [Tab] Plataforma..."
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleProcessSpreadsheet}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center gap-2"
            >
              <FileSpreadsheet size={16} /> Processar e Pré-visualizar
            </button>
          </div>
        </div>
      )}

      {/* ==================== 4. IMPORTAR PDF VIEW ==================== */}
      {mainTab === 'import_pdf' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">IMPORTAR PDF</h2>
            <p className="text-xs font-bold text-slate-400">Extração inteligente de PDF de bulas via Gemini</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-teal-700 font-black text-sm uppercase">
                <Sparkles size={18} /> Leitor Inteligente de Bulas em PDF (Gemini AI)
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Selecione um ou mais arquivos em formato PDF de bulas ou documentos regulatórios de vacinas. O Gemini analisará o documento completo e coletará dezenas de informações estruturadas automaticamente.
              </p>

              <div
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf';
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) setPdfFiles([e.target.files[0]]);
                  };
                  input.click();
                }}
                className="p-8 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl text-center cursor-pointer transition bg-white space-y-2"
              >
                <Upload size={32} className="mx-auto text-slate-400" />
                <p className="text-xs font-black uppercase text-slate-700">Arraste e solte ou clique aqui</p>
                <p className="text-[10px] text-slate-400">Formatos suportados: Apenas arquivos .PDF</p>
                {pdfFiles.length > 0 && (
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    Selecionado: {pdfFiles[0].name}
                  </span>
                )}
              </div>

              <button
                onClick={handleProcessPdfWithGemini}
                disabled={pdfProcessing}
                className="w-full py-3 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> {pdfProcessing ? 'Analisando PDF com Gemini...' : 'Processar Lote de PDFs com Gemini'}
              </button>
            </div>

            {/* Ficha de Revisão Vazia / Output */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col justify-center items-center text-center space-y-3">
              {pdfResult ? (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-left text-xs font-mono text-teal-900 whitespace-pre-line w-full">
                  {pdfResult}
                </div>
              ) : (
                <>
                  <FileText size={48} className="text-slate-300" />
                  <h3 className="text-xs font-black uppercase text-slate-600">Ficha de Revisão Vazia</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    Adicione seus PDFs de bulas e clique em "Processar Lote de PDFs com Gemini" para executar a extração automatizada de ingredientes.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. EXPLORADOR VIEW ==================== */}
      {mainTab === 'explorer' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">EXPLORADOR</h2>
            <p className="text-xs font-bold text-slate-400">Mapeamento bidirecional de insumos e composição</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <Compass size={16} className="text-teal-600" /> Mapeamento de Insumos & Inter-relação Regulatório
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analise o vínculo cruzado automático de substâncias do catálogo nacional. Selecione qualquer componente abaixo para auditar imediatamente todas as vacinas que compartilham deste adjuvante ou ingrediente ativo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Panel: Cataloged Substances */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  SUBSTÂNCIAS CATALOGADAS ({components.length})
                </span>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={explorerFilter}
                    onChange={e => setExplorerFilter(e.target.value)}
                    placeholder="Filtrar excipiente, IFA ou adjuvantes..."
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {components.filter(c => c.name.toLowerCase().includes(explorerFilter.toLowerCase())).map(comp => (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedSubstance(comp)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        selectedSubstance?.id === comp.id ? 'bg-teal-50 border-teal-300 font-bold' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{comp.name}</span>
                        <span className="text-[10px] text-slate-400">{comp.category} | {comp.code}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                  {components.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-8 text-center">Nenhuma substância mapeada na base regulatória.</p>
                  )}
                </div>
              </div>

              {/* Right Panel: Cross Mapping */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center space-y-2">
                {selectedSubstance ? (
                  <div className="text-left w-full space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 block">Correlação Encontrada</span>
                    <h4 className="font-black text-slate-900 text-sm">{selectedSubstance.name}</h4>
                    <p className="text-xs text-slate-600">Categoria: {selectedSubstance.category} | Grau: {selectedSubstance.grade}</p>
                    <p className="text-xs text-slate-500">Lote Atual: {selectedSubstance.batchNumber}</p>
                  </div>
                ) : (
                  <>
                    <Compass size={36} className="text-slate-300" />
                    <h4 className="text-xs font-black uppercase text-slate-600">Sem Correlações Ativas</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs">
                      Clique em qualquer insumo biológico ou veículo químico da lista lateral para correlacionar imediatamente.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. CATÁLOGO & LOTES VIEW ==================== */}
      {mainTab === 'catalog' && (
        <div className="space-y-6">
          {/* Subtabs for Catalog */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setCatalogSubTab('candidates')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                  catalogSubTab === 'candidates' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Syringe size={14} /> Candidatos Vacinais ({candidates.length})
              </button>

              <button
                onClick={() => setCatalogSubTab('components')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                  catalogSubTab === 'components' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Dna size={14} /> Componentes & Insumos ({components.length})
              </button>

              <button
                onClick={() => setCatalogSubTab('batches')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                  catalogSubTab === 'batches' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <TestTube size={14} /> Lotes de Formulação ({formulationBatches.length})
              </button>

              <button
                onClick={() => setCatalogSubTab('pipeline')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                  catalogSubTab === 'pipeline' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <BarChart2 size={14} /> Pipeline
              </button>
            </div>

            <div className="flex items-center gap-2">
              {catalogSubTab === 'candidates' && (
                <button
                  onClick={() => setCandidateModal({})}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
                >
                  <Plus size={14} /> Novo Candidato
                </button>
              )}
              {catalogSubTab === 'components' && (
                <button
                  onClick={() => setComponentModal({})}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
                >
                  <Plus size={14} /> Novo Insumo
                </button>
              )}
              {catalogSubTab === 'batches' && (
                <button
                  onClick={() => setBatchModal({ componentsUsed: [] })}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
                >
                  <Plus size={14} /> Novo Lote
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT: CANDIDATES */}
          {catalogSubTab === 'candidates' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCandidates.map(cand => (
                  <div key={cand.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-teal-700 block">{cand.platform}</span>
                      <h4 className="font-black text-slate-900 text-base">{cand.name}</h4>
                      <p className="text-xs font-bold text-slate-600">Patógeno: {cand.targetPathogen}</p>
                      <p className="text-[10px] text-slate-500">Fase: {cand.phase}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewCandidate(cand)} className="p-2 text-slate-500 hover:text-slate-800"><Eye size={16}/></button>
                      <button onClick={() => setCandidateModal(cand)} className="p-2 text-slate-500 hover:text-teal-700"><Edit3 size={16}/></button>
                      <button onClick={() => handleDeleteCandidate(cand.id, cand.name)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: COMPONENTS */}
          {catalogSubTab === 'components' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredComponents.map(comp => (
                  <div key={comp.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-slate-500 block">{comp.code}</span>
                      <h4 className="font-black text-slate-900 text-base">{comp.name}</h4>
                      <p className="text-xs font-bold text-slate-600">Categoria: {comp.category}</p>
                      <p className="text-[10px] text-slate-500">Estoque: {comp.stockQuantity} {comp.unit} | Temp: {comp.storageTemperature}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => setComponentModal(comp)} className="p-2 text-slate-500 hover:text-teal-700"><Edit3 size={16}/></button>
                      <button onClick={() => handleDeleteComponent(comp.id, comp.name)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: BATCHES */}
          {catalogSubTab === 'batches' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBatches.map(batch => (
                  <div key={batch.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-black text-teal-700 block">{batch.batchCode}</span>
                      <h4 className="font-black text-slate-900 text-base">Lote de Formulação</h4>
                      <p className="text-xs text-slate-600">Responsável: {batch.responsibleTechnician}</p>
                      <p className="text-[10px] text-slate-500">Data Preparo: {batch.preparationDate}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDeleteBatch(batch.id, batch.batchCode)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: PIPELINE */}
          {catalogSubTab === 'pipeline' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">PIPELINE VACINAL CTVACINAS</h3>
              <div className="p-8 text-center text-slate-400 space-y-2">
                <BarChart2 size={36} className="mx-auto text-teal-600" />
                <p className="text-xs font-bold uppercase">Relatório de Avanço Clínico</p>
                <p className="text-[10px]">Visão consolidada dos marcos regulatórios de desenvolvimento.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS Preserved */}
      {candidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight">
                {candidateModal.id ? 'Editar Candidato' : 'Novo Candidato Vacinal'}
              </h3>
              <button onClick={() => setCandidateModal(null)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={candidateModal.name || ''}
                  onChange={e => setCandidateModal({ ...candidateModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Patógeno Alvo *</label>
                <input
                  type="text"
                  required
                  value={candidateModal.targetPathogen || ''}
                  onChange={e => setCandidateModal({ ...candidateModal, targetPathogen: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setCandidateModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold uppercase">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-teal-700 text-white rounded-xl font-black uppercase">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {componentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight">
                {componentModal.id ? 'Editar Insumo' : 'Novo Insumo / Componente'}
              </h3>
              <button onClick={() => setComponentModal(null)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveComponent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={componentModal.name || ''}
                    onChange={e => setComponentModal({ ...componentModal, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={componentModal.code || ''}
                    onChange={e => setComponentModal({ ...componentModal, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setComponentModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold uppercase">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-teal-700 text-white rounded-xl font-black uppercase">Salvar Insumo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block">Ficha da Vacina</span>
                <h3 className="text-xl font-black uppercase">{viewCandidate.name}</h3>
              </div>
              <button onClick={() => setViewCandidate(null)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
                <div><span className="text-[9px] font-black uppercase text-slate-400 block">Patógeno</span><span className="font-bold">{viewCandidate.targetPathogen}</span></div>
                <div><span className="text-[9px] font-black uppercase text-slate-400 block">Fase</span><span className="font-bold text-teal-800">{viewCandidate.phase}</span></div>
                <div><span className="text-[9px] font-black uppercase text-slate-400 block">Plataforma</span><span className="font-bold">{viewCandidate.platform}</span></div>
                <div><span className="text-[9px] font-black uppercase text-slate-400 block">Pesquisador</span><span className="font-bold">{viewCandidate.leadResearcher}</span></div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Descrição & Estudos</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700">{viewCandidate.description || 'Sem descrição.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinesComponentsManager;
