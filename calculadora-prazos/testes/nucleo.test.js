'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/nucleo.js');

const cfgPadrao = (extra) => Object.assign({ fixos: P.fixosPadrao(), extras: [], tjac: {}, pfTjacConta: false }, extra || {});
const calc = (o, cfg) => P.calcularPrazo(Object.assign({ tipo: 'processual', modoData: 'intimacao', dobro: false, filtroEsfera: 'nacional-estadual', considerarRecesso: true }, o), cfg || cfgPadrao());

/* ---------- utilidades ---------- */
test('Páscoa (Gauss) de anos conhecidos', () => {
  const casos = { 2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16' };
  for (const [a, esperado] of Object.entries(casos)) assert.equal(P.toISO(P.pascoa(+a)), esperado);
});
test('Datas locais: ida e volta ISO e validação', () => {
  assert.equal(P.toISO(P.fromISO('2026-03-01')), '2026-03-01');
  assert.equal(P.fmtBR(P.fromISO('2026-03-01')), '01/03/2026');
  assert.equal(P.fromISO('2026-02-30'), null);
  assert.equal(P.fromISO('26-02-03'), null);
  assert.equal(P.toISO(P.addDays(P.fromISO('2026-12-31'), 1)), '2027-01-01');
  assert.equal(P.diffDiasCorridos(P.fromISO('2026-03-01'), P.fromISO('2026-03-15')), 14);
  assert.equal(P.isWeekend(P.fromISO('2026-03-14')), true);
});
test('escapeHtml neutraliza marcação', () => {
  assert.equal(P.escapeHtml('<img src=x onerror="a()">&\''), '&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;');
});

/* ---------- testes obrigatórios (dados fictícios) ---------- */
test('1) 15 dias úteis em dobro iniciado numa sexta-feira véspera de feriado (30/04/2027; 01/05 cai no sábado)', () => {
  const r = calc({ dataInicioISO: '2027-04-30', quantidade: 15, dobro: true });
  assert.equal(r.qtdEfetiva, 30);
  assert.equal(r.dataFinal, '2027-06-11'); // referência independente
  assert.ok(r.avisos.some((a) => /dobro/i.test(a)));
});
test('1b) Idem com o feriado em dia útil (quinta 30/04/2026; 01/05 sexta é feriado)', () => {
  const r = calc({ dataInicioISO: '2026-04-30', quantidade: 15, dobro: true });
  assert.equal(r.dataFinal, '2026-06-12');
  assert.ok(r.log.some((l) => l.data === '2026-05-01' && l.pulado && /Dia do Trabalho/.test(l.motivo)));
});
test('2) Prazo que atravessa Carnaval e Quarta-feira de Cinzas', () => {
  const r = calc({ dataInicioISO: '2026-02-13', quantidade: 5 });
  assert.equal(r.dataFinal, '2026-02-25');
  const pulados = r.log.filter((l) => l.pulado).map((l) => l.data);
  for (const d of ['2026-02-16', '2026-02-17', '2026-02-18']) assert.ok(pulados.includes(d), d);
});
test('3) Prazo que atravessa 20/12 a 20/01, com a suspensão ligada e desligada', () => {
  const on = calc({ dataInicioISO: '2026-12-10', quantidade: 10, considerarRecesso: true });
  assert.equal(on.dataFinal, '2027-01-26');
  assert.ok(on.avisos.some((a) => /atravessou a suspensão/i.test(a)));
  const off = calc({ dataInicioISO: '2026-12-10', quantidade: 10, considerarRecesso: false });
  assert.equal(off.dataFinal, '2026-12-24');
  assert.ok(!off.avisos.some((a) => /atravessou a suspensão/i.test(a)));
});
test('3b) Vencimento dentro de 20/12–20/01 gera aviso quando a suspensão está desligada', () => {
  const r = calc({ dataInicioISO: '2026-12-21', quantidade: 3, considerarRecesso: false });
  assert.ok(r.avisos.some((a) => /entre 20\/12 e 20\/01/.test(a)));
});
test('4) Modo envio com o 10º dia num sábado', () => {
  const r = calc({ dataInicioISO: '2026-03-05', modoData: 'envio', quantidade: 5 });
  assert.equal(r.ciencia, '2026-03-14'); // quinta + 9 = sábado
  assert.equal(r.dataFinal, '2026-03-20'); // começa a correr na segunda 16/03
  assert.ok(r.avisos.some((a) => /Lei 11\.419\/2006/.test(a)));
  assert.equal(r.log.filter((l) => !l.pulado)[0].data, '2026-03-16');
});
test('5) Prazo material vencendo num domingo é prorrogado', () => {
  const r = calc({ tipo: 'material', dataInicioISO: '2026-03-01', quantidade: 14 });
  assert.equal(r.dataFinal, '2026-03-16'); // 15/03 é domingo
  assert.ok(r.avisos.some((a) => /art\. 132, § 1º/.test(a)));
  const ult = r.log[r.log.length - 1];
  assert.deepEqual([ult.data, ult.pulado], ['2026-03-16', false]); // o dia do vencimento consta da memória
  assert.ok(r.log.some((l) => l.data === '2026-03-15' && l.pulado && /Domingo/.test(l.motivo)));
});
test('5b) Prazo material não dobra e avisa', () => {
  const r = calc({ tipo: 'material', dataInicioISO: '2026-03-02', quantidade: 10, dobro: true });
  assert.equal(r.qtdEfetiva, 10);
  assert.equal(r.dataFinal, '2026-03-12');
  assert.ok(r.avisos.some((a) => /não se aplica a prazo material/.test(a)));
});

/* ---------- calendário do TJAC (HTML fictício) ---------- */
function htmlTjac() {
  const dia = (n, ...linhas) => `<h3>${n} - dia</h3><p>${linhas.join('<br>')}</p>`;
  return `<!doctype html><html><body onload="x()"><script>window.evil=1</script>
  <header><h1>Calendário</h1></header>
  <div class="conteudo" onclick="y()">
  <h1><a id="janeiro"></a>Janeiro</h1>
  ${dia(1, 'Feriado Nacional', 'Confraternização Universal', 'Lei Federal 662/1949')}
  ${dia(20, 'Feriado Estadual', 'Dia do Cat&oacute;lico')}
  <h1>Fevereiro</h1>
  ${dia(16, 'Feriado Forense', 'Carnaval')}
  ${dia(27, 'Feriado Forense', 'Dia do Servidor do Judici&aacute;rio', 'Resolução 100/2020', 'Adiado para o dia 2 de março')}
  <h1>Março</h1>
  ${dia(8, 'Ferido Estadual', 'Dia da Mulher')}
  ${dia(9, 'Feriado Municipal', 'Aniversário de município')}
  <h1>Abril</h1>
  ${dia(3, 'Feriado Nacional', 'Sexta-feira Santa')}
  ${dia(21, 'Feriado Nacional', 'Tiradentes')}
  <h1>Maio</h1>
  ${dia(1, 'Feriado Nacional', 'Dia do Trabalho')}
  ${dia(28, 'Feriado Regimental', 'Data regimental', 'Antecipado para o dia 2')}
  <h1>Junho</h1>
  ${dia(4, 'Ponto Facultativo', 'Corpus Christi')}
  ${dia(15, 'Feriado Estadual', 'Aniversário do Acre')}
  <h1>Setembro</h1>
  ${dia(7, 'Feriado Nacional', 'Independência')}
  </div></body></html>`;
}
test('6) TJAC: transferência "para o dia 2 de março" e demais regras de leitura', () => {
  const r = P.parseCalendarioTjac(htmlTjac(), 2026);
  assert.equal(r.ok, true);
  const por = (nome) => r.itens.find((i) => i.nome.indexOf(nome) >= 0);
  const serv = por('Servidor do Judiciário');
  assert.equal(serv.data, '2026-03-02');
  assert.equal(serv.transferidoDe, '2026-02-27');
  assert.equal(serv.esfera, 'tjac');
  assert.equal(serv.base, 'Resolução 100/2020');
  assert.equal(r.itens.find((i) => i.data === '2026-02-27'), undefined);
  assert.equal(por('Data regimental').data, '2026-06-02'); // sem mês e dia muito anterior => mês seguinte
  assert.equal(por('Data regimental').classe, 'regimental');
  assert.equal(por('Dia da Mulher').data, '2026-03-08'); // "ferido" (erro do site) aceito
  assert.equal(por('Aniversário de município'), undefined); // municipal descartado
  assert.equal(por('Corpus Christi').tipo, 'ponto_facultativo');
  assert.equal(por('Corpus Christi').classe, 'ponto facultativo');
  assert.equal(por('Tiradentes').esfera, 'nacional');
  assert.equal(por('Católico').nome, 'Dia do Católico'); // entidade HTML decodificada
  assert.equal(r.itens.length, 12);
});
test('6b) TJAC: higienização remove <script> e atributos on*', () => {
  const limpo = P.higienizarHtml(htmlTjac());
  assert.ok(!/<script/i.test(limpo));
  assert.ok(!/\bon[a-z]+\s*=/i.test(limpo));
});
test('6c) TJAC: deduplicação por data+nome', () => {
  const blocos = [];
  for (let m = 1; m <= 12; m++) blocos.push(`<h1>${P.fromISO('2026-' + String(m).padStart(2, '0') + '-01') && ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][m - 1]}</h1><h3>10</h3><p>Feriado Forense<br>Dia X</p><p>Feriado Forense<br>Dia X</p>`);
  const r = P.parseCalendarioTjac('<a id="janeiro"></a>' + blocos.join(''), 2026);
  assert.equal(r.ok, true);
  assert.equal(r.itens.length, 12);
});
test('6d) TJAC substitui fixos e móveis do ano; extras continuam somando', () => {
  const r = P.parseCalendarioTjac(htmlTjac(), 2026);
  const cfg = cfgPadrao({ tjac: { 2026: { itens: r.itens } }, extras: [{ data: '2026-10-05', nome: 'Extra', esfera: 'forense', tipo: 'feriado', base: '' }] });
  const datas = P.feriadosDoAno(2026, cfg).map((i) => i.data);
  assert.ok(!datas.includes('2026-11-02')); // fixo padrão (Finados) some: o TJAC não o listou
  assert.ok(datas.includes('2026-03-02') && datas.includes('2026-10-05'));
  assert.ok(P.feriadosDoAno(2027, cfg).some((i) => i.data === '2027-11-02')); // outro ano segue o padrão
});

function armazenamentoFalso(opts) {
  const mem = {}; const o = opts || {};
  return { mem, ls: {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { if (o.cota) { const e = new Error('cota'); e.name = 'QuotaExceededError'; throw e; } mem[k] = String(v); }
  } };
}
test('7) Página do TJAC com 404: falha tratada e nada gravado', async () => {
  const { mem, ls } = armazenamentoFalso();
  const r = await P.carregarCalendarioTjac(2030, { buscar: async () => ({ status: 404, texto: '' }), armazenamento: P.criarArmazenamento(ls) });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'nao_publicado');
  assert.deepEqual(mem, {});
});
test('7b) Página do TJAC com estrutura alterada: falha tratada e nada gravado', async () => {
  const { mem, ls } = armazenamentoFalso();
  for (const texto of ['<html><body><h1>Manutenção</h1></body></html>', '<a id="janeiro"></a><h1>Janeiro</h1><h3>1</h3><p>Feriado Nacional<br>Ano Novo</p>']) {
    const r = await P.carregarCalendarioTjac(2026, { buscar: async () => ({ status: 200, texto }), armazenamento: P.criarArmazenamento(ls) });
    assert.equal(r.ok, false);
    assert.equal(r.motivo, 'estrutura');
  }
  assert.deepEqual(mem, {});
});
test('7c) Falha de rede, erro HTTP e leitura válida', async () => {
  const { mem, ls } = armazenamentoFalso();
  const arm = P.criarArmazenamento(ls);
  const r1 = await P.carregarCalendarioTjac(2026, { buscar: async () => { throw new TypeError('Failed to fetch'); }, armazenamento: arm });
  assert.equal(r1.motivo, 'rede');
  const r2 = await P.carregarCalendarioTjac(2026, { buscar: async () => ({ status: 500, texto: '' }), armazenamento: arm });
  assert.equal(r2.motivo, 'http');
  assert.deepEqual(mem, {});
  const r3 = await P.carregarCalendarioTjac(2026, { buscar: async () => ({ status: 200, texto: htmlTjac() }), armazenamento: arm, agora: () => new Date(2026, 0, 5) });
  assert.equal(r3.ok, true);
  assert.equal(r3.total, 12);
  assert.equal(arm.tjac()['2026'].itens.length, 12);
});
test('7d) Erro de cota ao gravar vira mensagem amigável', async () => {
  const { ls } = armazenamentoFalso({ cota: true });
  const r = await P.carregarCalendarioTjac(2026, { buscar: async () => ({ status: 200, texto: htmlTjac() }), armazenamento: P.criarArmazenamento(ls) });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'cota');
  assert.match(r.mensagem, /espaço/);
});

