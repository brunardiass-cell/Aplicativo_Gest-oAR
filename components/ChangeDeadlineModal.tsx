import React, { useState } from 'react';
import { Task } from '../types';
import { X, Calendar, Clock, AlertCircle, Check } from 'lucide-react';
import { DateInput } from './DateInput';

interface ChangeDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (taskId: string, newDate: string, reason?: string) => void;
}

export const ChangeDeadlineModal: React.FC<ChangeDeadlineModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave
}) => {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (task) {
      setNewDate(task.completionDate || '');
      setReason('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      alert('Por favor, selecione uma nova data de prazo.');
      return;
    }
    onSave(task.id, newDate, reason.trim());
    onClose();
  };

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return 'Sem prazo definido';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <header className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-teal-400" />
            <h3 className="text-sm font-black uppercase tracking-tight">Alterar Prazo da Atividade</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              {task.project}
            </span>
            <h4 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">
              {task.activity}
            </h4>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">Prazo Atual:</span>
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              {formatDateBR(task.completionDate)}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-tight text-slate-700 flex items-center gap-1">
              Novo Prazo <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={newDate}
              onChange={val => setNewDate(val)}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-tight text-slate-700 flex items-center justify-between">
              <span>Motivo da Alteração</span>
              <span className="text-[10px] font-bold text-slate-400">Opcional</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex.: Atraso na entrega de insumos, ajuste regulatório ou solicitação da liderança..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              A alteração será registrada automaticamente no histórico de rastreabilidade regulatória.
            </p>
          </div>

          {/* Histórico anterior se existir */}
          {task.deadlineHistory && task.deadlineHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Alterações Anteriores ({task.deadlineHistory.length})
              </span>
              <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">
                {task.deadlineHistory.map(dh => (
                  <div key={dh.id} className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                    <div>
                      <span className="text-slate-500">{formatDateBR(dh.previousDate)} &rarr; </span>
                      <span className="font-bold text-slate-800">{formatDateBR(dh.newDate)}</span>
                      {dh.reason && <p className="text-slate-400 italic mt-0.5">"{dh.reason}"</p>}
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-2">{dh.changedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
            >
              <Check size={14} /> Salvar Prazo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
