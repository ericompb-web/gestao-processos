import { describe, it, expect } from 'vitest';
import { calculateJudicialDeadline, calculateMaterialDeadline } from '../utils/calculator';
import { formatBR } from '../utils/dateHelpers';
import type { Holiday } from '../utils/types';

describe('Calculadora de Prazos - Casos de Teste do Prompt', () => {

    it('TESTE 1 — Exemplo do enunciado (transição 10 corridos -> úteis)', () => {
        // Início: 02/03/2026
        const dataInicio = new Date(2026, 2, 2, 12, 0, 0); // 12:00 to avoid timezone shifts
        const res = calculateJudicialDeadline(dataInicio, 1, 'SP', []);

        expect(formatBR(res.fimCorridos)).toBe('11/03/2026');
        expect(formatBR(res.inicioUteisEfetivo)).toBe('12/03/2026');
        expect(formatBR(res.termoFinal)).toBe('12/03/2026');
    });

    it('TESTE 2 — Judicial com fim de semana dentro da fase útil', () => {
        const dataInicio = new Date(2026, 2, 2, 12, 0, 0);
        const res = calculateJudicialDeadline(dataInicio, 5, 'SP', []);

        expect(formatBR(res.termoFinal)).toBe('18/03/2026');
    });

    it('TESTE 3 — Judicial com feriado local na fase útil', () => {
        const dataInicio = new Date(2026, 2, 2, 12, 0, 0);
        const feriados: Holiday[] = [
            { id: '1', date: '13/03/2026', description: 'Portaria do Tribunal', type: 'Local' }
        ];

        const res = calculateJudicialDeadline(dataInicio, 3, 'SP', feriados);

        expect(formatBR(res.fimCorridos)).toBe('11/03/2026');
        expect(formatBR(res.inicioUteisEfetivo)).toBe('12/03/2026');
        expect(formatBR(res.termoFinal)).toBe('17/03/2026');

        // Check if 13/03 was skipped with correct reason
        const skip13 = res.audit.find(a => formatBR(a.date) === '13/03/2026');
        expect(skip13).toBeDefined();
        expect(skip13?.counted).toBe(false);
        expect(skip13?.reason).toContain('Local');
    });

    it('TESTE 4 — Material (exclui dia do começo)', () => {
        const dataInicio = new Date(2026, 2, 2, 12, 0, 0);
        const res = calculateMaterialDeadline(dataInicio, 10);

        expect(formatBR(res.termoFinal)).toBe('12/03/2026');

        // Verify first day exclusion
        expect(res.audit[0].counted).toBe(false);
        expect(formatBR(res.audit[0].date)).toBe('02/03/2026');
        expect(res.audit[0].reason).toContain('Excluído');
    });

    it('TESTE 5 — Recesso Judiciário (20/12 a 20/01)', () => {
        // Início em 20/12/2026
        const dataInicio = new Date(2026, 11, 20, 12, 0, 0); // Month 11 is December
        // Phase 1 (10 corridos) continua normal. Fim = 29/12/2026
        // Phase 2 (úteis) deve pular todos os dias do recesso (até 20/01/2027)
        // O primeiro dia útil (se for dia de semana e não feriado) será 21/01/2027.

        const res = calculateJudicialDeadline(dataInicio, 1, 'SP', []);

        expect(formatBR(res.fimCorridos)).toBe('29/12/2026');
        expect(formatBR(res.inicioUteisEfetivo)).toBe('21/01/2027');
        expect(formatBR(res.termoFinal)).toBe('21/01/2027');

        // Check if a day inside the recess was correctly skipped with the reason
        const skipRecess = res.audit.find(a => formatBR(a.date) === '08/01/2027');
        expect(skipRecess).toBeDefined();
        expect(skipRecess?.counted).toBe(false);
        expect(skipRecess?.reason).toContain('Recesso Forense');
    });

});