/* ---------- regras de bloqueio e filtros ---------- */
test('Ponto facultativo do TJAC só conta como dia não útil se a opção estiver ligada', () => {
  const itens = [{ data: '2026-06-04', nome: 'Corpus Christi', tipo: 'ponto_facultativo', esfera: 'tjac', classe: 'ponto facultativo', base: '', origem: 'tjac' }];
  const base = { dataInicioISO: '2026-06-03', quantidade: 1 };
  const desl = calc(base, cfgPadrao({ tjac: { 2026: { itens } } }));
  assert.equal(desl.dataFinal, '2026-06-04');
  const lig = calc(base, cfgPadrao({ tjac: { 2026: { itens } }, pfTjacConta: true }));
  assert.equal(lig.dataFinal, '2026-06-05');
});
test('Ponto facultativo do calendário padrão nunca bloqueia (Corpus Christi 2026 = 04/06)', () => {
  assert.equal(calc({ dataInicioISO: '2026-06-03', quantidade: 1 }, cfgPadrao({ pfTjacConta: true })).dataFinal, '2026-06-04');
});
test('Filtro de esfera: municipal só bloqueia em "todos"; "nacional" ignora estadual', () => {
  const o = { dataInicioISO: '2026-12-21', quantidade: 5, considerarRecesso: false };
  assert.equal(calc(o).dataFinal, '2026-12-29');
  assert.equal(calc(Object.assign({ filtroEsfera: 'todos' }, o)).dataFinal, '2026-12-30');
  // 08/03/2027 (segunda): feriado estadual (Dia da Mulher)
  const m = { dataInicioISO: '2027-03-05', quantidade: 1 };
  assert.equal(calc(m).dataFinal, '2027-03-09');
  assert.equal(calc(Object.assign({ filtroEsfera: 'nacional' }, m)).dataFinal, '2027-03-08');
});
test('Feriados extras bloqueiam e podem ser municipais conforme o filtro', () => {
  const cfg = cfgPadrao({ extras: [{ data: '2026-03-10', nome: 'Feriado avulso', esfera: 'forense', tipo: 'feriado', base: '' }] });
  assert.equal(calc({ dataInicioISO: '2026-03-09', quantidade: 1 }, cfg).dataFinal, '2026-03-11');
});
test('Suspensão de fim de ano: 20/12 e 20/01 inclusive', () => {
  assert.equal(P.estaEmRecesso(P.fromISO('2026-12-19')), false);
  assert.equal(P.estaEmRecesso(P.fromISO('2026-12-20')), true);
  assert.equal(P.estaEmRecesso(P.fromISO('2027-01-20')), true);
  assert.equal(P.estaEmRecesso(P.fromISO('2027-01-21')), false);
});
test('Suspensão não se aplica a prazo material nem personalizado', () => {
  const r = calc({ tipo: 'material', dataInicioISO: '2026-12-10', quantidade: 12 });
  assert.equal(r.dataFinal, '2026-12-22');
});
test('Personalizado: corridos, pulando fim de semana/feriado e prorrogação', () => {
  const corridos = calc({ tipo: 'personalizado', dataInicioISO: '2026-03-02', quantidade: 5 });
  assert.equal(corridos.dataFinal, '2026-03-07'); // sábado, sem prorrogação
  const prorrog = calc({ tipo: 'personalizado', dataInicioISO: '2026-03-02', quantidade: 5, persProrroga: true });
  assert.equal(prorrog.dataFinal, '2026-03-09');
  const util = calc({ tipo: 'personalizado', dataInicioISO: '2026-03-02', quantidade: 5, persFimSemana: true });
  assert.equal(util.dataFinal, '2026-03-09');
  assert.ok(util.log.some((l) => l.pulado && l.motivo === 'Sábado'));
  const fer = calc({ tipo: 'personalizado', dataInicioISO: '2026-04-29', quantidade: 3, persFeriados: true });
  assert.equal(fer.dataFinal, '2026-05-03'); // pula 01/05
});
test('Validação das entradas', () => {
  assert.throws(() => calc({ dataInicioISO: '', quantidade: 5 }), /data válida/);
  assert.throws(() => calc({ dataInicioISO: '2026-03-02', quantidade: 0 }), /quantidade/);
  assert.throws(() => calc({ dataInicioISO: '2026-03-02', quantidade: 1.5 }), /quantidade/);
  assert.throws(() => calc({ dataInicioISO: '2026-03-02', quantidade: 99999 }), /quantidade/);
});
test('O log registra dias contados e pulados com o motivo', () => {
  const r = calc({ dataInicioISO: '2026-03-06', quantidade: 2 });
  assert.deepEqual(r.log.map((l) => [l.data, l.pulado]), [['2026-03-06', true], ['2026-03-07', true], ['2026-03-08', true], ['2026-03-09', false], ['2026-03-10', false]]);
  assert.equal(r.log[1].motivo, 'Sábado');
  assert.match(r.log[2].motivo, /Domingo/);
});

