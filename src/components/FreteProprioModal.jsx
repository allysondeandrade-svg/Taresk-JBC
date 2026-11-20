import React, { useState, useEffect } from 'react';
import { X, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import ProductSearchAutocomplete from './ProductSearchAutocomplete';

// Formata para moeda brasileira BRL R$ 0,00
function formatBRL(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Máscara de entrada monetária em R$ 0,00
function formatCurrencyInput(val) {
  if (val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte string com máscara R$ ou número para float puro
function parseCurrencyToNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/**
 * Cores da Margem Líquida e do Lucro Líquido:
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
      color: '#d97706',      // Amarelo
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
    return {
      color: '#2563eb',      // Azul
      bg: '#eff6ff',
      border: '#93c5fd'
    };
  }
}

export default function FreteProprioModal({
  isOpen,
  onClose,
  products = [],
  initialProduct = null
}) {
  // Produto selecionado (ao abrir começa vazio)
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchText, setProductSearchText] = useState('');

  // Campos de entrada
  const [valorProdutoMask, setValorProdutoMask] = useState('');
  const [freteAmazonMask, setFreteAmazonMask] = useState('');
  const [freteMEMask, setFreteMEMask] = useState('');
  const [taxaPctInput, setTaxaPctInput] = useState('12,5'); // Padrão 12,5%

  // Controle de exibição das informações intermediárias (ocultas por padrão)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Ao abrir o pop-up, a barra de pesquisa do produto fica vazia
  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(null);
      setProductSearchText('');
      setValorProdutoMask('');
      setFreteAmazonMask('');
      setFreteMEMask('');
      setTaxaPctInput('12,5');
      setIsDetailsOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Custo puxado da validação de dados do produto
  const custo = selectedProduct
    ? (typeof selectedProduct.cost === 'number' ? selectedProduct.cost : parseFloat(String(selectedProduct.cost || 0).replace(',', '.')) || 0)
    : 0;

  // Valores numéricos dos inputs
  const valorProduto = parseCurrencyToNumber(valorProdutoMask);
  const freteAmazon = parseCurrencyToNumber(freteAmazonMask);
  const freteME = parseCurrencyToNumber(freteMEMask);

  // Taxa %
  const taxaPctNum = parseFloat(String(taxaPctInput).replace(',', '.')) || 0;

  // FÓRMULAS CONFORME ESPECIFICADO:
  // 1. Valor Total = Valor do produto + Frete Amazon
  const valorTotal = valorProduto + freteAmazon;

  // 2. Taxa (R$) = Valor total x Taxa (%)
  const taxaReais = valorTotal * (taxaPctNum / 100);

  // 3. Valor a Receber = Valor Total - Taxa (R$)
  const valorAReceber = valorTotal - taxaReais;

  // 4. Valor - Frete ME = Valor a Receber - Frete Melhor Envio
  const valorMenosFreteME = valorAReceber - freteME;

  // 5. Lucro Bruto = (Valor - Frete ME) - Custo
  const lucroBruto = valorMenosFreteME - custo;

  // 6. Comissão = 25% de Lucro Bruto
  const comissao = lucroBruto * 0.25;

  // 7. Lucro líquido = Lucro bruto - comissão
  const lucroLiquido = lucroBruto - comissao;

  // 8. Margem = Lucro líquido / Valor do Produto
  const margem = valorProduto > 0 ? (lucroLiquido / valorProduto) * 100 : 0;

  const marginTheme = getMarginTheme(margem);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1.5px solid #e2e8f0'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '-0.3px' }}>
                Precificadora de Frete Próprio
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Cálculo de margem com envio próprio / Melhor Envio
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Tabela de Preenchimento e Cálculos estilo Planilha */}
          <div style={{
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'visible',
            background: '#ffffff'
          }}>
            {/* Linha Produto: Ao lado de "Produto" fica a barra de pesquisa que abre vazia */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              borderBottom: '1px solid #e2e8f0',
              alignItems: 'center',
              padding: '6px 10px',
              position: 'relative',
              zIndex: 50
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                Produto
              </div>
              <div>
                <ProductSearchAutocomplete
                  products={products}
                  value={productSearchText}
                  onChange={(val) => {
                    setProductSearchText(val);
                    if (!val) setSelectedProduct(null);
                  }}
                  onSelect={(p) => {
                    setSelectedProduct(p);
                    const label = `${p.sku} - ${p.title || p.product || ''}`;
                    setProductSearchText(label);
                  }}
                  placeholder="Buscar por SKU ou Nome..."
                  showCost={true}
                  inputStyle={{
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    padding: '8px 12px 8px 36px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                />
              </div>
            </div>

            {/* Linha Valor Produto (Input) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                Valor Produto *
              </div>
              <div style={{ padding: '6px 10px' }}>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={valorProdutoMask}
                  onChange={(e) => setValorProdutoMask(formatCurrencyInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                />
              </div>
            </div>

            {/* Linha Frete Plataforma (Input) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                Frete Plataforma
              </div>
              <div style={{ padding: '6px 10px' }}>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={freteAmazonMask}
                  onChange={(e) => setFreteAmazonMask(formatCurrencyInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                />
              </div>
            </div>

            {/* Linha Frete Transportadora (Input) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                Frete Transportadora
              </div>
              <div style={{ padding: '6px 10px' }}>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={freteMEMask}
                  onChange={(e) => setFreteMEMask(formatCurrencyInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                />
              </div>
            </div>

            {/* Linha Taxa (%) - O bloco vai até o final da linha e o % fica dentro do bloco aparecendo apenas ao digitar */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                Taxa (%)
              </div>
              <div style={{ padding: '6px 10px' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    placeholder="12,5"
                    value={taxaPctInput}
                    onChange={(e) => setTaxaPctInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 28px 7px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  />
                  {taxaPctInput.trim() !== '' && (
                    <span style={{
                      position: 'absolute',
                      right: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#64748b',
                      pointerEvents: 'none'
                    }}>
                      %
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seta abaixo de Taxa (%) para abrir/fechar as informações intermediárias */}
            <div
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer',
                userSelect: 'none',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: '700',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#3b82f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <span>{isDetailsOpen ? 'Ocultar detalhes de taxas e valores' : 'Ver detalhes de taxas e valores'}</span>
              {isDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {/* Bloco de informações ocultáveis (Valor Total, Taxa R$, Valor a Receber, Valor - Frete ME) */}
            {isDetailsOpen && (
              <div style={{ background: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                {/* Linha Valor Total (Troca com Taxa % anterior) */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                    Valor Total
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {formatBRL(valorTotal)}
                  </div>
                </div>

                {/* Linha Taxa (R$) */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                    Taxa (R$)
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {formatBRL(taxaReais)}
                  </div>
                </div>

                {/* Linha Valor a Receber */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                    Valor a Receber
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {formatBRL(valorAReceber)}
                  </div>
                </div>

                {/* Linha Valor - Frete Transportadora */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                    Valor - Frete Transportadora
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {formatBRL(valorMenosFreteME)}
                  </div>
                </div>
              </div>
            )}

            {/* Linha Custo (PRETO conforme solicitado: apenas lucro líquido e margem são coloridos) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Custo
              </div>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                {formatBRL(custo)}
              </div>
            </div>

            {/* Linha Lucro Bruto (Calculado) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Lucro Bruto
              </div>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                {formatBRL(lucroBruto)}
              </div>
            </div>

            {/* Linha Comissão (25% do Lucro Bruto) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Comissão (25%)
              </div>
              <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                {formatBRL(comissao)}
              </div>
            </div>

            {/* Linha Lucro Líquido (Colorido conforme a regra de margem) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              borderBottom: '1px solid #e2e8f0',
              background: marginTheme.bg
            }}>
              <div style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '800', color: marginTheme.color }}>
                Lucro Líquido
              </div>
              <div style={{ padding: '10px 12px', fontSize: '14px', fontWeight: '900', color: marginTheme.color }}>
                {formatBRL(lucroLiquido)}
              </div>
            </div>

            {/* Linha Margem Líquida (Destaque final com mesma regra de cores da precificadora kits) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              background: marginTheme.bg
            }}>
              <div style={{ padding: '12px 12px', fontSize: '14px', fontWeight: '900', color: marginTheme.color }}>
                Margem Líquida
              </div>
              <div style={{ padding: '12px 12px', fontSize: '16px', fontWeight: '900', color: marginTheme.color }}>
                {margem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Botão Fechar */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
