import React, { useState, useEffect, useMemo } from 'react';
import { Check, CheckCircle2, RotateCcw, ShieldCheck, ArrowUpDown, ChevronDown, RefreshCw, Eye, EyeOff, Search, Calendar, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';
import { SheetsApi } from '../services/sheetsApi';

// Cores de tag por plataforma no padrão Taresk
function getPlatformTagStyle(platName = '') {
  const p = String(platName).toLowerCase();
  if (p.includes('shopee')) {
    return { bg: '#fff7ed', color: '#ea580c', border: '#fdba74' };
  }
  if (p.includes('mercado') || p.includes('ml')) {
    return { bg: '#fefce8', color: '#ca8a04', border: '#fde047' };
  }
  if (p.includes('amazon')) {
    return { bg: '#f8fafc', color: '#334155', border: '#cbd5e1' };
  }
  if (p.includes('magalu')) {
    return { bg: '#f0f9ff', color: '#0284c7', border: '#7dd3fc' };
  }
  if (p.includes('face')) {
    return { bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' };
  }
  return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
}

// Regra de cores de margem idêntica à Precificadora:
// < 10%: Vermelho (#fee2e2 / #b91c1c)
// 10% a 15%: Amarelo (#fef3c7 / #b45309)
// >= 15%: Verde (#dcfce7 / #15803d)
function getMarginBadgeStyle(marginVal) {
  let num = 0;
  if (typeof marginVal === 'number') {
    num = marginVal <= 1 && marginVal >= -1 && marginVal !== 0 ? marginVal * 100 : marginVal;
  } else {
    const clean = String(marginVal || '').replace('%', '').replace(',', '.').trim();
    num = parseFloat(clean) || 0;
  }

  const rounded = Math.round(num * 10) / 10;

  if (rounded < 10) {
    return {
      bg: '#fee2e2',
      border: '#fca5a5',
      color: '#b91c1c',
      formatted: `${rounded.toFixed(2).replace('.', ',')}%`
    };
  } else if (rounded < 15) {
    return {
      bg: '#fef3c7',
      border: '#fcd34d',
      color: '#b45309',
      formatted: `${rounded.toFixed(2).replace('.', ',')}%`
    };
  } else {
    return {
      bg: '#dcfce7',
      border: '#86efac',
      color: '#15803d',
      formatted: `${rounded.toFixed(2).replace('.', ',')}%`
    };
  }
}

// Formatação monetária BRL
function formatBrl(val) {
  if (val === null || val === undefined || val === '') return 'R$ 0,00';
  if (typeof val === 'number') {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  const str = String(val).trim();
  if (str === '-') return '-';
  if (str.startsWith('R$')) return str;
  const num = parseFloat(str.replace(/[^0-9,-.]/g, '').replace(',', '.'));
  if (isNaN(num)) return str;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ConciliacaoView({
  users = [],
  platforms = []
}) {
  // Controle de subaba: apenas 'checklist'
  const [activeSubTab, setActiveSubTab] = useState('checklist');

  // Mês selecionado (padrão 'Nov 26')
  const [selectedMonth, setSelectedMonth] = useState('Nov 26');
  const [availableMonths, setAvailableMonths] = useState(['Nov 26', 'Dez 26', 'Jan 27']);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);

  // Dados financeiros vindos da planilha
  const [financialData, setFinancialData] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_financial_cache_nov26');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Mock inicial fiel aos dados da Foto 1 e Foto 2 (para renderização instantânea)
    return {
      resumo: [
        { plataforma: 'Facebook', margem: '26,69%', faturamento: 'R$ 37.511,00', descontos: '-', recebido: 'R$ 10.010,00', lucroBruto: 'R$ 10.010,00', comissao: '-', lucroLiquido: 'R$ 10.010,00', qtd: 0 },
        { plataforma: 'Mercado L JBC', margem: '6,21%', faturamento: 'R$ 32.342,92', descontos: 'R$ 1.595,13', recebido: 'R$ 21.132,97', lucroBruto: 'R$ 2.676,84', comissao: 'R$ 669,21', lucroLiquido: 'R$ 2.007,63', qtd: 178 },
        { plataforma: 'Mercado L Jere', margem: '5,06%', faturamento: 'R$ 27.178,30', descontos: 'R$ 723,92', recebido: 'R$ 17.552,28', lucroBruto: 'R$ 1.833,86', comissao: 'R$ 458,46', lucroLiquido: 'R$ 1.375,39', qtd: 59 },
        { plataforma: 'Mercado L Izabela', margem: '-16,27%', faturamento: 'R$ 9.720,88', descontos: 'R$ 1.957,04', recebido: 'R$ 6.289,25', lucroBruto: '-R$ 2.108,29', comissao: '-R$ 527,07', lucroLiquido: '-R$ 1.581,22', qtd: 30 },
        { plataforma: 'Shopee JBC', margem: '14,02%', faturamento: 'R$ 87.879,88', descontos: 'R$ 1.992,76', recebido: 'R$ 69.890,29', lucroBruto: 'R$ 16.423,03', comissao: 'R$ 4.105,76', lucroLiquido: 'R$ 12.317,27', qtd: 297 },
        { plataforma: 'Shopee Izabela', margem: '9,76%', faturamento: 'R$ 23.330,51', descontos: 'R$ 440,12', recebido: 'R$ 18.564,26', lucroBruto: 'R$ 3.036,64', comissao: 'R$ 759,16', lucroLiquido: 'R$ 2.277,48', qtd: 75 },
        { plataforma: 'Shopee Jere', margem: '8,80%', faturamento: 'R$ 5.520,28', descontos: 'R$ 76,29', recebido: 'R$ 4.243,18', lucroBruto: 'R$ 647,89', comissao: 'R$ 161,97', lucroLiquido: 'R$ 485,92', qtd: 13 },
        { plataforma: 'Shopee John', margem: '9,64%', faturamento: 'R$ 6.326,72', descontos: 'R$ 187,79', recebido: 'R$ 4.750,66', lucroBruto: 'R$ 812,87', comissao: 'R$ 203,22', lucroLiquido: 'R$ 609,66', qtd: 32 },
        { plataforma: 'Amazon JBC', margem: '10,93%', faturamento: 'R$ 17.225,87', descontos: 'R$ 334,49', recebido: 'R$ 12.711,46', lucroBruto: 'R$ 2.511,47', comissao: 'R$ 627,87', lucroLiquido: 'R$ 1.883,60', qtd: 57 },
        { plataforma: 'Amazon Allyson', margem: '10,99%', faturamento: 'R$ 4.711,80', descontos: 'R$ 164,31', recebido: 'R$ 3.552,67', lucroBruto: 'R$ 690,36', comissao: 'R$ 172,59', lucroLiquido: 'R$ 517,77', qtd: 28 },
        { plataforma: 'Amazon Jere', margem: '14,78%', faturamento: 'R$ 33.118,43', descontos: 'R$ 457,73', recebido: 'R$ 26.640,80', lucroBruto: 'R$ 6.525,07', comissao: 'R$ 1.631,27', lucroLiquido: 'R$ 4.893,80', qtd: 78 },
        { plataforma: 'Magalu JBC', margem: '5,22%', faturamento: 'R$ 3.269,50', descontos: 'R$ 29,34', recebido: 'R$ 2.034,89', lucroBruto: 'R$ 227,55', comissao: 'R$ 56,89', lucroLiquido: 'R$ 170,66', qtd: 5 },
        { plataforma: 'Magalu Jere', margem: '0,00%', faturamento: 'R$ 0,00', descontos: 'R$ 0,00', recebido: 'R$ 0,00', lucroBruto: 'R$ 0,00', comissao: 'R$ 0,00', lucroLiquido: 'R$ 0,00', qtd: 0 },
        { plataforma: 'TOTAL', margem: '8,14%', faturamento: 'R$ 288.136,09', descontos: 'R$ 7.958,92', recebido: 'R$ 197.372,71', lucroBruto: 'R$ 43.287,29', comissao: 'R$ 8.319,32', lucroLiquido: 'R$ 34.967,97', qtd: 852, isTotal: true }
      ],
      pedidos: [
        { id: 'ped_1', marketplace: 'Shopee JBC', unid: 1, produto: 'FG 2 Baby', preco: 'R$ 299,90', recebido: 'R$ 239,42', lucroBruto: 'R$ 71,42', comissao: 'R$ 17,86', lucroLiquido: 'R$ 53,57', pago: false, pedido: '261015N6E0C67E', situacao: '', entrega: 'Entrega Direta', margem: '17,86%' },
        { id: 'ped_2', marketplace: 'Shopee JBC', unid: 1, produto: 'Tampa Dobra', preco: 'R$ 41,90', recebido: 'R$ 36,53', lucroBruto: 'R$ 13,53', comissao: 'R$ 3,38', lucroLiquido: 'R$ 10,15', pago: false, pedido: '261014JJG3E8NH', situacao: '', entrega: 'Entrega Direta', margem: '24,22%' },
        { id: 'ped_3', marketplace: 'Shopee JBC', unid: 1, produto: 'Ester 2 Bules', preco: 'R$ 449,90', recebido: 'R$ 368,42', lucroBruto: 'R$ 88,42', comissao: 'R$ 22,11', lucroLiquido: 'R$ 66,32', pago: false, pedido: '261014JJ3RN2FN', situacao: '', entrega: 'Entrega Direta', margem: '14,74%' },
        { id: 'ped_4', marketplace: 'Shopee JBC', unid: 1, produto: 'Con + Espum', preco: 'R$ 49,90', recebido: 'R$ 34,93', lucroBruto: 'R$ 7,93', comissao: 'R$ 1,98', lucroLiquido: 'R$ 5,95', pago: false, pedido: '26101088GS7S3E', situacao: '', entrega: 'Shopee Xpress', margem: '11,92%' },
        { id: 'ped_5', marketplace: 'Shopee JBC', unid: 1, produto: 'ET 3 Band', preco: 'R$ 424,90', recebido: 'R$ 338,92', lucroBruto: 'R$ 119,92', comissao: 'R$ 29,98', lucroLiquido: 'R$ 89,94', pago: false, pedido: '261008394UMSK9', situacao: '', entrega: 'Shopee Xpress', margem: '21,17%' },
        { id: 'ped_6', marketplace: 'Shopee JBC', unid: 1, produto: 'ET 3 Band', preco: 'R$ 424,90', recebido: 'R$ 346,92', lucroBruto: 'R$ 127,92', comissao: 'R$ 31,98', lucroLiquido: 'R$ 95,94', pago: false, pedido: '2610070WTAPC7Y', situacao: '', entrega: 'Entrega Direta', margem: '22,58%' },
        { id: 'ped_7', marketplace: 'Shopee JBC', unid: 1, produto: 'FT 2 CUBAS 14L com Cabo', preco: 'R$ 529,90', recebido: 'R$ 429,22', lucroBruto: 'R$ 60,22', comissao: 'R$ 15,06', lucroLiquido: 'R$ 45,17', pago: false, pedido: '261006U9CSMPWB', situacao: '', entrega: 'Shopee Xpress', margem: '8,52%' },
        { id: 'ped_8', marketplace: 'Shopee JBC', unid: 1, produto: 'FG 2 SEN RISK', preco: 'R$ 389,90', recebido: 'R$ 308,82', lucroBruto: 'R$ 88,82', comissao: 'R$ 22,21', lucroLiquido: 'R$ 66,62', pago: false, pedido: '261006U51VJSME', situacao: '', entrega: 'Shopee Xpress', margem: '17,09%' },
        { id: 'ped_9', marketplace: 'Shopee JBC', unid: 1, produto: 'Espum', preco: 'R$ 26,90', recebido: 'R$ 16,53', lucroBruto: 'R$ 2,53', comissao: 'R$ 0,63', lucroLiquido: 'R$ 1,90', pago: false, pedido: '261005SBFWR01P', situacao: '', entrega: 'Shopee Xpress', margem: '7,05%' },
        { id: 'ped_10', marketplace: 'Shopee JBC', unid: 1, produto: 'ET 3 Band Gelo X', preco: 'R$ 469,90', recebido: 'R$ 377,62', lucroBruto: 'R$ 147,62', comissao: 'R$ 36,91', lucroLiquido: 'R$ 110,72', pago: false, pedido: '261004R1QH3K6A', situacao: '', entrega: 'Shopee Xpress', margem: '23,56%' },
        { id: 'ped_11', marketplace: 'Shopee JBC', unid: 1, produto: 'Con', preco: 'R$ 27,90', recebido: 'R$ 17,33', lucroBruto: 'R$ 3,33', comissao: 'R$ 0,83', lucroLiquido: 'R$ 2,50', pago: false, pedido: '261004QVOVYJ60', situacao: '', entrega: 'Shopee Xpress', margem: '8,95%' },
        { id: 'ped_12', marketplace: 'Shopee JBC', unid: 1, produto: 'FT 2 CUBAS 14L com Cabo', preco: 'R$ 529,90', recebido: 'R$ 429,22', lucroBruto: 'R$ 60,22', comissao: 'R$ 15,06', lucroLiquido: 'R$ 45,17', pago: false, pedido: '261003E16HUKVD', situacao: '', entrega: 'Shopee Xpress', margem: '8,52%' },
        { id: 'ped_13', marketplace: 'Shopee JBC', unid: 1, produto: 'Band P', preco: 'R$ 29,90', recebido: 'R$ 18,93', lucroBruto: 'R$ 2,93', comissao: 'R$ 0,73', lucroLiquido: 'R$ 2,20', pago: false, pedido: '261013HF44Y370', situacao: '', entrega: 'Shopee Xpress', margem: '7,35%' },
        { id: 'ped_14', marketplace: 'Shopee JBC', unid: 1, produto: 'Espum', preco: 'R$ 26,90', recebido: 'R$ 24,53', lucroBruto: 'R$ 10,53', comissao: 'R$ 2,63', lucroLiquido: 'R$ 7,90', pago: false, pedido: '261011AYBPJ53T', situacao: '', entrega: 'Entrega Direta', margem: '29,36%' },
        { id: 'ped_15', marketplace: 'Shopee JBC', unid: 1, produto: 'FG 6 ROA', preco: 'R$ 799,90', recebido: 'R$ 661,42', lucroBruto: 'R$ 111,42', comissao: 'R$ 27,86', lucroLiquido: 'R$ 83,57', pago: false, pedido: '2610108E76NNCQ', situacao: '', entrega: 'Shopee Xpress', margem: '10,45%' }
      ]
    };
  });

  // Filtros da subaba Pedidos
  const [pedidosSearch, setPedidosSearch] = useState('');
  const [pedidosMarketplaceFilter, setPedidosMarketplaceFilter] = useState('all');

  // Ordem e visibilidade personalizada das colunas na subaba Pedidos
  const DEFAULT_PEDIDOS_COLUMNS = [
    { id: 'marketplace', label: 'Marketplace', width: '160px', visible: true },
    { id: 'unid', label: 'Unid', width: '70px', align: 'center', visible: true },
    { id: 'produto', label: 'Produto', width: '220px', visible: true },
    { id: 'preco', label: 'Preço', width: '110px', align: 'right', visible: true },
    { id: 'recebido', label: 'Recebido', width: '110px', align: 'right', visible: true },
    { id: 'lucroBruto', label: 'Lucro Bruto', width: '120px', align: 'right', visible: true },
    { id: 'comissao', label: 'Comissão', width: '110px', align: 'right', visible: true },
    { id: 'lucroLiquido', label: 'Lucro Líq', width: '110px', align: 'right', visible: true },
    { id: 'pago', label: 'P', width: '60px', align: 'center', visible: true },
    { id: 'pedido', label: 'Pedido', width: '180px', visible: true },
    { id: 'situacao', label: 'Situação', width: '110px', visible: true },
    { id: 'entrega', label: 'Entrega', width: '150px', visible: true },
    { id: 'margem', label: 'Margem', width: '110px', align: 'center', visible: true }
  ];

  const [pedidosColumns, setPedidosColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_pedidos_col_order_v2') || localStorage.getItem('taresk_pedidos_col_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que todas as colunas padrão existam e tenham campo visible
          const merged = parsed.map(c => ({
            ...DEFAULT_PEDIDOS_COLUMNS.find(dc => dc.id === c.id) || {},
            ...c,
            visible: c.visible !== undefined ? c.visible : true
          }));
          // Adiciona colunas que possam faltar
          DEFAULT_PEDIDOS_COLUMNS.forEach(dc => {
            if (!merged.some(m => m.id === dc.id)) {
              merged.push({ ...dc, visible: true });
            }
          });
          return merged;
        }
      }
    } catch (e) {}
    return DEFAULT_PEDIDOS_COLUMNS;
  });

  const [isColumnOrganizerOpen, setIsColumnOrganizerOpen] = useState(false);

  // Mover coluna para a esquerda/cima (-1) ou direita/baixo (+1)
  const handleMoveColumn = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= pedidosColumns.length) return;
    const updated = [...pedidosColumns];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setPedidosColumns(updated);
    localStorage.setItem('taresk_pedidos_col_order_v2', JSON.stringify(updated));
  };

  // Alternar visibilidade de uma coluna (mostrar / ocultar)
  const handleToggleColumnVisibility = (colId) => {
    // Não permite ocultar todas as colunas (mantém pelo menos uma visível)
    const visibleCount = pedidosColumns.filter(c => c.visible !== false).length;
    const targetCol = pedidosColumns.find(c => c.id === colId);
    if (targetCol && targetCol.visible !== false && visibleCount <= 1) {
      alert('Pelo menos uma coluna deve permanecer visível.');
      return;
    }

    const updated = pedidosColumns.map(col => {
      if (col.id === colId) {
        return { ...col, visible: col.visible === false ? true : false };
      }
      return col;
    });
    setPedidosColumns(updated);
    localStorage.setItem('taresk_pedidos_col_order_v2', JSON.stringify(updated));
  };

  // Mostrar todas as colunas
  const handleShowAllColumns = () => {
    const updated = pedidosColumns.map(col => ({ ...col, visible: true }));
    setPedidosColumns(updated);
    localStorage.setItem('taresk_pedidos_col_order_v2', JSON.stringify(updated));
  };

  const handleResetColumnOrder = () => {
    setPedidosColumns(DEFAULT_PEDIDOS_COLUMNS);
    localStorage.removeItem('taresk_pedidos_col_order_v2');
    localStorage.removeItem('taresk_pedidos_col_order');
  };

  // Colunas atualmente visíveis para renderização da tabela
  const visiblePedidosColumns = useMemo(() => {
    return pedidosColumns.filter(col => col.visible !== false);
  }, [pedidosColumns]);

  // Carrega dados da planilha via SheetsApi
  const loadFinancialDataFromSheets = async (sheetName) => {
    setIsLoadingFinancial(true);
    try {
      // 1. Busca abas disponíveis
      const sheetsList = await SheetsApi.fetchFinancialSheets();
      if (Array.isArray(sheetsList) && sheetsList.length > 0) {
        setAvailableMonths(sheetsList);
      }

      // 2. Busca dados da aba selecionada
      const data = await SheetsApi.fetchFinancialData(sheetName);
      if (data && (Array.isArray(data.resumo) && data.resumo.length > 0 || Array.isArray(data.pedidos) && data.pedidos.length > 0)) {
        setFinancialData(prev => ({
          resumo: Array.isArray(data.resumo) && data.resumo.length > 0 ? data.resumo : prev.resumo,
          pedidos: Array.isArray(data.pedidos) && data.pedidos.length > 0 ? data.pedidos : prev.pedidos
        }));
        localStorage.setItem(`taresk_financial_cache_${sheetName.toLowerCase().replace(/\s+/g, '')}`, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Erro ao carregar dados financeiros:', e);
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  useEffect(() => {
    loadFinancialDataFromSheets(selectedMonth);
  }, [selectedMonth]);

  // Lista única de marketplaces para o filtro de Pedidos
  const availableMarketplaces = useMemo(() => {
    const set = new Set();
    (financialData.pedidos || []).forEach(p => {
      if (p.marketplace && p.marketplace.trim()) set.add(p.marketplace.trim());
    });
    return Array.from(set);
  }, [financialData.pedidos]);

  // Pedidos filtrados
  const filteredPedidos = useMemo(() => {
    return (financialData.pedidos || []).filter(item => {
      if (pedidosMarketplaceFilter !== 'all' && item.marketplace !== pedidosMarketplaceFilter) {
        return false;
      }
      if (pedidosSearch) {
        const q = pedidosSearch.toLowerCase().trim();
        const match =
          (item.produto || '').toLowerCase().includes(q) ||
          (item.pedido || '').toLowerCase().includes(q) ||
          (item.marketplace || '').toLowerCase().includes(q) ||
          (item.entrega || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [financialData.pedidos, pedidosMarketplaceFilter, pedidosSearch]);

  // ESTADO DA SUBABA CHECKLIST (Conciliação Clássica)
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_conciliacao_state');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('taresk_conciliacao_state', JSON.stringify(checklistState));
  }, [checklistState]);

  const handleToggle = (userKey, platKey, stepIndex) => {
    const key = `${userKey}__${platKey}`;
    setChecklistState(prev => {
      const current = prev[key] || [false, false, false, false];
      const updated = [...current];
      while (updated.length < 4) updated.push(false);
      updated[stepIndex] = !updated[stepIndex];
      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const getPlatformIcon = (platName = '') => {
    const lower = String(platName || '').toLowerCase();
    if (lower.includes('shopee')) return { src: './icon_shopee.png', alt: 'Shopee' };
    if (lower.includes('mercado') || lower.includes('ml')) return { src: './icon_mercadolivre.png', alt: 'Mercado Livre' };
    if (lower.includes('amazon')) return { src: './icon_amazon.png', alt: 'Amazon' };
    if (lower.includes('magalu') || lower.includes('magazine')) return { src: './icon_magalu.png', alt: 'Magalu' };
    return null;
  };

  const getUserPlatforms = (user) => {
    if (user.platforms && user.platforms.length > 0) {
      return user.platforms;
    }
    return platforms.slice(0, 4);
  };

  const handleClearAllChecklists = () => {
    if (!window.confirm('Tem certeza de que deseja limpar todos os checklists de todos os usuários na Conciliação?')) return;
    setChecklistState({});
    localStorage.removeItem('taresk_conciliacao_state');
  };

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 20px',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Cabeçalho Superior Padronizado: Nome da aba 'Financeiro' alinhado no canto superior esquerdo idêntico a Tarefas, Disputas, etc. */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Título 'Financeiro' isolado no canto superior esquerdo + Subabas pills */}
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '900',
          color: '#1e293b',
          letterSpacing: '-0.5px'
        }}>
          Financeiro
        </h1>

        {/* Lado Direito do Cabeçalho: Botão Limpar Checklists */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleClearAllChecklists}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1.5px solid #fca5a5',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={15} />
            Limpar Checklists
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUBABA RESUMO (FOTO 1): B1:J16 com Cores Oficiais do Taresk */}
      {/* ========================================================================= */}
      {activeSubTab === 'resumo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Tabela do Resumo dentro do container padronizado de ponta a ponta */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            overflowX: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                {/* Linha de cabeçalho unificada 'MARKETPLACES' com roxo suave do Taresk */}
                <tr style={{ background: '#581c87', color: '#ffffff', textAlign: 'center' }}>
                  <th colSpan="9" style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>
                    MARKETPLACES — RESUMO ({selectedMonth})
                  </th>
                </tr>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Plataforma</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Margem</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>Faturamento</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>Descontos</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>Recebido</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>Lucro Bruto</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>Comissão</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>Lucro Líquido</th>
                  <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Qtd</th>
                </tr>
              </thead>
              <tbody>
                {(financialData.resumo || []).map((row, idx) => {
                  const isTotal = row.isTotal || String(row.plataforma).toUpperCase() === 'TOTAL';
                  const marginStyle = getMarginBadgeStyle(row.margem);
                  const platStyle = getPlatformTagStyle(row.plataforma);

                  return (
                    <tr
                      key={idx}
                      style={{
                        background: isTotal ? '#f1f5f9' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                        borderBottom: isTotal ? 'none' : '1px solid #f1f5f9',
                        fontWeight: isTotal ? '900' : '500',
                        fontSize: '13px',
                        color: isTotal ? '#0f172a' : '#334155'
                      }}
                    >
                      {/* Plataforma */}
                      <td style={{ padding: '12px 18px' }}>
                        {isTotal ? (
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
                            TOTAL
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: platStyle.bg,
                            color: platStyle.color,
                            border: `1px solid ${platStyle.border}`,
                            fontWeight: '700',
                            fontSize: '12px'
                          }}>
                            {row.plataforma}
                          </span>
                        )}
                      </td>

                      {/* Margem com regra de cores da Precificadora */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          background: marginStyle.bg,
                          color: marginStyle.color,
                          border: `1px solid ${marginStyle.border}`,
                          fontWeight: '800',
                          fontSize: '12px',
                          minWidth: '65px'
                        }}>
                          {marginStyle.formatted}
                        </span>
                      </td>

                      {/* Faturamento */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: isTotal ? '900' : '600' }}>
                        {formatBrl(row.faturamento)}
                      </td>

                      {/* Descontos */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.descontos === '-' ? '#94a3b8' : '#e11d48' }}>
                        {formatBrl(row.descontos)}
                      </td>

                      {/* Recebido */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: isTotal ? '900' : '600' }}>
                        {formatBrl(row.recebido)}
                      </td>

                      {/* Lucro Bruto */}
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: String(row.lucroBruto).includes('-') ? '#dc2626' : '#1e293b'
                      }}>
                        {formatBrl(row.lucroBruto)}
                      </td>

                      {/* Comissão */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>
                        {formatBrl(row.comissao)}
                      </td>

                      {/* Lucro Líquido */}
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: '800',
                        color: String(row.lucroLiquido).includes('-') ? '#dc2626' : (isTotal ? '#15803d' : '#0f172a')
                      }}>
                        {formatBrl(row.lucroLiquido)}
                      </td>

                      {/* Quantidade */}
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: '700' }}>
                        {row.qtd || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 1.2 Tabela de Comissões dos Vendedores */}
          {(() => {
            const parseVal = (v) => {
              if (typeof v === 'number') return isNaN(v) ? 0 : v;
              if (!v || v === '-') return 0;
              const isNeg = String(v).includes('-');
              const clean = String(v).replace(/[^0-9,]/g, '').trim();
              if (!clean) return 0;
              const num = parseFloat(clean.replace(',', '.')) || 0;
              return isNeg ? -num : num;
            };

            // Mapeamento dos usuários conforme as Plataformas Relacionadas:
            // 1. Allyson: Shopee JBC, Mercado Livre JBC (Mercado L JBC), Magalu JBC, Amazon Allyson, Nuvemshop
            // 2. Jeremias: Amazon JBC, Shopee Jeremias (Shopee Jere), Mercado Livre Jeremias (Mercado L Jere), Amazon Jeremias (Amazon Jere), Magalu Jeremias (Magalu Jere), Shopee Allyson
            // 3. João (Izabela): Shopee Izabela, Mercado Livre Izabela (Mercado L Izabela)
            // 4. Johnathan: Shopee Johnathan (Shopee John)
            const userConfigs = [
              {
                id: 'allyson',
                displayName: 'Allyson',
                subtitle: 'Admin / Loja',
                avatar: '👑',
                matcher: (plat) => {
                  const p = plat.toLowerCase().replace(/\s+/g, ' ').trim();
                  if (p.includes('shopee') && p.includes('jbc')) return true;
                  if ((p.includes('mercado') || p.includes('ml')) && p.includes('jbc')) return true;
                  if (p.includes('magalu') && p.includes('jbc')) return true;
                  if (p.includes('amazon') && p.includes('allyson')) return true;
                  if (p.includes('nuvem') || p.includes('nuvemshop')) return true;
                  return false;
                }
              },
              {
                id: 'jeremias',
                displayName: 'Jeremias',
                subtitle: 'Apelido: Jere',
                avatar: '👨‍💼',
                matcher: (plat) => {
                  const p = plat.toLowerCase().replace(/\s+/g, ' ').trim();
                  if (p.includes('amazon') && p.includes('jbc')) return true;
                  if (p.includes('shopee') && (p.includes('jere') || p.includes('jeremias'))) return true;
                  if ((p.includes('mercado') || p.includes('ml')) && (p.includes('jere') || p.includes('jeremias'))) return true;
                  if (p.includes('amazon') && (p.includes('jere') || p.includes('jeremias'))) return true;
                  if (p.includes('magalu') && (p.includes('jere') || p.includes('jeremias'))) return true;
                  if (p.includes('shopee') && p.includes('allyson')) return true;
                  return false;
                }
              },
              {
                id: 'joao',
                displayName: 'João (Izabela)',
                subtitle: 'Plataformas Izabela',
                avatar: '👩‍💼',
                matcher: (plat) => {
                  const p = plat.toLowerCase().replace(/\s+/g, ' ').trim();
                  if (p.includes('izabela') || p.includes('izabel') || p.includes('joao') || p.includes('joão')) return true;
                  return false;
                }
              },
              {
                id: 'johnathan',
                displayName: 'Johnathan',
                subtitle: 'Apelido: John',
                avatar: '👨‍💻',
                matcher: (plat) => {
                  const p = plat.toLowerCase().replace(/\s+/g, ' ').trim();
                  if (p.includes('john') || p.includes('johnathan')) return true;
                  return false;
                }
              }
            ];

            const rows = (financialData.resumo || []).filter(r => !r.isTotal && String(r.plataforma).toUpperCase() !== 'TOTAL');

            const usersSummary = userConfigs.map(cfg => {
              const matchedRows = rows.filter(r => cfg.matcher(String(r.plataforma || '')));
              const totalComissao = matchedRows.reduce((acc, r) => acc + parseVal(r.comissao), 0);

              return {
                ...cfg,
                matchedRows,
                comissao: totalComissao
              };
            });

            const totalGeralComissao = usersSummary.reduce((acc, u) => acc + u.comissao, 0);

            return (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                overflowX: 'auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#581c87', color: '#ffffff', textAlign: 'center' }}>
                      <th colSpan="3" style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>
                        COMISSÃO DOS VENDEDORES ({selectedMonth})
                      </th>
                    </tr>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '800', color: '#0f172a', width: '240px' }}>Vendedor</th>
                      <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Plataformas Associadas</th>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right', width: '180px' }}>Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersSummary.map((u, uIdx) => {
                      const isNegative = u.comissao < 0;
                      return (
                        <tr
                          key={u.id}
                          style={{
                            background: uIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '13px',
                            color: '#334155'
                          }}
                        >
                          {/* Vendedor */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '20px' }}>{u.avatar}</span>
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                                  {u.displayName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                  {u.subtitle}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Plataformas Associadas */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {u.matchedRows.length > 0 ? (
                                u.matchedRows.map((mr, mrIdx) => {
                                  const tagStyle = getPlatformTagStyle(mr.plataforma);
                                  return (
                                    <span
                                      key={mrIdx}
                                      style={{
                                        display: 'inline-block',
                                        padding: '4px 9px',
                                        borderRadius: '6px',
                                        background: tagStyle.bg,
                                        color: tagStyle.color,
                                        border: `1px solid ${tagStyle.border}`,
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}
                                    >
                                      {mr.plataforma}
                                    </span>
                                  );
                                })
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Nenhuma no período
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Comissão do Vendedor */}
                          <td style={{
                            padding: '14px 20px',
                            textAlign: 'right',
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontWeight: '900',
                              fontSize: '14px',
                              background: isNegative ? '#fee2e2' : '#ecfdf5',
                              color: isNegative ? '#dc2626' : '#059669',
                              border: `1.5px solid ${isNegative ? '#fca5a5' : '#a7f3d0'}`
                            }}>
                              {formatBrl(u.comissao)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Linha de Total */}
                    <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: '900', fontSize: '13px', color: '#0f172a' }}>
                      <td style={{ padding: '14px 20px', letterSpacing: '0.5px' }}>
                        TOTAL COMISSÕES
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                        {usersSummary.length} Vendedores
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '5px 14px',
                          borderRadius: '8px',
                          background: '#581c87',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '14px'
                        }}>
                          {formatBrl(totalGeralComissao)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUBABA PEDIDOS (FOTO 2): B154:N1010 com Reordenação de Colunas */}
      {/* ========================================================================= */}
      {activeSubTab === 'pedidos' && (
        <div>
          {/* Balão Branco de Filtros e Busca (mesmo estilo unificado das demais abas) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '14px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Campo de Busca por Produto, Pedido ou Entrega */}
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                placeholder="Buscar por produto, pedido ou entrega..."
                value={pedidosSearch}
                onChange={(e) => setPedidosSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filtros à direita: Marketplace + Reorganizar Colunas + Total */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {/* Filtro por Marketplace */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Marketplace:</label>
                <select
                  value={pedidosMarketplaceFilter}
                  onChange={(e) => setPedidosMarketplaceFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Todos os Marketplaces</option>
                  {availableMarketplaces.map(mkp => (
                    <option key={mkp} value={mkp}>{mkp}</option>
                  ))}
                </select>
              </div>

              {/* Botão de Organizar / Ocultar Colunas */}
              <button
                type="button"
                onClick={() => setIsColumnOrganizerOpen(!isColumnOrganizerOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: isColumnOrganizerOpen ? '#ede9fe' : '#ffffff',
                  color: isColumnOrganizerOpen ? '#5925dc' : '#475569',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <SlidersHorizontal size={14} />
                Editar Colunas ({visiblePedidosColumns.length}/{pedidosColumns.length})
              </button>

              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                Total: <strong style={{ color: '#0f172a' }}>{filteredPedidos.length} pedidos</strong>
              </span>
            </div>
          </div>

          {/* Painel Colapsável de Reordenação e Visibilidade de Colunas */}
          {isColumnOrganizerOpen && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1.5px solid #ddd6fe',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                    Personalizar Colunas da Planilha:
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    Use as setas ◄ / ► para reordenar e o olho para exibir/ocultar
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleShowAllColumns}
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#059669',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={12} />
                    Mostrar Todas
                  </button>
                  <button
                    type="button"
                    onClick={handleResetColumnOrder}
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#6366f1',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {pedidosColumns.map((col, idx) => {
                  const isVisible = col.visible !== false;
                  return (
                    <div
                      key={col.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isVisible ? '#f8fafc' : '#f1f5f9',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: isVisible ? '1.5px solid #cbd5e1' : '1px dashed #cbd5e1',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: isVisible ? '#1e293b' : '#94a3b8',
                        opacity: isVisible ? 1 : 0.65,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Seta Esquerda */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveColumn(idx, -1)}
                        title="Mover para a esquerda"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          color: idx === 0 ? '#cbd5e1' : '#5925dc',
                          padding: '0 2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ArrowLeft size={13} />
                      </button>

                      {/* Nome da Coluna */}
                      <span style={{ textDecoration: isVisible ? 'none' : 'line-through' }}>
                        {col.label}
                      </span>

                      {/* Seta Direita */}
                      <button
                        type="button"
                        disabled={idx === pedidosColumns.length - 1}
                        onClick={() => handleMoveColumn(idx, 1)}
                        title="Mover para a direita"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: idx === pedidosColumns.length - 1 ? 'default' : 'pointer',
                          color: idx === pedidosColumns.length - 1 ? '#cbd5e1' : '#5925dc',
                          padding: '0 2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ArrowRight size={13} />
                      </button>

                      {/* Botão de Alternar Visibilidade (Olho) */}
                      <button
                        type="button"
                        onClick={() => handleToggleColumnVisibility(col.id)}
                        title={isVisible ? 'Ocultar esta coluna' : 'Mostrar esta coluna'}
                        style={{
                          background: isVisible ? '#ede9fe' : '#e2e8f0',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: isVisible ? '#5925dc' : '#64748b',
                          padding: '3px 5px',
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: '2px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela de Pedidos Padronizada de Ponta a Ponta */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            overflowX: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#581c87', color: '#ffffff', textAlign: 'center' }}>
                  <th colSpan={visiblePedidosColumns.length} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>
                    MARKETPLACES — DETALHAMENTO DE PEDIDOS ({selectedMonth})
                  </th>
                </tr>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {visiblePedidosColumns.map((col) => (
                    <th
                      key={col.id}
                      style={{
                        padding: '14px 16px',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0f172a',
                        textAlign: col.align || 'left',
                        width: col.width || 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={visiblePedidosColumns.length} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      Nenhum pedido encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredPedidos.map((ped, rIdx) => {
                    const marginStyle = getMarginBadgeStyle(ped.margem);
                    const platStyle = getPlatformTagStyle(ped.marketplace);

                    return (
                      <tr
                        key={ped.id || rIdx}
                        style={{
                          background: rIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                          borderBottom: '1px solid #f1f5f9',
                          fontSize: '13px',
                          color: '#334155'
                        }}
                      >
                        {visiblePedidosColumns.map((col) => {
                          if (col.id === 'marketplace') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: platStyle.bg,
                                  color: platStyle.color,
                                  border: `1px solid ${platStyle.border}`,
                                  fontWeight: '700',
                                  fontSize: '12px'
                                }}>
                                  {ped.marketplace}
                                </span>
                              </td>
                            );
                          }

                          if (col.id === 'unid') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '700' }}>
                                {ped.unid || 1}
                              </td>
                            );
                          }

                          if (col.id === 'produto') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', fontWeight: '700', color: '#0f172a' }}>
                                {ped.produto}
                              </td>
                            );
                          }

                          if (col.id === 'preco') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>
                                {formatBrl(ped.preco)}
                              </td>
                            );
                          }

                          if (col.id === 'recebido') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>
                                {formatBrl(ped.recebido)}
                              </td>
                            );
                          }

                          if (col.id === 'lucroBruto') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>
                                {formatBrl(ped.lucroBruto)}
                              </td>
                            );
                          }

                          if (col.id === 'comissao') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>
                                {formatBrl(ped.comissao)}
                              </td>
                            );
                          }

                          if (col.id === 'lucroLiquido') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '800', color: '#0f172a' }}>
                                {formatBrl(ped.lucroLiquido)}
                              </td>
                            );
                          }

                          if (col.id === 'pago') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(ped.pago)}
                                  readOnly
                                  style={{ width: '16px', height: '16px', cursor: 'default' }}
                                />
                              </td>
                            );
                          }

                          if (col.id === 'pedido') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#1e293b' }}>
                                {ped.pedido}
                              </td>
                            );
                          }

                          if (col.id === 'situacao') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', color: '#64748b' }}>
                                {ped.situacao || '-'}
                              </td>
                            );
                          }

                          if (col.id === 'entrega') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', color: '#475569', fontWeight: '600' }}>
                                {ped.entrega || '-'}
                              </td>
                            );
                          }

                          if (col.id === 'margem') {
                            return (
                              <td key={col.id} style={{ padding: '10px 16px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: '8px',
                                  background: marginStyle.bg,
                                  color: marginStyle.color,
                                  border: `1px solid ${marginStyle.border}`,
                                  fontWeight: '800',
                                  fontSize: '12px',
                                  minWidth: '65px'
                                }}>
                                  {marginStyle.formatted}
                                </span>
                              </td>
                            );
                          }

                          return <td key={col.id} style={{ padding: '10px 16px' }}>{ped[col.id] || '-'}</td>;
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBABA CHECKLIST: O checklist tradicional de conciliação por usuário */}
      {/* ========================================================================= */}
      {activeSubTab === 'checklist' && (
        <div>
          {/* Grid de Cards dos Usuários (Allyson, Jeremias, etc.) - Dispostos um ao lado do outro em linha */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            gap: '24px',
            overflowX: 'auto',
            paddingBottom: '16px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {users.map(user => {
              const userPlats = getUserPlatforms(user);
              const userId = user.id || user.name;

              return (
                <div
                  key={userId}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    flex: '0 0 auto',
                    width: '320px',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Cabeçalho do Card: Avatar, Nome e Botão de Reset */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#ede9fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {user.avatar || '👤'}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '800',
                          fontSize: '15px',
                          color: '#1e293b'
                        }}>
                          {user.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b'
                        }}>
                          {user.email || 'Colaborador'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResetUser(userId, userPlats)}
                      title="Desmarcar todos deste usuário"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>

                  {/* Cabeçalho das 4 colunas com os 4 ícones temáticos */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '48px repeat(4, 40px)',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: '4px',
                    borderBottom: '1.5px solid #e2e8f0'
                  }}>
                    <div />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Notas Fiscais">
                      <img src="./concil_step_1.png" alt="NF" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Faturamento / Extrato">
                      <img src="./concil_step_2.png" alt="Extrato" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Financeiro / Repasse">
                      <img src="./concil_step_3.png" alt="Financeiro" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Conferido / Finalizado">
                      <img src="./concil_step_4.png" alt="Conferido" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                  </div>

                  {/* Linhas das Plataformas do Usuário */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {userPlats.map((plat) => {
                      const platKey = plat.id || plat.name;
                      const logoInfo = getPlatformIcon(plat.name);
                      const key = `${userId}__${platKey}`;
                      const stepsState = checklistState[key] || [false, false, false, false];

                      return (
                        <div
                          key={platKey}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '48px repeat(4, 40px)',
                            gap: '10px',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={plat.name}>
                            {logoInfo ? (
                              <img src={logoInfo.src} alt={logoInfo.alt} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                            ) : (
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: plat.color || '#6366f1',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px'
                              }}>
                                {plat.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {[0, 1, 2, 3].map((stepIdx) => {
                            const isChecked = Boolean(stepsState[stepIdx]);

                            return (
                              <div
                                key={stepIdx}
                                onClick={() => handleToggle(userId, platKey, stepIdx)}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  border: isChecked ? '2.5px solid #65a30d' : '2px solid #52525b',
                                  borderRadius: '4px',
                                  backgroundColor: isChecked ? '#bbf7d0' : '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.15s ease',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {isChecked && (
                                  <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#16a34a"
                                    strokeWidth="3.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
