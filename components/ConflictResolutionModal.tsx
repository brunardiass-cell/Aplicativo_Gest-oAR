
import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import type { Diff } from '../utils/diff';

export interface Conflict {
  path: string;
  userDiff: Diff;
  serverDiff: Diff;
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflicts: Conflict[];
  onResolve: (resolutions: { path: string; choice: 'user' | 'server' }[]) => void;
  onCancel: () => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ isOpen, conflicts, onResolve, onCancel }) => {
  if (!isOpen) return null;

  const handleResolveAll = (choice: 'user' | 'server') => {
    const resolutions = conflicts.map(conflict => ({ path: conflict.path, choice }));
    onResolve(resolutions);
  };

  const getDisplayValue = (value: any) => {
    if (value === undefined) return <span className="italic text-slate-400">Não definido</span>;
    if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50 animate-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl text-center w-full">
        <ShieldAlert size={48} className="mx-auto text-red-500" />
        <h2 className="mt-4 text-2xl font-black text-slate-800">Conflito de Alterações</h2>
        <p className="mt-2 text-slate-600">Suas alterações entraram em conflito com as de outro usuário. Por favor, escolha qual versão manter para cada conflito.</p>
        
        <div className="mt-6 text-left space-y-4 max-h-80 overflow-y-auto custom-scrollbar p-4 bg-slate-50 rounded-lg border">
          {conflicts.map(conflict => (
            <div key={conflict.path} className="border-b pb-3 mb-3">
              <p className="font-bold text-sm text-slate-700">Conflito em: <code className="bg-slate-200 px-1.5 py-0.5 rounded-md text-xs">{conflict.path}</code></p>
              <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="font-bold text-red-700 mb-2">Sua Alteração (de <code className='font-mono'>{getDisplayValue(conflict.userDiff.oldValue)}</code> para):</p>
                  <pre className="whitespace-pre-wrap text-red-900 font-semibold bg-red-100 p-2 rounded">{getDisplayValue(conflict.userDiff.value)}</pre>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="font-bold text-green-700 mb-2">Alteração do Servidor (de <code className='font-mono'>{getDisplayValue(conflict.serverDiff.oldValue)}</code> para):</p>
                  <pre className="whitespace-pre-wrap text-green-900 font-semibold bg-green-100 p-2 rounded">{getDisplayValue(conflict.serverDiff.value)}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => handleResolveAll('user')}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
          >
            <Check size={16}/> Manter Todas as Minhas
          </button>
          <button 
            onClick={() => handleResolveAll('server')}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
            <Check size={16}/> Manter Todas do Servidor
          </button>
        </div>
        <button onClick={onCancel} className="mt-4 text-sm text-slate-500 hover:underline">Cancelar e Recarregar Dados</button>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;
