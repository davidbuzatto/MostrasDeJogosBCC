/**
 * Sistema de votação — Mostra de Jogos ORI 2026.
 *
 * Lógica principal: carregamento de candidatos, votação, persistência
 * em localStorage e painel administrativo.
 *
 * @author Prof. Dr. David Buzatto
 */

// configuração
const SENHA_ADMIN  = "orin2026";
const STORAGE_KEY  = "mostra_jogos_2026_votos";
const PONTOS       = { primeiro: 10, segundo: 5, terceiro: 2 };

const BADGE_CLASSES = { primeiro: "badge-1", segundo: "badge-2", terceiro: "badge-3" };
const BADGE_LABELS  = { primeiro: "🥇",      segundo: "🥈",      terceiro: "🥉"      };
const BTN_CLASSES   = { primeiro: "ativo-1", segundo: "ativo-2", terceiro: "ativo-3"  };
const CARD_CLASSES  = { primeiro: "selecionado-1", segundo: "selecionado-2", terceiro: "selecionado-3" };

// dados
let candidatos = [];
let votoAtual  = { primeiro: null, segundo: null, terceiro: null };

// telas
let telaVotacao;
let telaAdminLogin;
let telaAdminPainel;

// votação
let gradeJogos;
let bannerSucesso;
let btnConfirmar;
let resumoVoto;

// modal de ajuda
let modalAjuda;
let btnAjuda;

// admin — login
let formLogin;
let inputSenha;
let erroSenha;
let btnCancelarLogin;

// admin — painel
let btnSairAdmin;
let adminStats;
let btnResetar;
let btnAdminAcesso;

// ===== navegação entre telas =====

function mostrarTela( tela ) {
    [ telaVotacao, telaAdminLogin, telaAdminPainel ].forEach( t => t.classList.remove( "ativa" ) );
    tela.classList.add( "ativa" );
}

// ===== localstorage =====

function carregarVotos() {
    try {
        return JSON.parse( localStorage.getItem( STORAGE_KEY ) ) || [];
    } catch {
        return [];
    }
}

function salvarVoto( voto ) {
    let votos = carregarVotos();
    votos.push( voto );
    localStorage.setItem( STORAGE_KEY, JSON.stringify( votos ) );
}

function resetarVotos() {
    localStorage.removeItem( STORAGE_KEY );
}

// ===== renderização dos cards =====

