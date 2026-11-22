import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Package, Eye, EyeOff } from 'lucide-react';
import ProductSearchAutocomplete from './ProductSearchAutocomplete';
import {
  calculateShopee,
  calculateMercadoLivre,
  calculateAmazon,
  calculateMagalu,
  findPriceForTargetMargin
} from '../utils/pricingCalculators';

// Helper de estilo da margem líquida da Precificadora:
// < 10% = Vermelho
// 10% a 14.99% = Amarelo / Dourado
// >= 15% = Verde
function getMarginBadgeStyle(marginVal) {
  let num = 0;
  if (typeof marginVal === 'number') {
    num = marginVal;
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
      formatted: `${Math.round(rounded)}%`
    };
  } else if (rounded < 15) {
    return {
      bg: '#fef3c7',
      border: '#fcd34d',
      color: '#b45309',
      formatted: `${Math.round(rounded)}%`
    };
  } else {
    return {
      bg: '#dcfce7',
      border: '#86efac',
      color: '#15803d',
      formatted: `${Math.round(rounded)}%`
    };
  }
}

// Formata número para R$ XX,YY
function formatBrlNumber(num) {
  const n = typeof num === 'number' ? num : parseFloat(num) || 0;
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function ProductsCatalogView({
  products = [],
  tasks = [],
  currentUser = {},
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  platforms = []
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [visiblePlatformsProductIds, setVisiblePlatformsProductIds] = useState(new Set());

  const toggleProductPlatformsVisibility = (id) => {
    setVisiblePlatformsProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [newProduct, setNewProduct] = useState({
    sku: '',
    title: '',
    cost: '',
    width: '',
    length: '',
    height: '',
    weight: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Armazena preços editados inline por produto e canal: { [productId]: { shopee: 29.9, mercadoLivre: 35.0, ... } }
  const [productChannelPrices, setProductChannelPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_product_channel_prices');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Atualiza e persiste o preço de venda do marketplace para um produto
  const handleUpdateProductPrice = (productId, channelKey, newPrice) => {
    const updated = {
      ...productChannelPrices,
      [productId]: {
        ...(productChannelPrices[productId] || {}),
        [channelKey]: newPrice
      }
    };
    setProductChannelPrices(updated);
    try {
      localStorage.setItem('taresk_product_channel_prices', JSON.stringify(updated));
    } catch (e) {}

    // Salva também no objeto do produto caso seja persistido via onUpdateProduct
    const targetProd = products.find(p => p.id === productId);
    if (targetProd && onUpdateProduct) {
      const updatedChannelPrices = {
        ...(targetProd.channelPrices || {}),
        [channelKey]: newPrice
      };
      onUpdateProduct(productId, {
        ...targetProd,
        channelPrices: updatedChannelPrices
      });
    }
  };

  // Helper que obtém o preço atual (digitado pelo usuário ou calculado para 15% de margem padrão da precificadora)
  const getProductPriceAndMargin = (prod, channelKey) => {
    const cost = typeof prod.cost === 'number' && !isNaN(prod.cost)
      ? prod.cost
      : parseFloat(String(prod.cost || 0).replace(',', '.')) || 0;

    const savedPrice = productChannelPrices[prod.id]?.[channelKey] ?? prod.channelPrices?.[channelKey];

    let calcFn;
    if (channelKey === 'shopee') {
      calcFn = (p, c) => calculateShopee(p, c);
    } else if (channelKey === 'mercadoLivre') {
      calcFn = (p, c, pObj) => calculateMercadoLivre(p, c, pObj, 16.5);
    } else if (channelKey === 'amazon') {
      calcFn = (p, c, pObj) => calculateAmazon(p, c, pObj, 15.0);
    } else if (channelKey === 'magalu') {
      calcFn = (p, c, pObj) => calculateMagalu(p, c, pObj, 16.0);
    }

    let finalPrice = 0;
    if (savedPrice !== undefined && savedPrice !== null && !isNaN(savedPrice) && savedPrice > 0) {
      finalPrice = parseFloat(savedPrice);
    } else {
      // Se ainda não houver preço digitado, calcula automaticamente o preço para atingir 15% de margem líquida
      finalPrice = findPriceForTargetMargin(calcFn, cost, prod, null, 15.0);
    }

    const calcResult = calcFn ? calcFn(finalPrice, cost, prod) : { margemLiquida: 0 };
    return {
      price: finalPrice,
      margin: calcResult.margemLiquida || 0
    };
  };

  const handleSaveNew = (e) => {
    e.preventDefault();
    if (!newProduct.sku.trim()) {
      alert('Preencha o SKU do produto.');
      return;
    }

    const costNum = parseFloat(String(newProduct.cost).replace(',', '.')) || 0;
    const widthNum = parseFloat(String(newProduct.width).replace(',', '.')) || 0;
    const lengthNum = parseFloat(String(newProduct.length).replace(',', '.')) || 0;
    const heightNum = parseFloat(String(newProduct.height).replace(',', '.')) || 0;
    const weightNum = parseFloat(String(newProduct.weight).replace(',', '.')) || 0;

    const prodToSave = {
      id: 'prod_' + Date.now(),
      sku: newProduct.sku.trim(),
      title: newProduct.title.trim() || newProduct.sku.trim(),
      product: newProduct.title.trim() || newProduct.sku.trim(),
      cost: costNum,
      width: widthNum,
      length: lengthNum,
      height: heightNum,
      weight: weightNum,
      platforms: []
    };

    onAddProduct(prodToSave);
    setNewProduct({
      sku: '',
      title: '',
      cost: '',
      width: '',
      length: '',
      height: '',
      weight: ''
    });
    setIsAdding(false);
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setEditForm({
      sku: prod.sku,
      title: prod.title || prod.product || '',
      cost: prod.cost,
      width: prod.width,
      length: prod.length,
      height: prod.height,
      weight: prod.weight
    });
  };

  const handleSaveEdit = (id) => {
    const costNum = parseFloat(String(editForm.cost).replace(',', '.')) || 0;
    const widthNum = parseFloat(String(editForm.width).replace(',', '.')) || 0;
    const lengthNum = parseFloat(String(editForm.length).replace(',', '.')) || 0;
    const heightNum = parseFloat(String(editForm.height).replace(',', '.')) || 0;
    const weightNum = parseFloat(String(editForm.weight).replace(',', '.')) || 0;

    onUpdateProduct(id, {
      sku: editForm.sku.trim(),
      title: editForm.title.trim() || editForm.sku.trim(),
      product: editForm.title.trim() || editForm.sku.trim(),
      cost: costNum,
      width: widthNum,
      length: lengthNum,
      height: heightNum,
      weight: weightNum
    });
    setEditingId(null);
  };

  const handleToggleProductPlatform = (prod, platformId) => {
    let currentPlatforms = prod.platforms;
    if (!currentPlatforms) {
      currentPlatforms = [];
      const relatedTasks = tasks.filter(t => t.productId === prod.id || (prod.sku && t.title?.toLowerCase().includes(prod.sku.toLowerCase())));
      const hasTaskActive = (key) => relatedTasks.some(t => t.marketplaces?.[key]?.active);
      if (hasTaskActive('shopee')) currentPlatforms.push('plat_shopee');
      if (hasTaskActive('mercadoLivre')) currentPlatforms.push('plat_ml');
      if (hasTaskActive('amazon')) currentPlatforms.push('plat_amazon');
      if (hasTaskActive('magalu')) currentPlatforms.push('plat_magalu');
    }

    const isCurrentlyActive = currentPlatforms.includes(platformId);
    const updatedPlatforms = isCurrentlyActive
      ? currentPlatforms.filter(id => id !== platformId)
      : [...currentPlatforms, platformId];

    onUpdateProduct(prod.id, {
      ...prod,
      platforms: updatedPlatforms
    });
  };

  const isProductPlatformActive = (prod, plat) => {
    if (Array.isArray(prod.platforms)) {
      return prod.platforms.includes(plat.id);
    }
    const relatedTasks = tasks.filter(t => t.productId === prod.id || (prod.sku && t.title?.toLowerCase().includes(prod.sku.toLowerCase())));
    const platName = plat.name?.toLowerCase() || '';
    if (platName.includes('shopee')) return relatedTasks.some(t => t.marketplaces?.shopee?.active);
    if (platName.includes('mercado') || platName.includes('ml')) return relatedTasks.some(t => t.marketplaces?.mercadoLivre?.active);
    if (platName.includes('amazon')) return relatedTasks.some(t => t.marketplaces?.amazon?.active);
    if (platName.includes('magalu')) return relatedTasks.some(t => t.marketplaces?.magalu?.active);
    return false;
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Barra Superior de Título e Botão Novo Produto */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>
          Produtos
        </h1>

        {/* Botão Circular Roxo (+) padronizado */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          title="Novo Produto"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#5925dc',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(89, 37, 220, 0.4)',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#4e1fc4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#5925dc'; }}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Barra de Filtros com balão branco de canto a canto */}
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
        {/* Campo de Busca Rápida por SKU ou Nome com Autocomplete estilo Excel */}
        <div style={{ width: '320px', maxWidth: '100%' }}>
          <ProductSearchAutocomplete
            products={products}
            value={productSearch}
            onChange={(val) => setProductSearch(val)}
            onSelect={(prod) => setProductSearch(prod.sku || prod.title || '')}
            placeholder="Buscar por SKU ou Nome..."
            showCost={true}
          />
        </div>

        {/* Quantidade total de produtos ou botão de limpar filtro se houver busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {productSearch && (
            <button
              type="button"
              onClick={() => setProductSearch('')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1.5px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              Limpar Filtro
            </button>
          )}

          <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#64748b'
          }}>
            Total: <span style={{ color: '#0f172a', fontWeight: '800' }}>{products.length} produtos</span>
          </div>
        </div>
      </div>

      {/* Formulário Colapsável de Novo Produto */}
      {isAdding && (
        <form
          onSubmit={handleSaveNew}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #ddd6fe',
            boxShadow: '0 10px 25px -5px rgba(108, 92, 231, 0.15)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end'
          }}
        >
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              SKU *
            </label>
            <input
              type="text"
              placeholder="Ex: Band G"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Produto (Nome / Descrição)
            </label>
            <input
              type="text"
              placeholder="Ex: Bandeja G"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Custo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 21.00"
              value={newProduct.cost}
              onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Largura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 20"
              value={newProduct.width}
              onChange={(e) => setNewProduct({ ...newProduct, width: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Comprimento (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 30"
              value={newProduct.length}
              onChange={(e) => setNewProduct({ ...newProduct, length: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Altura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 5"
              value={newProduct.height}
              onChange={(e) => setNewProduct({ ...newProduct, height: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 1.5"
              value={newProduct.weight}
              onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                padding: '11px 16px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{
                padding: '11px 12px',
                borderRadius: '8px',
                background: '#e2e8f0',
                color: '#475569',
                fontWeight: '600',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Produtos exatamente como na foto do usuário */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        overflowX: 'auto',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                SKU
              </th>
              <th style={{ padding: '16px 16px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Produto
              </th>
              <th style={{ padding: '16px 14px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Custo
              </th>
              <th style={{ padding: '16px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Largura
              </th>
              <th style={{ padding: '16px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Comp
              </th>
              <th style={{ padding: '16px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Altura
              </th>
              <th style={{ padding: '16px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Peso
              </th>
              {/* Coluna Shopee com Ícone Oficial */}
              <th style={{ padding: '10px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src="./icon_shopee.png"
                    alt="Shopee"
                    title="Shopee"
                    style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </th>
              {/* Coluna Mercado Livre com Ícone Oficial */}
              <th style={{ padding: '10px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src="./icon_mercadolivre.png"
                    alt="Mercado Livre"
                    title="Mercado Livre"
                    style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </th>
              {/* Coluna Magalu com Ícone Oficial */}
              <th style={{ padding: '10px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src="./icon_magalu.png"
                    alt="Magalu"
                    title="Magalu"
                    style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </th>
              {/* Coluna Amazon com Ícone Oficial */}
              <th style={{ padding: '10px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src="./icon_amazon.png"
                    alt="Amazon"
                    title="Amazon"
                    style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </th>
              <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#64748b', textAlign: 'right', whiteSpace: 'nowrap' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {products
              .slice()
              .sort((a, b) => {
                const skuA = (a.sku || '').toUpperCase();
                const skuB = (b.sku || '').toUpperCase();
                return skuA.localeCompare(skuB, 'pt-BR', { numeric: true, sensitivity: 'base' });
              })
              .filter(prod => {
                if (productSearch.trim()) {
                  const q = productSearch.toLowerCase().trim();
                  const matchSku = (prod.sku || '').toLowerCase().includes(q);
                  const matchTitle = (prod.title || prod.product || '').toLowerCase().includes(q);
                  if (!matchSku && !matchTitle) return false;
                }
                return true;
              })
              .map((prod) => {
                const isEditing = editingId === prod.id;
                const isPlatVisible = visiblePlatformsProductIds.has(prod.id);

                return (
                  <tr
                    key={prod.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Coluna SKU */}
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.sku}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                          {prod.sku}
                        </span>
                      )}
                    </td>

                    {/* Coluna Produto */}
                    <td style={{ padding: '16px 20px', minWidth: '180px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.title !== undefined ? editForm.title : (editForm.product || '')}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value, product: e.target.value })}
                          style={{ width: '100%', minWidth: '160px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                          {prod.title || prod.product || '-'}
                        </span>
                      )}
                    </td>

                    {/* Coluna Custo */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.cost}
                          onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                          style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          R$ {(typeof prod.cost === 'number' && !isNaN(prod.cost) ? prod.cost : parseFloat(String(prod.cost || 0).replace(',', '.')) || 0).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </td>

                    {/* Coluna Largura */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.width}
                          onChange={(e) => setEditForm({ ...editForm, width: e.target.value })}
                          style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          {prod.width || 0} cm
                        </span>
                      )}
                    </td>

                    {/* Coluna Comp */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.length}
                          onChange={(e) => setEditForm({ ...editForm, length: e.target.value })}
                          style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          {prod.length || 0} cm
                        </span>
                      )}
                    </td>

                    {/* Coluna Altura */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.height}
                          onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                          style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          {prod.height || 0} cm
                        </span>
                      )}
                    </td>

                    {/* Coluna Peso */}
                    <td style={{ padding: '16px 12px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.weight}
                          onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                          style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          {prod.weight || 0} kg
                        </span>
                      )}
                    </td>

                    {/* Coluna SHOPEE (Preço R$ 00,00 e Margem 00% com regras da precificadora) */}
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const { price, margin } = getProductPriceAndMargin(prod, 'shopee');
                        const badgeStyle = getMarginBadgeStyle(margin);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>R$</span>
                              <input
                                type="text"
                                defaultValue={price > 0 ? price.toFixed(2).replace('.', ',') : ''}
                                placeholder="0,00"
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                                  handleUpdateProductPrice(prod.id, 'shopee', val);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                style={{
                                  width: '58px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#0f172a',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: `1px solid ${badgeStyle.border}`
                            }}>
                              {badgeStyle.formatted}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Coluna MERCADO LIVRE (Preço R$ 00,00 e Margem 00% com regras da precificadora) */}
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const { price, margin } = getProductPriceAndMargin(prod, 'mercadoLivre');
                        const badgeStyle = getMarginBadgeStyle(margin);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>R$</span>
                              <input
                                type="text"
                                defaultValue={price > 0 ? price.toFixed(2).replace('.', ',') : ''}
                                placeholder="0,00"
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                                  handleUpdateProductPrice(prod.id, 'mercadoLivre', val);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                style={{
                                  width: '58px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#0f172a',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: `1px solid ${badgeStyle.border}`
                            }}>
                              {badgeStyle.formatted}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Coluna MAGALU (Preço R$ 00,00 e Margem 00% com regras da precificadora) */}
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const { price, margin } = getProductPriceAndMargin(prod, 'magalu');
                        const badgeStyle = getMarginBadgeStyle(margin);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>R$</span>
                              <input
                                type="text"
                                defaultValue={price > 0 ? price.toFixed(2).replace('.', ',') : ''}
                                placeholder="0,00"
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                                  handleUpdateProductPrice(prod.id, 'magalu', val);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                style={{
                                  width: '58px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#0f172a',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: `1px solid ${badgeStyle.border}`
                            }}>
                              {badgeStyle.formatted}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Coluna AMAZON (Preço R$ 00,00 e Margem 00% com regras da precificadora) */}
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const { price, margin } = getProductPriceAndMargin(prod, 'amazon');
                        const badgeStyle = getMarginBadgeStyle(margin);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>R$</span>
                              <input
                                type="text"
                                defaultValue={price > 0 ? price.toFixed(2).replace('.', ',') : ''}
                                placeholder="0,00"
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                                  handleUpdateProductPrice(prod.id, 'amazon', val);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                style={{
                                  width: '58px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#0f172a',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: `1px solid ${badgeStyle.border}`
                            }}>
                              {badgeStyle.formatted}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Ações: Olho, Editar, Excluir como na imagem */}
                    <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(prod.id)}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Check size={14} /> Salvar
                        </button>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => toggleProductPlatformsVisibility(prod.id)}
                            title={isPlatVisible ? "Ocultar plataformas" : "Ver plataformas cadastradas"}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              background: isPlatVisible ? '#ede9fe' : '#f8fafc',
                              color: isPlatVisible ? '#6d28d9' : '#94a3b8',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isPlatVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={() => startEdit(prod)}
                            title="Editar"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir ${prod.sku}?`)) onDeleteProduct(prod.id);
                            }}
                            title="Excluir"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
