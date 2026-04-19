// ============================================================
// APP.JS — Carrinho com desconto progressivo
// ============================================================

let carrinho = [];       // lista de produtos no carrinho
let paymentId = null;
let verificacaoInterval;

// ── Renderiza os cards ───────────────────────────────────────
function renderizarProdutos() {
  const grade = document.getElementById('grade-produtos');
  grade.innerHTML = '';

  PRODUTOS.forEach(produto => {
    const noCarrinho = carrinho.some(i => i.id === produto.id);
    const card = document.createElement('div');
    card.className = `card ${noCarrinho ? 'no-carrinho' : ''}`;
    card.id = `card-${produto.id}`;

    card.innerHTML = `
      <div class="card-imagem">
        <img src="${produto.preview}" alt="${produto.nome}" loading="lazy"/>
        <div class="card-check">✓</div>
      </div>
      <div class="card-info">
        <h3>${produto.nome}</h3>
        <div class="card-rodape">
          <span class="card-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
          <button class="btn-adicionar" onclick="toggleCarrinho('${produto.id}')">
            ${noCarrinho ? '✓ Adicionado' : '+ Carrinho'}
          </button>
        </div>
      </div>
    `;
    grade.appendChild(card);
  });
}

// ── Adiciona ou remove do carrinho ──────────────────────────
function toggleCarrinho(id) {
  const produto = PRODUTOS.find(p => p.id === id);
  const index   = carrinho.findIndex(i => i.id === id);

  if (index === -1) {
    carrinho.push(produto);
  } else {
    carrinho.splice(index, 1);
  }

  atualizarContador();
  renderizarProdutos();
}

// ── Atualiza o número no ícone do carrinho ──────────────────
function atualizarContador() {
  document.getElementById('carrinho-count').textContent = carrinho.length;
}

// ── Calcula totais com desconto ──────────────────────────────
function calcularTotais() {
  const subtotal  = carrinho.reduce((s, p) => s + p.preco, 0);
  const desconto  = calcularDesconto(carrinho.length);
  const valorDesc = subtotal * (desconto.percentual / 100);
  const total     = subtotal - valorDesc;
  return { subtotal, desconto, valorDesc, total };
}

