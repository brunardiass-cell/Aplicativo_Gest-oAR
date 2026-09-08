import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  ArrowRight, 
  Info, 
  FileText, 
  Check, 
  Edit3, 
  Layers
} from 'lucide-react';
import { 
  MicroOperationalTemplate, 
  MicroTemplateChecklistItem, 
  MicroTemplateDependency,
  loadMicroTemplates,
  saveMicroTemplates,
  DEFAULT_MICRO_TEMPLATES 
} from '../utils/microTemplates';

interface ManageTemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSaved?: (template: MicroOperationalTemplate) => void;
  initialTemplateToEdit?: MicroOperationalTemplate | null;
}

export const ManageTemplatesDrawer: React.FC<ManageTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  onTemplateSaved,
  initialTemplateToEdit
}) => {
  const [templatesList, setTemplatesList] = useState<MicroOperationalTemplate[]>([]);
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetUsage, setTargetUsage] = useState('Contratação de serviço');
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<MicroTemplateChecklistItem[]>([]);
  const [dependencies, setDependencies] = useState<MicroTemplateDependency[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loaded = loadMicroTemplates();
      setTemplatesList(loaded);

      if (initialTemplateToEdit) {
        startEditing(initialTemplateToEdit);
      } else {
        setIsCreatingOrEditing(false);
      }
    }
  }, [isOpen, initialTemplateToEdit]);

  const startNewTemplate = () => {
    setEditingTemplateId(null);
    setName('');
    setTargetUsage('Contratação de serviço');
    setDescription('');
    setChecklist([
      { id: `chk_${Date.now()}_1`, item: 'Definir escopo' },
      { id: `chk_${Date.now()}_2`, item: 'Solicitar orçamento' },
      { id: `chk_${Date.now()}_3`, item: 'Avaliar propostas' },
      { id: `chk_${Date.now()}_4`, item: 'Aprovar contrato' },
      { id: `chk_${Date.now()}_5`, item: 'Revisar relatório final' }
    ]);
    setDependencies([
      { id: `dep_${Date.now()}_1`, fromItem: 'Solicitar orçamento', toItem: 'Avaliar propostas' },
      { id: `dep_${Date.now()}_2`, fromItem: 'Aprovar contrato', toItem: 'Revisar relatório final' }
    ]);
    setError('');
    setIsCreatingOrEditing(true);
  };

  const startEditing = (tmpl: MicroOperationalTemplate) => {
    setEditingTemplateId(tmpl.id);
    setName(tmpl.name);
    setTargetUsage(tmpl.targetUsage || 'Contratação de serviço');
    setDescription(tmpl.description || '');
    setChecklist(tmpl.checklist.map(c => ({ ...c })));
    setDependencies((tmpl.internalDependencies || []).map(d => ({ ...d })));
    setError('');
    setIsCreatingOrEditing(true);
  };

  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    const newItem: MicroTemplateChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      item: newItemText.trim()
    };
    setChecklist([...checklist, newItem]);
    setNewItemText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    const itemToRemove = checklist.find(c => c.id === id);
    const updated = checklist.filter(c => c.id !== id);
    setChecklist(updated);
    if (itemToRemove) {
      setDependencies(dependencies.filter(d => d.fromItem !== itemToRemove.item && d.toItem !== itemToRemove.item));
    }
  };

  const handleUpdateChecklistText = (id: string, newText: string) => {
    const oldItem = checklist.find(c => c.id === id);
    setChecklist(checklist.map(c => c.id === id ? { ...c, item: newText } : c));
    if (oldItem && oldItem.item !== newText) {
      setDependencies(dependencies.map(d => ({
        ...d,
        fromItem: d.fromItem === oldItem.item ? newText : d.fromItem,
        toItem: d.toItem === oldItem.item ? newText : d.toItem
      })));
    }
  };

  const handleAddDependency = () => {
    if (checklist.length < 2) return;
    const from = checklist[0].item;
    const to = checklist[1].item;
    const newDep: MicroTemplateDependency = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      fromItem: from,
      toItem: to
    };
    setDependencies([...dependencies, newDep]);
  };

  const handleRemoveDependency = (id: string) => {
    setDependencies(dependencies.filter(d => d.id !== id));
  };

  const handleSaveTemplate = () => {
    if (!name.trim()) {
      setError('O nome do template é obrigatório.');
      return;
    }
    if (checklist.length === 0) {
      setError('Adicione ao menos um item ao checklist do template.');
      return;
    }

    const templateId = editingTemplateId || `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTmpl: MicroOperationalTemplate = {
      id: templateId,
      name: name.trim(),
      targetUsage,
      description: description.trim(),
      checklist,
      internalDependencies: dependencies,
      isCustom: true
    };

    let updatedList: MicroOperationalTemplate[];
    if (editingTemplateId) {
      updatedList = templatesList.map(t => t.id === editingTemplateId ? newTmpl : t);
    } else {
      updatedList = [...templatesList, newTmpl];
    }

    setTemplatesList(updatedList);
    saveMicroTemplates(updatedList);

    if (onTemplateSaved) {
      onTemplateSaved(newTmpl);
    }

    setIsCreatingOrEditing(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templatesList.filter(t => t.id !== id);
    setTemplatesList(updated);
    saveMicroTemplates(updated);
    if (editingTemplateId === id) {
      setIsCreatingOrEditing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 border-l border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              {isCreatingOrEditing ? (editingTemplateId ? 'Editar template' : 'Criar template') : 'Gerenciar templates'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCreatingOrEditing 
                ? 'Defina tarefas e dependências internas reutilizáveis para microatividades.'
                : 'Selecione, edite ou crie novos templates para microatividades.'
              }
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

          {!isCreatingOrEditing ? (
            /* List of existing templates */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Templates Disponíveis ({templatesList.length})</span>
                <button
                  type="button"
                  onClick={startNewTemplate}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Novo Template
                </button>
              </div>

              <div className="space-y-2.5">
                {templatesList.map(tmpl => (
                  <div 
                    key={tmpl.id}
                    className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">{tmpl.name}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                            {tmpl.targetUsage}
                          </span>
                        </div>
                        {tmpl.description && (
                          <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => startEditing(tmpl)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition"
                          title="Editar template"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tmpl.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition"
                          title="Excluir template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-3 pt-1 border-t border-slate-200/60">
                      <span>{tmpl.checklist.length} itens no checklist</span>
                      <span>•</span>
                      <span>{tmpl.internalDependencies?.length || 0} dependências</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Form: Create or Edit Template (Image 4 right column) */
            <div className="space-y-5">
              {/* Informative banner (Image 4) */}
              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                  i
                </div>
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong className="block font-bold">Templates são aplicados em microatividades</strong>
                  Cada template define tarefas e dependências dentro de uma microatividade. Eles não controlam macroatividades ou fases.
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                  {error}
                </div>
              )}

              {/* Template Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">
                  Nome do template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Serviço / contratação"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              {/* Target Usage */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">
                  Tipo de uso / Microatividade alvo <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetUsage}
                  onChange={e => setTargetUsage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="Contratação de serviço">Contratação de serviço</option>
                  <option value="Desenvolvimento técnico">Desenvolvimento técnico / bioprocesso</option>
                  <option value="Controle de qualidade">Controle de qualidade</option>
                  <option value="Caracterização">Caracterização</option>
                  <option value="Estabilidade">Estabilidade</option>
                  <option value="Assuntos regulatórios">Assuntos regulatórios</option>
                  <option value="Geral">Geral / Outros</option>
                </select>
                <p className="text-[11px] text-slate-400 font-medium">
                  Este template será sugerido para microatividades do tipo "{targetUsage}".
                </p>
              </div>

              {/* Internal Checklist (Image 4) */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    Checklist interno da microatividade
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newItemText.trim()) handleAddChecklistItem();
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Adicionar item
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Estas são as tarefas que serão criadas dentro da microatividade ao aplicar o template.
                </p>

                {/* Items list */}
                <div className="space-y-1.5">
                  {checklist.map((c, index) => (
                    <div 
                      key={c.id} 
                      className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition group"
                    >
                      <GripVertical size={13} className="text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={c.item}
                        onChange={e => handleUpdateChecklistText(c.id, e.target.value)}
                        className="flex-1 bg-transparent text-xs font-bold text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(c.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                        title="Remover item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Add Checklist Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddChecklistItem(); }}
                    placeholder="Nome da nova tarefa do checklist..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Internal Dependencies (Image 4) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    Dependências internas
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDependency}
                    disabled={checklist.length < 2}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Adicionar dependência
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Defina relações entre os itens do checklist.
                </p>

                <div className="space-y-2">
                  {dependencies.map(dep => (
                    <div 
                      key={dep.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2"
                    >
                      <select
                        value={dep.fromItem}
                        onChange={e => setDependencies(dependencies.map(d => d.id === dep.id ? { ...d, fromItem: e.target.value } : d))}
                        className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                      >
                        {checklist.map(c => (
                          <option key={c.id} value={c.item}>{c.item}</option>
                        ))}
                      </select>

                      <ArrowRight size={14} className="text-slate-400 shrink-0" />

                      <select
                        value={dep.toItem}
                        onChange={e => setDependencies(dependencies.map(d => d.id === dep.id ? { ...d, toItem: e.target.value } : d))}
                        className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                      >
                        {checklist.map(c => (
                          <option key={c.id} value={c.item}>{c.item}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                        title="Remover dependência"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {dependencies.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic py-1">
                      Nenhuma dependência interna configurada.
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer (Image 4) */}
        {isCreatingOrEditing ? (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsCreatingOrEditing(false)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Salvar template
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
