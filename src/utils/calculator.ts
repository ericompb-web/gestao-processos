import type { AuditRecord, JudicialResult, MaterialResult, Holiday } from './types';
import { addDays } from 'date-fns';
import { dayOfWeekPt, isWeekend, checkHoliday, isJudicialRecess } from './dateHelpers';

export function calculateJudicialDeadline(data_inicio: Date, N_uteis: number, ufSelecionada: string, holidays: Holiday[]): JudicialResult {
    const fim_corridos = addDays(data_inicio, 9);
    const audit: AuditRecord[] = [];

    // Phase 1
    for (let i = 0; i <= 9; i++) {
        const d = addDays(data_inicio, i);
        audit.push({
            counted: true,
            marker: '✅',
            phase: 'corridos',
            countNumber: i + 1,
            date: d,
            dow: dayOfWeekPt(d),
            reason: 'Dia corrido (contado)',
        });
    }

    let cursor = addDays(fim_corridos, 1);
    let inicio_uteis_efetivo: Date | null = null;

    // Phase 2 start
    while (true) {
        if (isWeekend(cursor)) {
            audit.push({
                counted: false, marker: '❌', phase: 'uteis', countNumber: null,
                date: cursor, dow: dayOfWeekPt(cursor), reason: 'Sábado/Domingo'
            });
            cursor = addDays(cursor, 1);
            continue;
        }

        if (isJudicialRecess(cursor)) {
            audit.push({
                counted: false, marker: '❌', phase: 'uteis', countNumber: null,
                date: cursor, dow: dayOfWeekPt(cursor), reason: 'Recesso Forense (Art. 220, CPC)'
            });
            cursor = addDays(cursor, 1);
            continue;
        }

        const { isHoliday, reason } = checkHoliday(cursor, ufSelecionada, holidays);
        if (isHoliday) {
            audit.push({
                counted: false, marker: '❌', phase: 'uteis', countNumber: null,
                date: cursor, dow: dayOfWeekPt(cursor), reason
            });
            cursor = addDays(cursor, 1);
            continue;
        }

        inicio_uteis_efetivo = cursor;
        break;
    }

    // Phase 2 counting
    let countUteis = 0;
    let termo_final = cursor; // Base case

    while (countUteis < N_uteis) {
        const d = cursor;

        if (isWeekend(d)) {
            audit.push({
                counted: false, marker: '❌', phase: 'uteis', countNumber: null,
                date: d, dow: dayOfWeekPt(d), reason: 'Sábado/Domingo'
            });
            cursor = addDays(cursor, 1);
            continue;
        }

        if (isJudicialRecess(d)) {
            audit.push({
                counted: false, marker: '❌', phase: 'uteis', countNumber: null,
                date: d, dow: dayOfWeekPt(d), reason: 'Recesso Forense (Art. 220, CPC)'
            });
            cursor = addDays(cursor, 1);
            continue;
        }

        const { isHoliday, reason } = checkHoliday(d, ufSelecionada, holidays);
        if (isHoliday) {
            audit.push({
                counted: false, marker: '❌', phase: 'uteis', countNumber: null,
                date: d, dow: dayOfWeekPt(d), reason
            });
            cursor = addDays(cursor, 1);
            continue;
        }

        countUteis += 1;
        audit.push({
            counted: true, marker: '✅', phase: 'uteis', countNumber: countUteis,
            date: d, dow: dayOfWeekPt(d), reason: 'Dia útil (contado)'
        });

        if (countUteis === N_uteis) {
            termo_final = d;
            break;
        }

        cursor = addDays(cursor, 1);
    }

    return { termoFinal: termo_final, fimCorridos: fim_corridos, inicioUteisEfetivo: inicio_uteis_efetivo!, audit };
}

export function calculateMaterialDeadline(data_inicio: Date, N_corridos: number): MaterialResult {
    const termo_final = addDays(data_inicio, N_corridos);
    const audit: AuditRecord[] = [];

    audit.push({
        counted: false, marker: '❌', phase: 'material', countNumber: null,
        date: data_inicio, dow: dayOfWeekPt(data_inicio), reason: 'Excluído (dia do começo)'
    });

    for (let i = 1; i <= N_corridos; i++) {
        const d = addDays(data_inicio, i);
        audit.push({
            counted: true, marker: '✅', phase: 'material', countNumber: i,
            date: d, dow: dayOfWeekPt(d), reason: 'Dia corrido (contado)'
        });
    }

    return { termoFinal: termo_final, audit };
}
