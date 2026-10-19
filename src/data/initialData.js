// Dados iniciais e estruturas para o Taresk

export const DEFAULT_USER_PLATFORMS = [
  { id: 'plat_shopee_1', name: 'Shopee', color: '#f97316' },
  { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
  { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
  { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
];

export const INITIAL_PLATFORMS = [
  { id: 'plat_shopee', name: 'Shopee', color: '#f97316', description: 'Marketplace Shopee Brasil' },
  { id: 'plat_ml', name: 'Mercado Livre', color: '#facc15', description: 'Mercado Livre Oficial & Filiais' },
  { id: 'plat_amazon', name: 'Amazon', color: '#334155', description: 'Amazon Seller Central' },
  { id: 'plat_magalu', name: 'Magalu', color: '#38bdf8', description: 'Magazine Luiza Marketplace' },
  { id: 'plat_shein', name: 'Shein', color: '#000000', description: 'Shein Marketplace' },
  { id: 'plat_tiktok', name: 'TikTok Shop', color: '#ff004f', description: 'TikTok E-commerce' }
];

export const INITIAL_USERS = [
  {
    id: 'user_master',
    name: 'JBC Eletro (Admin)',
    email: 'eletrojbc@gmail.com',
    password: 'Jbc29378125@',
    role: 'premium_admin',
    avatar: '⚡',
    badge: 'Administrador Premium',
    platforms: [
      { id: 'plat_shopee_1', name: 'Shopee Principal', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Loja 2', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ]
  },
  {
    id: 'user_colab_1',
    name: 'Mariana Souza',
    email: 'mariana@jbceletro.com',
    password: '123',
    role: 'operator',
    avatar: '👩‍💻',
    badge: 'Especialista em Catálogo',
    platforms: [
      { id: 'plat_shopee_1', name: 'Shopee Oficial', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Secundária', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ]
  },
  {
    id: 'user_colab_2',
    name: 'Carlos Oliveira',
    email: 'carlos@jbceletro.com',
    password: '123',
    role: 'operator',
    avatar: '👨‍🔧',
    badge: 'Mídia & Imagens',
    platforms: [
      { id: 'plat_shopee_1', name: 'Shopee', color: '#f97316' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' }
    ]
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    sku: 'FOG-02-BOC',
    title: 'Fogão 2 Bocas Alta Pressão Inox',
    cost: 145.00,
    width: 32, // cm
    length: 54, // cm
    height: 18, // cm
    weight: 4.80 // kg
  },
  {
    id: 'p2',
    sku: 'PAN-ELE-05L',
    title: 'Panela Elétrica Multifunção 5L Inox',
    cost: 120.00,
    width: 30,
    length: 30,
    height: 35,
    weight: 3.50
  },
  {
    id: 'p3',
    sku: 'VENT-COL-40',
    title: 'Ventilador Coluna 40cm Turbo Silencioso',
    cost: 89.90,
    width: 45,
    length: 45,
    height: 130,
    weight: 5.20
  },
  {
    id: 'p4',
    sku: 'FRIT-AIR-4L',
    title: 'Fritadeira Air Fryer 4L Digital Preto',
    cost: 185.00,
    width: 33,
    length: 33,
    height: 38,
    weight: 4.60
  }
];

export const DEFAULT_CHECKLIST_ITEMS = [
  'Foto de Capa Ambientada 1 IA Pura',
  'Foto de Capa Ambientada 2 IA Realista',
  'Descrição 1',
  'Foto Ambientada outro Contexto',
  'Sem Fundo Crua',
  'Medidas',
  'Outro Ângulo',
  'Descrição 2',
  'Descrição 3'
];

export const INITIAL_TASKS = [
  {
    id: 'task_1',
    type: 'product_catalog', // 'product_catalog' ou 'special'
    productId: 'p1',
    title: 'Fogão 2 Bocas Alta Pressão Inox',
    assignedTo: 'user_colab_1',
    assignedByName: 'JBC Eletro (Admin)',
    createdById: 'user_master',
    dueDate: '25/10',
    status: 'in_progress', // 'in_progress', 'completed'
    marketplaces: {
      shopee: { status: 'published', active: true, u: true, o: true },
      mercadoLivre: { status: 'published', active: true, u: true, o: true },
      amazon: { status: 'published', active: true, u: true, o: true },
      magalu: { status: 'pending', active: false, u: false, o: false }
    },
    checklist: DEFAULT_CHECKLIST_ITEMS.map((item, idx) => ({
      id: `chk_${idx}`,
      label: item,
      completed: idx < 6 // 6 itens já feitos
    })),
    notes: 'Priorizar fotos ambientadas com IA para a campanha de fim de mês.'
  },
  {
    id: 'task_2',
    type: 'special',
    productId: null,
    title: 'Fazer Vídeo do Fogão 2 Bocas',
    assignedTo: 'user_colab_2',
    assignedByName: 'JBC Eletro (Admin)',
    createdById: 'user_master',
    dueDate: '22/10',
    status: 'in_progress',
    checklist: [
      { id: 'sp_1', label: 'Roteiro de unboxing e demonstração das chamas', completed: true },
      { id: 'sp_2', label: 'Gravação em alta definição no estúdio', completed: true },
      { id: 'sp_3', label: 'Edição formato Reels/Shorts 9:16 com legendas', completed: false },
      { id: 'sp_4', label: 'Upload no canal e link nos anúncios Mercado Livre e Shopee', completed: false }
    ],
    notes: 'Focar na pressão dos queimadores e robustez dos botões.'
  },
  {
    id: 'task_3',
    type: 'product_catalog',
    productId: 'p2',
    title: 'Panela Elétrica Multifunção 5L Inox',
    assignedTo: 'user_master',
    assignedByName: 'JBC Eletro (Admin)',
    createdById: 'user_master',
    dueDate: '28/10',
    status: 'pending',
    marketplaces: {
      shopee: { status: 'pending', active: false, u: false, o: false },
      mercadoLivre: { status: 'pending', active: false, u: false, o: false },
      amazon: { status: 'pending', active: false, u: false, o: false },
      magalu: { status: 'pending', active: false, u: false, o: false }
    },
    checklist: DEFAULT_CHECKLIST_ITEMS.map((item, idx) => ({
      id: `chk_${idx}`,
      label: item,
      completed: false
    })),
    notes: 'Novo lote chegando do fornecedor.'
  },
  {
    id: 'task_4',
    type: 'product_catalog',
    productId: 'p3',
    title: 'Ventilador Coluna 40cm Turbo Silencioso',
    assignedTo: 'user_colab_1',
    assignedByName: 'Mariana Souza',
    createdById: 'user_colab_1',
    dueDate: '30/10',
    status: 'in_progress',
    marketplaces: {
      shopee: { status: 'published', active: true, u: true, o: true },
      mercadoLivre: { status: 'published', active: true, u: true, o: true },
      amazon: { status: 'published', active: true, u: true, o: true },
      magalu: { status: 'published', active: true, u: true, o: true }
    },
    checklist: DEFAULT_CHECKLIST_ITEMS.map((item, idx) => ({
      id: `chk_${idx}`,
      label: item,
      completed: true
    })),
    notes: 'Criada pela própria colaboradora para revisão sazonal de verão.'
  }
];

// Configurações padrão de canais para a calculadora precificadora
export const DEFAULT_PRICING_CONFIGS = {
  shopee: {
    name: 'Shopee',
    color: '#ee4d2d',
    lightBg: '#fef3f0',
    textColor: '#ffffff',
    defaultCommissionRate: 20.0, // 20% taxa Shopee padrão com frete grátis
    fixedFee: 4.00, // taxa fixa por item
    defaultShippingCost: 0 // normalmente embutido ou bancado na comissão de frete
  },
  mercadoLivre: {
    name: 'Mercado L',
    color: '#ffe600',
    lightBg: '#fffde7',
    textColor: '#1a1a1a',
    defaultCommissionRate: 16.5, // 16.5% no Premium
    fixedFee: 6.50, // taxa fixa abaixo de 79 ou custo fixo
    defaultShippingCost: 22.90 // frete grátis obrigatório > R$79
  },
  amazon: {
    name: 'Amazon',
    color: '#232f3e',
    lightBg: '#f3f4f6',
    textColor: '#ffffff',
    defaultCommissionRate: 15.0, // 15% categoria eletrodomésticos
    fixedFee: 0,
    defaultShippingCost: 19.50
  },
  magalu: {
    name: 'Magalu',
    color: '#0086ff',
    lightBg: '#e8f3ff',
    textColor: '#ffffff',
    defaultCommissionRate: 16.0, // 16% Magalu
    fixedFee: 3.00,
    defaultShippingCost: 21.00
  }
};
