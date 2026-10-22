// Utilitários de precificação e tabelas de frete/taxas por Marketplace

/**
 * Calcula o peso considerado: maior entre o peso real e o peso cúbico.
 * Peso Cúbico = (largura cm * comprimento cm * altura cm) / 6000
 */
export function getConsideredWeight(product) {
  if (!product) return 0.5;
  const realWeight = parseFloat(product.weight) || 0;
  const width = parseFloat(product.width) || 0;
  const length = parseFloat(product.length) || 0;
  const height = parseFloat(product.height) || 0;

  const cubicWeight = (width > 0 && length > 0 && height > 0)
    ? (width * length * height) / 6000
    : 0;

  return Math.max(realWeight, cubicWeight, 0.1);
}

// ----------------------------------------------------
// 1. SHOPEE
// ----------------------------------------------------
// Até R$ 79,99: 20% + R$ 4,50
// Acima de R$ 80 até R$ 99,99: 14% + R$ 16,00
// Acima de R$ 100 até R$ 199,99: 14% + R$ 20,00
// Acima de R$ 200 até R$ 499,99: 14% + R$ 26,00
// Acima de R$ 500: 14% + R$ 26,00
export function calculateShopee(price, productCost, customRate = null, customFixedFee = null) {
  const p = parseFloat(price) || 0;
  if (p <= 0) {
    const custo = parseFloat(productCost) || 0;
    return {
      price: 0,
      feeRate: customRate !== null && !isNaN(customRate) ? parseFloat(customRate) : 20.0,
      tarifaValor: 0,
      fixedFee: customFixedFee !== null && !isNaN(customFixedFee) ? parseFloat(customFixedFee) : 0,
      frete: 0,
      recebido: 0,
      custo,
      lucroBruto: 0,
      commission: 0,
      lucroLiquido: 0,
      margemLiquida: 0
    };
  }

  let feeRate = 20.0;
  let fixedFee = 4.50;

  if (p < 80) {
    feeRate = 20.0;
    fixedFee = 4.50;
  } else if (p < 100) {
    feeRate = 14.0;
    fixedFee = 16.00;
  } else if (p < 200) {
    feeRate = 14.0;
    fixedFee = 20.00;
  } else {
    // Acima de 200 (incluindo acima de 500)
    feeRate = 14.0;
    fixedFee = 26.00;
  }

  // Sobrescreve com valores personalizados se informados
  if (customRate !== null && !isNaN(customRate)) {
    feeRate = parseFloat(customRate);
  }
  if (customFixedFee !== null && !isNaN(customFixedFee)) {
    fixedFee = parseFloat(customFixedFee);
  }

  const tarifaValor = p * (feeRate / 100);
  const deducaoCanal = tarifaValor + fixedFee;
  const recebido = Math.max(0, p - deducaoCanal);
  const custo = parseFloat(productCost) || 0;
  const lucroBruto = recebido - custo;
  const commission = lucroBruto > 0 ? (lucroBruto * 0.25) : 0;
  const lucroLiquido = lucroBruto - commission;
  const margemLiquida = p > 0 ? ((lucroLiquido / p) * 100) : 0;

  return {
    price: p,
    feeRate,
    tarifaValor,
    fixedFee,
    frete: 0,
    recebido,
    custo,
    lucroBruto,
    commission,
    lucroLiquido,
    margemLiquida
  };
}

// ----------------------------------------------------
// 2. MERCADO LIVRE
// ----------------------------------------------------
// Tabela de Envio Mercado Livre cruzando peso com faixa de preço
// Faixas de preço:
// 0: [0, 18.99]
// 1: [19, 48.99]
// 2: [49, 78.99]
// 3: [79, 99.99]
// 4: [100, 119.99]
// 5: [120, 149.99]
// 6: [150, 199.99]
// 7: >= 200

