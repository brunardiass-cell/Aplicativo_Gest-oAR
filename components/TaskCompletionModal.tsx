import React from 'react';
import { Task } from '../types';
import { X, Check, Clock, Calendar } from 'lucide-react';

interface TaskCompletionModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: (choice: 'keep_7_days' | 'hide_immediately') => void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  task,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !task) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Botão Fechar (X) superior direito */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Ícone de Sucesso Centralizado */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#00ba88] text-white flex items-center justify-center shadow-md">
            <Check size={34} strokeWidth={3} />
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tarefa concluída!
          </h3>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            O que você quer fazer agora?
          </p>
        </div>

        {/* Título da Atividade em Destaque */}
        <div className="w-full px-4 py-3 bg-slate-50/90 border border-slate-200/80 rounded-2xl mb-5 text-center">
          <p className="text-xs sm:text-sm font-bold text-slate-700 italic truncate" title={task.activity}>
            "{task.activity}"
          </p>
        </div>

        {/* Opções de Exibição */}
        <div className="space-y-3 mb-6">
          {/* Opção 1: Mostrar por mais 7 dias */}
          <button
            type="button"
            onClick={() => onConfirm('keep_7_days')}
            className="w-full text-left p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/20 hover:bg-blue-50/40 hover:border-blue-600 transition flex items-start gap-3.5 group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-[#1b64f2] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-slate-900 leading-snug">
                Mostrar por mais 7 dias
              </h4>
              <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                A tarefa continua aparecendo na lista e será arquivada automaticamente depois de 7 dias.
              </p>
            </div>
          </button>

          {/* Opção 2: Concluir e não mostrar mais */}
          <button
            type="button"
            onClick={() => onConfirm('hide_immediately')}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 transition flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition">
              <Calendar size={18} strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-slate-900 leading-snug">
                Concluir e não mostrar mais
              </h4>
              <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                A tarefa será movida para o histórico imediatamente.
              </p>
            </div>
          </button>
        </div>

        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-black transition tracking-wide text-center active:scale-[0.99]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
