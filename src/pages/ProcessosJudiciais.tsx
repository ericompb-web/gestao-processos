import { useState } from 'react';

import { Plus, Scale } from 'lucide-react';
import { ProcessTable } from '../components/ProcessTable';
import { ProcessModal } from '../components/ProcessModal';
import { useProcessStore } from '../store/useProcessStore';
import type { Processo } from '../utils/types';

export default function ProcessosJudiciais() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addProcesso } = useProcessStore();

  const handleSave = (data: Omit<Processo, 'id' | 'tipo'>) => {
    addProcesso({ ...data, tipo: 'judicial' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-700 mb-1">
            <Scale className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-slate-800">Processos Judiciais</h1>
          </div>
          <p className="text-slate-500 text-sm">Gerencie seus processos, prazos e pendências judiciais.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all active:scale-[0.98] shadow-sm hover:shadow"
        >
          <Plus className="w-5 h-5" />
          Novo Processo
        </button>
      </div>

      <ProcessTable tipo="judicial" />

      <ProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        tipo="judicial"
      />
    </div>
  );
}
