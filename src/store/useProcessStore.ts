import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Processo, ProcessoTipo } from '../utils/types';
import { v4 as uuidv4 } from 'uuid';

interface ProcessStore {
    processos: Processo[];
    addProcesso: (processo: Omit<Processo, 'id'>) => void;
    updateProcesso: (id: string, processo: Partial<Processo>) => void;
    deleteProcesso: (id: string) => void;
    getProcessosByType: (tipo: ProcessoTipo) => Processo[];
    getProcessoById: (id: string) => Processo | undefined;
}

export const useProcessStore = create<ProcessStore>()(
    persist(
        (set, get) => ({
            processos: [],
            addProcesso: (processo) => set((state) => ({
                processos: [...state.processos, { ...processo, id: uuidv4() }]
            })),
            updateProcesso: (id, updatedFields) => set((state) => ({
                processos: state.processos.map(p => p.id === id ? { ...p, ...updatedFields } : p)
            })),
            deleteProcesso: (id) => set((state) => ({
                processos: state.processos.filter(p => p.id !== id)
            })),
            getProcessosByType: (tipo) => {
                const processos = get().processos.filter(p => p.tipo === tipo);
                // Ordenar por prazo mais curto (mais antigo primeiro)
                return processos.sort((a, b) => {
                    if (!a.prazo) return 1;
                    if (!b.prazo) return -1;
                    return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
                });
            },
            getProcessoById: (id) => get().processos.find(p => p.id === id),
        }),
        {
            name: 'processos-storage', // name of item in the storage (must be unique)
        }
    )
);
