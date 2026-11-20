import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Calculator, Info } from 'lucide-react';

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

export default function ShopeeKitsModal({
  isOpen,
  onClose,
  product = {}
}) {
  // Inicializa inputs com base no produto selecionado
  const initialCost = useMemo(() => {
    if (typeof product.cost === 'number' && !isNaN(product.cost)) return product.cost;
    return parseFloat(String(product.cost || 20).replace(',', '.')) || 20;
  }, [product]);

  const [custo, setCusto] = useState(initialCost);
  const [embalagem, setEmbalagem] = useState(1.00);
  const [precoUn, setPrecoUn] = useState(45.00);
  const [desc2Unid, setDesc2Unid] = useState(5); // em % (ex: 5%)
  const [desc3Unid, setDesc3Unid] = useState(10); // em % (ex: 10%)
  const [comissaoVendedor, setComissaoVendedor] = useState(25); // em % do Lucro Bruto (ex: 25%)

  // Atualiza custo quando o produto selecionado mudar
  useEffect(() => {
    if (product && product.cost !== undefined) {
      const c = typeof product.cost === 'number' ? product.cost : parseFloat(String(product.cost).replace(',', '.')) || 0;
      if (c > 0) setCusto(c);
    }
  }, [product]);

  if (!isOpen) return null;

  // Cálculos para as 3 linhas (1 unid, 2 unid, 3 unid)
  const rows = [
    { qtdNum: 1, label: '1 unid', descPct: 0 },
    { qtdNum: 2, label: '2 unid', descPct: desc2Unid },
    { qtdNum: 3, label: '3 unid', descPct: desc3Unid }
  ].map(r => {
    const qtd = r.qtdNum;
    // Preço Bruto = precoUn * qtd
    // Preço com desconto = Preço Bruto * (1 - descPct / 100)
    const rawPreco = (precoUn * qtd) * (1 - (r.descPct / 100));
    const preco = Math.round(rawPreco * 100) / 100;

    const { taxaPct, taxaFixa } = getShopeeKitRates(preco);

    // Recebido = Preço - (Preço * taxaPct/100) - Taxa Fixa
    const tarifaShopee = (preco * (taxaPct / 100)) + taxaFixa;
    const recebido = preco - tarifaShopee;

    // Custo Total = (Custo + Embalagem) * Qtd
    const custoTotal = (custo + embalagem) * qtd;

    // Lucro Bruto = Recebido - Custo Total
    const lucroBruto = recebido - custoTotal;

    // Comissão Vendedor (25% do Lucro Bruto conforme foto: 11 * 0.25 = 2.75)
    const comissao = Math.max(0, lucroBruto * (comissaoVendedor / 100));

    // Lucro Líquido = Lucro Bruto - Comissão
    const lucroLiq = lucroBruto - comissao;

    // Margem Líquida % = (Lucro Líq / Preço) * 100
    const margem = preco > 0 ? (lucroLiq / preco) * 100 : 0;

    // Lucro por Unidade = Lucro Líq / Qtd
    const lucroPorUnid = lucroLiq / qtd;

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
      lucroPorUnid
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
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Tabela de Referência (Laranja conforme a Foto 1) */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid #ff5722', background: '#ffffff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#ff5722', color: '#ffffff', fontWeight: '900', fontSize: '13px', textAlign: 'center', padding: '8px 10px' }}>
                <span>Referência</span>
                <span>Valor</span>
              </div>

              {/* Linha Custo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Custo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={custo}
                    onChange={(e) => setCusto(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Linha Emb */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Emb</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={embalagem}
                    onChange={(e) => setEmbalagem(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Linha Preço Un */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Preço Un</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={precoUn}
                    onChange={(e) => setPrecoUn(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Linha Desc 2 unid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', borderBottom: '1px solid #fed7aa', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Desc 2 unid</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    value={desc2Unid}
                    onChange={(e) => setDesc2Unid(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>%</span>
                </div>
              </div>

              {/* Linha Desc 3 unid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', background: '#fff7ed', padding: '6px 10px' }}>
                <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '13px' }}>Desc 3 unid</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    value={desc3Unid}
                    onChange={(e) => setDesc3Unid(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', outline: 'none' }}
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

          {/* Tabela de Resultados dos Kits (1 unid, 2 unid, 3 unid) - Idêntica à Foto 1 */}
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

                    {/* Lucro Líquido */}
                    <td style={{ padding: '12px 8px', fontWeight: '900', color: r.lucroLiq >= 0 ? '#16a34a' : '#dc2626', borderRight: '1px solid #fed7aa' }}>
                      {formatBRL(r.lucroLiq)}
                    </td>

                    {/* Margem */}
                    <td style={{ padding: '12px 8px', fontWeight: '800', color: r.margem >= 0 ? '#16a34a' : '#dc2626', borderRight: '1px solid #fed7aa' }}>
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
