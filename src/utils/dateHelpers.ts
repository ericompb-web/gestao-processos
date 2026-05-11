import { format, parse, isWeekend as isFnsWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Holiday } from './types';

export function parseBR(dateStr: string): Date {
    // Parse with strict formatting
    return parse(dateStr, 'dd/MM/yyyy', new Date());
}

export function formatBR(date: Date): string {
    return format(date, 'dd/MM/yyyy');
}

export function dayOfWeekPt(date: Date): string {
    const dow = format(date, 'EEEE', { locale: ptBR });
    return dow.charAt(0).toUpperCase() + dow.slice(1);
}

export function isWeekend(date: Date): boolean {
    return isFnsWeekend(date);
}

export function isJudicialRecess(date: Date): boolean {
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    const day = date.getDate();
    if (month === 11 && day >= 20) return true;
    if (month === 0 && day <= 20) return true;
    return false;
}

export function checkHoliday(date: Date, uf: string, holidays: Holiday[]): { isHoliday: boolean; reason: string } {
    const dateStr = formatBR(date);

    for (const h of holidays) {
        if (h.date === dateStr) {
            if (h.type === 'Nacional') {
                return { isHoliday: true, reason: `Feriado Nacional: ${h.description}` };
            }
            if (h.type === 'Local') {
                return { isHoliday: true, reason: `Feriado Local: ${h.description}` };
            }
            if (h.type === 'Estadual' && h.uf === uf) {
                return { isHoliday: true, reason: `Feriado Estadual: ${h.description}` };
            }
        }
    }

    return { isHoliday: false, reason: '' };
}
