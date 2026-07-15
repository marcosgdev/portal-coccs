(function(){
  var root = document.documentElement;
  var scale = 1;
  document.getElementById('btn-font-mais').addEventListener('click', function(){
    scale = Math.min(scale + 0.1, 1.4);
    root.style.setProperty('--font-scale', scale);
  });
  document.getElementById('btn-font-menos').addEventListener('click', function(){
    scale = Math.max(scale - 0.1, 0.85);
    root.style.setProperty('--font-scale', scale);
  });
  var contrasteBtn = document.getElementById('btn-contraste');
  contrasteBtn.addEventListener('click', function(){
    var ativo = root.getAttribute('data-contraste') === 'alto';
    root.setAttribute('data-contraste', ativo ? 'normal' : 'alto');
    contrasteBtn.setAttribute('aria-pressed', String(!ativo));
  });

  var modoEscuroBtn = document.getElementById('btn-modo-escuro');
  var temaSalvo = localStorage.getItem('tema');
  if (temaSalvo === 'escuro' || temaSalvo === 'claro') {
    root.setAttribute('data-tema', temaSalvo);
  }
  function temaEfetivoEscuro(){
    var atual = root.getAttribute('data-tema');
    if (atual === 'escuro') return true;
    if (atual === 'claro') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  modoEscuroBtn.setAttribute('aria-pressed', String(temaEfetivoEscuro()));
  modoEscuroBtn.addEventListener('click', function(){
    var novoEscuro = !temaEfetivoEscuro();
    var novoTema = novoEscuro ? 'escuro' : 'claro';
    root.setAttribute('data-tema', novoTema);
    localStorage.setItem('tema', novoTema);
    modoEscuroBtn.setAttribute('aria-pressed', String(novoEscuro));
  });
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('menu-principal');
  var headerPrincipal = document.querySelector('header.principal');

  function fecharMenu(){
    menu.classList.remove('aberto');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu de navegação');
  }
  function abrirMenu(){
    menu.classList.add('aberto');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu de navegação');
  }
  menuToggle.addEventListener('click', function(){
    if (menu.classList.contains('aberto')) fecharMenu(); else abrirMenu();
  });
  menu.addEventListener('click', function(e){
    if (e.target.tagName === 'A') fecharMenu();
  });
  document.addEventListener('click', function(e){
    if (menu.classList.contains('aberto') && !menu.contains(e.target) && !menuToggle.contains(e.target)) {
      fecharMenu();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menu.classList.contains('aberto')) {
      fecharMenu();
      menuToggle.focus();
    }
  });

  // Header encolhe ao rolar, pra dar mais destaque de conteúdo e reforçar a navegação fixa.
  if (headerPrincipal){
    var aplicarEncolhido = function(){
      headerPrincipal.classList.toggle('encolhido', window.scrollY > 40);
    };
    aplicarEncolhido();
    window.addEventListener('scroll', aplicarEncolhido, { passive: true });
  }

  // Scroll-spy: destaca no menu o item da seção atualmente visível.
  var linksMenu = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var secoesMenu = linksMenu
    .map(function(a){ return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && secoesMenu.length){
    var observerMenu = new IntersectionObserver(function(entradas){
      entradas.forEach(function(entrada){
        if (!entrada.isIntersecting) return;
        var link = menu.querySelector('a[href="#' + entrada.target.id + '"]');
        if (!link) return;
        linksMenu.forEach(function(l){ l.classList.remove('ativo'); });
        link.classList.add('ativo');
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    secoesMenu.forEach(function(s){ observerMenu.observe(s); });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroSection = document.querySelector('.hero');
  var heroBg = document.querySelector('.hero-bg');
  var heroVisual = document.querySelector('.hero-visual');
  if (!reduceMotion && heroSection && (heroBg || heroVisual)) {
    var ticking = false;
    function atualizarParallax(){
      var rect = heroSection.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var scrollNoHero = Math.max(0, -rect.top);
        if (heroBg) heroBg.style.transform = 'translateY(' + (scrollNoHero * 0.35) + 'px)';
        if (heroVisual) heroVisual.style.transform = 'translateY(' + (scrollNoHero * 0.12) + 'px)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if (!ticking) {
        window.requestAnimationFrame(atualizarParallax);
        ticking = true;
      }
    }, { passive: true });
  }
})();

(function(){
  var busca = document.getElementById('normativos-pesquisa');
  var lista = document.getElementById('normativos-lista-busca');
  var vazio = document.getElementById('normativos-vazio');
  var contagem = document.getElementById('normativos-contagem');
  if (!busca || !lista) return;
  var itens = Array.prototype.slice.call(lista.querySelectorAll('li'));
  function atualizar(){
    var q = busca.value.trim().toLowerCase();
    var visiveis = 0;
    itens.forEach(function(li){
      var ok = !q || (li.getAttribute('data-texto') || '').indexOf(q) !== -1;
      li.hidden = !ok;
      if (ok) visiveis++;
    });
    if (vazio) vazio.hidden = visiveis !== 0;
    if (contagem) contagem.textContent = visiveis + (visiveis === 1 ? ' normativo' : ' normativos');
  }
  busca.addEventListener('input', atualizar);
  atualizar();
})();

(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var logoBg = document.querySelector('.logo-giro-bg');
  if (reduceMotion || !logoBg) return;

  var ticking = false;
  function atualizarGiro(){
    var scrollY = window.scrollY || window.pageYOffset;
    var rotY = scrollY * 0.15;
    var rotX = Math.sin(scrollY * 0.002) * 10;
    logoBg.style.transform =
      'translate(-50%, -50%) perspective(1200px) rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg)';
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking) {
      window.requestAnimationFrame(atualizarGiro);
      ticking = true;
    }
  }, { passive: true });
  atualizarGiro();
})();

(function(){
  var aniversariantes = [
    { nome:"Alcina Mara de Sousa Pessoa", email:"alcina.pessoa@tjpa.jus.br", dia:15, mes:1 },
    { nome:"Cristiane de Sousa Lima", email:"cristiane.lima@tjpa.jus.br", dia:11, mes:1 },
    { nome:"Luana Gondim da Serra Silva", email:"luana.serra@tjpa.jus.br", dia:16, mes:1 },
    { nome:"Regiane Maria Pereira dos Santos", email:"regiane.santos@tjpa.jus.br", dia:24, mes:1 },
    { nome:"Taiana Marina Souza Ladeira", email:"taiana.ladeira@tjpa.jus.br", dia:8, mes:2 },
    { nome:"Manoela de Azevedo Pinheiro Lopes", email:"manoela.lopes@tjpa.jus.br", dia:23, mes:2 },
    { nome:"Marcos Vinícius Galvão de Encarnação", email:"vinicius.encarnacao@tjpa.jus.br", dia:3, mes:4 },
    { nome:"Gabriel Lamego Pereira", email:"gabriel.pereira@tjpa.jus.br", dia:15, mes:4 },
    { nome:"Andreza Etheene Cavalcante Moura", email:"andreza.moura@tjpa.jus.br", dia:4, mes:5 },
    { nome:"Luciano Santa Brígida das Neves", email:"luciano.neves@tjpa.jus.br", dia:1, mes:6 },
    { nome:"Jonas Américo Alves Duarte", email:"jonas.duarte@tjpa.jus.br", dia:3, mes:6 },
    { nome:"Lorena Penin Bastos Botelho", email:"lorena.bastos@tjpa.jus.br", dia:7, mes:6 },
    { nome:"Expedito dos Santos Ferreira", email:"expedito.ferreira@tjpa.jus.br", dia:9, mes:6 },
    { nome:"Helen Rose da Silva Saraiva Almeida", email:"helen.rose@tjpa.jus.br", dia:14, mes:6 },
    { nome:"Ricardo da Silva Lacerda", email:"ricardo.lacerda@tjpa.jus.br", dia:7, mes:7 },
    { nome:"Ana Cláudia Reis Gomes", email:"ana.gomes@tjpa.jus.br", dia:5, mes:8 },
    { nome:"Brunna Ferreira da Silva", email:"brunna.silva@tjpa.jus.br", dia:8, mes:8 },
    { nome:"Lenne Chaves Pinto da Silva Torres", email:"lenne.tores@tjpa.jus.br", dia:29, mes:8 },
    { nome:"Rosângela Vieira dos Santos", email:"rosangela.vieira@tjpa.jus.br", dia:2, mes:9 },
    { nome:"Ana Marcela Santos de Souza", email:"ana.msouza@tjpa.jus.br", dia:9, mes:9 },
    { nome:"Rodrigo Augusto do Amaral Alcântara", email:"rodrigo.alcantara@tjpa.jus.br", dia:8, mes:9 },
    { nome:"Enderson Clayson Gonçalves Silva", email:"enderson.silva@tjpa.jus.br", dia:17, mes:9 },
    { nome:"Lorena Larisse de Araújo Rego", email:"lorena.rego@tjpa.jus.br", dia:19, mes:9 },
    { nome:"Rafaela Martins Prazeres", email:"rafaela.prazeres@tjpa.jus.br", dia:20, mes:9 },
    { nome:"Zaiana Fonseca Teixeira", email:"zaiana.teixeira@tjpa.jus.br", dia:6, mes:10 },
    { nome:"Muiracatiara Miranda Chagas", email:"muiracatiara.chagas@tjpa.jus.br", dia:12, mes:10 },
    { nome:"Gleycilene Wenny Gama Santiago", email:"gleycilene.santiago@tjpa.jus.br", dia:23, mes:10 },
    { nome:"Vladimila Pereira Machado", email:"vladimila.machado@tjpa.jus.br", dia:27, mes:10 },
    { nome:"Amanda Caroline Pinheiro dos Santos", email:"amanda.pinheiro@tjpa.jus.br", dia:3, mes:11 },
    { nome:"Sidalia Souza do Amaral", email:"sidalia.amaral@tjpa.jus.br", dia:21, mes:11 },
    { nome:"Daniele Dias Marques", email:"daniele.marques@tjpa.jus.br", dia:5, mes:12 },
    { nome:"Carolina Nogueira Costa", email:"carolina.costa@tjpa.jus.br", dia:7, mes:12 },
    { nome:"Almir Alessandro Marinho Pinheiro", email:"almir.pinheiro@tjpa.jus.br", dia:22, mes:1 },
    { nome:"Ely Pinheiro de Sousa", email:"ely.sousa@tjpa.jus.br", dia:8, mes:6 },
    { nome:"Maria José Campelo Costa", email:"maria.campelo@tjpa.jus.br", dia:6, mes:5 },
    { nome:"Antônio Birajara Alves da Silva", email:"alves.silva@tjpa.jus.br", dia:25, mes:1 },
    { nome:"Afonso Teixeira Noura Neto", email:"afonso.teixeira@tjpa.jus.br", dia:27, mes:6 },
    { nome:"Elielza Carneiro do Nascimento Maués", email:"elielza.maues@tjpa.jus.br", dia:21, mes:6 },
    { nome:"Lucas Prestes Rocha", email:"lucas.procha@tjpa.jus.br", dia:8, mes:6 }
  ];
  var meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var grid = document.getElementById('aniversarios-grid');
  var tabs = document.querySelectorAll('.mes-tab');
  if (!grid || !tabs.length) return;

  var hoje = new Date();
  var mesAtual = hoje.getMonth() + 1;
  var diaAtual = hoje.getDate();

  function iniciais(nome){
    var partes = nome.trim().split(/\s+/);
    var primeira = partes[0].charAt(0);
    var ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (primeira + ultima).toUpperCase();
  }

  function escapeHtml(texto){
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  function renderMes(mes){
    var lista = aniversariantes
      .filter(function(p){ return p.mes === mes; })
      .sort(function(a, b){ return a.dia - b.dia; });

    grid.innerHTML = '';
    if (lista.length === 0) {
      var vazio = document.createElement('p');
      vazio.className = 'aniversarios-vazio';
      vazio.textContent = 'Nenhum aniversariante em ' + meses[mes - 1] + '.';
      grid.appendChild(vazio);
      return;
    }
    lista.forEach(function(p){
      var ehHoje = (mes === mesAtual && p.dia === diaAtual);
      var card = document.createElement('div');
      card.className = 'aniversario-card' + (ehHoje ? ' hoje' : '');
      card.innerHTML =
        (ehHoje ? '<span class="selo-hoje">Hoje 🎉</span>' : '') +
        '<div class="aniversario-avatar" aria-hidden="true">' + escapeHtml(iniciais(p.nome)) + '</div>' +
        '<div class="aniversario-info">' +
          '<span class="data">' + String(p.dia).padStart(2, '0') + ' de ' + meses[mes - 1] + '</span>' +
          '<strong>' + escapeHtml(p.nome) + '</strong>' +
          '<a href="mailto:' + p.email + '">' + escapeHtml(p.email) + '</a>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function selecionarMes(mes){
    tabs.forEach(function(tab){
      tab.setAttribute('aria-selected', String(Number(tab.getAttribute('data-mes')) === mes));
    });
    renderMes(mes);
  }

  tabs.forEach(function(tab){
    var mes = Number(tab.getAttribute('data-mes'));
    if (aniversariantes.some(function(p){ return p.mes === mes; })) {
      var bolinha = document.createElement('span');
      bolinha.className = 'bolinha';
      bolinha.setAttribute('aria-hidden', 'true');
      tab.appendChild(bolinha);
    }
    tab.addEventListener('click', function(){ selecionarMes(mes); });
  });

  selecionarMes(mesAtual);
})();
