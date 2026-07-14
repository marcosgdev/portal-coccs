(function () {
  var grid = document.getElementById('parcerias-kpis');
  if (!grid) return;

  var state = {
    data: PARCERIAS_DATA,
    search: '',
    demandante: '',
    status: '',
    tipo: '',
    instr: ''
  };

  var syncPill = document.getElementById('parcerias-sync-status');
  var atualizarBtn = document.getElementById('parcerias-atualizar');
  var buscaInput = document.getElementById('parcerias-busca');
  var fDemandante = document.getElementById('parcerias-f-demandante');
  var fStatus = document.getElementById('parcerias-f-status');
  var fTipo = document.getElementById('parcerias-f-tipo');
  var fInstr = document.getElementById('parcerias-f-instr');
  var limparBtn = document.getElementById('parcerias-limpar');
  var contagemEl = document.getElementById('parcerias-contagem');
  var tbody = document.getElementById('parcerias-tbody');
  var notaEl = document.getElementById('parcerias-nota');
  var graficoSub = document.getElementById('parcerias-grafico-sub');
  var legendaEl = document.getElementById('parcerias-legenda');
  var graficoEl = document.getElementById('parcerias-grafico');
  var exportarBtn = document.getElementById('parcerias-exportar');

  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  function setSyncStatus(tipo, texto) {
    syncPill.textContent = texto;
    syncPill.setAttribute('data-status', tipo);
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
    fillSelect(fDemandante, uniqueSorted(state.data, 'demandante'), 'Todos os demandantes');
    fillSelect(fStatus, uniqueSorted(state.data, 'status'), 'Todas as etapas');
    fillSelect(fTipo, uniqueSorted(state.data, 'tipo'), 'Todos os tipos');
    fillSelect(fInstr, uniqueSorted(state.data, 'tipoInstr'), 'Todos os instrumentos');
  }

  function getFiltered() {
    var q = state.search.trim().toLowerCase();
    return state.data.filter(function (r) {
      if (state.demandante && r.demandante !== state.demandante) return false;
      if (state.status && r.status !== state.status) return false;
      if (state.tipo && r.tipo !== state.tipo) return false;
      if (state.instr && r.tipoInstr !== state.instr) return false;
      if (q) {
        var hay = ((r.objeto || '') + ' ' + (r.partes || '') + ' ' + (r.processo || '') + ' ' + (r.demandante || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderKpis(filtered) {
    var total = filtered.length;
    var finalizados = filtered.filter(function (r) { return r.grupo === 'Finalizado'; }).length;
    var diligencia = filtered.filter(function (r) { return r.grupo === 'Diligência'; }).length;
    var assinatura = filtered.filter(function (r) { return r.grupo === 'Assinatura'; }).length;
    var externo = filtered.filter(function (r) { return r.tipo === 'Externo'; }).length;
    var urgentes = filtered.filter(function (r) { return r.urgente; }).length;
    var pct = function (n) { return total ? ((n / total) * 100).toFixed(0) : '0'; };

    var tiles = [
      {
        num: total, label: 'Parcerias no filtro atual',
        cenario: 'Dimensionar o volume total de parcerias e convênios monitorados pela COCCS, considerando os filtros aplicados.',
        considerados: 'Todos os processos da base que atendem aos filtros de demandante, etapa, tipo, instrumento e busca atualmente selecionados.',
        excluidos: 'Nenhum — soma bruta de todas as linhas que passam pelos filtros atuais.'
      },
      {
        num: finalizados + ' (' + pct(finalizados) + '%)', label: 'Finalizadas',
        cenario: 'Medir quantas parcerias já concluíram seu ciclo de tramitação.',
        considerados: 'Processos cuja etapa está classificada como "Finalizado".',
        excluidos: 'Processos em planejamento, diligência, parecer/autorização ou assinatura, e processos sem etapa informada.'
      },
      {
        num: diligencia + ' (' + pct(diligencia) + '%)', label: 'Em diligência / instrução',
        cenario: 'Acompanhar o volume de processos atualmente em fase de instrução ou diligência junto às unidades.',
        considerados: 'Processos cuja etapa está classificada como "Diligência".',
        excluidos: 'Processos em qualquer outra etapa do ciclo de tramitação.'
      },
      {
        num: assinatura + ' (' + pct(assinatura) + '%)', label: 'Aguardando assinatura',
        cenario: 'Identificar quantas parcerias estão na fase final, aguardando formalização do instrumento.',
        considerados: 'Processos cuja etapa está classificada como "Assinatura".',
        excluidos: 'Processos em outras etapas do ciclo de tramitação.'
      },
      {
        num: externo + ' (' + pct(externo) + '%)', label: 'Parcerias externas',
        cenario: 'Dimensionar o volume de parcerias firmadas com órgãos ou entidades externas ao TJPA.',
        considerados: 'Processos marcados com tipo "Externo".',
        excluidos: 'Processos internos e processos sem informação de tipo.'
      },
      {
        num: urgentes, label: 'Marcadas como urgentes',
        cenario: 'Sinalizar processos que exigem atenção prioritária da equipe da Coordenadoria.',
        considerados: 'Processos com o campo "urgente" marcado como verdadeiro na base de origem.',
        excluidos: 'Processos sem essa marcação.'
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

  function renderLegenda() {
    legendaEl.innerHTML = PARCERIAS_GRUPO_ORDEM.map(function (g) {
      return '<span><span class="amostra" style="background:' + PARCERIAS_GRUPO_COLOR[g] + '"></span>' + escapeHtml(g) + '</span>';
    }).join('');
  }

  function renderGrafico(filtered) {
    graficoSub.textContent = filtered.length + ' processos no filtro atual · top 8 demandantes';

    var totals = {};
    filtered.forEach(function (r) {
      var d = r.demandante || 'Sem informação';
      totals[d] = (totals[d] || 0) + 1;
    });
    var top = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).slice(0, 8);

    if (!top.length) {
      graficoEl.innerHTML = '<p style="color:var(--tinta-suave); font-size:0.88rem;">Nenhum processo para exibir com os filtros atuais.</p>';
      return;
    }

    var maxTotal = Math.max.apply(null, top.map(function (d) { return totals[d]; }));

    graficoEl.innerHTML = top.map(function (d) {
      var porGrupo = {};
      filtered.forEach(function (r) {
        if ((r.demandante || 'Sem informação') === d) {
          porGrupo[r.grupo] = (porGrupo[r.grupo] || 0) + 1;
        }
      });
      var larguraTotal = (totals[d] / maxTotal) * 100;
      var segs = PARCERIAS_GRUPO_ORDEM.filter(function (g) { return porGrupo[g] > 0; }).map(function (g) {
        var largura = (porGrupo[g] / totals[d]) * 100;
        return '<div class="parcerias-bar-seg" data-tooltip="' + escapeHtml(g) + ': ' + porGrupo[g] + '" tabindex="0" ' +
          'style="width:' + largura + '%; background:' + PARCERIAS_GRUPO_COLOR[g] + '">' + porGrupo[g] + '</div>';
      }).join('');
      return '<div class="parcerias-bar-row">' +
        '<span class="rotulo" title="' + escapeHtml(d) + '">' + escapeHtml(d) + '</span>' +
        '<div class="parcerias-bar-track"><div style="display:flex; width:' + larguraTotal + '%; height:100%;">' + segs + '</div></div>' +
        '<span class="total">' + totals[d] + '</span>' +
        '</div>';
    }).join('');
  }

  function renderTabela(filtered) {
    contagemEl.textContent = filtered.length + (filtered.length === 1 ? ' processo' : ' processos');

    var linhas = filtered.slice(0, 60);
    tbody.innerHTML = linhas.map(function (r) {
      var cor = PARCERIAS_GRUPO_COLOR[r.grupo] || '#898781';
      return '<tr>' +
        '<td class="num">' + (r.urgente ? '<span class="urgente-marca" title="Urgente"></span>' : '') + (r.ordem != null ? r.ordem : '—') + '</td>' +
        '<td class="num">' + escapeHtml(r.dataRec || '—') + '</td>' +
        '<td class="objeto">' + escapeHtml(r.objeto) + '</td>' +
        '<td>' + escapeHtml(r.demandante) + '</td>' +
        '<td><span class="status-pill" style="background:' + cor + '22; color:' + cor + '">' + escapeHtml(r.status) + '</span></td>' +
        '<td>' + escapeHtml(r.tipo) + '</td>' +
        '</tr>';
    }).join('');

    if (filtered.length > 60) {
      notaEl.hidden = false;
      notaEl.textContent = 'Mostrando 60 de ' + filtered.length + ' processos — refine os filtros para ver mais.';
    } else {
      notaEl.hidden = true;
    }
  }

  function render() {
    var filtered = getFiltered();
    renderKpis(filtered);
    renderGrafico(filtered);
    renderTabela(filtered);
    var temFiltro = state.search || state.demandante || state.status || state.tipo || state.instr;
    limparBtn.hidden = !temFiltro;
  }

  function exportarCsv() {
    var filtered = getFiltered();
    var headers = ['Ordem', 'Data recebimento', 'Processo', 'Objeto', 'Partes', 'Demandante', 'Status', 'Tipo', 'Tipo de instrumento', 'Urgente', 'Andamento'];
    var esc = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\n/g, ' ') + '"'; };
    var linhas = filtered.map(function (r) {
      return [r.ordem, r.dataRec, r.processo, r.objeto, r.partes, r.demandante, r.status, r.tipo, r.tipoInstr, r.urgente ? 'Sim' : 'Não', r.andamento].map(esc).join(';');
    });
    var csv = [headers.map(esc).join(';')].concat(linhas).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'parcerias_coccs_filtrado.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function buscarDadosAoVivo() {
    if (!PARCERIAS_N8N_URL || PARCERIAS_N8N_URL.indexOf('SEU-N8N') !== -1) {
      setSyncStatus('local', 'Dados: instantâneo local (webhook n8n não configurado)');
      return;
    }
    setSyncStatus('loading', 'Buscando atualização…');
    fetch(PARCERIAS_N8N_URL, { cache: 'no-store' })
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
  renderLegenda();
  render();
  buscarDadosAoVivo();

  buscaInput.addEventListener('input', function () { state.search = buscaInput.value; render(); });
  fDemandante.addEventListener('change', function () { state.demandante = fDemandante.value; render(); });
  fStatus.addEventListener('change', function () { state.status = fStatus.value; render(); });
  fTipo.addEventListener('change', function () { state.tipo = fTipo.value; render(); });
  fInstr.addEventListener('change', function () { state.instr = fInstr.value; render(); });
  limparBtn.addEventListener('click', function () {
    state.search = ''; state.demandante = ''; state.status = ''; state.tipo = ''; state.instr = '';
    buscaInput.value = ''; fDemandante.value = ''; fStatus.value = ''; fTipo.value = ''; fInstr.value = '';
    render();
  });
  exportarBtn.addEventListener('click', exportarCsv);
  atualizarBtn.addEventListener('click', buscarDadosAoVivo);
})();