/* ---------- importação e armazenamento ---------- */
test('Importação JSON: aceita dados válidos e rejeita inválidos', () => {
  const ok = P.validarImportacao({ extras: [{ data: '2026-10-05', nome: 'X', esfera: 'forense', tipo: 'feriado', base: 'Portaria 1' }] });
  assert.equal(ok.ok, true);
  assert.equal(ok.fixos, null);
  const ruins = [
    { extras: [{ data: '05/10/2026', nome: 'X', esfera: 'forense', tipo: 'feriado' }] },
    { extras: [{ data: '2026-10-05', nome: 'X', esfera: 'galactica', tipo: 'feriado' }] },
    { extras: [{ data: '2026-10-05', nome: 'X', esfera: 'forense', tipo: 'outro' }] },
    { extras: [{ data: '2026-10-05', nome: 42, esfera: 'forense', tipo: 'feriado' }] },
    { fixos: [{ mes: 2, dia: 30, nome: 'X', esfera: 'forense', tipo: 'feriado' }] },
    { fixos: 'texto' }, [], null, {}
  ];
  for (const r of ruins) assert.equal(P.validarImportacao(r).ok, false, JSON.stringify(r));
});
test('Armazenamento: chaves prefixadas, padrões e dados corrompidos', () => {
  const { mem, ls } = armazenamentoFalso();
  const arm = P.criarArmazenamento(ls);
  assert.equal(arm.fixos().length, P.fixosPadrao().length);
  assert.equal(arm.pfTjacConta(), false);
  arm.salvarPfTjacConta(true);
  arm.salvarExtras([{ data: '2026-10-05', nome: 'X', esfera: 'forense', tipo: 'feriado', base: '' }]);
  assert.deepEqual(Object.keys(mem).sort(), ['op_feriados_extras', 'op_pf_tjac_conta']);
  mem.op_feriados_fixos = '{lixo'; mem.op_feriados_tjac = '[1,2]';
  assert.equal(arm.fixos().length, P.fixosPadrao().length);
  assert.deepEqual(arm.tjac(), {});
});
test('Base padrão: 9 nacionais, feriado e ponto facultativo estadual de agosto, móveis', () => {
  const fx = P.fixosPadrao();
  assert.equal(fx.filter((f) => f.esfera === 'nacional').length, 9);
  assert.equal(fx.find((f) => f.mes === 8 && f.dia === 6).tipo, 'ponto_facultativo');
  assert.equal(fx.filter((f) => f.esfera === 'municipal').length, 1);
  const mv = P.moveisDoAno(2026).map((i) => [i.data, i.tipo]);
  assert.deepEqual(mv, [['2026-02-16', 'feriado'], ['2026-02-17', 'feriado'], ['2026-02-18', 'feriado'], ['2026-04-02', 'feriado'], ['2026-04-03', 'feriado'], ['2026-06-04', 'ponto_facultativo']]);
});
