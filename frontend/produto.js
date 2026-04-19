const PRODUTOS = [
  
  {
    id: 'foto-001',
    tipo: 'avulsa',
    nome: 'Pôr do Sol na Praia',
    preco: 18.00,
    preview: 'img/foto1.jpeg',
    arquivo: 'foto1.jpeg',
  },

  {
    id: 'foto-002',
    tipo: 'avulsa',
    nome: 'Pôr do Sol na Praia 2',
    preco: 20.00,
    preview: 'img/foto2.jpeg',
    arquivo: 'foto2.jpeg',
  },

  {
    id: 'foto-003',
    tipo: 'avulsa',
    nome: 'Pôr do Sol na Praia com Salva-vidas',
    preco: 17.00,
    preview: 'img/foto3.jpeg',
    arquivo: 'foto3.jpeg',
  },

  {
    id: 'foto-004',
    tipo: 'avulsa',
    nome: 'Pôr do Sol no Riacho',
    preco: 22.00,
    preview: 'img/foto4.jpeg',
    arquivo: 'foto4.jpeg',
  },

  {
    id: 'foto-005',
    tipo: 'avulsa',
    nome: 'Sentado na Pedra',
    preco: 25.00,
    preview: 'img/foto5.jpeg',
    arquivo: 'foto5.jpeg',
  },

  {
    id: 'foto-006',
    tipo: 'avulsa',
    nome: 'Olhar Aguçado',
    preco: 25.00,
    preview: 'img/foto6.jpeg',
    arquivo: 'foto6.jpeg',
  },

  {
    id: 'foto-007',
    tipo: 'avulsa',
    nome: 'Olhar Aguçado 2',
    preco: 22.00,
    preview: 'img/foto7.jpeg',
    arquivo: 'foto7.jpeg',
  },

  {
    id: 'foto-008',
    tipo: 'avulsa',
    nome: 'Olhar de Longe',
    preco: 20.00,
    preview: 'img/foto8.jpeg',
    arquivo: 'foto8.jpeg',
},
{
    id: 'foto-009',
    tipo: 'avulsa',
    nome: 'Olhar Observador',
    preco: 20.00,
    preview: 'img/foto9.jpeg',
    arquivo: 'foto9.jpeg',
},
{
    id: 'foto-010',
    tipo: 'avulsa',
    nome: 'Surf do Dog',
    preco: 20.00,
    preview: 'img/foto10.jpeg',
    arquivo: 'foto10.jpeg',
},
{
    id: 'foto-011',
    tipo: 'avulsa',
    nome: 'Apreciação do Horizonte',
    preco: 20.00,
    preview: 'img/foto11.jpeg',
    arquivo: 'foto11.jpeg',
},

  {
    id: 'foto-012',
    tipo: 'avulsa',
    nome: 'Miss Universo',
    preco: 1.00,
    preview: 'img/foto12.jpeg',
    arquivo: 'foto12.jpeg',
  },

];

// ── DESCONTOS PROGRESSIVOS ────────────────────────────────────
const DESCONTOS = [
  { minFotos: 5, percentual: 20, label: '5+ fotos = 20% off' },
  { minFotos: 3, percentual: 10, label: '3+ fotos = 10% off' },
  { minFotos: 1, percentual: 0,  label: ''                   },
];

function calcularDesconto(qtdFotos) {
  return DESCONTOS.find(d => qtdFotos >= d.minFotos) || DESCONTOS[2];
}