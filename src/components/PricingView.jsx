import React, { useState, useEffect } from 'react';
import { Search, Calculator, DollarSign, ArrowRight, Info, AlertTriangle, TrendingUp, Box, Scale, Layers, Truck } from 'lucide-react';
import ShopeeKitsModal from './ShopeeKitsModal';
import FreteProprioModal from './FreteProprioModal';
import ProductSearchAutocomplete from './ProductSearchAutocomplete';
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

export default function PricingView({ products = [] }) {
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
  const [isKitsModalOpen, setIsKitsModalOpen] = useState(false);
  const [isFreteProprioModalOpen, setIsFreteProprioModalOpen] = useState(false);

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

  // Altera o preço de venda de um canal com suporte a digitação fluida em centavos
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
      [channelKey]: isNaN(val) ? 0 : val
    }));
  };

  // Altera o Frete ou Tarifa Fixa do canal (formato monetário)
  const handleFreightRawInput = (channelKey, rawString) => {
    if (rawString === '') {
      setCustomFreights(prev => ({ ...prev, [channelKey]: null }));
      return;
    }
    const cleanDigits = rawString.replace(/\D/g, '');
    const cents = parseInt(cleanDigits, 10);
    const newFreight = isNaN(cents) ? 0 : cents / 100;
    setCustomFreights(prev => ({
      ...prev,
      [channelKey]: newFreight
    }));
  };

  // Restaura configurações padrão do canal
  const handleResetChannel = (channelKey) => {
    setCustomRates(prev => ({ ...prev, [channelKey]: null }));
    setCustomFreights(prev => ({ ...prev, [channelKey]: null }));
  };

  // Cálculos de cada Marketplace
  const cost = parseFloat(selectedProduct.cost) || 0;
  const realWeight = parseFloat(selectedProduct.weight) || 0;
  const length = parseFloat(selectedProduct.length) || 0;
  const width = parseFloat(selectedProduct.width) || 0;
  const height = parseFloat(selectedProduct.height) || 0;
  const cubicWeight = (length * width * height) / 6000;
  const consideredWeight = Math.max(realWeight, cubicWeight);

  const shopeeCalc = calculateShopee(channelPrices.shopee, cost, customRates.shopee, customFreights.shopee);
  const mlRate = customRates.mercadoLivre !== null ? customRates.mercadoLivre : (mlListingType === 'classico' ? 12.0 : 16.5);
  const mlCalc = calculateMercadoLivre(channelPrices.mercadoLivre, cost, selectedProduct, mlRate, customFreights.mercadoLivre);
  const amazonCalc = calculateAmazon(channelPrices.amazon, cost, selectedProduct, customRates.amazon || 15.0, customFreights.amazon);
  const magaluCalc = calculateMagalu(channelPrices.magalu, cost, selectedProduct, customRates.magalu || 16.0, customFreights.magalu);

  // Filtro de produtos para o dropdown estilo Excel
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const title = (p.title || p.product || '').toLowerCase();
    return sku.includes(q) || title.includes(q);
  });

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 20px',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Título da Aba no canto superior esquerdo padronizado */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '900',
          color: '#1e293b',
          letterSpacing: '-0.5px'
        }}>
          Precificadora
        </h1>
        {/* Espaço reservado para alinhamento com os botões redondos de ação */}
        <div style={{ width: '42px', height: '42px', flexShrink: 0 }} />
      </div>

      {/* Barra branca unificada contendo a Busca de SKU/Nome + Métricas do Produto */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Campo de Busca de SKU/Nome dentro da barra branca */}
        <div style={{ width: '280px', maxWidth: '100%', flexShrink: 0 }}>
          <ProductSearchAutocomplete
            products={products}
            value={productSearch}
            placeholder="Buscar por SKU ou Nome..."
            showCost={true}
            onSelect={(p) => {
              setSelectedProductId(p.id);
              setProductSearch(`${p.sku} - ${p.title || p.product || ''}`);
            }}
            inputStyle={{
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              padding: '8px 12px 8px 36px',
              fontSize: '13px'
            }}
          />
        </div>

        {/* Custo Base */}
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>Custo Base</span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
            R$ {(typeof selectedProduct.cost === 'number' && !isNaN(selectedProduct.cost) ? selectedProduct.cost : parseFloat(String(selectedProduct.cost || 0).replace(',', '.')) || 0).toFixed(2).replace('.', ',')}
          </span>
        </div>

        <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />

        {/* Medidas (CxLxA) */}
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>Medidas (CxLxA)</span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
            {selectedProduct.length || 0} x {selectedProduct.width || 0} x {selectedProduct.height || 0} cm
          </span>
        </div>

        <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />

        {/* Peso Balança */}
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>Peso Balança</span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
            {realWeight.toFixed(2)} kg
          </span>
        </div>

        <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />

        {/* Peso Cubado */}
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>Peso Cubado (÷ 6000)</span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
            {cubicWeight.toFixed(2)} kg
          </span>
        </div>

        <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />

        {/* Peso Considerado */}
        <div style={{
          background: '#ede9fe',
          padding: '5px 12px',
          borderRadius: '8px',
          border: '1px solid #c4b5fd'
        }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#5925dc', display: 'block' }}>
            Peso Considerado (Maior)
          </span>
          <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
            {consideredWeight.toFixed(2)} kg
          </span>
        </div>
      </div>

      {/* Botões Precificadora de Kits Shopee e Frete Próprio logo abaixo da barra branca */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '28px'
      }}>
        {/* Botão Precificadora de Kits Shopee */}
        <button
          type="button"
          onClick={() => setIsKitsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            background: '#ff5722',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(255, 87, 34, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#f4511e'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#ff5722'; }}
        >
          <Layers size={16} />
          <span>Precificadora de Kits Shopee</span>
        </button>

        {/* Botão Frete Próprio */}
        <button
          type="button"
          onClick={() => setIsFreteProprioModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#2563eb'; }}
        >
          <Truck size={16} />
          <span>Frete Próprio</span>
        </button>
      </div>

      {/* Grid com os 4 Cards de Canais perfeitamente alinhados */}
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

        {/* CARD 2: MERCADO LIVRE */}
        <PricingCard
          title="Mercado Livre"
          subtitle="Clássico (12%) / Premium (16.5%)"
          brandBg="#ffe600"
          brandTextColor="#000000"
          calc={mlCalc}
          channelKey="mercadoLivre"
          hasListingSelector={true}
          mlListingType={mlListingType}
          onToggleListingType={() => setMlListingType(prev => prev === 'classico' ? 'premium' : 'classico')}
          onPriceRawInput={handlePriceRawInput}
          customRate={customRates.mercadoLivre}
          customFreight={customFreights.mercadoLivre}
          onRateRawInput={handleRateRawInput}
          onFreightRawInput={handleFreightRawInput}
          onResetChannel={handleResetChannel}
        />

        {/* CARD 3: AMAZON */}
        <PricingCard
          title="Amazon"
          subtitle="DBA – Delivery by Amazon"
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

      {/* Modal Popup da Precificadora de Kits Shopee */}
      <ShopeeKitsModal
        isOpen={isKitsModalOpen}
        onClose={() => setIsKitsModalOpen(false)}
        products={products}
        initialProduct={selectedProduct}
      />

      {/* Modal Popup da Precificadora de Frete Próprio */}
      <FreteProprioModal
        isOpen={isFreteProprioModalOpen}
        onClose={() => setIsFreteProprioModalOpen(false)}
        products={products}
        initialProduct={selectedProduct}
      />
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
      color: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Topo do Card com altura fixa padronizada */}
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
                onClick={onToggleListingType}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: mlListingType === 'classico' ? '#000000' : 'transparent',
                  color: mlListingType === 'classico' ? '#ffffff' : '#000000',
                  transition: 'all 0.15s ease'
                }}
              >
                Clássico (12%)
              </button>
              <button
                type="button"
                onClick={onToggleListingType}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: mlListingType === 'premium' ? '#000000' : 'transparent',
                  color: mlListingType === 'premium' ? '#ffffff' : '#000000',
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

        {/* 3 & 4: Linhas de métricas com a mesma fonte de Precificadora ('Plus Jakarta Sans') e balões de escrita simplificados */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          color: '#0f172a'
        }}>
          {/* Preço de Venda */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '40px'
          }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Preço</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              background: '#ffffff',
              padding: '6px 12px',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(calc.price)}
                onChange={(e) => onPriceRawInput(channelKey, e.target.value)}
                title="Digite o preço em formato R$ 00,00"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: '800',
                  fontSize: '15px',
                  textAlign: 'right',
                  color: '#0f172a',
                  outline: 'none',
                  width: '100%'
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>

          {/* Tarifa % */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '38px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Tarifa %</span>
              {customRate !== null && (
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#7c3aed' }}>Personalizada</span>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: customRate !== null ? '1.5px solid #8b5cf6' : '1.5px solid #cbd5e1',
              borderRadius: '10px',
              background: customRate !== null ? '#faf5ff' : '#ffffff',
              padding: '6px 12px',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <input
                type="text"
                inputMode="decimal"
                value={customRate !== null ? String(customRate).replace('.', ',') : calc.feeRate.toFixed(1).replace('.', ',')}
                onChange={(e) => onRateRawInput(channelKey, e.target.value)}
                placeholder={calc.feeRate.toFixed(1).replace('.', ',')}
                title="Alíquota % do canal"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: '800',
                  fontSize: '14px',
                  textAlign: 'right',
                  color: customRate !== null ? '#6b21a8' : '#0f172a',
                  outline: 'none',
                  width: '100%'
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginLeft: '6px' }}>%</span>
            </div>
          </div>

          {/* Tarifa Fixa ou Frete */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '38px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                {isShopeeStyle ? 'Tarifa Fixa' : 'Frete'}
              </span>
              {customFreight !== null && (
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#7c3aed' }}>Personalizado</span>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: customFreight !== null ? '1.5px solid #8b5cf6' : '1.5px solid #cbd5e1',
              borderRadius: '10px',
              background: customFreight !== null ? '#faf5ff' : '#ffffff',
              padding: '6px 12px',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(isShopeeStyle ? (customFreight !== null ? customFreight : calc.fixedFee) : (customFreight !== null ? customFreight : calc.frete))}
                onChange={(e) => onFreightRawInput(channelKey, e.target.value)}
                title={isShopeeStyle ? "Tarifa Fixa" : "Frete"}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: '800',
                  fontSize: '14px',
                  textAlign: 'right',
                  color: customFreight !== null ? '#6b21a8' : '#0f172a',
                  outline: 'none',
                  width: '100%'
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

          {/* Recebido */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            alignItems: 'center',
            minHeight: '30px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Recebido</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '900',
              textAlign: 'right',
              color: '#0f172a',
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
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Custo</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '900',
              textAlign: 'right',
              color: '#0f172a',
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
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Lucro Bruto</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '900',
              textAlign: 'right',
              color: '#0f172a',
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
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Comissão</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '900',
              textAlign: 'right',
              color: '#0f172a',
              fontVariantNumeric: 'tabular-nums'
            }}>
              R$ {calc.commission.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Bloco de Rodapé do Card com Lucro Líquido e Margem Líquida */}
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
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
            Lucro Líquido
          </span>
          <span style={{
            fontSize: '18px',
            fontWeight: '900',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            color: '#0f172a'
          }}>
            R$ {calc.lucroLiquido.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Margem Líquida */}
        {(() => {
          const m = calc.margemLiquida;
          let marginBg = '#f1f5f9';
          let marginBorder = '#e2e8f0';

          const roundedMargin = Math.round(m * 10) / 10;

          if (roundedMargin < 10) {
            marginBg = '#fee2e2';
            marginBorder = '#fca5a5';
          } else if (roundedMargin < 15) {
            marginBg = '#fef3c7';
            marginBorder = '#fcd34d';
          } else {
            marginBg = '#dcfce7';
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
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                Margem Líquida
              </span>
              <span style={{
                fontSize: '18px',
                fontWeight: '900',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: '#0f172a'
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