function renderizarCandidatos() {

    gradeJogos.innerHTML = "";

    candidatos.forEach( c => {

        let card = document.createElement( "div" );
        card.className = "card";
        card.dataset.id = c.id;

        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${c.imagem}" alt="Screenshot de ${c.nome}" loading="lazy" />
                <div class="card-badge" id="badge-${c.id}" hidden></div>
            </div>
            <div class="card-body">
                <div class="card-nome">${c.nome}</div>
                <div class="card-devs">${c.desenvolvedores}</div>
            </div>
            <div class="card-botoes">
                <button class="btn-posicao" data-id="${c.id}" data-pos="primeiro">🥇 1º</button>
                <button class="btn-posicao" data-id="${c.id}" data-pos="segundo">🥈 2º</button>
                <button class="btn-posicao" data-id="${c.id}" data-pos="terceiro">🥉 3º</button>
            </div>
        `;

        gradeJogos.appendChild( card );

    });

}

// ===== lógica de votação =====

function handleVotoBotao( id, posicao ) {

    let outrasPosicoes = Object.keys( votoAtual ).filter( p => p !== posicao );

    // se este jogo já está nessa posição, deseleciona
    if ( votoAtual[ posicao ] === id ) {
        votoAtual[ posicao ] = null;
    } else {
        // se este jogo já está em outra posição, libera aquela posição
        outrasPosicoes.forEach( p => {
            if ( votoAtual[ p ] === id ) votoAtual[ p ] = null;
        });
        votoAtual[ posicao ] = id;
    }

    atualizarUI();

}

function atualizarUI() {

    // limpa todos os estados visuais
    document.querySelectorAll( ".card" ).forEach( card => {
        card.className = "card";
        let badge = card.querySelector( ".card-badge" );
        badge.hidden = true;
        badge.className = "card-badge";
        badge.textContent = "";
    });

    document.querySelectorAll( ".btn-posicao" ).forEach( btn => {
        btn.className = "btn-posicao";
        btn.disabled = false;
    });

    // aplica estados ativos
    Object.entries( votoAtual ).forEach( ( [ posicao, id ] ) => {

        if ( id === null ) return;

        let card = document.querySelector( `.card[data-id="${id}"]` );
        if ( !card ) return;

        card.classList.add( CARD_CLASSES[ posicao ] );

        let badge = card.querySelector( ".card-badge" );
        badge.hidden = false;
        badge.className = `card-badge ${BADGE_CLASSES[ posicao ]}`;
        badge.textContent = BADGE_LABELS[ posicao ];

        let btn = card.querySelector( `.btn-posicao[data-pos="${posicao}"]` );
        btn.classList.add( BTN_CLASSES[ posicao ] );

    });

    // desabilita botões de posições já ocupadas em outros cards
    Object.entries( votoAtual ).forEach( ( [ posicao, idOcupado ] ) => {
        if ( idOcupado === null ) return;
        document.querySelectorAll( `.btn-posicao[data-pos="${posicao}"]` ).forEach( btn => {
            if ( Number( btn.dataset.id ) !== idOcupado ) btn.disabled = true;
        });
    });

    atualizarResumo();

    let completo = Object.values( votoAtual ).every( v => v !== null );
    btnConfirmar.disabled = !completo;

}

function atualizarResumo() {

    let posicoes = [
        { pos: "primeiro", label: "1º Lugar", emoji: "🥇" },
        { pos: "segundo",  label: "2º Lugar", emoji: "🥈" },
        { pos: "terceiro", label: "3º Lugar", emoji: "🥉" }
    ];

    let algumSelecionado = Object.values( votoAtual ).some( v => v !== null );

    if ( !algumSelecionado ) {
        resumoVoto.innerHTML = "<span class=\"resumo-vazio\">Selecione seus 3 jogos favoritos acima.</span>";
        return;
    }

    resumoVoto.innerHTML = posicoes.map( ( { pos, label, emoji } ) => {
        let id   = votoAtual[ pos ];
        let nome = id ? ( candidatos.find( c => c.id === id )?.nome ?? "—" ) : "—";
        return `<div class="resumo-item">
            <span class="resumo-medalha">${emoji}</span>
            <span><strong>${label}:</strong> ${nome}</span>
        </div>`;
    }).join( "" );

}

// ===== confirmação do voto =====

function confirmarVoto() {
    salvarVoto( { ...votoAtual } );
    votoAtual = { primeiro: null, segundo: null, terceiro: null };
    embaralhar( candidatos );
    renderizarCandidatos();
    atualizarUI();
    window.scrollTo( { top: 0, behavior: "smooth" } );
    mostrarToast( "✅ Voto computado! Obrigado pela sua participação." );
}

function mostrarToast( mensagem ) {
    bannerSucesso.textContent = mensagem;
    bannerSucesso.classList.add( "visivel" );
    setTimeout( () => bannerSucesso.classList.remove( "visivel" ), 3500 );
}

// ===== modal de ajuda =====

function abrirModal() {
    modalAjuda.hidden = false;
    document.body.style.overflow = "hidden";
}

function fecharModal() {
    modalAjuda.hidden = true;
    document.body.style.overflow = "";
}

// ===== admin — login =====

function abrirTelaLogin() {
    inputSenha.value = "";
    erroSenha.hidden = true;
    mostrarTela( telaAdminLogin );
    setTimeout( () => inputSenha.focus(), 100 );
}

function tentarLogin( event ) {
    event.preventDefault();
    if ( inputSenha.value === SENHA_ADMIN ) {
        erroSenha.hidden = true;
        inputSenha.value = "";
        renderizarStats();
        mostrarTela( telaAdminPainel );
    } else {
        erroSenha.hidden = false;
        inputSenha.value = "";
        inputSenha.focus();
    }
}

// ===== admin — estatísticas =====

function calcularStats() {

    let votos  = carregarVotos();
    let totais = {};

    candidatos.forEach( c => {
        totais[ c.id ] = { pontos: 0, primeiro: 0, segundo: 0, terceiro: 0 };
    });

    votos.forEach( v => {
        if ( v.primeiro  && totais[ v.primeiro  ] ) { totais[ v.primeiro  ].pontos += PONTOS.primeiro;  totais[ v.primeiro  ].primeiro++;  }
        if ( v.segundo   && totais[ v.segundo   ] ) { totais[ v.segundo   ].pontos += PONTOS.segundo;   totais[ v.segundo   ].segundo++;   }
        if ( v.terceiro  && totais[ v.terceiro  ] ) { totais[ v.terceiro  ].pontos += PONTOS.terceiro;  totais[ v.terceiro  ].terceiro++;  }
    });

    return { totais: totais, totalVotos: votos.length };

}

function renderizarStats() {

    let { totais, totalVotos } = calcularStats();
    let maxPontos = Math.max( ...Object.values( totais ).map( t => t.pontos ), 1 );

    let ranking = candidatos
        .map( c => ( { ...c, ...totais[ c.id ] } ) )
        .sort( ( a, b ) => b.pontos - a.pontos );

    let medalhas = [ "🥇", "🥈", "🥉" ];

    adminStats.innerHTML = `
        <div class="stats-header">
            <h3>Ranking</h3>
            <span class="stats-total">${totalVotos} voto${ totalVotos !== 1 ? "s" : "" } registrado${ totalVotos !== 1 ? "s" : "" }</span>
        </div>
        ${ ranking.map( ( c, i ) => `
            <div class="stat-card">
                <div class="stat-posicao">${ medalhas[ i ] ?? ( i + 1 ) + "º" }</div>
                <div class="stat-info">
                    <div class="stat-nome">${c.nome}</div>
                    <div class="stat-devs">${c.desenvolvedores}</div>
                    <div class="stat-detalhe">🥇 ${c.primeiro}× · 🥈 ${c.segundo}× · 🥉 ${c.terceiro}×</div>
                    <div class="barra-wrap">
                        <div class="barra" style="width: ${ maxPontos > 0 ? Math.round( ( c.pontos / maxPontos ) * 100 ) : 0 }%"></div>
                    </div>
                </div>
                <div class="stat-pontos-wrap">
                    <div class="stat-pontos">${c.pontos}</div>
                    <div class="stat-pontos-label">pts</div>
                </div>
            </div>
        ` ).join( "" ) }
    `;

}

// ===== admin — reset =====

function resetarVotacao() {
    if ( confirm( "Tem certeza que deseja apagar todos os votos? Esta ação não pode ser desfeita." ) ) {
        resetarVotos();
        renderizarStats();
    }
}

// ===== embaralhamento (Fisher-Yates) =====

function embaralhar( arr ) {
    for ( let i = arr.length - 1; i > 0; i-- ) {
        let j = Math.floor( Math.random() * ( i + 1 ) );
        [ arr[ i ], arr[ j ] ] = [ arr[ j ], arr[ i ] ];
    }
    return arr;
}

// ===== inicialização =====

async function init() {

    // telas
    telaVotacao     = document.getElementById( "tela-votacao" );
    telaAdminLogin  = document.getElementById( "tela-admin-login" );
    telaAdminPainel = document.getElementById( "tela-admin-painel" );

    // votação
    gradeJogos    = document.getElementById( "grade-jogos" );
    bannerSucesso = document.getElementById( "banner-sucesso" );
    btnConfirmar  = document.getElementById( "btn-confirmar" );
    resumoVoto    = document.getElementById( "resumo-voto" );

    // modal de ajuda
    modalAjuda = document.getElementById( "modal-ajuda" );
    btnAjuda   = document.getElementById( "btn-ajuda" );

    // admin — login
    formLogin        = document.getElementById( "form-login" );
    inputSenha       = document.getElementById( "input-senha" );
    erroSenha        = document.getElementById( "erro-senha" );
    btnCancelarLogin = document.getElementById( "btn-cancelar-login" );

    // admin — painel
    btnAdminAcesso = document.getElementById( "btn-admin-acesso" );
    btnSairAdmin   = document.getElementById( "btn-sair-admin" );
    adminStats     = document.getElementById( "admin-stats" );
    btnResetar     = document.getElementById( "btn-resetar" );

    // eventos — votação
    btnConfirmar.addEventListener( "click", confirmarVoto );

    gradeJogos.addEventListener( "click", event => {
        let btn = event.target.closest( ".btn-posicao" );
        if ( !btn || btn.disabled ) return;
        handleVotoBotao( Number( btn.dataset.id ), btn.dataset.pos );
    });

    // eventos — modal de ajuda
    btnAjuda.addEventListener( "click", abrirModal );
    document.getElementById( "btn-fechar-modal" ).addEventListener( "click", fecharModal );
    document.getElementById( "btn-fechar-modal-2" ).addEventListener( "click", fecharModal );
    modalAjuda.addEventListener( "click", event => {
        if ( event.target === modalAjuda ) fecharModal();
    });
    document.addEventListener( "keydown", event => {
        if ( event.key === "Escape" && !modalAjuda.hidden ) fecharModal();
    });

    // eventos — admin
    btnAdminAcesso.addEventListener( "click", abrirTelaLogin );
    formLogin.addEventListener( "submit", tentarLogin );
    btnCancelarLogin.addEventListener( "click", () => {
        embaralhar( candidatos );
        renderizarCandidatos();
        atualizarUI();
        mostrarTela( telaVotacao );
    });

    btnSairAdmin.addEventListener( "click", () => {
        embaralhar( candidatos );
        renderizarCandidatos();
        atualizarUI();
        mostrarTela( telaVotacao );
    });
    btnResetar.addEventListener( "click", resetarVotacao );

    // carrega candidatos e monta a grade
    try {
        let resp = await fetch( "candidatos.json" );
        candidatos = embaralhar( await resp.json() );
        renderizarCandidatos();
        atualizarResumo();
    } catch ( err ) {
        gradeJogos.innerHTML = "<p style=\"color:red;padding:2rem;\">Erro ao carregar candidatos.json</p>";
        console.error( err );
    }

}

init();
