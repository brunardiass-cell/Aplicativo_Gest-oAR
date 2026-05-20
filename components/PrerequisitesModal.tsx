import React, { useState } from 'react';
import { Prerequisite, PrerequisiteType, PrerequisiteStatus } from '../types';
import { X, Plus, Trash2, Clock, DollarSign, Calendar, User, ListTodo } from 'lucide-react';

interface PrerequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  prerequisites: Prerequisite[];
  onUpdatePrerequisites: (updated: Prerequisite[]) => void;
}

export const PrerequisitesModal: React.FC<PrerequisitesModalProps> = ({
  isOpen,
  onClose,
  title,
  prerequisites = [],
  onUpdatePrerequisites,
}) => {
  const [localPres, setLocalPres] = useState<Prerequisite[]>(prerequisites);

  if (!isOpen) return null;

  const handleAdd = () => {
    const newPre: Prerequisite = {
      id: 'pre_' + Math.random().toString(36).substr(2, 9),
      name: 'Novo Pré-requisito',
      type: 'recurso',
      status: 'não iniciado',
      completed: false,
      leadTimeDays: 7,
    };
    const updated = [...localPres, newPre];
    setLocalPres(updated);
    onUpdatePrerequisites(updated);
  };

  const handleUpdate = (id: string, updates: Partial<Prerequisite>) => {
    const updated = localPres.map(p => {
      if (p.id === id) {
        const item = { ...p, ...updates };
        if (updates.status) {
          item.completed = updates.status === 'concluído';
        } else if (updates.completed !== undefined) {
          item.status = updates.completed ? 'concluído' : 'em andamento';
        }
        return item;
      }
      return p;
    });
    setLocalPres(updated);
    onUpdatePrerequisites(updated);
  };

  const handleDelete = (id: string) => {
    const updated = localPres.filter(p => p.id !== id);
    setLocalPres(updated);
    onUpdatePrerequisites(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 bg-teal-50 border-b border-teal-100 flex items-center gap-4">
          <div className="p-3 bg-teal-500 rounded-2xl text-white shadow-lg shadow-teal-200">
            <ListTodo size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate">
              Pré-requisitos e Orçamentos
            </h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest truncate">
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {localPres.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ListTodo size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nenhum pré-requisito cadastrado para esta atividade
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {localPres.map((pre, index) => {
                const isBudget = pre.type === 'orçamento';
                return (
                  <div
                    key={pre.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isBudget
                        ? 'bg-emerald-50/40 border-emerald-100'
                        : pre.completed
                        ? 'bg-slate-50/50 border-slate-100'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1 mt-1.5">
                        <input
                          type="checkbox"
                          checked={pre.completed}
                          onChange={e =>
                            handleUpdate(pre.id, { completed: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        {isBudget && (
                          <span
                            title="Ação financeira / orçamento"
                            className="text-emerald-600 animate-pulse"
                          >
                            <DollarSign size={16} />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Name Input */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            Nome do Pré-requisito
                          </label>
                          <input
                            type="text"
                            value={pre.name}
                            onChange={e =>
                              handleUpdate(pre.id, { name: e.target.value })
                            }
                            className="w-full bg-transparent text-xs font-bold text-slate-850 border-b border-dashed border-slate-200 focus:border-teal-500 focus:ring-0 outline-none pb-0.5"
                          />
                        </div>

                        {/* Type Select */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            Tipo
                          </label>
                          <select
                            value={pre.type}
                            onChange={e =>
                              handleUpdate(pre.id, {
                                type: e.target.value as PrerequisiteType,
                              })
                            }
                            className="w-full bg-slate-50 border-0 text-[10px] font-bold text-slate-600 rounded-lg py-1 px-2 focus:ring-1 focus:ring-teal-500 outline-none"
                          >
                            <option value="recurso">Recurso</option>
                            <option value="orçamento">Orçamento</option>
                            <option value="contratação">Contratação</option>
                            <option value="logística">Logística</option>
                          </select>
                        </div>

                        {/* Status Select */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            Status
                          </label>
                          <select
                            value={pre.status}
                            onChange={e =>
                              handleUpdate(pre.id, {
                                status: e.target.value as PrerequisiteStatus,
                              })
                            }
                            className="w-full bg-slate-50 border-0 text-[10px] font-bold text-slate-600 rounded-lg py-1 px-2 focus:ring-1 focus:ring-teal-500 outline-none"
                          >
                            <option value="não iniciado">Não Iniciado</option>
                            <option value="em andamento">Em Andamento</option>
                            <option value="concluído">Concluído</option>
                          </select>
                        </div>

                        {/* Lead Time Days */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            Antecedência
                          </label>
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <input
                              type="number"
                              value={pre.leadTimeDays}
                              onChange={e =>
                                handleUpdate(pre.id, {
                                  leadTimeDays: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-12 bg-slate-50 border-0 text-[10px] font-bold text-slate-700 rounded-lg py-1 px-1.5 focus:ring-1 focus:ring-teal-500 outline-none text-center"
                              title="Dias de antecedência"
                            />
                            <span className="text-[8px] text-slate-400 font-bold">dias</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(pre.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg mt-4 shrink-0 transition"
                        title="Excluir pré-requisito"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Extensão de orçamento se tipo for Orçamento */}
                    {isBudget && (
                      <div className="mt-3 pt-3 border-t border-emerald-100/50 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-1 duration-200">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <DollarSign size={10} className="text-emerald-500" /> Valor Estimado (R$)
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={pre.value || ''}
                            onChange={e =>
                              handleUpdate(pre.id, {
                                value: parseFloat(e.target.value) || undefined,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-300 transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar size={10} className="text-emerald-500" /> Data do Orçamento
                          </label>
                          <input
                            type="date"
                            value={pre.date || ''}
                            onChange={e =>
                              handleUpdate(pre.id, { date: e.target.value || undefined })
                            }
                            className="w-full px-3 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-slate-850 outline-none focus:border-emerald-300 transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <User size={10} className="text-emerald-500" /> Empresa / Fornecedor
                          </label>
                          <input
                            type="text"
                            placeholder="Nome do Fornecedor / Empresa"
                            value={pre.company || ''}
                            onChange={e =>
                              handleUpdate(pre.id, { company: e.target.value || undefined })
                            }
                            className="w-full px-3 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-slate-850 outline-none focus:border-emerald-300 transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleAdd}
            className="w-full py-3.5 border-2 border-dashed border-teal-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-teal-600 hover:border-teal-400 hover:bg-teal-50/50 transition flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Adicionar Pré-requisito
          </button>
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-xl transition"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};
