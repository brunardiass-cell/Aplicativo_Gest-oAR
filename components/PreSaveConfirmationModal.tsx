
import React from 'react';
import { ShieldQuestion, Merge, Save, Server, X } from 'lucide-react';

interface PreSaveConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (choice: 'merge' | 'overwrite_user' | 'overwrite_server') => void;
  onCancel: () => void;
}

const PreSaveConfirmationModal: React.FC<PreSaveConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50 animate-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center w-full">
        <ShieldQuestion size={48} className="mx-auto text-brand-primary" />
        <h2 className="mt-4 text-2xl font-black text-slate-800">Novas Alterações no Servidor</h2>
        <p className="mt-2 text-slate-600">Os dados no servidor foram atualizados por outro usuário enquanto você trabalhava. Como deseja proceder?</p>
        
        <div className="mt-8 space-y-3 text-left">
          <button 
            onClick={() => onConfirm('merge')}
            className="w-full flex items-start gap-4 p-4 border rounded-lg hover:bg-sky-50 hover:border-sky-500 transition-all text-left"
          >
            <Merge className="h-6 w-6 text-sky-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-sky-700">Mesclar Alterações (Recomendado)</h3>
              <p className="text-sm text-slate-500">Suas alterações serão combinadas com as do servidor. Se houver conflitos no mesmo campo, você poderá resolvê-los.</p>
            </div>
          </button>

          <button 
            onClick={() => onConfirm('overwrite_user')}
            className="w-full flex items-start gap-4 p-4 border rounded-lg hover:bg-amber-50 hover:border-amber-500 transition-all text-left"
          >
            <Save className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-700">Manter Apenas Minhas Alterações</h3>
              <p className="text-sm text-slate-500">As alterações feitas por outros usuários serão descartadas. Use com cuidado.</p>
            </div>
          </button>

          <button 
            onClick={() => onConfirm('overwrite_server')}
            className="w-full flex items-start gap-4 p-4 border rounded-lg hover:bg-red-50 hover:border-red-500 transition-all text-left"
          >
            <Server className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-700">Manter Apenas as do Servidor</h3>
              <p className="text-sm text-slate-500">Suas alterações locais serão descartadas e os dados serão recarregados.</p>
            </div>
          </button>
        </div>

        <button onClick={onCancel} className="mt-6 text-sm text-slate-500 hover:underline flex items-center justify-center gap-1 mx-auto">
          <X size={14}/>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PreSaveConfirmationModal;
