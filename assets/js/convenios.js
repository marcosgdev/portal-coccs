(function () {
  var grid = document.getElementById('convenios-kpis');
  if (!grid) return;

  var PRAZO_ORDEM = ['≤30', '31–60', '61–90', '91–150', '>150', 'sem_data'];
  var PRAZO_LABEL = { '≤30': 'Até 30 dias', '31–60': '31 a 60 dias', '61–90': '61 a 90 dias', '91–150': '91 a 150 dias', '>150': 'Mais de 150 dias', 'sem_data': 'Sem data de término' };
  var PRAZO_COR = { '≤30': '#d03b3b', '31–60': '#F2B705', '61–90': '#F2B705', '91–150': '#1F4E79', '>150': '#008300', 'sem_data': '#898781' };
  var COR_PADRAO = '#1F4E79';

  var state = { data: CONVENIOS_DATA, search: '', setor: '', tipo: '', natureza: '', prazo: '', sortKey: 'restante_dias', sortDir: 1 };

  var syncPill = document.getElementById('convenios-sync-status');
  var atualizarBtn = document.getElementById('convenios-atualizar');
  var buscaInput = document.getElementById('convenios-busca');
  var fSetor = document.getElementById('convenios-f-setor');
  var fTipo = document.getElementById('convenios-f-categoria');
  var fNatureza = document.getElementById('convenios-f-natureza');
  var fPrazo = document.getElementById('convenios-f-prazo');
  var limparBtn = document.getElementById('convenios-limpar');
  var contagemEl = document.getElementById('convenios-contagem');
  var tbody = document.getElementById('convenios-tbody');
  var notaEl = document.getElementById('convenios-nota');
  var prazoSub = document.getElementById('convenios-prazo-sub');
  var prazoLegenda = document.getElementById('convenios-prazo-legenda');
  var prazoGrafico = document.getElementById('convenios-prazo-grafico');
  var setorSub = document.getElementById('convenios-setor-sub');
  var setorGrafico = document.getElementById('convenios-setor-grafico');
  var categoriaSub = document.getElementById('convenios-categoria-sub');
  var categoriaGrafico = document.getElementById('convenios-categoria-grafico');
  var naturezaSub = document.getElementById('convenios-natureza-sub');
  var naturezaGrafico = document.getElementById('convenios-natureza-grafico');
  var trimestreSub = document.getElementById('convenios-trimestre-sub');
  var trimestreGrafico = document.getElementById('convenios-trimestre-grafico');
  var exportarBtn = document.getElementById('convenios-exportar');

  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  function setSyncStatus(tipo, texto) {
    syncPill.textContent = texto;
    syncPill.setAttribute('data-status', tipo);
  }

  function bucketPrazo(dias) {
    if (dias === null || dias === undefined) return 'sem_data';
    if (dias <= 30) return '≤30';
    if (dias <= 60) return '31–60';
    if (dias <= 90) return '61–90';
    if (dias <= 150) return '91–150';
    return '>150';
  }

  function instrumentoLabel(r) {
    var num = r.numero || '—';
    var ano = r.ano || '—';
    return num + '/' + ano;
  }

  function fmtBRL(v) {
    if (!v) return 'R$ 0';
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var partes = iso.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  function uniqueSorted(data, campo) {
    var set = {};
    data.forEach(function (r) { if (r[campo]) set[r[campo]] = true; });
    return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
  }

  function fillSelect(select, options, placeholder) {
    var atual = select.value;
    select.innerHTML = '';
    var optTodos = document.createElement('option');
    optTodos.value = '';
    optTodos.textContent = placeholder;
    select.appendChild(optTodos);
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      select.appendChild(opt);
    });
    if (options.indexOf(atual) !== -1) select.value = atual;
  }

  function popularFiltros() {
    fillSelect(fSetor, uniqueSorted(state.data, 'setor_demandante'), 'Todos os setores');
    fillSelect(fTipo, uniqueSorted(state.data, 'tipo_instrumento'), 'Todos os tipos');
    fillSelect(fNatureza, uniqueSorted(state.data, 'natureza'), 'Todas as naturezas');
  }

  function getFiltered() {
    var q = state.search.trim().toLowerCase();
    return state.data.filter(function (r) {
      if (state.setor && r.setor_demandante !== state.setor) return false;
      if (state.tipo && r.tipo_instrumento !== state.tipo) return false;
      if (state.natureza && r.natureza !== state.natureza) return false;
      if (state.prazo && bucketPrazo(r.restante_dias) !== state.prazo) return false;
      if (q) {
        var hay = (instrumentoLabel(r) + ' ' + (r.credor || '') + ' ' + (r.objeto || '') + ' ' + (r.gestor || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderKpis(filtered) {
    var total = filtered.length;
    var d30 = filtered.filter(function (r) { return bucketPrazo(r.restante_dias) === '≤30'; }).length;
    var d90 = filtered.filter(function (r) { var b = bucketPrazo(r.restante_dias); return b === '≤30' || b === '31–60' || b === '61–90'; }).length;
    var valorTotal = filtered.reduce(function (soma, r) { return soma + (Number(r.valor_global_atualizado) || 0); }, 0);
    var estrategicos = filtered.filter(function (r) { return r.estrategico && r.estrategico.toLowerCase() === 'sim'; }).length;

    var tiles = [
      {
        num: total, label: 'Instrumentos vigentes',
        cenario: 'Dimensionar o volume total de contratos e instrumentos vigentes monitorados pela COCCS, considerando os filtros aplicados.',
        considerados: 'Todos os instrumentos da base que atendem aos filtros de setor, tipo, natureza, prazo e busca atualmente selecionados.',
        excluidos: 'Nenhum — soma bruta de todas as linhas que passam pelos filtros atuais.'
      },
      {
        num: d30, label: 'Vencem em até 30 dias',
        cenario: 'Sinalizar instrumentos que exigem providência imediata de prorrogação ou encerramento.',
        considerados: 'Instrumentos com prazo restante até o término igual ou inferior a 30 dias.',
        excluidos: 'Instrumentos com prazo maior, sem data de término definida ou já vencidos fora da base.'
      },
      {
        num: d90, label: 'Vencem em até 90 dias',
        cenario: 'Antecipar a carga de trabalho de prorrogações e renovações dos próximos três meses.',
        considerados: 'Instrumentos com prazo restante até o término igual ou inferior a 90 dias.',
        excluidos: 'Instrumentos com prazo maior que 90 dias ou sem data de término definida.'
      },
      {
        num: fmtBRL(valorTotal), label: 'Valor global atualizado',
        cenario: 'Dimensionar o volume financeiro total sob gestão da Coordenadoria nos instrumentos vigentes.',
        considerados: 'Soma do valor global atualizado de todos os instrumentos no filtro atual.',
        excluidos: 'Instrumentos sem valor global atualizado informado (considerados como zero).'
      },
      {
        num: estrategicos, label: 'Contratos estratégicos',
        cenario: 'Identificar quantos instrumentos estão classificados como estratégicos para a gestão administrativa do Tribunal.',
        considerados: 'Instrumentos com o campo "estratégico" marcado como "Sim".',
        excluidos: 'Instrumentos não classificados como estratégicos.'
      }
    ];

    grid.innerHTML = tiles.map(function (t) {
      return '<div class="stat-item">' +
        '<span class="kpi-info-wrap">' +
        '<button type="button" class="kpi-info-btn" aria-label="Como o indicador \'' + escapeHtml(t.label) + '\' é calculado">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="M12 16v-5"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></svg>' +
        '</button>' +
        '<span class="kpi-tooltip" role="tooltip">' +
        '<p><strong>Cenário:</strong>' + escapeHtml(t.cenario) + '</p>' +
        '<p><strong>Considerados:</strong>' + escapeHtml(t.considerados) + '</p>' +
        '<p><strong>Excluídos:</strong>' + escapeHtml(t.excluidos) + '</p>' +
        '</span>' +
        '</span>' +
        '<span class="stat-num">' + escapeHtml(t.num) + '</span><span class="stat-label">' + escapeHtml(t.label) + '</span></div>';
    }).join('');
  }

  function renderBarList(container, entries, corPorLabel) {
    if (!entries.length) {
      container.innerHTML = '<p style="color:var(--tinta-suave); font-size:0.88rem;">Nenhum instrumento para exibir com os filtros atuais.</p>';
      return;
    }
    var max = Math.max.apply(null, entries.map(function (e) { return e[1]; }));
    container.innerHTML = entries.map(function (e) {
      var label = e[0], count = e[1];
      var cor = typeof corPorLabel === 'function' ? corPorLabel(label) : (corPorLabel || COR_PADRAO);
      var largura = (count / max) * 100;
      return '<div class="parcerias-bar-row">' +
        '<span class="rotulo" title="' + escapeHtml(label) + '">' + escapeHtml(label) + '</span>' +
        '<div class="parcerias-bar-track"><div class="parcerias-bar-seg" data-tooltip="' + escapeHtml(label) + ': ' + count + '" tabindex="0" ' +
        'style="width:' + largura + '%; background:' + cor + '">' + count + '</div></div>' +
        '<span class="total">' + count + '</span>' +
        '</div>';
    }).join('');
  }

  function topN(filtered, campo, n) {
    var counts = {};
    filtered.forEach(function (r) {
      var v = r[campo] || 'Sem informação';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, n).map(function (k) { return [k, counts[k]]; });
  }

  function renderPrazoChart(filtered) {
    prazoSub.textContent = filtered.length + ' instrumentos no filtro atual';
    var counts = {};
    PRAZO_ORDEM.forEach(function (b) { counts[b] = 0; });
    filtered.forEach(function (r) { counts[bucketPrazo(r.restante_dias)]++; });
    var entries = PRAZO_ORDEM.filter(function (b) { return counts[b] > 0; }).map(function (b) { return [PRAZO_LABEL[b], counts[b], b]; });
    prazoLegenda.innerHTML = entries.map(function (e) {
      return '<span><span class="amostra" style="background:' + PRAZO_COR[e[2]] + '"></span>' + escapeHtml(e[0]) + '</span>';
    }).join('');
    renderBarList(prazoGrafico, entries.map(function (e) { return [e[0], e[1]]; }), function (label) {
      var bucket = PRAZO_ORDEM.filter(function (b) { return PRAZO_LABEL[b] === label; })[0];
      return PRAZO_COR[bucket] || COR_PADRAO;
    });
  }

  function renderSetorChart(filtered) {
    var entries = topN(filtered, 'setor_demandante', 8);
    setorSub.textContent = filtered.length + ' instrumentos no filtro atual · top 8 setores';
    renderBarList(setorGrafico, entries);
  }

  function renderCategoriaChart(filtered) {
    var entries = topN(filtered, 'tipo_instrumento', 8);
    categoriaSub.textContent = filtered.length + ' instrumentos no filtro atual';
    renderBarList(categoriaGrafico, entries);
  }

  function renderNaturezaChart(filtered) {
    var entries = topN(filtered, 'natureza', 8);
    naturezaSub.textContent = filtered.length + ' instrumentos no filtro atual · top 8 naturezas';
    renderBarList(naturezaGrafico, entries);
  }

  function renderTrimestreChart(filtered) {
    var counts = {};
    filtered.forEach(function (r) {
      var v = r.vigencia_trimestral || 'Sem informação';
      counts[v] = (counts[v] || 0) + 1;
    });
    var parsed = Object.keys(counts).map(function (label) {
      var m = label.match(/(\d{4})\s*-\s*(\d)/);
      var key = m ? (parseInt(m[1], 10) * 10 + parseInt(m[2], 10)) : 999999;
      return { label: label, count: counts[label], key: key };
    });
    parsed.sort(function (a, b) { return a.key - b.key; });
    var agora = new Date();
    var chaveAtual = agora.getFullYear() * 10 + Math.ceil((agora.getMonth() + 1) / 3);
    var futuros = parsed.filter(function (p) { return p.key >= chaveAtual; });
    var lista = (futuros.length ? futuros : parsed).slice(0, 10);
    trimestreSub.textContent = 'Próximos períodos de vencimento no filtro atual';
    renderBarList(trimestreGrafico, lista.map(function (p) { return [p.label, p.count]; }));
  }

  function renderTabela(filtered) {
    contagemEl.textContent = filtered.length + (filtered.length === 1 ? ' instrumento' : ' instrumentos');

    var ordenado = filtered.slice().sort(function (a, b) {
      var av = a[state.sortKey], bv = b[state.sortKey];
      if (av === null || av === undefined) av = state.sortKey === 'restante_dias' ? 1e9 : '';
      if (bv === null || bv === undefined) bv = state.sortKey === 'restante_dias' ? 1e9 : '';
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return -1 * state.sortDir;
      if (av > bv) return 1 * state.sortDir;
      return 0;
    });

    var linhas = ordenado.slice(0, 60);
    tbody.innerHTML = linhas.map(function (r) {
      var bucket = bucketPrazo(r.restante_dias);
      var cor = PRAZO_COR[bucket] || COR_PADRAO;
      var objeto = r.objeto || '';
      return '<tr>' +
        '<td class="num">' + escapeHtml(instrumentoLabel(r)) + '</td>' +
        '<td>' + escapeHtml(r.credor || 'Sem informação') + '</td>' +
        '<td class="objeto" title="' + escapeHtml(objeto) + '">' + escapeHtml(objeto.length > 90 ? objeto.slice(0, 90) + '…' : objeto) + '</td>' +
        '<td>' + escapeHtml(r.setor_demandante || 'Sem informação') + '</td>' +
        '<td>' + escapeHtml(r.tipo_instrumento || 'Sem informação') + '</td>' +
        '<td class="num">' + fmtDate(r.termino) + '</td>' +
        '<td><span class="status-pill" style="background:' + cor + '22; color:' + cor + '">' + (r.restante_dias != null ? r.restante_dias + 'd' : '—') + '</span></td>' +
        '<td>' + escapeHtml(r.fiscal_tecnico || 'Sem informação') + '</td>' +
        '</tr>';
    }).join('');

    if (ordenado.length > 60) {
      notaEl.hidden = false;
      notaEl.textContent = 'Mostrando 60 de ' + ordenado.length + ' instrumentos — refine os filtros para ver mais.';
    } else {
      notaEl.hidden = true;
    }
  }

  function render() {
    var filtered = getFiltered();
    renderKpis(filtered);
    renderPrazoChart(filtered);
    renderSetorChart(filtered);
    renderCategoriaChart(filtered);
    renderNaturezaChart(filtered);
    renderTrimestreChart(filtered);
    renderTabela(filtered);
    var temFiltro = state.search || state.setor || state.tipo || state.natureza || state.prazo;
    limparBtn.hidden = !temFiltro;
  }

  function exportarCsv() {
    var filtered = getFiltered();
    var headers = ['Instrumento', 'Tipo', 'Credor', 'CNPJ', 'Objeto', 'Natureza', 'Forma de contratação', 'Licitação', 'Setor demandante', 'Início', 'Término', 'Dias restantes', 'Valor global atualizado', 'Valor executado', '% executado', 'Estratégico', 'Gestor', 'Fiscal demandante', 'Fiscal técnico', 'Protocolo'];
    var esc = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\n/g, ' ') + '"'; };
    var linhas = filtered.map(function (r) {
      return [instrumentoLabel(r), r.tipo_instrumento, r.credor, r.cnpj, r.objeto, r.natureza, r.forma_contratacao, r.licitacao, r.setor_demandante, r.inicio, r.termino, r.restante_dias, r.valor_global_atualizado, r.valor_executado, r.pct_executado, r.estrategico, r.gestor, r.fiscal_demandante, r.fiscal_tecnico, r.protocolo].map(esc).join(';');
    });
    var csv = [headers.map(esc).join(';')].concat(linhas).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'contratos_vigentes_filtrado.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function buscarDadosAoVivo() {
    if (!CONVENIOS_N8N_URL || CONVENIOS_N8N_URL.indexOf('SEU-N8N') !== -1) {
      setSyncStatus('local', 'Dados: instantâneo local (webhook n8n não configurado)');
      return;
    }
    setSyncStatus('loading', 'Buscando atualização…');
    fetch(CONVENIOS_N8N_URL, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (Array.isArray(json) && json.length) {
          state.data = json;
          popularFiltros();
          render();
          setSyncStatus('live', 'Dados ao vivo (n8n, atualização diária)');
        } else {
          throw new Error('payload vazio');
        }
      })
      .catch(function () {
        setSyncStatus('error', 'Endpoint n8n indisponível — usando instantâneo local');
      });
  }

  popularFiltros();
  render();
  buscarDadosAoVivo();

  buscaInput.addEventListener('input', function () { state.search = buscaInput.value; render(); });
  fSetor.addEventListener('change', function () { state.setor = fSetor.value; render(); });
  fTipo.addEventListener('change', function () { state.tipo = fTipo.value; render(); });
  fNatureza.addEventListener('change', function () { state.natureza = fNatureza.value; render(); });
  fPrazo.addEventListener('change', function () { state.prazo = fPrazo.value; render(); });
  limparBtn.addEventListener('click', function () {
    state.search = ''; state.setor = ''; state.tipo = ''; state.natureza = ''; state.prazo = '';
    buscaInput.value = ''; fSetor.value = ''; fTipo.value = ''; fNatureza.value = ''; fPrazo.value = '';
    render();
  });
  exportarBtn.addEventListener('click', exportarCsv);
  atualizarBtn.addEventListener('click', buscarDadosAoVivo);

  document.querySelectorAll('.convenios-tabela th[data-key]').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-key');
      if (state.sortKey === k) state.sortDir *= -1; else { state.sortKey = k; state.sortDir = 1; }
      renderTabela(getFiltered());
    });
  });
})();
