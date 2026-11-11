/* Núcleo de cálculo da Calculadora de Prazos (PGE/AC, TJAC).
 * JavaScript puro, sem bibliotecas. Datas são sempre datas LOCAIS
 * (new Date(ano, mes-1, dia)), nunca UTC, para evitar deslocamento de fuso. */
(function (raiz, fabrica) {
  var nucleo = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = nucleo;
  else raiz.Prazos = nucleo;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ESFERAS = ['nacional', 'estadual', 'municipal', 'forense', 'tjac'];
  var TIPOS = ['feriado', 'ponto_facultativo'];
  var FILTROS = ['todos', 'nacional', 'nacional-estadual'];
  var CHAVES = {
    fixos: 'op_feriados_fixos',
    extras: 'op_feriados_extras',
    tjac: 'op_feriados_tjac',
    pfTjac: 'op_pf_tjac_conta'
  };
  var MAX_QTD = 3650;

  /* ---------- 1. Utilidades de data ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
    if (!m) return null;
    var a = +m[1], me = +m[2], di = +m[3];
    if (a < 1900 || a > 2200) return null;
    var d = new Date(a, me - 1, di);
    if (d.getFullYear() !== a || d.getMonth() !== me - 1 || d.getDate() !== di) return null;
    return d;
  }
  function fmtBR(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }
  function diffDiasCorridos(a, b) {
    var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / 86400000);
  }
  var DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function diaSemana(d) { return DIAS_SEMANA[d.getDay()]; }
  function porExtenso(d) { return diaSemana(d) + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"'`]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
  }

  /* Páscoa: algoritmo de Gauss (anônimo gregoriano). */
  function pascoa(ano) {
    var a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31);
    var dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  /* ---------- 2. Base de feriados ---------- */
  function fx(mes, dia, nome, esfera, tipo, base) {
    return { mes: mes, dia: dia, nome: nome, esfera: esfera, tipo: tipo || 'feriado', base: base || '' };
  }
  function fixosPadrao() {
    return [
      fx(1, 1, 'Confraternização Universal', 'nacional'),
      fx(4, 21, 'Tiradentes', 'nacional'),
      fx(5, 1, 'Dia do Trabalho', 'nacional'),
      fx(9, 7, 'Independência do Brasil', 'nacional'),
      fx(10, 12, 'Nossa Senhora Aparecida', 'nacional'),
      fx(11, 2, 'Finados', 'nacional'),
      fx(11, 15, 'Proclamação da República', 'nacional'),
      fx(11, 20, 'Dia da Consciência Negra', 'nacional', 'feriado', 'Lei 14.759/2023'),
      fx(12, 25, 'Natal', 'nacional'),
      fx(1, 20, 'Dia do Católico', 'estadual', 'feriado', 'Lei Estadual 3.137/2016'),
      fx(1, 23, 'Dia do Evangélico', 'estadual', 'feriado', 'Lei Estadual 1.538/2004'),
      fx(3, 8, 'Dia Internacional da Mulher', 'estadual', 'feriado', 'Lei Estadual 1.411/2001'),
      fx(6, 15, 'Aniversário do Estado do Acre', 'estadual', 'feriado', 'Lei 14/1964'),
      fx(9, 5, 'Dia da Amazônia', 'estadual', 'feriado', 'Lei 243/1968'),
      fx(10, 28, 'Dia do Servidor Público', 'estadual'),
      fx(11, 17, 'Tratado de Petrópolis', 'estadual'),
      fx(8, 6, 'Início da Revolução Acreana', 'estadual', 'ponto_facultativo'),
      fx(8, 11, 'Dia do Advogado', 'forense', 'feriado', 'Art. 37, § 1º, II, LC Estadual 221/2010'),
      fx(12, 8, 'Dia da Justiça', 'forense'),
      fx(12, 28, 'Aniversário de Rio Branco', 'municipal', 'feriado', 'Lei Municipal 330/1981')
    ];
  }

  function movelItem(p, delta, nome, esfera, tipo) {
    var d = addDays(p, delta);
    return { data: toISO(d), nome: nome, esfera: esfera, tipo: tipo, base: 'Data móvel (Páscoa ' + (delta >= 0 ? '+' : '−') + Math.abs(delta) + ')', origem: 'padrao' };
  }
  function moveisDoAno(ano) {
    var p = pascoa(ano);
    return [
      movelItem(p, -48, 'Carnaval (segunda-feira)', 'forense', 'feriado'),
      movelItem(p, -47, 'Carnaval (terça-feira)', 'forense', 'feriado'),
      movelItem(p, -46, 'Quarta-feira de Cinzas', 'forense', 'feriado'),
      movelItem(p, -3, 'Quinta-feira Santa', 'estadual', 'feriado'),
      movelItem(p, -2, 'Sexta-feira Santa', 'nacional', 'feriado'),
      movelItem(p, 60, 'Corpus Christi', 'nacional', 'ponto_facultativo')
    ];
  }
  function expandirFixos(fixos, ano) {
    var r = [];
    fixos.forEach(function (f) {
      var d = new Date(ano, f.mes - 1, f.dia);
      if (d.getMonth() !== f.mes - 1) return;
      r.push({ data: toISO(d), nome: f.nome, esfera: f.esfera, tipo: f.tipo, base: f.base || '', origem: 'padrao' });
    });
    return r;
  }

  function textoValido(v, max) { return typeof v === 'string' && v.length <= max; }

  /* Validação usada na importação (JSON) e ao ler o localStorage. */
  function validarFixo(f, i) {
    var p = 'fixos[' + i + ']: ';
    if (!f || typeof f !== 'object') return p + 'item inválido';
    if (!Number.isInteger(f.mes) || f.mes < 1 || f.mes > 12) return p + 'mês inválido';
    if (!Number.isInteger(f.dia) || f.dia < 1 || f.dia > 31) return p + 'dia inválido';
    if (new Date(2024, f.mes - 1, f.dia).getMonth() !== f.mes - 1) return p + 'dia inexistente no mês';
    if (!textoValido(f.nome, 200) || !f.nome.trim()) return p + 'nome inválido';
    if (ESFERAS.indexOf(f.esfera) < 0) return p + 'esfera inválida';
    if (TIPOS.indexOf(f.tipo) < 0) return p + 'tipo inválido';
    if (f.base !== undefined && !textoValido(f.base, 300)) return p + 'base inválida';
    return null;
  }
  function validarExtra(e, i) {
    var p = 'extras[' + i + ']: ';
    if (!e || typeof e !== 'object') return p + 'item inválido';
    if (typeof e.data !== 'string' || !fromISO(e.data)) return p + 'data inválida (use AAAA-MM-DD)';
    if (!textoValido(e.nome, 200) || !e.nome.trim()) return p + 'nome inválido';
    if (ESFERAS.indexOf(e.esfera) < 0) return p + 'esfera inválida';
    if (TIPOS.indexOf(e.tipo) < 0) return p + 'tipo inválido';
    if (e.base !== undefined && !textoValido(e.base, 300)) return p + 'base inválida';
    return null;
  }
  function validarImportacao(obj) {
    var erros = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, erros: ['O arquivo não contém um objeto JSON válido.'] };
    var temFixos = obj.fixos !== undefined, temExtras = obj.extras !== undefined;
    if (!temFixos && !temExtras) erros.push('O arquivo não traz "fixos" nem "extras".');
    if (temFixos) {
      if (!Array.isArray(obj.fixos) || obj.fixos.length > 500) erros.push('"fixos" deve ser uma lista de até 500 itens.');
      else obj.fixos.forEach(function (f, i) { var e = validarFixo(f, i); if (e) erros.push(e); });
    }
    if (temExtras) {
      if (!Array.isArray(obj.extras) || obj.extras.length > 2000) erros.push('"extras" deve ser uma lista de até 2000 itens.');
      else obj.extras.forEach(function (x, i) { var e = validarExtra(x, i); if (e) erros.push(e); });
    }
    if (erros.length) return { ok: false, erros: erros.slice(0, 10) };
    return {
      ok: true,
      fixos: temFixos ? obj.fixos.map(function (f) { return { mes: f.mes, dia: f.dia, nome: f.nome.trim(), esfera: f.esfera, tipo: f.tipo, base: f.base || '' }; }) : null,
      extras: temExtras ? obj.extras.map(function (x) { return { data: x.data, nome: x.nome.trim(), esfera: x.esfera, tipo: x.tipo, base: x.base || '' }; }) : null
    };
  }

  /* ---------- Armazenamento (localStorage com chaves prefixadas) ---------- */
  function criarArmazenamento(ls) {
    function ler(chave, padrao) {
      try {
        var bruto = ls.getItem(chave);
        if (bruto === null || bruto === undefined) return padrao;
        return JSON.parse(bruto);
      } catch (e) { return padrao; }
    }
    function gravar(chave, valor) {
      try { ls.setItem(chave, JSON.stringify(valor)); return { ok: true }; }
      catch (e) {
        var cota = e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
        return { ok: false, mensagem: cota
          ? 'Não há espaço disponível no armazenamento local do aplicativo. Exporte e remova dados antigos e tente novamente.'
          : 'Não foi possível gravar os dados localmente.' };
      }
    }
    function fixos() {
      var v = ler(CHAVES.fixos, null);
      if (!Array.isArray(v)) return fixosPadrao();
      for (var i = 0; i < v.length; i++) if (validarFixo(v[i], i)) return fixosPadrao();
      return v;
    }
    function extras() {
      var v = ler(CHAVES.extras, []);
      if (!Array.isArray(v)) return [];
      return v.filter(function (x, i) { return !validarExtra(x, i); });
    }
    function tjac() {
      var v = ler(CHAVES.tjac, {});
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    }
    function pfTjacConta() { return ler(CHAVES.pfTjac, false) === true; }
    return {
      ler: ler, gravar: gravar, fixos: fixos, extras: extras, tjac: tjac, pfTjacConta: pfTjacConta,
      salvarFixos: function (v) { return gravar(CHAVES.fixos, v); },
      salvarExtras: function (v) { return gravar(CHAVES.extras, v); },
      salvarTjac: function (v) { return gravar(CHAVES.tjac, v); },
      salvarPfTjacConta: function (v) { return gravar(CHAVES.pfTjac, !!v); },
      config: function () { return { fixos: fixos(), extras: extras(), tjac: tjac(), pfTjacConta: pfTjacConta() }; }
    };
  }

  /* ---------- 3. Calendário oficial do TJAC ---------- */
  var ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ordm: 'º', ordf: 'ª', ndash: '–', mdash: '—',
    aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', eacute: 'é', ecirc: 'ê', iacute: 'í', oacute: 'ó', ocirc: 'ô', otilde: 'õ', uacute: 'ú', ccedil: 'ç',
    Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã', Eacute: 'É', Ecirc: 'Ê', Iacute: 'Í', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Uacute: 'Ú', Ccedil: 'Ç' };
  function decodificarEntidades(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (m, e) {
      if (e.charAt(0) === '#') {
        var cod = e.charAt(1).toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return cod > 0 && cod < 0x110000 ? String.fromCodePoint(cod) : m;
      }
      return Object.prototype.hasOwnProperty.call(ENTIDADES, e) ? ENTIDADES[e] : m;
    });
  }
  function semAcento(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  /* Remove <script> e atributos on* antes de interpretar o HTML. */
  function higienizarHtml(html) {
    var r = String(html)
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<script\b[^>]*>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    var anterior;
    do {
      anterior = r;
      r = r.replace(/(<[a-z][^<>]*?)\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '$1');
    } while (r !== anterior);
    return r;
  }
  function linhasDoBloco(interno) {
    return decodificarEntidades(interno.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[a-z][^>]*>/gi, ''))
      .split('\n').map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
  }
  function mesPorTexto(t) {
    var s = semAcento(t);
    for (var i = 0; i < MESES.length; i++) if (s.indexOf(semAcento(MESES[i])) >= 0) return i;
    return -1;
  }
  var RE_TRANSF = /\b(?:adiad[oa]|transferid[oa]|antecipad[oa])\b[^]*?\bpara\s+(?:o\s+)?(?:dia\s+)?(\d{1,2})(?:\s*[º°o])?(?:\s+de\s+([a-zçãéêô]+))?/i;
  var RE_BASE = /\b(lei|decreto|portaria|resolu[cç][aã]o|provimento|regimento|ato\b|art\.|artigo|lc\b)/i;

  /* Lê o HTML do calendário do TJAC. Devolve {ok, itens} ou {ok:false, motivo}. */
  function parseCalendarioTjac(html, ano) {
    var limpo = higienizarHtml(html);
    var ancora = /<a\b[^>]*\b(?:id|name)\s*=\s*["']?janeiro\b[^>]*>/i.exec(limpo);
    if (!ancora) return { ok: false, motivo: 'estrutura', itens: [] };
    var inicio = ancora.index;
    var h1 = limpo.lastIndexOf('<h1', inicio);
    if (h1 >= 0 && limpo.slice(h1, inicio).toLowerCase().indexOf('</h1') < 0) inicio = h1;

    var re = /<(h1|h3|p)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
    re.lastIndex = inicio;
    var mes = -1, dia = null, m, itens = [], vistos = {};
    while ((m = re.exec(limpo))) {
      var tag = m[1].toLowerCase(), linhas = linhasDoBloco(m[2]);
      if (tag === 'h1') { var mm = mesPorTexto(linhas.join(' ')); if (mm >= 0) { mes = mm; dia = null; } continue; }
      if (mes < 0) continue;
      if (tag === 'h3') { var dm = /^\s*(\d{1,2})\b/.exec(linhas.join(' ')); dia = dm ? { n: +dm[1], resto: linhas.join(' ').replace(/^\s*\d{1,2}\s*[-–—:.]?\s*/, '') } : null; continue; }
      if (!dia || !linhas.length) continue;

      var iClasse = -1;
      for (var i = 0; i < linhas.length; i++) if (/^(feriado|ferido|ponto\s+facultativo)\b/i.test(linhas[i])) { iClasse = i; break; }
      if (iClasse < 0) continue;
      var linhaClasse = semAcento(linhas[iClasse]);
      if (/municipal/.test(linhaClasse)) continue;
      var tipo = /^ponto/.test(linhaClasse) ? 'ponto_facultativo' : 'feriado';
      var classe = /nacional/.test(linhaClasse) ? 'nacional' : /estadual/.test(linhaClasse) ? 'estadual'
        : /forense/.test(linhaClasse) ? 'forense' : /regimental/.test(linhaClasse) ? 'regimental'
        : tipo === 'ponto_facultativo' ? 'ponto facultativo' : 'feriado';

      var d = dia.n, mo = mes, ano2 = ano, transferidoDe = null;
      var t = RE_TRANSF.exec(linhas.join(' '));
      if (t) {
        var novoDia = +t[1], novoMes = t[2] ? mesPorTexto(t[2]) : -1;
        transferidoDe = ano + '-' + pad(mes + 1) + '-' + pad(dia.n);
        d = novoDia;
        if (novoMes >= 0) mo = novoMes;
        else if (novoDia < dia.n - 15) mo = mes + 1;
        if (mo > 11) { mo = 0; ano2 = ano + 1; }
      }
      var data = new Date(ano2, mo, d);
      if (data.getFullYear() !== ano2 || data.getMonth() !== mo || data.getDate() !== d) continue;

      var resto = linhas.filter(function (l, k) { return k !== iClasse && !RE_TRANSF.test(l); });
      var baseLinhas = resto.filter(function (l) { return RE_BASE.test(l); });
      var nomeLinhas = resto.filter(function (l) { return !RE_BASE.test(l); });
      var nome = nomeLinhas[0] || dia.resto || (tipo === 'ponto_facultativo' ? 'Ponto facultativo' : 'Feriado');
      var item = {
        data: toISO(data), nome: nome.slice(0, 200), tipo: tipo,
        esfera: classe === 'nacional' ? 'nacional' : 'tjac', classe: classe,
        base: baseLinhas.join(' | ').slice(0, 300), origem: 'tjac'
      };
      if (transferidoDe) item.transferidoDe = transferidoDe;
      var chave = item.data + '|' + item.nome;
      if (vistos[chave]) continue;
      vistos[chave] = true;
      itens.push(item);
    }
    if (itens.length < 10) return { ok: false, motivo: 'estrutura', itens: [] };
    return { ok: true, itens: itens };
  }

  function urlCalendarioTjac(ano) { return 'https://www.tjac.jus.br/adm/calendarios/calendario-' + ano + '/'; }

  /* Busca, interpreta e grava o calendário do ano. Nada é gravado em caso de falha.
   * buscar(ano) -> Promise<{status, texto}> (injetado: fetch no navegador, IPC no Electron). */
  function carregarCalendarioTjac(ano, ctx) {
    var agora = ctx.agora ? ctx.agora() : new Date();
    return Promise.resolve().then(function () { return ctx.buscar(ano); }).then(function (resp) {
      if (!resp) return { ok: false, motivo: 'rede', mensagem: 'Sem resposta do servidor do TJAC.' };
      if (resp.status === 404) return { ok: false, motivo: 'nao_publicado', mensagem: 'O calendário de ' + ano + ' ainda não foi publicado pelo TJAC.' };
      if (resp.status !== 200) return { ok: false, motivo: 'http', mensagem: 'O servidor do TJAC respondeu com o código ' + resp.status + '.' };
      var r = parseCalendarioTjac(resp.texto || '', ano);
      if (!r.ok) return { ok: false, motivo: 'estrutura', mensagem: 'A página do TJAC foi lida, mas a estrutura não foi reconhecida (menos de 10 datas). Nenhum dado foi alterado.' };
      var todos = ctx.armazenamento.tjac();
      todos[String(ano)] = { lidoEm: agora.toISOString(), total: r.itens.length, itens: r.itens };
      var g = ctx.armazenamento.salvarTjac(todos);
      if (!g.ok) return { ok: false, motivo: 'cota', mensagem: g.mensagem };
      return { ok: true, total: r.itens.length, lidoEm: todos[String(ano)].lidoEm };
    }, function () {
      return { ok: false, motivo: 'rede', mensagem: 'Não foi possível acessar o site do TJAC (sem conexão ou acesso bloqueado). Os dados já gravados foram mantidos.' };
    });
  }

  /* ---------- Feriados efetivos de um ano ---------- */
  function feriadosDoAno(ano, cfg) {
    var lista = [];
    var tj = cfg.tjac && cfg.tjac[String(ano)];
    if (tj && Array.isArray(tj.itens)) {
      tj.itens.forEach(function (it) { if (typeof it.data === 'string' && it.data.slice(0, 4) === String(ano)) lista.push(it); });
    } else {
      lista = expandirFixos(cfg.fixos || fixosPadrao(), ano).concat(moveisDoAno(ano));
    }
    (cfg.extras || []).forEach(function (e) {
      if (e.data.slice(0, 4) === String(ano)) lista.push({ data: e.data, nome: e.nome, esfera: e.esfera, tipo: e.tipo, base: e.base || '', origem: 'extra' });
    });
    lista.sort(function (a, b) { return a.data < b.data ? -1 : a.data > b.data ? 1 : 0; });
    return lista;
  }

  /* ---------- 4. Filtro de esfera ---------- */
  function esferaPermitida(item, filtro) {
    if (filtro === 'todos') return true;
    if (filtro === 'nacional') return item.esfera === 'nacional';
    return item.esfera !== 'municipal'; // nacional-estadual (padrão)
  }
  /* Só "feriado" bloqueia; ponto facultativo só bloqueia se vier do TJAC e a opção estiver ligada. */
  function bloqueia(item, cfg) {
    if (item.tipo === 'feriado') return true;
    return item.tipo === 'ponto_facultativo' && item.origem === 'tjac' && !!cfg.pfTjacConta;
  }

  /* ---------- 5. Suspensão de fim de ano ---------- */
  function estaEmRecesso(d) {
    var m = d.getMonth(), dia = d.getDate();
    return (m === 11 && dia >= 20) || (m === 0 && dia <= 20);
  }

  /* ---------- 6. calcularPrazo ---------- */
  function calcularPrazo(opts, cfg) {
    var inicio = fromISO(opts.dataInicioISO);
    if (!inicio) throw new Error('Informe uma data válida.');
    var quantidade = Number(opts.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_QTD) throw new Error('A quantidade deve ser um número inteiro entre 1 e ' + MAX_QTD + '.');
    var tipo = opts.tipo || 'processual';
    if (['processual', 'material', 'personalizado'].indexOf(tipo) < 0) throw new Error('Tipo de prazo inválido.');
    var filtro = FILTROS.indexOf(opts.filtroEsfera) >= 0 ? opts.filtroEsfera : 'nacional-estadual';
    var recessoAtivo = tipo === 'processual' && opts.considerarRecesso !== false;

    var cacheAno = {};
    function mapaDo(ano) {
      if (!cacheAno[ano]) {
        var mp = {};
        feriadosDoAno(ano, cfg).forEach(function (it) {
          if (!esferaPermitida(it, filtro) || !bloqueia(it, cfg)) return;
          if (!mp[it.data]) mp[it.data] = it;
        });
        cacheAno[ano] = mp;
      }
      return cacheAno[ano];
    }
    function feriadoEm(d) { var it = mapaDo(d.getFullYear())[toISO(d)]; return it || null; }
    function nomeFeriado(it) { return it.nome + ' (' + (it.esfera === 'tjac' ? 'TJAC' : it.esfera) + (it.tipo === 'ponto_facultativo' ? ', ponto facultativo' : '') + ')'; }
    /* naoUtil: devolve o motivo ou null. */
    function naoUtil(d, comRecesso) {
      if (isWeekend(d)) return { motivo: d.getDay() === 0 ? 'Domingo' : 'Sábado' };
      var f = feriadoEm(d);
      if (f) return { motivo: 'Feriado: ' + nomeFeriado(f) };
      if (comRecesso && estaEmRecesso(d)) return { motivo: 'Suspensão de fim de ano (CPC, art. 220)', recesso: true };
      return null;
    }

    var avisos = [], log = [];
    var ciencia = inicio;
    if (opts.modoData === 'envio') {
      ciencia = addDays(inicio, 9);
      avisos.push('Modo envio (Lei 11.419/2006, art. 5º, § 3º): a ciência é presumida no 10º dia corrido contado do dia do envio (' + fmtBR(ciencia) + '); o prazo começa a correr no primeiro dia útil seguinte à ciência.');
    }

    var qtd = quantidade;
    if (opts.dobro) {
      if (tipo === 'material') avisos.push('A dobra para a Fazenda Pública (CPC, art. 183) não se aplica a prazo material; a quantidade não foi dobrada.');
      else {
        qtd = quantidade * 2;
        avisos.push('Prazo em dobro aplicado (CPC, art. 183): ' + quantidade + ' → ' + qtd + '. A dobra não incide quando a lei fixa prazo próprio para a Fazenda Pública (art. 183, § 2º).');
      }
    }

    log.push({ data: toISO(ciencia), motivo: opts.modoData === 'envio' ? 'Dia da ciência presumida (excluído da contagem)' : 'Dia do começo (excluído da contagem)', pulado: true });

    var cursor = ciencia, contados = 0, guarda = 0, final = null;
    function registrarPulo(d, nu) { var e = { data: toISO(d), motivo: nu.motivo, pulado: true }; if (nu.recesso) e.recesso = true; log.push(e); }
    function registrarContado(d, n) { log.push({ data: toISO(d), motivo: 'Dia contado (' + n + '/' + qtd + ')', pulado: false }); }

    if (tipo === 'processual') {
      /* CPC, arts. 219 e 224: exclui o dia do começo; só dias úteis. */
      while (contados < qtd && guarda++ < 40000) {
        cursor = addDays(cursor, 1);
        var nu = naoUtil(cursor, recessoAtivo);
        if (nu) { registrarPulo(cursor, nu); continue; }
        contados++; registrarContado(cursor, contados);
      }
      final = cursor;
    } else if (tipo === 'material') {
      /* CC, art. 132: exclui o dia do começo; dias corridos; prorroga se vencer em dia não útil. */
      for (var i = 1; i <= qtd; i++) { cursor = addDays(ciencia, i); registrarContado(cursor, i); }
      final = cursor;
      var venc = final, prorrogou = false;
      var nu2;
      while ((nu2 = naoUtil(final, false))) { registrarPulo(final, { motivo: 'Vencimento em dia não útil — prorrogado: ' + nu2.motivo }); final = addDays(final, 1); prorrogou = true; }
      if (prorrogou) log.push({ data: toISO(final), motivo: 'Vencimento prorrogado para o primeiro dia útil', pulado: false });
      if (prorrogou) avisos.push('Vencimento prorrogado de ' + fmtBR(venc) + ' para ' + fmtBR(final) + ' (CC, art. 132, § 1º).');
    } else {
      /* Personalizado: corridos ou pulando fins de semana e/ou feriados; prorrogação opcional. */
      while (contados < qtd && guarda++ < 40000) {
        cursor = addDays(cursor, 1);
        var motivo = null;
        if (opts.persFimSemana && isWeekend(cursor)) motivo = cursor.getDay() === 0 ? 'Domingo' : 'Sábado';
        else if (opts.persFeriados) { var f2 = feriadoEm(cursor); if (f2) motivo = 'Feriado: ' + nomeFeriado(f2); }
        if (motivo) { registrarPulo(cursor, { motivo: motivo }); continue; }
        contados++; registrarContado(cursor, contados);
      }
      final = cursor;
      if (opts.persProrroga) {
        var venc2 = final, pr = false, nu3;
        while ((nu3 = naoUtil(final, false))) { registrarPulo(final, { motivo: 'Vencimento em dia não útil — prorrogado: ' + nu3.motivo }); final = addDays(final, 1); pr = true; }
        if (pr) log.push({ data: toISO(final), motivo: 'Vencimento prorrogado para o primeiro dia útil', pulado: false });
        if (pr) avisos.push('Vencimento prorrogado de ' + fmtBR(venc2) + ' para ' + fmtBR(final) + '.');
      }
    }

    if (recessoAtivo && log.some(function (l) { return l.recesso; })) avisos.push('A contagem atravessou a suspensão de fim de ano (20/12 a 20/01, CPC, art. 220): os dias do período não foram contados.');
    if (estaEmRecesso(final)) avisos.push('O vencimento (' + fmtBR(final) + ') cai entre 20/12 e 20/01' + (recessoAtivo ? '.' : ', período de suspensão dos prazos processuais; a suspensão não foi aplicada neste cálculo. Confirme se ela incide no caso concreto.'));

    return { dataFinal: toISO(final), qtdEfetiva: qtd, ciencia: toISO(ciencia), log: log, avisos: avisos, tipo: tipo };
  }

  return {
    ESFERAS: ESFERAS, TIPOS: TIPOS, FILTROS: FILTROS, CHAVES: CHAVES, MAX_QTD: MAX_QTD,
    toISO: toISO, fromISO: fromISO, fmtBR: fmtBR, addDays: addDays, isWeekend: isWeekend,
    diffDiasCorridos: diffDiasCorridos, diaSemana: diaSemana, porExtenso: porExtenso, escapeHtml: escapeHtml,
    pascoa: pascoa, fixosPadrao: fixosPadrao, moveisDoAno: moveisDoAno, feriadosDoAno: feriadosDoAno,
    validarImportacao: validarImportacao, validarExtra: validarExtra, criarArmazenamento: criarArmazenamento,
    higienizarHtml: higienizarHtml, parseCalendarioTjac: parseCalendarioTjac, urlCalendarioTjac: urlCalendarioTjac,
    carregarCalendarioTjac: carregarCalendarioTjac, estaEmRecesso: estaEmRecesso, esferaPermitida: esferaPermitida,
    bloqueia: bloqueia, calcularPrazo: calcularPrazo
  };
});
