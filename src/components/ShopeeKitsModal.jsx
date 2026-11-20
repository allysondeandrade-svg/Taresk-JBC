import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Info } from 'lucide-react';

/**
 * Retorna taxa % e taxa fixa de frete da Shopee de acordo com a tabela da Foto 2:
 * < R$ 79,99   -> 20% | R$ 4,00
 * até 99,99    -> 14% | R$ 16,00
 * até 199,99   -> 14% | R$ 20,00
 * até 499,99   -> 14% | R$ 26,00
 * > R$ 500,00  -> 14% | R$ 26,00
 */
export function getShopeeKitRates(preco) {
  const p = parseFloat(preco) || 0;
  if (p < 79.99) {
    return { taxaPct: 20, taxaFixa: 4.00 };
  } else if (p <= 99.99) {
    return { taxaPct: 14, taxaFixa: 16.00 };
  } else if (p <= 199.99) {
    return { taxaPct: 14, taxaFixa: 20.00 };
  } else {
    // até 499,99 ou > 500,00
    return { taxaPct: 14, taxaFixa: 26.00 };
  }
}

// Formata para moeda brasileira BRL R$ 0,00
function formatBRL(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata número puro para valor monetário com máscara R$ 0,00 a partir de digitação (sem zero na frente)
function formatCurrencyInput(val) {
  if (val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte string monetária "R$ 49,90" ou número para float puro
function parseCurrencyToNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/**
 * Retorna as cores da Margem e do Lucro Líquido conforme a regra:
 * < 5%         -> Vermelho
 * até 9,99%    -> Laranja
 * até 11,99%   -> Amarelo
 * até 19,99%   -> Verde
 * a partir 20% -> Azul
 */
function getMarginTheme(margemPct) {
  const m = parseFloat(margemPct) || 0;
  if (m < 5.0) {
    return {
      color: '#dc2626',      // Vermelho
      bg: '#fef2f2',
      border: '#fca5a5'
    };
  } else if (m <= 9.99) {
    return {
      color: '#ea580c',      // Laranja
      bg: '#fff7ed',
      border: '#fdba74'
    };
  } else if (m <= 11.99) {
    return {
      color: '#d97706',      // Amarelo / Âmbar escuro legível
      bg: '#fefce8',
      border: '#fde047'
    };
  } else if (m <= 19.99) {
    return {
      color: '#16a34a',      // Verde
      bg: '#f0fdf4',
      border: '#86efac'
    };
  } else {
    // >= 20%
    return {
      color: '#2563eb',      // Azul
      bg: '#eff6ff',
      border: '#93c5fd'
    };
  }
}

export default function ShopeeKitsModal({
  isOpen,
  onClose,
  product = {},
  products = []
}) {
  // Produto selecionado no dropdown de validação de dados
  const [selectedProdId, setSelectedProdId] = useState(product?.id || '');

  // Valores em formato monetário com máscara R$ 00,00 (sem zero na frente)
  const [custoStr, setCustoStr] = useState('');
  const [precoUnStr, setPrecoUnStr] = useState('');

  // Descontos em %
  const [desc2Unid, setDesc2Unid] = useState(5); // em % (ex: 5%)
  const [desc3Unid, setDesc3Unid] = useState(10); // em % (ex: 10%)
  const comissaoVendedor = 25; // em % do Lucro Bruto (25%)

  // Quando abrir o modal ou o produto mudar, inicializa os dados
  useEffect(() => {
    const activeProd = (products || []).find(p => p.id === (selectedProdId || product?.id)) || product;
    if (activeProd) {
      setSelectedProdId(activeProd.id || '');
      const rawCost = typeof activeProd.cost === 'number' ? activeProd.cost : parseFloat(String(activeProd.cost || 0).replace(',', '.')) || 0;
      setCustoStr(formatBRL(rawCost));
      if (!precoUnStr) {
        // Preço sugerido inicial
        const initialPrice = rawCost > 0 ? (rawCost * 2) : 45.00;
        setPrecoUnStr(formatBRL(initialPrice));
      }
    }
  }, [product, isOpen]);

  // Ao trocar de produto no dropdown de validação de dados
  const handleProductSelect = (prodId) => {
    setSelectedProdId(prodId);
    const chosen = (products || []).find(p => p.id === prodId);
    if (chosen) {
      const rawCost = typeof chosen.cost === 'number' ? chosen.cost : parseFloat(String(chosen.cost || 0).replace(',', '.')) || 0;
      setCustoStr(formatBRL(rawCost));
      const initialPrice = rawCost > 0 ? (rawCost * 2) : 45.00;
      setPrecoUnStr(formatBRL(initialPrice));
    }
  };

  if (!isOpen) return null;

  const custoNum = parseCurrencyToNumber(custoStr);
  const precoUnNum = parseCurrencyToNumber(precoUnStr);

  // Cálculos para as 3 linhas (1 unid, 2 unid, 3 unid)
  const rows = [
    { qtdNum: 1, label: '1 unid', descPct: 0 },
    { qtdNum: 2, label: '2 unid', descPct: desc2Unid },
    { qtdNum: 3, label: '3 unid', descPct: desc3Unid }
  ].map(r => {
    const qtd = r.qtdNum;
    const rawPreco = (precoUnNum * qtd) * (1 - (r.descPct / 100));
    const preco = Math.round(rawPreco * 100) / 100;

    const { taxaPct, taxaFixa } = getShopeeKitRates(preco);

    // Recebido = Preço - (Preço * taxaPct/100) - Taxa Fixa
    const tarifaShopee = (preco * (taxaPct / 100)) + taxaFixa;
    const recebido = preco - tarifaShopee;

    // Custo Total = Custo * Qtd (Emb removida)
    const custoTotal = custoNum * qtd;

    // Lucro Bruto = Recebido - Custo Total
    const lucroBruto = recebido - custoTotal;

    // Comissão Vendedor (25% do Lucro Bruto)
    const comissao = Math.max(0, lucroBruto * (comissaoVendedor / 100));

    // Lucro Líquido = Lucro Bruto - Comissão
    const lucroLiq = lucroBruto - comissao;

    // Margem Líquida % = (Lucro Líq / Preço) * 100
    const margem = preco > 0 ? (lucroLiq / preco) * 100 : 0;

    // Lucro por Unidade = Lucro Líq / Qtd
    const lucroPorUnid = lucroLiq / qtd;

    const theme = getMarginTheme(margem);

    return {
      label: r.label,
      preco,
      taxaPct,
      taxaFixa,
      recebido,
      lucroBruto,
      comissao,
      lucroLiq,
      margem,
      lucroPorUnid,
      theme
    };
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '980px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Superior Laranja Promoção de Kits idêntico à Foto 1 */}
        <div
          style={{
            background: '#ff5722',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="#ffffff" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '0.5px' }}>
              Promoção de Kits Shopee
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Topo: Tabela de Parâmetros de Referência à Esquerda + Faixa de Fretes à Direita */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 360px) 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Tabela de Referência (Laranja conforme a Foto 1) */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid #ff5722', background: '#ffffff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', background: '#ff5722', color: '#ffffff', fontWeight: '900', fontSize: '13px', textAlign: 'center', padding: '8px 10px' }}>
                <span>Referência</span>
                <span>Valor</span>
              </div>

              {/* Linha 1: Validação de Dados do Produto (Onde ficava o custo) */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Produto</span>
                <select
                  value={selectedProdId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #fdba74',
                    fontWeight: '700',
                    fontSize: '12px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#000000',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Selecione o Produto...</option>
                  {(products || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linha 2: Custo em R$ 00,00 (No lugar onde estava Emb) */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Custo</span>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={custoStr}
                  onChange={(e) => setCustoStr(formatCurrencyInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #fdba74',
                    fontWeight: '800',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#000000',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Linha 3: Preço Un em R$ 00,00 */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Preço Un</span>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={precoUnStr}
                  onChange={(e) => setPrecoUnStr(formatCurrencyInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #fdba74',
                    fontWeight: '800',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#000000',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Linha 4: Desc 2 unid */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Desc 2 unid</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    value={desc2Unid}
                    onChange={(e) => setDesc2Unid(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none', background: '#ffffff' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>%</span>
                </div>
              </div>

              {/* Linha 5: Desc 3 unid */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Desc 3 unid</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    value={desc3Unid}
                    onChange={(e) => setDesc3Unid(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none', background: '#ffffff' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>%</span>
                </div>
              </div>
            </div>

            {/* Tabela de Faixas de Frete Shopee (Foto 2) */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid #334155', background: '#ffffff' }}>
              <div style={{ background: '#ff5722', color: '#ffffff', fontWeight: '900', fontSize: '13px', textAlign: 'center', padding: '8px 10px', letterSpacing: '0.5px' }}>
                FAIXA DE FRETES SHOPEE (TABELA OFICIAL)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#334155', color: '#ffffff', fontWeight: '800' }}>
                    <th style={{ padding: '6px 8px', borderRight: '1px solid #475569' }}>PREÇO</th>
                    <th style={{ padding: '6px 8px', borderRight: '1px solid #475569' }}>Taxa %</th>
                    <th style={{ padding: '6px 8px' }}>Taxa Fixa</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { faixa: '< R$ 79,99', pct: '20%', fixa: 'R$ 4,00' },
                    { faixa: 'até 99,99', pct: '14%', fixa: 'R$ 16,00' },
                    { faixa: 'até 199,99', pct: '14%', fixa: 'R$ 20,00' },
                    { faixa: 'até 499,99', pct: '14%', fixa: 'R$ 26,00' },
                    { faixa: '> R$ 500,00', pct: '14%', fixa: 'R$ 26,00' }
                  ].map((f, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px', fontWeight: '800', color: '#334155', borderRight: '1px solid #e2e8f0' }}>{f.faixa}</td>
                      <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>{f.pct}</td>
                      <td style={{ padding: '5px 8px', fontWeight: '800', color: '#0f172a' }}>{f.fixa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Legenda de Cores de Margem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11px', fontWeight: '800' }}>
            <span style={{ color: '#64748b' }}>Legenda de Margem:</span>
            <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '2px 6px', borderRadius: '4px' }}>
              &lt; 5%: Vermelho
            </span>
            <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fdba74', padding: '2px 6px', borderRadius: '4px' }}>
              até 9,99%: Laranja
            </span>
            <span style={{ background: '#fefce8', color: '#d97706', border: '1px solid #fde047', padding: '2px 6px', borderRadius: '4px' }}>
              até 11,99%: Amarelo
            </span>
            <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '2px 6px', borderRadius: '4px' }}>
              até 19,99%: Verde
            </span>
            <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd', padding: '2px 6px', borderRadius: '4px' }}>
              ≥ 20%: Azul
            </span>
          </div>

          {/* Tabela de Resultados dos Kits (1 unid, 2 unid, 3 unid) */}
          <div style={{ borderRadius: '12px', overflowX: 'auto', border: '2px solid #ff5722', background: '#ffffff', boxShadow: '0 4px 14px rgba(255, 87, 34, 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: '#ff5722', color: '#ffffff', fontSize: '13px', fontWeight: '900' }}>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Qtd</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Preço</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Taxa %</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Taxa Fixa</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Recebido</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Lucro Bruto</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Comissão</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Lucro Líq</th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>Margem</th>
                  <th style={{ padding: '10px 8px' }}>Lucro por Unid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: idx < rows.length - 1 ? '1px solid #fdba74' : 'none',
                      background: idx % 2 === 0 ? '#fff7ed' : '#ffffff',
                      fontSize: '13px'
                    }}
                  >
                    {/* Qtd */}
                    <td style={{ padding: '12px 8px', fontWeight: '800', color: '#431407', borderRight: '1px solid #fed7aa' }}>
                      {r.label}
                    </td>

                    {/* Preço (em negrito de destaque) */}
                    <td style={{ padding: '12px 8px', fontWeight: '900', fontSize: '14px', color: '#000000', borderRight: '1px solid #fed7aa' }}>
                      {formatBRL(r.preco)}
                    </td>

                    {/* Taxa % */}
                    <td style={{ padding: '12px 8px', fontWeight: '700', color: '#334155', borderRight: '1px solid #fed7aa' }}>
                      {r.taxaPct}%
                    </td>

                    {/* Taxa Fixa */}
                    <td style={{ padding: '12px 8px', fontWeight: '700', color: '#334155', borderRight: '1px solid #fed7aa' }}>
                      {formatBRL(r.taxaFixa)}
                    </td>

                    {/* Recebido */}
                    <td style={{ padding: '12px 8px', fontWeight: '800', color: '#1e293b', borderRight: '1px solid #fed7aa' }}>
                      {formatBRL(r.recebido)}
                    </td>

                    {/* Lucro Bruto */}
                    <td style={{ padding: '12px 8px', fontWeight: '800', color: '#1e293b', borderRight: '1px solid #fed7aa' }}>
                      {formatBRL(r.lucroBruto)}
                    </td>

                    {/* Comissão */}
                    <td style={{ padding: '12px 8px', fontWeight: '700', color: '#475569', borderRight: '1px solid #fed7aa' }}>
                      {formatBRL(r.comissao)}
                    </td>

                    {/* Lucro Líquido - Acompanha a cor da margem */}
                    <td style={{
                      padding: '12px 8px',
                      fontWeight: '900',
                      color: r.theme.color,
                      borderRight: '1px solid #fed7aa'
                    }}>
                      {formatBRL(r.lucroLiq)}
                    </td>

                    {/* Margem - Segue as faixas de cores especificadas */}
                    <td style={{
                      padding: '12px 8px',
                      fontWeight: '900',
                      color: r.theme.color,
                      borderRight: '1px solid #fed7aa'
                    }}>
                      {r.margem.toFixed(2).replace('.', ',')}%
                    </td>

                    {/* Lucro por Unid */}
                    <td style={{ padding: '12px 8px', fontWeight: '900', color: '#000000' }}>
                      {formatBRL(r.lucroPorUnid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com Dica e Botão Fechar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} color="#ff5722" />
              Os cálculos aplicam automaticamente a regra de fretes da Shopee conforme a faixa do valor final do kit.
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 24px',
                borderRadius: '10px',
                border: 'none',
                background: '#ff5722',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)'
              }}
            >
              Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