const ML_FREIGHT_TABLE = [
  { maxWeight: 0.3, fees: [5.65, 6.85, 8.15, 12.95, 14.95, 16.95, 19.05, 21.65] },
  { maxWeight: 0.5, fees: [5.95, 6.95, 8.25, 13.85, 16.15, 18.15, 20.45, 23.25] },
  { maxWeight: 1.0, fees: [6.05, 7.15, 8.45, 14.45, 16.85, 19.05, 21.35, 24.45] },
  { maxWeight: 1.5, fees: [6.15, 7.35, 8.65, 14.75, 17.15, 19.45, 21.75, 25.45] },
  { maxWeight: 2.0, fees: [6.25, 7.45, 8.75, 15.05, 17.65, 19.85, 22.25, 25.55] },
  { maxWeight: 3.0, fees: [6.35, 8.65, 9.15, 16.45, 19.15, 21.65, 24.35, 27.05] },
  { maxWeight: 4.0, fees: [6.45, 8.75, 9.75, 17.85, 20.75, 23.35, 26.35, 29.25] },
  { maxWeight: 5.0, fees: [6.55, 8.85, 10.25, 19.75, 22.85, 26.05, 29.25, 32.45] },
  { maxWeight: 6.0, fees: [6.65, 8.95, 10.35, 25.95, 29.15, 33.35, 36.45, 40.85] },
  { maxWeight: 7.0, fees: [6.75, 9.05, 10.45, 27.55, 31.65, 36.75, 40.85, 45.25] },
  { maxWeight: 8.0, fees: [6.85, 9.25, 10.55, 29.45, 34.35, 39.25, 44.15, 49.35] },
  { maxWeight: 9.0, fees: [6.95, 9.35, 10.65, 30.25, 35.25, 40.35, 45.35, 50.75] },
  { maxWeight: 10.0, fees: [7.05, 9.45, 10.85, 38.25, 45.05, 51.95, 58.75, 65.85] },
  { maxWeight: 11.0, fees: [7.05, 9.65, 11.05, 41.65, 48.55, 55.45, 62.35, 69.35] },
  { maxWeight: 13.0, fees: [7.15, 10.05, 11.45, 42.55, 49.75, 56.85, 63.85, 70.95] },
  { maxWeight: 15.0, fees: [7.25, 10.25, 11.65, 45.55, 52.95, 60.55, 68.15, 75.65] },
  { maxWeight: 17.0, fees: [7.35, 10.45, 11.85, 48.95, 56.55, 64.05, 71.35, 79.35] },
  { maxWeight: 20.0, fees: [7.45, 10.65, 12.05, 55.15, 64.35, 73.55, 82.75, 91.95] },
  { maxWeight: 25.0, fees: [7.65, 11.05, 12.25, 64.55, 75.75, 85.45, 96.25, 106.85] },
  { maxWeight: 30.0, fees: [7.75, 11.25, 12.45, 66.45, 76.05, 86.25, 97.15, 107.85] },
  { maxWeight: 40.0, fees: [7.85, 11.45, 12.65, 68.35, 79.65, 89.75, 100.05, 107.95] },
  { maxWeight: 50.0, fees: [7.95, 11.65, 12.85, 70.95, 81.85, 92.85, 103.45, 111.65] },
  { maxWeight: 60.0, fees: [8.05, 11.85, 13.05, 75.55, 87.25, 99.05, 110.25, 119.05] },
  { maxWeight: 70.0, fees: [8.15, 12.05, 13.25, 80.95, 93.75, 105.95, 118.05, 127.45] },
  { maxWeight: 80.0, fees: [8.25, 12.25, 13.45, 84.65, 97.95, 110.75, 123.35, 133.15] },
  { maxWeight: 90.0, fees: [8.35, 12.45, 13.65, 94.05, 108.35, 122.95, 136.95, 147.85] },
  { maxWeight: 100.0, fees: [8.45, 12.65, 13.85, 107.45, 124.85, 140.45, 156.45, 168.85] },
  { maxWeight: 125.0, fees: [8.55, 12.85, 14.05, 120.15, 138.95, 156.95, 174.85, 188.85] },
  { maxWeight: 150.0, fees: [8.65, 12.85, 14.25, 127.45, 147.05, 166.55, 185.55, 200.35] },
  { maxWeight: 9999.0, fees: [8.75, 12.85, 14.45, 167.05, 193.35, 218.45, 243.45, 262.85] }
];

