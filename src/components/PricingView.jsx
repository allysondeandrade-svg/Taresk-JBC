import React, { useState, useEffect } from 'react';
import { Search, Calculator, DollarSign, ArrowRight, Info, AlertTriangle, TrendingUp, Box, Scale } from 'lucide-react';
import { DEFAULT_PRICING_CONFIGS } from '../data/initialData';
import {
  getConsideredWeight,
  calculateShopee,
  calculateMercadoLivre,
  calculateAmazon,
  calculateMagalu,
  findPriceForTargetMargin
} from '../utils/pricingCalculators';

// Formata número para string monetária brasileira BRL (ex: 10 -> "10,00", 259.9 -> "259,90")
function formatCurrency(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default function PricingView({ products }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [productSearch, setProductSearch] = useState('');

  // Preço de venda em centavos/valor numérico para cada canal
  const [channelPrices, setChannelPrices] = useState({
    shopee: 0,
    mercadoLivre: 0,
    amazon: 0,
    magalu: 0
  });

  // Tarifas % personalizadas (se null, usa a regra automática do canal)
  const [customRates, setCustomRates] = useState({
    shopee: null,
    mercadoLivre: null,
    amazon: null,
    magalu: null
  });

  // Frete ou Tarifa Fixa personalizada (se null, usa a tabela oficial automática)
  const [customFreights, setCustomFreights] = useState({
    shopee: null, // Tarifa fixa Shopee
    mercadoLivre: null, // Frete Mercado Livre
    amazon: null, // Frete Amazon DBA
    magalu: null // Frete Magalu Luiza Envios
  });

  // Tipo de anúncio no Mercado Livre: 'classico' ou 'premium'
  const [mlListingType, setMlListingType] = useState('premium');

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0] || {
    title: 'Produto de Teste',
    sku: 'PROD-CUSTOM',
    cost: 145.00,
    width: 30,
    length: 30,
    height: 30,
    weight: 3.50
  };

  // Ao selecionar um produto ou trocar o tipo de anúncio ML, preenche automaticamente os preços para atingir 15% de margem líquida
  useEffect(() => {
    if (!selectedProduct || !selectedProduct.cost) return;

    const cost = parseFloat(selectedProduct.cost) || 0;
    const mlRate = customRates.mercadoLivre !== null ? customRates.mercadoLivre : (mlListingType === 'classico' ? 12.0 : 16.5);

    const shopee15 = findPriceForTargetMargin((p, c) => calculateShopee(p, c, customRates.shopee, customFreights.shopee), cost, selectedProduct, null, 15.0);
    const ml15 = findPriceForTargetMargin((p, c, prod, rate) => calculateMercadoLivre(p, c, prod, rate, customFreights.mercadoLivre), cost, selectedProduct, mlRate, 15.0);
    const amazon15 = findPriceForTargetMargin((p, c, prod, rate) => calculateAmazon(p, c, prod, rate, customFreights.amazon), cost, selectedProduct, customRates.amazon || 15.0, 15.0);
    const magalu15 = findPriceForTargetMargin((p, c, prod, rate) => calculateMagalu(p, c, prod, rate, customFreights.magalu), cost, selectedProduct, customRates.magalu || 16.0, 15.0);

    setChannelPrices({
      shopee: shopee15,
      mercadoLivre: ml15,
      amazon: amazon15,
      magalu: magalu15
    });
  }, [selectedProductId, selectedProduct.cost, mlListingType, customRates, customFreights]);

  // Ao digitar, trata como centavos: digitar 1000 => 10,00
  const handlePriceRawInput = (channelKey, rawString) => {
    const cleanDigits = rawString.replace(/\D/g, '');
    const cents = parseInt(cleanDigits, 10);
    const newPrice = isNaN(cents) ? 0 : cents / 100;

    setChannelPrices(prev => ({
      ...prev,
      [channelKey]: newPrice
    }));
  };

  // Altera a tarifa % do canal
  const handleRateRawInput = (channelKey, rawString) => {
    if (rawString === '') {
      setCustomRates(prev => ({ ...prev, [channelKey]: null }));
      return;
    }
    const clean = rawString.replace(',', '.').replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    setCustomRates(prev => ({
      ...prev,
      [channelKey]: isNaN(val) ? null : val
    }));
  };

  // Altera o frete / taxa fixa do canal
  const handleFreightRawInput = (channelKey, rawString) => {
    if (rawString === '') {
      setCustomFreights(prev => ({ ...prev, [channelKey]: null }));
      return;
    }
    const cleanDigits = rawString.replace(/\D/g, '');
    const cents = parseInt(cleanDigits, 10);
    const val = isNaN(cents) ? null : cents / 100;
    setCustomFreights(prev => ({
      ...prev,
      [channelKey]: val
    }));
  };

  // Reseta um canal para as tarifas/fretes automáticos oficiais
  const handleResetChannel = (channelKey) => {
    setCustomRates(prev => ({ ...prev, [channelKey]: null }));
    setCustomFreights(prev => ({ ...prev, [channelKey]: null }));
  };

  // Cálculos automáticos com base no produto, dimensões e peso
  const realWeight = parseFloat(selectedProduct.weight) || 0;
  const cubicWeight = (selectedProduct.width && selectedProduct.length && selectedProduct.height)
    ? ((selectedProduct.width * selectedProduct.length * selectedProduct.height) / 6000)
    : 0;
  const consideredWeight = Math.max(realWeight, cubicWeight, 0.1);

  // Alíquota ML padrão
  const mlRate = customRates.mercadoLivre !== null ? customRates.mercadoLivre : (mlListingType === 'classico' ? 12.0 : 16.5);

  const shopeeCalc = calculateShopee(channelPrices.shopee, selectedProduct.cost, customRates.shopee, customFreights.shopee);
  const mlCalc = calculateMercadoLivre(channelPrices.mercadoLivre, selectedProduct.cost, selectedProduct, mlRate, customFreights.mercadoLivre);
  const amazonCalc = calculateAmazon(channelPrices.amazon, selectedProduct.cost, selectedProduct, customRates.amazon || 15.0, customFreights.amazon);
  const magaluCalc = calculateMagalu(channelPrices.magalu, selectedProduct.cost, selectedProduct, customRates.magalu || 16.0, customFreights.magalu);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* Barra de Pesquisa de Produto idêntica à Página 4 do PDF */}
      <div style={{
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <input
            type="text"
            placeholder="Digite o Produto"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px 14px 44px',
              borderRadius: '9999px',
              border: '2px solid #0f172a',
              fontSize: '16px',
              fontWeight: '500',
              color: '#000000',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}
          />
          <Search
            size={20}
            color="#000000"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Seletor rápido de produtos cadastrados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000' }}>
            Selecionar Produto:
          </span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{
              padding: '12px 18px',
              borderRadius: '9999px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              fontWeight: '600',
              background: '#ffffff',
              color: '#000000'
            }}
          >
            {products
              .filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
              .map(p => {
                const cVal = typeof p.cost === 'number' && !isNaN(p.cost) ? p.cost : parseFloat(String(p.cost || 0).replace(',', '.')) || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.title} (Custo: R$ {cVal.toFixed(2).replace('.', ',')})
                  </option>
                );
              })}
          </select>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#000000', opacity: 0.75, display: 'block' }}>Custo Base</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>
              R$ {(typeof selectedProduct.cost === 'number' && !isNaN(selectedProduct.cost) ? selectedProduct.cost : parseFloat(String(selectedProduct.cost || 0).replace(',', '.')) || 0).toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />
          <div>
            <span style={{ fontSize: '11px', color: '#000000', opacity: 0.75, display: 'block' }}>Medidas (CxLxA)</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000' }}>
              {selectedProduct.length || 0} x {selectedProduct.width || 0} x {selectedProduct.height || 0} cm
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />
          <div>
            <span style={{ fontSize: '11px', color: '#000000', opacity: 0.75, display: 'block' }}>Peso Balança</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000' }}>
              {realWeight.toFixed(2)} kg
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />
          <div>
            <span style={{ fontSize: '11px', color: '#000000', opacity: 0.75, display: 'block' }}>Peso Cubado (÷ 6000)</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000' }}>
              {cubicWeight.toFixed(2)} kg
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />
          <div style={{
            background: '#eef2ff',
            padding: '4px 8px',
            borderRadius: '8px',
            border: '1px solid #c7d2fe'
          }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#312e81', display: 'block' }}>
              Peso Considerado (Maior)
            </span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#000000' }}>
              {consideredWeight.toFixed(2)} kg
            </span>
          </div>
        </div>
      </div>

      {/* Grid com os 4 Cards de Canais perfeitamente alinhados com fundo branco */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* CARD 1: SHOPEE */}
        <PricingCard
          title="Shopee"
          subtitle="Tabela de Tarifas e Frete Shopee"
          brandBg="#ff5722"
          brandTextColor="#ffffff"
          calc={shopeeCalc}
          channelKey="shopee"
          isShopeeStyle={true}
          onPriceRawInput={handlePriceRawInput}
          customRate={customRates.shopee}
          customFreight={customFreights.shopee}
          onRateRawInput={handleRateRawInput}
          onFreightRawInput={handleFreightRawInput}
          onResetChannel={handleResetChannel}
        />

        {/* CARD 2: MERCADO LIVRE (Escreve totalmente Mercado Livre e seletor Clássico/Premium) */}
        <PricingCard
          title="Mercado Livre"
          subtitle="Envios e Comissões Oficiais"
          brandBg="#ffe600"
          brandTextColor="#000000"
          calc={mlCalc}
          channelKey="mercadoLivre"
          onPriceRawInput={handlePriceRawInput}
          hasListingSelector={true}
          mlListingType={mlListingType}
          onToggleListingType={setMlListingType}
          customRate={customRates.mercadoLivre}
          customFreight={customFreights.mercadoLivre}
          onRateRawInput={handleRateRawInput}
          onFreightRawInput={handleFreightRawInput}
          onResetChannel={handleResetChannel}
        />

        {/* CARD 3: AMAZON */}
        <PricingCard
          title="Amazon"
          subtitle="DBA - Delivery by Amazon"
          brandBg="#131921"
          brandTextColor="#ffffff"
          calc={amazonCalc}
          channelKey="amazon"
          onPriceRawInput={handlePriceRawInput}
          customRate={customRates.amazon}
          customFreight={customFreights.amazon}
          onRateRawInput={handleRateRawInput}
          onFreightRawInput={handleFreightRawInput}
          onResetChannel={handleResetChannel}
        />

        {/* CARD 4: MAGALU */}
        <PricingCard
          title="Magalu"
          subtitle="Marketplace Luiza Envios"
          brandBg="#0086ff"
          brandTextColor="#ffffff"
          calc={magaluCalc}
          channelKey="magalu"
          onPriceRawInput={handlePriceRawInput}
          customRate={customRates.magalu}
          customFreight={customFreights.magalu}
          onRateRawInput={handleRateRawInput}
          onFreightRawInput={handleFreightRawInput}
          onResetChannel={handleResetChannel}
        />
      </div>
    </div>
  );
}

