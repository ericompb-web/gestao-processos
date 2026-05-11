
import type { ProcessoTipo } from '../utils/types';
import { formatBR } from '../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useProcessStore } from '../store/useProcessStore';

interface ProcessTableProps {
  tipo: ProcessoTipo;
}

export function ProcessTable({ tipo }: ProcessTableProps) {
  const navigate = useNavigate();
  const { getProcessosByType, deleteProcesso } = useProcessStore();
  
  const processos = getProcessosByType(tipo);

  const getStatusColor = (situacao: string) => {
    const s = situacao.toLowerCase();
    if (s.includes('prazo')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s.includes('conclu')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('suspenso')) return 'bg-slate-100 text-slate-800 border-slate-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (processos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum processo {tipo}</h3>
        <p className="text-slate-500 max-w-sm">Adicione seu primeiro processo para começar a acompanhar prazos e pendências.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Nº Processo</th>
              <th className="px-4 py-3 font-semibold">Parte Contrária</th>
              <th className="px-4 py-3 font-semibold">
                {tipo === 'judicial' ? 'Órgão Competente' : 'Órgão Interessado'}
              </th>
              <th className="px-4 py-3 font-semibold">Pendência</th>
              <th className="px-4 py-3 font-semibold">Prazo</th>
              <th className="px-4 py-3 font-semibold">Situação</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processos.map((processo) => {
              // Parse date correctly for display if it exists
              let formattedDate = '-';
              let isLate = false;
              if (processo.prazo) {
                const parts = processo.prazo.split('-');
                if (parts.length === 3) {
                  const [y, m, d] = parts;
                  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
                  formattedDate = formatBR(dateObj);
                  
                  // Check if late
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (dateObj < today && !processo.situacao.toLowerCase().includes('conclu')) {
                    isLate = true;
                  }
                }
              }

              return (
                <tr key={processo.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 font-medium">
                    <button 
                      onClick={() => navigate(`/processo/${processo.id}`)}
                      className="text-brand-600 hover:text-brand-800 hover:underline text-left transition-colors"
                    >
                      {processo.numero}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{processo.parteContraria}</td>
                  <td className="px-4 py-3 text-slate-600">{processo.orgao}</td>
                  <td className="px-4 py-3 text-slate-600">{processo.pendencia}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${isLate ? 'text-red-600 flex items-center gap-1.5' : 'text-slate-700'}`}>
                      {formattedDate}
                      {isLate && <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(processo.situacao)}`}>
                      {processo.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este processo?')) {
                          deleteProcesso(processo.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