export function getMLFreight(price, weight) {
  let colIndex = 0;
  if (price < 19) colIndex = 0;
  else if (price < 49) colIndex = 1;
  else if (price < 79) colIndex = 2;
  else if (price < 100) colIndex = 3;
  else if (price < 120) colIndex = 4;
  else if (price < 150) colIndex = 5;
  else if (price < 200) colIndex = 6;
  else colIndex = 7;

  const row = ML_FREIGHT_TABLE.find(r => weight <= r.maxWeight) || ML_FREIGHT_TABLE[ML_FREIGHT_TABLE.length - 1];
  let frete = row.fees[colIndex];

  // Regra especial: produtos de menos de R$ 19 pagam no máximo metade do preço do produto
  if (price < 19 && price > 0) {
    frete = Math.min(frete, price / 2);
  }

  return frete;
}

export function calculateMercadoLivre(price, productCost, product, customRate = 16.5, customFreight = null) {
  const p = parseFloat(price) || 0;
  const weight = getConsideredWeight(product);
  const feeRate = parseFloat(customRate) || 16.5;
  const custo = parseFloat(productCost) || 0;

  if (p <= 0) {
    return {
      price: 0,
      feeRate,
      tarifaValor: 0,
      fixedFee: 0,
      frete: customFreight !== null && !isNaN(customFreight) ? parseFloat(customFreight) : 0,
      recebido: 0,
      custo,
      lucroBruto: 0,
      commission: 0,
      lucroLiquido: 0,
      margemLiquida: 0,
      consideredWeight: weight
    };
  }

  const frete = (customFreight !== null && !isNaN(customFreight))
    ? parseFloat(customFreight)
    : getMLFreight(p, weight);
  const tarifaValor = p * (feeRate / 100);
  const deducaoCanal = tarifaValor + frete;
  const recebido = Math.max(0, p - deducaoCanal);
  const lucroBruto = recebido - custo;
  const commission = lucroBruto > 0 ? (lucroBruto * 0.25) : 0;
  const lucroLiquido = lucroBruto - commission;
  const margemLiquida = p > 0 ? ((lucroLiquido / p) * 100) : 0;

  return {
    price: p,
    feeRate,
    tarifaValor,
    fixedFee: 0,
    frete,
    recebido,
    custo,
    lucroBruto,
    commission,
    lucroLiquido,
    margemLiquida,
    consideredWeight: weight
  };
}

// ----------------------------------------------------
// 3. AMAZON (DBA)
// ----------------------------------------------------
// Produtos até R$ 78,99: Tarifa por unidade vendida fixa
// Até 30: 4,50
// De 30 a 49,99: 6,50
// De 50 a 78,99: 6,75
// A partir de R$ 79: Cruzamento por peso e preço (SP/Capital/Regiões)
const AMAZON_MID_TABLE = [
  { maxWeight: 0.25, fees: [11.95, 13.95, 15.95, 17.95] },
  { maxWeight: 0.50, fees: [12.85, 15.00, 17.15, 19.30] },
  { maxWeight: 1.00, fees: [13.45, 15.70, 17.95, 20.20] },
  { maxWeight: 2.00, fees: [14.00, 16.35, 18.75, 21.10] },
  { maxWeight: 3.00, fees: [14.95, 17.45, 19.95, 22.40] },
  { maxWeight: 4.00, fees: [16.15, 18.85, 21.55, 24.20] },
  { maxWeight: 5.00, fees: [17.00, 19.90, 22.75, 25.60] },
  { maxWeight: 6.00, fees: [25.00, 30.00, 34.00, 38.00] },
  { maxWeight: 7.00, fees: [26.00, 31.00, 35.00, 39.00] },
  { maxWeight: 8.00, fees: [27.00, 32.00, 36.00, 40.00] },
  { maxWeight: 9.00, fees: [28.00, 33.00, 37.00, 41.00] },
  { maxWeight: 10.00, fees: [39.50, 46.00, 52.75, 59.00] }
];

const AMAZON_HIGH_TABLE = [
  { maxWeight: 0.25, fee: 19.95 },
  { maxWeight: 0.50, fee: 20.45 },
  { maxWeight: 1.00, fee: 21.45 },
  { maxWeight: 2.00, fee: 22.95 },
  { maxWeight: 3.00, fee: 23.95 },
  { maxWeight: 4.00, fee: 25.95 },
  { maxWeight: 5.00, fee: 27.95 },
  { maxWeight: 6.00, fee: 36.95 },
  { maxWeight: 7.00, fee: 39.45 },
  { maxWeight: 8.00, fee: 40.45 },
  { maxWeight: 9.00, fee: 45.45 },
  { maxWeight: 10.00, fee: 59.95 }
];

