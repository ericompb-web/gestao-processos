export type HolidayType = 'Nacional' | 'Estadual' | 'Local';

export interface Holiday {
    id: string;
    date: string; // 'DD/MM/AAAA'
    description: string;
    type: HolidayType;
    uf?: string; // BR States
}

export interface AuditRecord {
    counted: boolean;
    marker: string;
    phase: 'corridos' | 'uteis' | 'material';
    countNumber: number | null;
    date: Date;
    dow: string;
    reason: string;
}

export interface JudicialResult {
    termoFinal: Date;
    fimCorridos: Date;
    inicioUteisEfetivo: Date;
    audit: AuditRecord[];
}

export interface MaterialResult {
    termoFinal: Date;
    audit: AuditRecord[];
}

export type ProcessoTipo = 'judicial' | 'administrativo';

export interface Processo {
    id: string;
    numero: string;
    parteContraria: string;
    orgao: string; // 'órgão competente' ou 'órgão interessado'
    pendencia: string;
    prazo: string; // ISO date string (YYYY-MM-DD)
    situacao: string;
    tipo: ProcessoTipo;
    observacoes?: string;
    // Prazos curtos em cima = ordenar por 'prazo'
}

export type TarefaStatus = 'atrasadas' | 'hoje' | 'proximas' | 'sem_prazo' | 'concluidas';

export interface Tarefa {
    id: string;
    titulo: string;
    descricao?: string;
    prazo?: string; // ISO date string
    status: TarefaStatus;
    ordem: number; // For drag and drop ordering
}