function PricingCard({
  title,
  subtitle,
  brandBg,
  brandTextColor = '#ffffff',
  calc,
  channelKey,
  isShopeeStyle = false,
  onPriceRawInput,
  hasListingSelector = false,
  mlListingType = 'premium',
  onToggleListingType,
  customRate = null,
  customFreight = null,
  onRateRawInput,
  onFreightRawInput,
  onResetChannel
}) {
  const hasCustomValues = customRate !== null || customFreight !== null;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1.5px solid #e2e8f0',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      color: '#000000'
    }}>
      {/* Topo do Card com altura fixa padronizada para manter alinhamento estrito */}
      <div>
        <div style={{
          padding: '22px 20px 18px',
          textAlign: 'center',
          minHeight: '118px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: brandBg,
          color: brandTextColor,
          position: 'relative'
        }}>
          <h3 style={{
            fontSize: '26px',
            fontWeight: '900',
            color: brandTextColor,
            letterSpacing: '-0.5px',
            margin: 0,
            lineHeight: 1.15
          }}>
            {title}
          </h3>

          {/* Seletor Clássico vs Premium no Mercado Livre */}
          {hasListingSelector ? (
            <div style={{
              display: 'inline-flex',
              marginTop: '10px',
              background: 'rgba(0,0,0,0.12)',
              padding: '3px',
              borderRadius: '9999px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => onToggleListingType('classico')}
                style={{
                  border: 'none',
                  background: mlListingType === 'classico' ? '#000000' : 'transparent',
                  color: mlListingType === 'classico' ? '#ffffff' : '#000000',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Clássico (12%)
              </button>
              <button
                type="button"
                onClick={() => onToggleListingType('premium')}
                style={{
                  border: 'none',
                  background: mlListingType === 'premium' ? '#000000' : 'transparent',
                  color: mlListingType === 'premium' ? '#ffffff' : '#000000',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Premium (16.5%)
              </button>
            </div>
          ) : (
            <span style={{
              marginTop: '8px',
              fontSize: '12px',
              fontWeight: '700',
              color: brandTextColor,
              opacity: 0.85,
              display: 'inline-block'
            }}>
              {subtitle}
            </span>
          )}

          {/* Botão de Restaurar Padrão do canal se houver valores editados */}
          {hasCustomValues && (
            <button
              type="button"
              onClick={() => onResetChannel(channelKey)}
              title="Restaurar tarifas e fretes automáticos deste canal"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Restaurar
            </button>
          )}
        </div>

        {/* Linhas de métricas perfeitamente alinhadas */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          color: '#000000'
        }}>
          {/* Preço de Venda */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '40px'
          }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>Preço</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#000000' }}>R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(calc.price)}
                onChange={(e) => onPriceRawInput(channelKey, e.target.value)}
                title="Digite o preço (ex: 1000 vira 10,00)"
                style={{
                  width: '120px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '2px solid #cbd5e1',
                  background: '#f8fafc',
                  fontWeight: '800',
                  fontSize: '16px',
                  textAlign: 'right',
                  color: '#000000',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.select();
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              />
            </div>
          </div>

          {/* Tarifa % (Agora editável com indicação visual) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '36px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>Tarifa %</span>
              {customRate !== null && (
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed' }}>Personalizada</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <input
                type="text"
                inputMode="decimal"
                value={customRate !== null ? String(customRate).replace('.', ',') : calc.feeRate.toFixed(1).replace('.', ',')}
                onChange={(e) => onRateRawInput(channelKey, e.target.value)}
                placeholder={calc.feeRate.toFixed(1).replace('.', ',')}
                title="Clique para alterar a alíquota de comissão % deste canal"
                style={{
                  width: '84px',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  border: customRate !== null ? '2px solid #8b5cf6' : '1.5px solid #cbd5e1',
                  background: customRate !== null ? '#faf5ff' : '#f8fafc',
                  fontWeight: '800',
                  fontSize: '14px',
                  textAlign: 'right',
                  color: customRate !== null ? '#6b21a8' : '#000000',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.select();
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = customRate !== null ? '#8b5cf6' : '#cbd5e1';
                  e.currentTarget.style.background = customRate !== null ? '#faf5ff' : '#f8fafc';
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#000000' }}>%</span>
            </div>
          </div>

          {/* Tarifa Fixa ou Frete (Agora editável com indicação visual) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '36px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>
                {isShopeeStyle ? 'Tarifa Fixa' : 'Frete'}
              </span>
              {customFreight !== null && (
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed' }}>Personalizado</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#000000' }}>R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(isShopeeStyle ? (customFreight !== null ? customFreight : calc.fixedFee) : (customFreight !== null ? customFreight : calc.frete))}
                onChange={(e) => onFreightRawInput(channelKey, e.target.value)}
                title={isShopeeStyle ? "Clique para alterar a Tarifa Fixa (ex: 450 vira 4,50)" : "Clique para alterar o Frete (ex: 2290 vira 22,90)"}
                style={{
                  width: '100px',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  border: customFreight !== null ? '2px solid #8b5cf6' : '1.5px solid #cbd5e1',
                  background: customFreight !== null ? '#faf5ff' : '#f8fafc',
                  fontWeight: '800',
                  fontSize: '14px',
                  textAlign: 'right',
                  color: customFreight !== null ? '#6b21a8' : '#000000',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.select();
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = customFreight !== null ? '#8b5cf6' : '#cbd5e1';
                  e.currentTarget.style.background = customFreight !== null ? '#faf5ff' : '#f8fafc';
                }}
              />
            </div>
          </div>

          {/* Divisor sutil */}
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.12)', margin: '2px 0' }} />

          {/* Recebido */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '30px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>Recebido</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '800',
              textAlign: 'right',
              color: '#000000',
              fontVariantNumeric: 'tabular-nums'
            }}>
              R$ {calc.recebido.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Custo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '30px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>Custo</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '800',
              textAlign: 'right',
              color: '#000000',
              fontVariantNumeric: 'tabular-nums'
            }}>
              R$ {calc.custo.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Lucro Bruto */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '30px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>Lucro Bruto</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '800',
              textAlign: 'right',
              color: '#000000',
              fontVariantNumeric: 'tabular-nums'
            }}>
              R$ {calc.lucroBruto.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Comissão */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '30px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>Comissão</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '800',
              textAlign: 'right',
              color: '#000000',
              fontVariantNumeric: 'tabular-nums'
            }}>
              R$ {calc.commission.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Bloco de Rodapé do Card com Lucro Líquido e Margem Líquida fixados no rodapé */}
      <div style={{
        padding: '0 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '4px' }} />

        {/* Lucro Líquido */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '130px 1fr',
          alignItems: 'center',
          background: '#f8fafc',
          padding: '11px 16px',
          borderRadius: '14px',
          border: '1.5px solid #e2e8f0'
        }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>
            Lucro Líquido
          </span>
          <span style={{
            fontSize: '18px',
            fontWeight: '900',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            color: '#000000'
          }}>
            R$ {calc.lucroLiquido.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Margem Líquida (Leve vermelho < 10%, amarelo 10-15%, verde > 15%) */}
        {(() => {
          const m = calc.margemLiquida;
          let marginBg = '#f1f5f9';
          let marginBorder = '#e2e8f0';

          // Arredonda para 1 casa decimal para conferência visual
          const roundedMargin = Math.round(m * 10) / 10;

          if (roundedMargin < 10) {
            marginBg = '#fee2e2'; // leve vermelho (< 10%)
            marginBorder = '#fca5a5';
          } else if (roundedMargin < 15) {
            marginBg = '#fef3c7'; // amarelo suave (10% a 14.9%)
            marginBorder = '#fcd34d';
          } else {
            marginBg = '#dcfce7'; // verde suave (a partir de 15.0%)
            marginBorder = '#86efac';
          }

          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr',
              alignItems: 'center',
              background: marginBg,
              padding: '11px 16px',
              borderRadius: '14px',
              border: `1.5px solid ${marginBorder}`,
              transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>
                Margem Líquida
              </span>
              <span style={{
                fontSize: '18px',
                fontWeight: '900',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: '#000000'
              }}>
                {calc.margemLiquida.toFixed(1).replace('.', ',')}%
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}