export function getAmazonFreight(price, weight) {
  if (price < 30) return 4.50;
  if (price < 50) return 6.50;
  if (price < 79) return 6.75;

  if (price < 200) {
    let col = 0;
    if (price < 100) col = 0;
    else if (price < 120) col = 1;
    else if (price < 150) col = 2;
    else col = 3;

    if (weight <= 10.0) {
      const row = AMAZON_MID_TABLE.find(r => weight <= r.maxWeight) || AMAZON_MID_TABLE[AMAZON_MID_TABLE.length - 1];
      return row.fees[col];
    } else {
      const baseRow = AMAZON_MID_TABLE[AMAZON_MID_TABLE.length - 1];
      const addRate = col === 3 ? 3.50 : 3.05;
      const extraKg = Math.ceil(weight - 10);
      return baseRow.fees[col] + (extraKg * addRate);
    }
  } else {
    if (weight <= 10.0) {
      const row = AMAZON_HIGH_TABLE.find(r => weight <= r.maxWeight) || AMAZON_HIGH_TABLE[AMAZON_HIGH_TABLE.length - 1];
      return row.fee;
    } else {
      const baseFee = 59.95;
      const extraKg = Math.ceil(weight - 10);
      return baseFee + (extraKg * 4.00);
    }
  }
}

export function calculateAmazon(price, productCost, product, customRate = 15.0, customFreight = null) {
  const p = parseFloat(price) || 0;
  const weight = getConsideredWeight(product);
  const feeRate = parseFloat(customRate) || 15.0;
  const custo = parseFloat(productCost) || 0;

  if (p <= 0) {
    return {
      price: 0,
      feeRate,
      tarifaValor: 0,
      fixedFee: 0,
      frete: customFreight !== null && !isNaN(customFreight) ? parseFloat(customFreight) : 0,
      recebido: 0,
      custo,
      lucroBruto: 0,
      commission: 0,
      lucroLiquido: 0,
      margemLiquida: 0,
      consideredWeight: weight
    };
  }

  const frete = (customFreight !== null && !isNaN(customFreight))
    ? parseFloat(customFreight)
    : getAmazonFreight(p, weight);
  const tarifaValor = p * (feeRate / 100);
  const deducaoCanal = tarifaValor + frete;
  const recebido = Math.max(0, p - deducaoCanal);
  const lucroBruto = recebido - custo;
  const commission = lucroBruto > 0 ? (lucroBruto * 0.25) : 0;
  const lucroLiquido = lucroBruto - commission;
  const margemLiquida = p > 0 ? ((lucroLiquido / p) * 100) : 0;

  return {
    price: p,
    feeRate,
    tarifaValor,
    fixedFee: 0,
    frete,
    recebido,
    custo,
    lucroBruto,
    commission,
    lucroLiquido,
    margemLiquida,
    consideredWeight: weight
  };
}

// ----------------------------------------------------
// 4. MAGALU
// ----------------------------------------------------
const MAGALU_MID_TABLE = [
  { maxWeight: 0.5, fee: 17.95 },
  { maxWeight: 1.0, fee: 20.45 },
  { maxWeight: 2.0, fee: 21.45 },
  { maxWeight: 5.0, fee: 25.45 },
  { maxWeight: 9.0, fee: 38.95 },
  { maxWeight: 13.0, fee: 49.45 },
  { maxWeight: 17.0, fee: 55.95 },
  { maxWeight: 23.0, fee: 67.45 },
  { maxWeight: 30.0, fee: 74.45 },
  { maxWeight: 40.0, fee: 79.95 },
  { maxWeight: 50.0, fee: 94.95 },
  { maxWeight: 60.0, fee: 98.95 },
  { maxWeight: 70.0, fee: 103.45 },
  { maxWeight: 80.0, fee: 107.95 },
  { maxWeight: 90.0, fee: 112.95 },
  { maxWeight: 100.0, fee: 117.95 },
  { maxWeight: 9999.0, fee: 150.00 }
];

