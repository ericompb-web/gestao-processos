import { useState } from 'react';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { CheckSquare, Plus, Clock, AlertCircle, Calendar as CalendarIcon, CheckCircle2, GripVertical, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Tarefa, TarefaStatus } from '../utils/types';
import { formatBR } from '../utils/dateHelpers';

const columns: { id: TarefaStatus; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'atrasadas', title: 'Atrasadas', icon: <AlertCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-50 border-red-100' },
  { id: 'hoje', title: 'Hoje', icon: <Clock className="w-4 h-4 text-amber-500" />, color: 'bg-amber-50 border-amber-100' },
  { id: 'proximas', title: 'Próximas', icon: <CalendarIcon className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
];

export default function Tarefas() {
  const { tarefas, addTarefa, moveTarefa, updateTarefa, deleteTarefa } = useTaskStore();
  const [isAdding, setIsAdding] = useState<TarefaStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTarefa(draggableId, destination.droppableId as TarefaStatus, destination.index);
  };

  const handleAddTask = (status: TarefaStatus) => {
    if (!newTaskTitle.trim()) {
      setIsAdding(null);
      return;
    }
    
    addTarefa({
      titulo: newTaskTitle,
      status,
      descricao: '',
    });
    
    setNewTaskTitle('');
    setIsAdding(null);
  };

  const toggleConcluida = (tarefa: Tarefa) => {
    if (tarefa.status === 'concluidas') {
      // Return to 'sem_prazo' or guess based on deadline. Let's say 'hoje' for simplicity or 'sem_prazo'
      updateTarefa(tarefa.id, { status: 'sem_prazo' });
    } else {
      updateTarefa(tarefa.id, { status: 'concluidas' });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-2 text-brand-700">
        <CheckSquare className="w-6 h-6" />
        <h1 className="text-2xl font-bold text-slate-800">Quadro de Tarefas</h1>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
          {columns.map((column) => {
            const columnTasks = tarefas
              .filter((t) => t.status === column.id || (column.id === 'proximas' && t.status === 'sem_prazo'))
              .sort((a, b) => {
                if (a.prazo && b.prazo) return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
                if (a.prazo) return -1;
                if (b.prazo) return 1;
                return a.ordem - b.ordem;
              });

            

            return (
              <div
                key={column.id}
                className={`flex flex-col min-w-[280px] sm:min-w-[320px] w-full max-w-sm rounded-xl border ${column.color} snap-center`}
              >
                <div className="p-4 border-b border-inherit bg-white/50 rounded-t-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    {column.icon}
                    {column.title}
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsAdding(column.id)}
                    className="p-1 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-3 min-h-[150px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-black/5' : ''
                      }`}
                    >
                      {columnTasks.map((tarefa, index) => (
                        <Draggable key={tarefa.id} draggableId={tarefa.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm group ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-brand-500/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-slate-800 text-sm">{tarefa.titulo}</p>
                                    <button 
                                      onClick={() => deleteTarefa(tarefa.id)}
                                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {tarefa.prazo && (
                                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-slate-500">
                                      <CalendarIcon className="w-3 h-3" />
                                      {formatBR(new Date(tarefa.prazo + 'T12:00:00'))}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => toggleConcluida(tarefa)}
                                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-600 transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Marcar como concluída
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {isAdding === column.id && (
                        <div className="bg-white p-3 rounded-lg border border-brand-300 shadow-sm">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Título da tarefa..."
                            className="w-full text-sm outline-none bg-transparent"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTask(column.id);
                              if (e.key === 'Escape') {
                                setIsAdding(null);
                                setNewTaskTitle('');
                              }
                            }}
                            onBlur={() => handleAddTask(column.id)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Completed Tasks Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Tarefas Concluídas
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 max-h-[300px] overflow-y-auto">
          {tarefas.filter(t => t.status === 'concluidas').length === 0 ? (
            <p className="text-sm text-slate-500 p-4 text-center">Nenhuma tarefa concluída ainda.</p>
          ) : (
            <div className="space-y-1">
              {tarefas
                .filter(t => t.status === 'concluidas')
                .map(tarefa => (
                <div key={tarefa.id} className="flex items-center justify-between p-3 bg-white rounded-lg opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleConcluida(tarefa)} className="text-emerald-500 hover:text-slate-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-slate-600 line-through">{tarefa.titulo}</span>
                  </div>
                  <button onClick={() => deleteTarefa(tarefa.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
