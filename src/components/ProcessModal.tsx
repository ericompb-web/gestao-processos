import { useState, useEffect } from 'react';

import { X } from 'lucide-react';
import type { Processo, ProcessoTipo } from '../utils/types';

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (processo: Omit<Processo, 'id' | 'tipo'>) => void;
  tipo: ProcessoTipo;
  initialData?: Processo;
}

export function ProcessModal({ isOpen, onClose, onSave, tipo, initialData }: ProcessModalProps) {
  const [numero, setNumero] = useState('');
  const [parteContraria, setParteContraria] = useState('');
  const [orgao, setOrgao] = useState('');
  const [pendencia, setPendencia] = useState('');
  const [prazo, setPrazo] = useState('');
  const [situacao, setSituacao] = useState('');

  useEffect(() => {
    if (initialData) {
      setNumero(initialData.numero);
      setParteContraria(initialData.parteContraria);
      setOrgao(initialData.orgao);
      setPendencia(initialData.pendencia);
      setPrazo(initialData.prazo);
      setSituacao(initialData.situacao);
    } else {
      setNumero('');
      setParteContraria('');
      setOrgao('');
      setPendencia('');
      setPrazo('');
      setSituacao('Pendente');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      numero,
      parteContraria,
      orgao,
      pendencia,
      prazo,
      situacao
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Editar Processo' : `Novo Processo ${tipo === 'judicial' ? 'Judicial' : 'Administrativo'}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Número do Processo</label>
            <input
              type="text"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 0000000-00.0000.0.00.0000"
              className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Parte Contrária</label>
            <input
              type="text"
              value={parteContraria}
              onChange={(e) => setParteContraria(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              {tipo === 'judicial' ? 'Órgão Competente' : 'Órgão Interessado'}
            </label>
            <input
              type="text"
              value={orgao}
              onChange={(e) => setOrgao(e.target.value)}
              placeholder={tipo === 'judicial' ? 'Ex: 1ª Vara Cível' : 'Ex: INSS'}
              className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Pendência</label>
            <input
              type="text"
              value={pendencia}
              onChange={(e) => setPendencia(e.target.value)}
              placeholder="Ex: Apresentar Contestação"
              className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Prazo Fatal</label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Situação</label>
              <input
                type="text"
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                placeholder="Ex: Prazo Aberto"
                className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