const MAGALU_HIGH_TABLE = [
  { maxWeight: 0.5, fee: 19.45 },
  { maxWeight: 1.0, fee: 22.45 },
  { maxWeight: 2.0, fee: 23.45 },
  { maxWeight: 5.0, fee: 27.45 },
  { maxWeight: 9.0, fee: 42.45 },
  { maxWeight: 13.0, fee: 53.45 },
  { maxWeight: 17.0, fee: 60.45 },
  { maxWeight: 23.0, fee: 72.95 },
  { maxWeight: 30.0, fee: 80.45 },
  { maxWeight: 40.0, fee: 86.45 },
  { maxWeight: 50.0, fee: 102.95 },
  { maxWeight: 60.0, fee: 106.95 },
  { maxWeight: 70.0, fee: 111.95 },
  { maxWeight: 80.0, fee: 116.95 },
  { maxWeight: 90.0, fee: 121.95 },
  { maxWeight: 100.0, fee: 127.45 },
  { maxWeight: 9999.0, fee: 160.00 }
];

export function getMagaluFreight(price, weight) {
  if (price < 79) {
    return 3.00;
  }
  if (price <= 199) {
    const row = MAGALU_MID_TABLE.find(r => weight <= r.maxWeight) || MAGALU_MID_TABLE[MAGALU_MID_TABLE.length - 1];
    return row.fee;
  } else {
    const row = MAGALU_HIGH_TABLE.find(r => weight <= r.maxWeight) || MAGALU_HIGH_TABLE[MAGALU_HIGH_TABLE.length - 1];
    return row.fee;
  }
}

export function calculateMagalu(price, productCost, product, customRate = 16.0, customFreight = null) {
  const p = parseFloat(price) || 0;
  const weight = getConsideredWeight(product);
  const feeRate = parseFloat(customRate) || 16.0;
  const custo = parseFloat(productCost) || 0;

  if (p <= 0) {
    return {
      price: 0,
      feeRate,
      tarifaValor: 0,
      fixedFee: 0,
      frete: customFreight !== null && !isNaN(customFreight) ? parseFloat(customFreight) : 0,
      recebido: 0,
      custo,
      lucroBruto: 0,
      commission: 0,
      lucroLiquido: 0,
      margemLiquida: 0,
      consideredWeight: weight
    };
  }

  const frete = (customFreight !== null && !isNaN(customFreight))
    ? parseFloat(customFreight)
    : getMagaluFreight(p, weight);
  const tarifaValor = p * (feeRate / 100);
  const deducaoCanal = tarifaValor + frete;
  const recebido = Math.max(0, p - deducaoCanal);
  const lucroBruto = recebido - custo;
  const commission = lucroBruto > 0 ? (lucroBruto * 0.25) : 0;
  const lucroLiquido = lucroBruto - commission;
  const margemLiquida = p > 0 ? ((lucroLiquido / p) * 100) : 0;

  return {
    price: p,
    feeRate,
    tarifaValor,
    fixedFee: 0,
    frete,
    recebido,
    custo,
    lucroBruto,
    commission,
    lucroLiquido,
    margemLiquida,
    consideredWeight: weight
  };
}

/**
 * Encontra o preço de venda para atingir uma margem líquida alvo (padrão 15%).
 * Usa busca binária eficiente respeitando os saltos de faixas de frete/tarifas.
 */
export function findPriceForTargetMargin(calcFn, productCost, product, extraArg, targetMargin = 15.0) {
  const cost = parseFloat(productCost) || 0;
  if (cost <= 0) return 0;

  let low = cost;
  let high = Math.max(cost * 4, 300);
  let bestPrice = cost * 1.5;

  // Busca binária com 22 iterações (precisão de centavos)
  for (let i = 0; i < 22; i++) {
    const mid = (low + high) / 2;
    const res = calcFn(mid, cost, product, extraArg);

    if (res.margemLiquida >= targetMargin) {
      bestPrice = mid;
      high = mid; // tenta achar o menor preço que atinge a margem
    } else {
      low = mid;
    }
  }

  // Arredonda para 2 casas decimais
  return Math.round(bestPrice * 100) / 100;
}

