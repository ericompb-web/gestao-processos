/* Interface da Calculadora de Prazos. Depende de nucleo.js (window.Prazos). */
(function () {
  'use strict';
  var P = window.Prazos;
  var esc = P.escapeHtml;
  var $ = function (id) { return document.getElementById(id); };

  /* Armazenamento: localStorage, com reserva em memória se o acesso for bloqueado. */
  function lsSeguro() {
    try { var t = '__op_teste__'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); return window.localStorage; }
    catch (e) {
      var mem = {};
      return { getItem: function (k) { return k in mem ? mem[k] : null; }, setItem: function (k, v) { mem[k] = String(v); }, removeItem: function (k) { delete mem[k]; } };
    }
  }
  var arm = P.criarArmazenamento(lsSeguro());
  var ultimoResultado = null; // opções do último cálculo, para recalcular quando os feriados mudam
  var statusTjac = {};        // mensagens da última tentativa por ano

  /* ---------- Rede: única chamada externa (calendário público do TJAC) ---------- */
  function buscarCalendario(ano) {
    if (window.prazosNativo) return window.prazosNativo.buscarCalendarioTjac(ano);
    return fetch(P.urlCalendarioTjac(ano), { credentials: 'omit', cache: 'no-store' }).then(function (r) {
      return r.status === 200 ? r.text().then(function (t) { return { status: 200, texto: t }; }) : { status: r.status, texto: '' };
    });
  }

  /* ---------- Formulário ---------- */
  function valorRadio(nome) { return document.querySelector('input[name="' + nome + '"]:checked').value; }
  function lerOpcoes() {
    return {
      dataInicioISO: $('data').value,
      modoData: valorRadio('modoData'),
      tipo: valorRadio('tipo'),
      quantidade: $('quantidade').value === '' ? NaN : Number($('quantidade').value),
      dobro: $('dobro').checked,
      filtroEsfera: $('filtro').value,
      considerarRecesso: $('recesso').checked,
      persFimSemana: $('persFimSemana').checked,
      persFeriados: $('persFeriados').checked,
      persProrroga: $('persProrroga').checked
    };
  }
  function ajustarFormulario() {
    var tipo = valorRadio('tipo');
    $('opcoes-pers').hidden = tipo !== 'personalizado';
    $('recesso').disabled = tipo !== 'processual';
    $('recesso').closest('label').style.opacity = tipo === 'processual' ? '1' : '.55';
  }
  function mostrarErro(msg) { var e = $('erro'); e.textContent = msg || ''; e.hidden = !msg; }

  function calcular() {
    mostrarErro('');
    var op = lerOpcoes();
    try {
      var r = P.calcularPrazo(op, arm.config());
      ultimoResultado = op;
      exibir(r);
    } catch (e) {
      ultimoResultado = null;
      mostrarErro(e.message);
      $('resultado').hidden = true; $('vazio').hidden = false;
    }
  }
  function recalcularSeHouver() {
    if (!ultimoResultado) return;
    try { exibir(P.calcularPrazo(ultimoResultado, arm.config())); } catch (e) { /* mantém o resultado anterior */ }
  }

  function exibir(r) {
    var final = P.fromISO(r.dataFinal);
    $('vazio').hidden = true; $('resultado').hidden = false;
    $('venc').textContent = P.porExtenso(final);
    $('r-qtd').textContent = r.qtdEfetiva + (r.tipo === 'material' ? ' dias corridos' : r.tipo === 'processual' ? ' dias úteis' : ' dias');
    var temCiencia = ultimoResultado && ultimoResultado.modoData === 'envio';
    $('r-ciencia-bloco').hidden = !temCiencia;
    if (temCiencia) $('r-ciencia').textContent = P.fmtBR(P.fromISO(r.ciencia)) + ' (' + P.diaSemana(P.fromISO(r.ciencia)) + ')';
    $('avisos').innerHTML = r.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');

    var ult = r.log.length - 1, linhas = [];
    r.log.forEach(function (l, i) {
      var d = P.fromISO(l.data);
      var contado = !l.pulado;
      var ehFinal = contado && i === ult && l.data === r.dataFinal;
      linhas.push('<tr class="' + (contado ? 'contado' : 'pulado') + (ehFinal ? ' final' : '') + '">' +
        '<td>' + esc(P.fmtBR(d)) + '</td><td>' + esc(P.diaSemana(d)) + '</td><td>' + esc(l.motivo) + (ehFinal && !/vencimento/i.test(l.motivo) ? ' — vencimento' : '') + '</td></tr>');
    });
    $('tab-log').tBodies[0].innerHTML = linhas.join('');
    var vencimento = $('tab-log').tBodies[0].querySelector('tr.final');
    if (vencimento && vencimento.scrollIntoView) vencimento.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- Feriados ---------- */
  function anoAtual() { var v = Number($('ano').value); return Number.isInteger(v) && v >= 1990 && v <= 2200 ? v : new Date().getFullYear(); }
  function msgFer(texto, tipo) { var m = $('msg-fer'); m.textContent = texto || ''; m.className = 'status' + (tipo ? ' ' + tipo : ''); }
  var ROTULO_ESFERA = { nacional: 'Nacional', estadual: 'Estadual', municipal: 'Municipal', forense: 'Forense', tjac: 'TJAC' };
  var ROTULO_ORIGEM = { padrao: 'Base padrão', tjac: 'TJAC', extra: 'Avulso' };

  function renderFeriados() {
    var ano = anoAtual(), cfg = arm.config();
    var itens = P.feriadosDoAno(ano, cfg);
    var extras = cfg.extras;
    var html = itens.map(function (it) {
      var d = P.fromISO(it.data);
      var idxExtra = -1;
      if (it.origem === 'extra') for (var i = 0; i < extras.length; i++) if (extras[i].data === it.data && extras[i].nome === it.nome) { idxExtra = i; break; }
      var nome = esc(it.nome) + (it.transferidoDe ? ' <span class="dica">(transferido de ' + esc(P.fmtBR(P.fromISO(it.transferidoDe))) + ')</span>' : '');
      var tipo = it.tipo === 'ponto_facultativo' ? 'Ponto facultativo' : 'Feriado';
      return '<tr><td>' + esc(P.fmtBR(d)) + '</td><td>' + esc(P.diaSemana(d)) + '</td><td>' + nome + '</td>' +
        '<td>' + esc(ROTULO_ESFERA[it.esfera] || it.esfera) + '</td><td>' + esc(tipo) + '</td>' +
        '<td><span class="etiqueta">' + esc(ROTULO_ORIGEM[it.origem] || it.origem) + '</span></td><td>' + esc(it.base || '') + '</td>' +
        '<td>' + (idxExtra >= 0 ? '<button type="button" class="remover" data-extra="' + idxExtra + '">Remover</button>' : '') + '</td></tr>';
    }).join('');
    $('tab-fer').tBodies[0].innerHTML = html || '<tr><td colspan="8">Nenhum feriado para este ano.</td></tr>';
    renderStatusTjac();
  }
  function renderStatusTjac() {
    var ano = anoAtual(), tj = arm.tjac()[String(ano)], el = $('status-tjac');
    var partes = [];
    if (tj && tj.lidoEm) {
      var lido = new Date(tj.lidoEm);
      partes.push('Calendário do TJAC ' + ano + ': lido em ' + P.fmtBR(lido) + ', ' + tj.total + ' datas (substitui os feriados fixos e móveis de ' + ano + ').');
    } else partes.push('Calendário do TJAC ' + ano + ': ainda não lido; usando a base padrão.');
    var s = statusTjac[ano];
    if (s) partes.push(s.mensagem);
    el.textContent = partes.join(' ');
    el.className = 'status' + (s && !s.ok ? ' ruim' : s && s.ok ? ' bom' : '');
  }

  function aposMudarFeriados() { renderFeriados(); recalcularSeHouver(); }

  function atualizarTjac(ano, silencioso) {
    var btn = $('btn-tjac');
    if (!silencioso) { btn.disabled = true; statusTjac[ano] = { ok: true, mensagem: 'Lendo o calendário do TJAC…' }; renderStatusTjac(); }
    return P.carregarCalendarioTjac(ano, { buscar: buscarCalendario, armazenamento: arm }).then(function (r) {
      statusTjac[ano] = { ok: r.ok, mensagem: r.ok ? 'Leitura concluída: ' + r.total + ' datas.' : r.mensagem };
      if (r.ok) aposMudarFeriados(); else renderStatusTjac();
    }).then(function () { btn.disabled = false; });
  }
  function atualizacaoAutomatica() {
    var hoje = new Date(), ano = hoje.getFullYear(), tj = arm.tjac();
    var trintaDias = 30 * 86400000;
    [ano, ano + 1].forEach(function (a) {
      var reg = tj[String(a)];
      var velho = !reg || !reg.lidoEm || (hoje - new Date(reg.lidoEm)) > trintaDias;
      if (velho) atualizarTjac(a, true);
    });
  }

  /* ---------- Feriados avulsos, importação e exportação ---------- */
  function adicionarExtra(ev) {
    ev.preventDefault();
    var novo = { data: $('x-data').value, nome: $('x-nome').value.trim(), esfera: $('x-esfera').value, tipo: $('x-tipo').value, base: $('x-base').value.trim() };
    var erro = P.validarExtra(novo, 0);
    if (erro) { msgFer(erro.replace(/^extras\[0\]: /, 'Dados inválidos: '), 'ruim'); return; }
    var lista = arm.extras();
    if (lista.some(function (e) { return e.data === novo.data && e.nome === novo.nome; })) { msgFer('Esse feriado avulso já está cadastrado.', 'ruim'); return; }
    lista.push(novo);
    var g = arm.salvarExtras(lista);
    if (!g.ok) { msgFer(g.mensagem, 'ruim'); return; }
    $('form-extra').reset();
    msgFer('Feriado avulso adicionado.', 'bom');
    $('ano').value = novo.data.slice(0, 4);
    aposMudarFeriados();
  }
  function removerExtra(idx) {
    var lista = arm.extras();
    if (!lista[idx]) return;
    lista.splice(idx, 1);
    var g = arm.salvarExtras(lista);
    if (!g.ok) { msgFer(g.mensagem, 'ruim'); return; }
    msgFer('Feriado avulso removido.', 'bom');
    aposMudarFeriados();
  }
  function exportar() {
    var dados = { versao: 1, fixos: arm.fixos(), extras: arm.extras() };
    var blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'feriados-calculadora-prazos.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    msgFer('Arquivo exportado (feriados fixos e avulsos; o calendário do TJAC é relido automaticamente).', 'bom');
  }
  function importar(arquivo) {
    if (!arquivo) return;
    if (arquivo.size > 2 * 1024 * 1024) { msgFer('Arquivo grande demais (limite de 2 MB).', 'ruim'); return; }
    arquivo.text().then(function (texto) {
      var obj;
      try { obj = JSON.parse(texto); } catch (e) { msgFer('O arquivo não é um JSON válido.', 'ruim'); return; }
      var v = P.validarImportacao(obj);
      if (!v.ok) { msgFer('Importação recusada. ' + v.erros.join(' · '), 'ruim'); return; }
      if (v.fixos) { var g1 = arm.salvarFixos(v.fixos); if (!g1.ok) { msgFer(g1.mensagem, 'ruim'); return; } }
      if (v.extras) { var g2 = arm.salvarExtras(v.extras); if (!g2.ok) { msgFer(g2.mensagem, 'ruim'); return; } }
      msgFer('Importação concluída' + (v.fixos ? ': ' + v.fixos.length + ' feriados fixos' : '') + (v.extras ? (v.fixos ? ' e ' : ': ') + v.extras.length + ' avulsos' : '') + '.', 'bom');
      aposMudarFeriados();
    }, function () { msgFer('Não foi possível ler o arquivo.', 'ruim'); });
  }

  /* ---------- Início ---------- */
  function hojeISO() { return P.toISO(new Date()); }
  function iniciar() {
    $('data').value = hojeISO();
    $('ano').value = new Date().getFullYear();
    $('pfTjac').checked = arm.pfTjacConta();
    ajustarFormulario();

    $('form').addEventListener('submit', function (e) { e.preventDefault(); calcular(); });
    document.querySelectorAll('input[name="tipo"]').forEach(function (r) { r.addEventListener('change', ajustarFormulario); });
    $('ano').addEventListener('change', renderFeriados);
    $('btn-tjac').addEventListener('click', function () { atualizarTjac(anoAtual(), false); });
    $('btn-exportar').addEventListener('click', exportar);
    $('btn-importar').addEventListener('click', function () { $('arquivo').click(); });
    $('arquivo').addEventListener('change', function (e) { importar(e.target.files[0]); e.target.value = ''; });
    $('form-extra').addEventListener('submit', adicionarExtra);
    $('tab-fer').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-extra]'); if (b) removerExtra(Number(b.getAttribute('data-extra')));
    });
    $('pfTjac').addEventListener('change', function (e) {
      var g = arm.salvarPfTjacConta(e.target.checked);
      if (!g.ok) msgFer(g.mensagem, 'ruim');
      recalcularSeHouver();
    });
    renderFeriados();
    atualizacaoAutomatica();
  }
  iniciar();
})();
