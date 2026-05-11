import React, { useState } from 'react';
import { useHolidays } from '../hooks/useHolidays';
import type { HolidayType } from '../utils/types';
import { ESTADOS } from '../utils/estados';
import { Trash2, Plus, Calendar, X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function HolidayManager({ isOpen, onClose }: Props) {
    const { holidays, addHoliday, removeHoliday } = useHolidays();
    const [dateStr, setDateStr] = useState('');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState<HolidayType>('Nacional');
    const [uf, setUf] = useState('');

    if (!isOpen) return null;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateStr || !desc) return;

        // Convert YYYY-MM-DD back to DD/MM/YYYY
        const [y, m, d] = dateStr.split('-');
        const formattedDate = `${d}/${m}/${y}`;

        addHoliday({
            date: formattedDate,
            description: desc,
            type,
            uf: type === 'Estadual' ? uf : undefined
        });

        setDateStr('');
        setDesc('');
        setType('Nacional');
        setUf('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-lg bg-white flex flex-col max-h-[90vh] shadow-2xl">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                        <Calendar className="w-5 h-5 text-brand-600" />
                        Gerenciar Feriados
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-6 bg-slate-50/50">
                    <form onSubmit={handleAdd} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm text-slate-800">Novo Feriado</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Data</label>
                                <input
                                    type="date"
                                    required
                                    value={dateStr}
                                    onChange={(e) => setDateStr(e.target.value)}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Tiradentes"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border text-slate-800 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Tipo</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as HolidayType)}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border bg-white text-slate-800 transition-colors"
                                >
                                    <option value="Nacional">Nacional</option>
                                    <option value="Estadual">Estadual</option>
                                    <option value="Local">Local</option>
                                </select>
                            </div>
                            {type === 'Estadual' && (
                                <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">UF</label>
                                    <select
                                        required
                                        value={uf}
                                        onChange={(e) => setUf(e.target.value)}
                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50 px-3 py-2 border bg-white text-slate-800 transition-colors"
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
                            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow"
                        >
                            <Plus className="w-4 h-4" /> Cadastrar Feriado
                        </button>
                    </form>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-slate-800">Feriados Cadastrados</h3>
                        {holidays.length === 0 ? (
                            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 border-dashed text-slate-500 flex flex-col items-center justify-center gap-2">
                                <Calendar className="w-8 h-8 text-slate-300" />
                                <p className="text-sm">Nenhum feriado cadastrado ainda.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {holidays.map(h => (
                                    <li key={h.id} className="group flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-800 mb-1">
                                                {h.date} — {h.description}
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="inline-flex text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                                    {h.type}
                                                </span>
                                                {h.type === 'Estadual' && h.uf && (
                                                    <span className="inline-flex text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 bg-brand-50 border border-brand-100 text-brand-700 rounded-md">
                                                        {h.uf}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeHoliday(h.id)}
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
