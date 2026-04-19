require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const { criarCobrancaPix, consultarPagamento } = require('./pagamento');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const pagamentos = {};

// ── POST /api/criar-pix ──────────────────────────────────────
app.post('/api/criar-pix', async (req, res) => {
  const { itens, total, emailComprador } = req.body;

  if (!itens || !emailComprador || !total) {
    return res.status(400).json({ erro: 'itens, total e emailComprador são obrigatórios' });
  }

  try {
    const descricao = itens.length === 1
      ? itens[0].nome
      : `${itens.length} fotos - Minha Loja`;

    console.log(`\n🛒 Nova compra: ${descricao} — R$${total} — ${emailComprador}`);

    const cobranca = await criarCobrancaPix({
      valor: total,
      descricao,
      emailComprador,
    });

    // Salva os itens comprados para gerar o zip depois
    pagamentos[cobranca.id] = {
      itens,
      emailComprador,
      status: 'pending',
    };

    res.json(cobranca);

  } catch (erro) {
    console.error('Erro:', erro.message);
    res.status(500).json({ erro: erro.message });
  }
});

// ── GET /api/status/:id ──────────────────────────────────────
app.get('/api/status/:id', async (req, res) => {
  try {
    const dados = await consultarPagamento(req.params.id);

    if (dados.status === 'approved' && pagamentos[req.params.id]) {
      const pagamento = pagamentos[req.params.id];
      pagamento.status = 'approved';

      if (!pagamento.tokenDownload) {
        pagamento.tokenDownload = crypto.randomBytes(32).toString('hex');
        console.log(`✅ Pagamento aprovado! Token: ${pagamento.tokenDownload}`);
      }

      return res.json({
        ...dados,
        linkDownload: `/download/${pagamento.tokenDownload}`,
      });
    }

    res.json(dados);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── GET /download/:token ─────────────────────────────────────
app.get('/download/:token', (req, res) => {
  const pagamento = Object.values(pagamentos).find(
    p => p.tokenDownload === req.params.token && p.status === 'approved'
  );

  if (!pagamento) return res.status(403).send('Link inválido ou expirado.');

  // Se só tem 1 foto
  if (pagamento.itens.length === 1) {
    const arquivo = pagamento.itens[0].arquivo; // 👈 usa o campo arquivo do produto
    const caminho = path.join(__dirname, '../downloads', arquivo);
    console.log(`📥 Tentando baixar: ${caminho}`);
    if (!fs.existsSync(caminho)) {
      console.log('❌ Arquivo não encontrado!');
      return res.status(404).send('Arquivo não encontrado.');
    }
    return res.download(caminho);
  }

  // Se tem várias fotos — por enquanto entrega a primeira
  const arquivo = pagamento.itens[0].arquivo;
  const caminho = path.join(__dirname, '../downloads', arquivo);
  if (!fs.existsSync(caminho)) return res.status(404).send('Arquivo não encontrado.');
  res.download(caminho);
});

// ── POST /api/webhook ────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
  const { type, data } = req.body;
  if (type === 'payment') {
    const pag = await consultarPagamento(data.id);
    if (pag.status === 'approved' && pagamentos[data.id]) {
      pagamentos[data.id].status = 'approved';
      console.log(`Webhook: pagamento ${data.id} aprovado!`);
    }
  }
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});