// ── Abre o carrinho ──────────────────────────────────────────
function abrirCarrinho() {
  const { subtotal, desconto, valorDesc, total } = calcularTotais();

  // Vazio ou com itens
  const vazio  = document.getElementById('carrinho-vazio');
  const itens  = document.getElementById('carrinho-itens');
  const resumo = document.getElementById('carrinho-resumo');

  if (carrinho.length === 0) {
    vazio.style.display  = 'flex';
    itens.style.display  = 'none';
    resumo.classList.add('escondido');
  } else {
    vazio.style.display  = 'none';
    itens.style.display  = 'flex';
    resumo.classList.remove('escondido');

    // Renderiza itens do carrinho
    itens.innerHTML = carrinho.map(p => `
      <div class="carrinho-item">
        <img src="${p.preview}" alt="${p.nome}"/>
        <div class="item-info">
          <span>${p.nome}</span>
          <small>R$ ${p.preco.toFixed(2).replace('.', ',')}</small>
        </div>
        <button class="btn-remover" onclick="removerItem('${p.id}')">🗑</button>
      </div>
    `).join('');

    // Subtotal
    document.getElementById('resumo-subtotal').textContent =
      `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

    // Desconto
    const linhaDesc = document.getElementById('resumo-desconto-linha');
    if (desconto.percentual > 0) {
      linhaDesc.classList.remove('escondido');
      document.getElementById('resumo-desconto-label').textContent =
        `Desconto (${desconto.percentual}%):`;
      document.getElementById('resumo-desconto-valor').textContent =
        `- R$ ${valorDesc.toFixed(2).replace('.', ',')}`;
    } else {
      linhaDesc.classList.add('escondido');
    }

    // Total
    document.getElementById('resumo-total').textContent =
      `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  document.getElementById('modal-carrinho').classList.remove('escondido');
  document.getElementById('overlay').classList.remove('escondido');
}

// ── Remove item do carrinho ──────────────────────────────────
function removerItem(id) {
  carrinho = carrinho.filter(p => p.id !== id);
  atualizarContador();
  renderizarProdutos();
  abrirCarrinho(); // atualiza o modal
}

// ── Inicia pagamento ─────────────────────────────────────────
async function iniciarPagamento() {
  const email = document.getElementById('email-comprador').value.trim();

  if (!email || !email.includes('@')) {
    alert('Por favor, informe um e-mail válido.');
    return;
  }

  const { total } = calcularTotais();
  const btn = document.getElementById('btn-pagar');
  btn.textContent = '⏳ Gerando Pix...';
  btn.disabled = true;

  try {
    const resposta = await fetch('/api/criar-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
       itens: carrinho.map(p => ({ id: p.id, nome: p.nome, preco: p.preco, arquivo: p.arquivo })),
        total,
        emailComprador: email,
      }),
    });

    if (!resposta.ok) throw new Error('Erro ao criar cobrança');
    const cobranca = await resposta.json();
    paymentId = cobranca.id;

    document.getElementById('qrcode').innerHTML =
      `<img src="data:image/png;base64,${cobranca.qrCodeBase64}"
            style="width:200px;height:200px;" alt="QR Code"/>`;
    document.getElementById('codigo-pix-texto').textContent = cobranca.qrCode;
    document.getElementById('valor-pix-texto').textContent =
      `R$ ${total.toFixed(2).replace('.', ',')}`;

    document.getElementById('modal-carrinho').classList.add('escondido');
    document.getElementById('modal-pix').classList.remove('escondido');
    document.getElementById('status-pagamento').className = 'status-aguardando';
    document.getElementById('status-pagamento').textContent = '⏳ Aguardando pagamento...';

    iniciarVerificacao(email);

  } catch (erro) {
    alert('Erro ao gerar o Pix. Verifique o servidor e tente novamente.');
    console.error(erro);
  } finally {
    btn.textContent = 'Pagar com Pix';
    btn.disabled = false;
  }
}

// ── Verifica status ──────────────────────────────────────────
function iniciarVerificacao(email) {
  verificacaoInterval = setInterval(async () => {
    if (!paymentId) return;
    try {
      const r = await fetch(`/api/status/${paymentId}`);
      const d = await r.json();
      if (d.status === 'approved') {
        clearInterval(verificacaoInterval);
        pagamentoAprovado(email, d.linkDownload);
      }
    } catch(e) { console.error(e); }
  }, 5000);
}

// ── Pagamento aprovado ───────────────────────────────────────
function pagamentoAprovado(email, linkDownload) {
  carrinho = [];
  atualizarContador();
  renderizarProdutos();

  document.getElementById('status-pagamento').className = 'status-aprovado';
  document.getElementById('status-pagamento').innerHTML = `
    Pagamento confirmado!<br/>
    <a href="${linkDownload}" download
       style="color:#00d4aa;font-weight:bold;display:inline-block;margin-top:0.5rem">
      Clique aqui para baixar suas fotos
    </a><br/>
    <small style="color:#888;font-size:0.8rem">Link enviado para ${email}</small>
  `;
}

// ── Copiar Pix ───────────────────────────────────────────────
function copiarPix() {
  navigator.clipboard.writeText(
    document.getElementById('codigo-pix-texto').textContent
  ).then(() => {
    document.getElementById('mensagem-copiado').classList.remove('escondido');
    setTimeout(() =>
      document.getElementById('mensagem-copiado').classList.add('escondido'), 3000);
  });
}

// ── Fechar modais ────────────────────────────────────────────
function fecharCarrinho() {
  document.getElementById('modal-carrinho').classList.add('escondido');
  document.getElementById('overlay').classList.add('escondido');
}
function fecharPix() {
  clearInterval(verificacaoInterval);
  document.getElementById('modal-pix').classList.add('escondido');
  document.getElementById('overlay').classList.add('escondido');
}
function fecharTudo() { fecharCarrinho(); fecharPix(); }

// ── Inicia ───────────────────────────────────────────────────
renderizarProdutos();