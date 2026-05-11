import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { JudicialResult, MaterialResult } from './types';
import { formatBR } from './dateHelpers';

export function generatePDF(
    modo: 'Judicial' | 'Material',
    dataInicio: Date,
    quantidadeString: string,
    uf: string,
    result: JudicialResult | MaterialResult
) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(21, 128, 61); // brand-700
    doc.text('Calculadora de Prazos', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    // Resumo Title
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Resumo do Cálculo', 14, 45);

    // Resumo Contents
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Modo: Prazo ${modo}`, 14, 53);
    doc.text(`Data do Começo: ${formatBR(dataInicio)}`, 14, 59);

    let currentY = 59;

    if (modo === 'Judicial') {
        const res = result as JudicialResult;
        currentY += 6; doc.text(`UF Considerada: ${uf}`, 14, currentY);
        currentY += 6; doc.text(`Fim da Fase Corrida: ${formatBR(res.fimCorridos)}`, 14, currentY);
        currentY += 6; doc.text(`1º Dia Útil (Fase 2): ${formatBR(res.inicioUteisEfetivo)}`, 14, currentY);
        currentY += 6; doc.text(`Dias Úteis Contados: ${quantidadeString}`, 14, currentY);

        currentY += 12;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`Termo Final: ${formatBR(res.termoFinal)}`, 14, currentY);
        doc.setFont('helvetica', 'normal');
    } else {
        const res = result as MaterialResult;
        currentY += 6; doc.text(`Dias Corridos Contados: ${quantidadeString}`, 14, currentY);
        currentY += 6; doc.text('Nota: Dia do começo foi excluído da contagem.', 14, currentY);

        currentY += 12;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`Termo Final: ${formatBR(res.termoFinal)}`, 14, currentY);
        doc.setFont('helvetica', 'normal');
    }

    // Table
    const tableData = result.audit.map(r => [
        r.marker,
        r.countNumber ? r.countNumber.toString() : '-',
        formatBR(r.date),
        r.dow,
        r.reason
    ]);

    const startY = currentY + 10;

    autoTable(doc, {
        startY,
        head: [['Status', 'Dia', 'Data', 'Dia da Semana', 'Motivo']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [34, 197, 94] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save('calculo-prazo.pdf');
}
