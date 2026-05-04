
import React, { useState } from 'react';
import { RegulatoryStandard, RegulatoryStandardStatus, ActivityPlanTemplate, Project } from '../types';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag
} from 'lucide-react';

interface RegulatoryStandardsManagerProps {
  standards: RegulatoryStandard[];
  onAddStandard: (standard: RegulatoryStandard) => void;
  onUpdateStandard: (standard: RegulatoryStandard) => void;
  onDeleteStandard: (id: string) => void;
  activityPlans: ActivityPlanTemplate[];
  projects: Project[];
}

const RegulatoryStandardsManager: React.FC<RegulatoryStandardsManagerProps> = ({
  standards,
  onAddStandard,
  onUpdateStandard,
  onDeleteStandard,
  activityPlans,
  projects
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<RegulatoryStandard, 'id'>>({
    name: '',
    type: 'Manual',
    theme: '',
    phase: '',
    relatedActivities: [],
    version: '1.0',
    status: 'vigente',
    summary: '',
    documentLink: '',
    notebookLMLink: '',
    keywords: [],
    appliesTo: ''
  });

  const [activityInput, setActivityInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allSystemActivities = React.useMemo(() => {
    const names = new Set<string>();
    
    // From templates
    activityPlans.forEach(plan => {
      plan.macroActivities.forEach(macro => names.add(macro.name));
    });
    
    // From projects
    projects.forEach(project => {
      project.macroActivities.forEach(macro => {
        names.add(macro.name);
        macro.microActivities.forEach(micro => names.add(micro.name));
      });
    });
    
    return Array.from(names).sort();
  }, [activityPlans, projects]);

  const filteredSuggestions = allSystemActivities.filter(name => 
    name.toLowerCase().includes(activityInput.toLowerCase()) && 
    !formData.relatedActivities.includes(name)
  ).slice(0, 5);

  const handleAddActivity = (activityName?: string) => {
    const finalName = activityName || activityInput.trim();
    if (finalName && !formData.relatedActivities.includes(finalName)) {
      setFormData({
        ...formData,
        relatedActivities: [...formData.relatedActivities, finalName]
      });
      setActivityInput('');
      setShowSuggestions(false);
    }
  };

  const removeActivity = (activity: string) => {
    setFormData({
      ...formData,
      relatedActivities: formData.relatedActivities.filter(a => a !== activity)
    });
  };

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords?.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keyword]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: (formData.keywords || []).filter(k => k !== keyword)
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Manual',
      theme: '',
      phase: '',
      relatedActivities: [],
      version: '1.0',
      status: 'vigente',
      summary: '',
      documentLink: '',
      notebookLMLink: '',
      keywords: [],
      appliesTo: ''
    });
    setActivityInput('');
    setKeywordInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateStandard({ ...formData, id: editingId });
      setEditingId(null);
    } else {
      onAddStandard({ ...formData, id: crypto.randomUUID() });
      setIsAdding(false);
    }
    resetForm();
  };

  const startEdit = (standard: RegulatoryStandard) => {
    setFormData({
      name: standard.name,
      type: standard.type || 'Manual',
      theme: standard.theme,
      phase: standard.phase,
      relatedActivities: standard.relatedActivities,
      version: standard.version,
      status: standard.status,
      summary: standard.summary,
      documentLink: standard.documentLink,
      notebookLMLink: standard.notebookLMLink,
      keywords: standard.keywords || [],
      appliesTo: standard.appliesTo || ''
    });
    setEditingId(standard.id);
    setIsAdding(true);
  };

  const filteredStandards = standards.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.keywords && s.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (s.appliesTo && s.appliesTo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: RegulatoryStandardStatus) => {
    switch (status) {
      case 'vigente': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'vigente com alteração': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Alterador': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'À Entrar em Vigor': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'obsoleto': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: RegulatoryStandardStatus) => {
    switch (status) {
      case 'vigente': return <CheckCircle2 size={12} />;
      case 'vigente com alteração': return <Edit2 size={12} />;
      case 'Alterador': return <Plus size={12} />;
      case 'À Entrar em Vigor': return <Clock size={12} />;
      case 'obsoleto': return <AlertCircle size={12} />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <ShieldCheck size={24} />
            </div>
            Gestão de Normas Regulatórias
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Cadastre e gerencie normas padronizadas para todo o sistema.</p>
        </div>
        
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={18} /> Nova Norma
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              {editingId ? 'Editar Norma' : 'Cadastrar Nova Norma'}
            </h2>
            <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Norma</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: RDC 301/2019"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo da Norma</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium appearance-none bg-white"
                >
                  <option value="Manual">Manual</option>
                  <option value="Guia">Guia</option>
                  <option value="RDC">RDC</option>
                  <option value="Instrução Normativa">Instrução Normativa</option>
                  <option value="Portaria">Portaria</option>
                  <option value="Lei">Lei</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tema / Assunto</label>
                <input 
                  required
                  value={formData.theme}
                  onChange={e => setFormData({...formData, theme: e.target.value})}
                  placeholder="Ex: Boas Práticas de Fabricação"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fase do Projeto</label>
                <input 
                  value={formData.phase}
                  onChange={e => setFormData({...formData, phase: e.target.value})}
                  placeholder="Ex: Produção, Qualidade, etc."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Versão</label>
                  <input 
                    value={formData.version}
                    onChange={e => setFormData({...formData, version: e.target.value})}
                    placeholder="1.0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as RegulatoryStandardStatus})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium appearance-none bg-white"
                  >
                    <option value="vigente">Vigente</option>
                    <option value="vigente com alteração">Vigente com alteração</option>
                    <option value="Alterador">Alterador</option>
                    <option value="À Entrar em Vigor">À Entrar em Vigor</option>
                    <option value="obsoleto">Obsoleto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resumo / Descrição</label>
                <textarea 
                  required
                  value={formData.summary}
                  onChange={e => setFormData({...formData, summary: e.target.value})}
                  rows={3}
                  placeholder="Breve descrição do conteúdo e aplicabilidade da norma..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium resize-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Se aplica a...</label>
                <input 
                  value={formData.appliesTo}
                  onChange={e => setFormData({...formData, appliesTo: e.target.value})}
                  placeholder="Ex: Laboratórios, Equipe de Qualidade, Processo de Fabricação X"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Palavras Chaves (Facilitar Busca)</label>
                <div className="flex gap-2">
                  <input 
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Digite uma palavra chave..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                  <button 
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(formData.keywords || []).map(keyword => (
                    <span key={keyword} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-tight border border-slate-200">
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(keyword)} className="hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Documento Oficial</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    value={formData.documentLink}
                    onChange={e => setFormData({...formData, documentLink: e.target.value})}
                    placeholder="https://..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link NotebookLM</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    value={formData.notebookLMLink}
                    onChange={e => setFormData({...formData, notebookLMLink: e.target.value})}
                    placeholder="https://notebooklm.google.com/..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Atividades Relacionadas (Vínculo Automático)</label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input 
                      value={activityInput}
                      onChange={e => {
                        setActivityInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                      placeholder="Digite o nome exato da atividade..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddActivity()}
                      className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                      Adicionar
                    </button>
                  </div>

                  {showSuggestions && activityInput && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {filteredSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddActivity(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex items-center gap-2"
                        >
                          <Plus size={14} className="text-slate-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.relatedActivities.map(activity => (
                    <span key={activity} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold uppercase tracking-tight border border-brand-primary/20">
                      {activity}
                      <button type="button" onClick={() => removeActivity(activity)} className="hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {formData.relatedActivities.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">Nenhuma atividade vinculada. A norma não aparecerá automaticamente nos projetos.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                className="px-6 py-3 text-slate-500 font-bold uppercase text-xs tracking-widest hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
              >
                <Save size={18} /> {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, tema ou resumo..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStandards.map(standard => (
              <div key={standard.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(standard.status)}`}>
                        {getStatusIcon(standard.status)}
                        {standard.status}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        <Tag size={10} />
                        {standard.type || 'Manual'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versão {standard.version}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">{standard.name}</h3>
                    <p className="text-brand-primary text-xs font-bold uppercase tracking-wider">{standard.theme}</p>
                    
                    {standard.appliesTo && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Se aplica a:</span>
                        <span className="text-xs font-bold text-slate-700">{standard.appliesTo}</span>
                      </div>
                    )}

                    {standard.keywords && standard.keywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {standard.keywords.map(kw => (
                          <span key={kw} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-tight">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(standard)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-primary rounded-lg transition" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteStandard(standard.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                  {standard.summary}
                </p>

                <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-3">
                    {standard.documentLink && (
                      <a 
                        href={standard.documentLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-500 hover:text-brand-primary text-xs font-bold uppercase tracking-tight transition"
                      >
                        <FileText size={14} /> Documento <ExternalLink size={12} />
                      </a>
                    )}
                    {standard.notebookLMLink && (
                      <a 
                        href={standard.notebookLMLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-xs font-bold uppercase tracking-tight transition"
                      >
                        <BookOpen size={14} /> NotebookLM <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculos:</span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                      {standard.relatedActivities.length} Atividades
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredStandards.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-black uppercase tracking-tight">Nenhuma norma encontrada</h3>
                  <p className="text-slate-500 text-sm font-medium">Tente ajustar sua busca ou cadastre uma nova norma.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulatoryStandardsManager;
