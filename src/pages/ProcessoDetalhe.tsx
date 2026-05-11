import { useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, ExternalLink, Calculator, Bot, FileText, FileUp } from 'lucide-react';
import { useProcessStore } from '../store/useProcessStore';
import { formatBR } from '../utils/dateHelpers';
import { ProcessModal } from '../components/ProcessModal';
import type { Processo } from '../utils/types';

export default function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProcessoById, updateProcesso } = useProcessStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const processo = id ? getProcessoById(id) : undefined;

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-xl font-semibold text-slate-800">Processo não encontrado</h2>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 text-brand-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>
    );
  }

  const handleUpdate = (data: Omit<Processo, 'id' | 'tipo'>) => {
    updateProcesso(processo.id, data);
  };

  const aiShortcuts = [
    { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { name: 'Claude', url: 'https://claude.ai', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { name: 'NotebookLM', url: 'https://notebooklm.google.com', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para lista
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{processo.numero}</h1>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider">
              {processo.tipo}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" /> Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Detalhes do Processo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Parte Contrária</span>
                <p className="text-slate-800 font-medium">{processo.parteContraria}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {processo.tipo === 'judicial' ? 'Órgão Competente' : 'Órgão Interessado'}
                </span>
                <p className="text-slate-800 font-medium">{processo.orgao}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendência Atual</span>
                <p className="text-slate-800 font-medium">{processo.pendencia}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Situação</span>
                <p className="text-slate-800 font-medium">{processo.situacao}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prazo Fatal</span>
                <p className={`font-semibold ${new Date(processo.prazo) < new Date() && !processo.situacao.toLowerCase().includes('conclu') ? 'text-red-600' : 'text-slate-800'}`}>
                  {processo.prazo ? formatBR(new Date(processo.prazo + 'T12:00:00')) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Observações</h2>
            <textarea
              className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 resize-none text-slate-700"
              placeholder="Adicione notas, andamentos ou informações importantes sobre este processo..."
              value={processo.observacoes || ''}
              onChange={(e) => updateProcesso(processo.id, { observacoes: e.target.value })}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" /> Autos e Documentos
              </h2>
            </div>
            
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors group">
              <div className="bg-white p-3 rounded-full inline-block mb-3 shadow-sm group-hover:scale-105 transition-transform">
                <FileUp className="w-6 h-6 text-brand-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">Anexar PDF</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Arraste um documento em PDF aqui ou clique para selecionar. O aplicativo tentará gerar um resumo automaticamente.
              </p>
              <button 
                onClick={() => alert("Recurso de upload e resumo de PDF será integrado em breve!")}
                className="text-xs font-medium bg-brand-50 text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-100 transition-colors"
              >
                Selecionar Arquivo
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Calculadora Shortcut */}
          <div className="bg-brand-600 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Calculadora de Prazos</h3>
              <p className="text-brand-100 text-sm mb-4">
                Calcule o prazo fatal para as pendências deste processo rapidamente.
              </p>
              <button 
                onClick={() => navigate('/calculadora')}
                className="bg-white text-brand-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-50 transition-colors shadow-sm"
              >
                Abrir Calculadora
              </button>
            </div>
          </div>

          {/* AI Shortcuts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4" /> Ferramentas de IA
            </h3>
            <div className="space-y-3">
              {aiShortcuts.map(ai => (
                <button
                  key={ai.name}
                  onClick={() => window.open(ai.url, '_blank')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${ai.color}`}
                >
                  {ai.name}
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdate}
        tipo={processo.tipo}
        initialData={processo}
      />
    </div>
  );
}
