import React, { useState } from 'react';
import { Calendar, Scale, FileText, Settings, Download, CheckCircle2, XCircle, Info, Calculator } from 'lucide-react';
import { calculateJudicialDeadline, calculateMaterialDeadline } from '../utils/calculator';
import { generatePDF } from '../utils/pdfGenerator';
import { useHolidays } from '../hooks/useHolidays';
import { HolidayManager } from '../components/HolidayManager';
import { ESTADOS } from '../utils/estados';
import { formatBR } from '../utils/dateHelpers';
import type { JudicialResult, MaterialResult } from '../utils/types';

export default function CalculadoraPrazos() {
  const [activeTab, setActiveTab] = useState<'Judicial' | 'Material'>('Judicial');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('');
  const [uf, setUf] = useState<string>('');
  const [result, setResult] = useState<JudicialResult | MaterialResult | null>(null);
  const [isHolidayManagerOpen, setIsHolidayManagerOpen] = useState(false);

  const { holidays } = useHolidays();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInicio || !quantidade) return;

    // Parse date (yyyy-mm-dd to Date)
    const [y, m, d] = dataInicio.split('-');
    const startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0); // Noon to avoid timezone shifts
    const numDays = parseInt(quantidade);

    if (activeTab === 'Judicial') {
      if (!uf) {
        alert("Por favor, selecione uma UF para o prazo Judicial.");
        return;
      }
      const res = calculateJudicialDeadline(startDate, numDays, uf, holidays);
      setResult(res);
    } else {
      const res = calculateMaterialDeadline(startDate, numDays);
      setResult(res);
    }
  };

  const handlePDF = () => {
    if (!result || !dataInicio) return;
    const [y, m, d] = dataInicio.split('-');
    const startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
    generatePDF(activeTab, startDate, quantidade, uf, result);
  };

  const clearResult = () => setResult(null);

  const handleTabChange = (tab: 'Judicial' | 'Material') => {
    setActiveTab(tab);
    clearResult();
  };

  const isJudicial = (res: any): res is JudicialResult => {
    return 'fimCorridos' in res;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calculadora de Prazos</h1>
          <p className="text-slate-500 text-sm mt-1">Calcule prazos judiciais e materiais</p>
        </div>
        <button
          onClick={() => setIsHolidayManagerOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Gerenciar Feriados</span>
        </button>
      </div>

      <div className="flex p-1 bg-slate-200/50 rounded-xl w-full sm:w-auto self-start relative isolate overflow-hidden">
        <button
          onClick={() => handleTabChange('Judicial')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all z-10 ${activeTab === 'Judicial'
              ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
        >
          <Scale className="w-4 h-4" /> Prazo Judicial
        </button>
        <button
          onClick={() => handleTabChange('Material')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all z-10 ${activeTab === 'Material'
              ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
        >
          <Calendar className="w-4 h-4" /> Prazo Material
        </button>
      </div>

      {/* Helper text */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 animate-in fade-in duration-300">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
        <div className="text-sm space-y-1">
          {activeTab === 'Judicial' ? (
            <>
              <p><strong>Regra Híbrida:</strong> 10 dias corridos iniciais (incluindo o dia do começo) + dias úteis após o 10º dia.</p>
              <p className="opacity-90">Sábados, domingos e feriados cadastrados não são contados na Fase de dias úteis.</p>
            </>
          ) : (
            <>
              <p><strong>Dias Corridos:</strong> Contado em dias corridos ininterruptos.</p>
              <p className="opacity-90">O dia do começo informado <strong>não é contabilizado</strong> na contagem (dia 1 = próximo dia).</p>
            </>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-card p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <form onSubmit={handleCalculate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Data do Começo</label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); clearResult() }}
                className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2.5 border text-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                {activeTab === 'Judicial' ? 'Qtd. Dias Úteis (Fase 2)' : 'Qtd. Dias Corridos'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantidade}
                onChange={(e) => { setQuantidade(e.target.value); clearResult() }}
                placeholder="Ex: 5"
                className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2.5 border text-slate-800 transition-colors"
              />
            </div>

            {activeTab === 'Judicial' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">UF (Obrigatório)</label>
                <select
                  required
                  value={uf}
                  onChange={(e) => { setUf(e.target.value); clearResult() }}
                  className="w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2.5 border bg-white text-slate-800 transition-colors"
                >
                  <option value="">Selecione...</option>
                  {ESTADOS.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow"
          >
            <Calculator className="w-5 h-5" /> Calcular Prazo
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          {/* Summary Card */}
          <div className="glass-card overflow-hidden border-brand-100 ring-1 ring-brand-500/20 rounded-xl bg-white shadow-sm">
            <div className="bg-brand-50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-100">
              <div>
                <h2 className="text-brand-800 font-semibold mb-1">Termo Final</h2>
                <p className="text-4xl font-bold text-brand-600 tracking-tight">
                  {formatBR(result.termoFinal)}
                </p>
              </div>
              <button
                onClick={handlePDF}
                className="flex items-center justify-center gap-2 bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 font-semibold py-2 px-6 rounded-lg transition-all active:scale-[0.98] shadow-sm"
              >
                <Download className="w-5 h-5" /> Gerar PDF
              </button>
            </div>
            <div className="p-6 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Modo</span>
                <p className="font-medium text-slate-800 flex items-center gap-1.5">
                  {activeTab === 'Judicial' ? <Scale className="w-4 h-4 text-brand-500" /> : <Calendar className="w-4 h-4 text-brand-500" />}
                  {activeTab}
                </p>
              </div>
              {activeTab === 'Judicial' && isJudicial(result) ? (
                <>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Fim 10 Corridos</span>
                    <p className="font-medium text-slate-800">{formatBR(result.fimCorridos)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Início Fase Útil</span>
                    <p className="font-medium text-slate-800">{formatBR(result.inicioUteisEfetivo)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">UF / Dias Úteis</span>
                    <p className="font-medium text-slate-800">{uf} • {quantidade} dias</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Qtd Corridos</span>
                    <p className="font-medium text-slate-800">{quantidade} dias</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Nota</span>
                    <p className="font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block">Dia do começo excluído</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Audit List */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Detalhes da Simulação
            </h3>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Status / Diaº</th>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Dia da Semana</th>
                      <th className="px-4 py-3 font-semibold">Motivo / Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.audit.map((record, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50 transition-colors ${record.counted ? '' : 'bg-red-50/30'}`}>
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          {record.counted ? (
                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${record.phase === 'uteis' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50'}`}>
                              <CheckCircle2 className="w-4 h-4" />
                              {record.countNumber}º dia
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2 py-1 rounded-md">
                              <XCircle className="w-4 h-4" />
                              {record.phase === 'material' ? '-' : 'Pausado'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatBR(record.date)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 capitalize">
                          {record.dow}
                        </td>
                        <td className={`px-4 py-3 ${record.counted ? 'text-slate-500' : 'text-red-600 font-medium'}`}>
                          {record.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <HolidayManager
        isOpen={isHolidayManagerOpen}
        onClose={() => setIsHolidayManagerOpen(false)}
      />
    </div>
  );
}
