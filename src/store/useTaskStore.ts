import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tarefa, TarefaStatus } from '../utils/types';
import { v4 as uuidv4 } from 'uuid';

interface TaskStore {
    tarefas: Tarefa[];
    addTarefa: (tarefa: Omit<Tarefa, 'id' | 'ordem'>) => void;
    updateTarefa: (id: string, tarefa: Partial<Tarefa>) => void;
    deleteTarefa: (id: string) => void;
    moveTarefa: (id: string, newStatus: TarefaStatus, newIndex: number) => void;
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set) => ({
            tarefas: [],
            addTarefa: (tarefa) => set((state) => {
                const statusTarefas = state.tarefas.filter(t => t.status === tarefa.status);
                const maxOrdem = statusTarefas.length > 0 ? Math.max(...statusTarefas.map(t => t.ordem)) : -1;
                return {
                    tarefas: [...state.tarefas, { ...tarefa, id: uuidv4(), ordem: maxOrdem + 1 }]
                };
            }),
            updateTarefa: (id, updatedFields) => set((state) => ({
                tarefas: state.tarefas.map(t => t.id === id ? { ...t, ...updatedFields } : t)
            })),
            deleteTarefa: (id) => set((state) => ({
                tarefas: state.tarefas.filter(t => t.id !== id)
            })),
            moveTarefa: (id, newStatus, newIndex) => set((state) => {
                const tarefas = [...state.tarefas];
                const tarefaIndex = tarefas.findIndex(t => t.id === id);
                if (tarefaIndex === -1) return state;

                const tarefa = tarefas[tarefaIndex];
                tarefa.status = newStatus;

                // Sort the destination list by 'ordem'
                const destList = tarefas.filter(t => t.status === newStatus && t.id !== id).sort((a, b) => a.ordem - b.ordem);
                
                // Insert the moved task at the new index
                destList.splice(newIndex, 0, tarefa);

                // Update 'ordem' for all tasks in the destination list
                destList.forEach((t, i) => {
                    const idx = tarefas.findIndex(x => x.id === t.id);
                    if (idx !== -1) {
                        tarefas[idx].ordem = i;
                    }
                });

                return { tarefas };
            }),
        }),
        {
            name: 'tarefas-storage',
        }
    )
);
