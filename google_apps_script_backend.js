/**
 * ============================================================================
 * TARESK - BACKEND GOOGLE APPS SCRIPT (JBC ELETRO)
 * ============================================================================
 * Este script transforma sua Planilha do Google Sheets em uma API REST completa
 * para sincronizar Usuários, Produtos, Plataformas, Tarefas, Checklists e Precificações.
 * 
 * ESTRUTURA COM SUPORTE A ID FORMATADO (00001, 00002, ...):
 * - Tarefas / Tarefas_Finalizadas: [ID, Tipo, SKU, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, AtualizadoEm]
 * - Produtos: [ID, SKU, Produto, Foto, Custo, Largura, Comprimento, Altura, Peso]
 * - Plataformas: [ID, Nome, Cor]
 * - Usuários: [ID, Nome, Email, Senha, Plataformas_JSON]
 * 
 * NOTA DE COMPATIBILIDADE:
 * O script detecta automaticamente se a coluna ID está presente nas abas existentes.
 * Se a coluna ID existir, usa o ID sequencial de 5 dígitos (00001, 00002...).
 * Se não existir, funciona normalmente por SKU/Nome sem quebrar dados existentes!
 * 
 * INSTRUÇÕES RÁPIDAS DE INSTALAÇÃO:
 * 1. Abra sua planilha no Google Sheets.
 * 2. Clique em: "Extensões" > "Apps Script".
 * 3. Substitua o conteúdo pelo código abaixo.
 * 4. Execute a função "setupSheets" uma vez para atualizar os cabeçalhos.
 * 5. Clique em: "Implantar" > "Gerenciar implantações" > Editar (lápis) > Versão: "Nova versão" > "Implantar".
 * ============================================================================
 */

// Nomes das abas da planilha
const SHEETS = {
  USERS: 'Usuarios',
  PRODUCTS: 'Produtos',
  PLATFORMS: 'Plataformas',
  TASKS: 'Tarefas',
  COMPLETED_TASKS: 'Tarefas_Finalizadas',
  PRICING: 'Precificadora',
  CHECKLIST_TEMPLATES: 'Modelos_Checklist',
  ANNOTATIONS: 'Anotação',
  DISPUTES: 'Disputas',
  BILLS: 'Contas'
};

/**
 * Cria o menu Taresk na planilha ao abrir
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Taresk')
    .addItem('⚡ Atualizar Colunas e Estrutura', 'setupSheets')
    .addItem('🔑 Gerar IDs Únicos em Todas as Abas (Anti-Colisão)', 'regenerateAllUniqueIds')
    .addToUi();
}

/**
 * Atribui IDs numéricos aleatórios únicos para todas as linhas de todas as abas
 * eliminando de forma definitiva IDs sequenciais como 1, 2, 3... e duplicatas
 */
function regenerateAllUniqueIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToProcess = [
    SHEETS.PRODUCTS,
    SHEETS.TASKS,
    SHEETS.COMPLETED_TASKS,
    SHEETS.BILLS,
    SHEETS.DISPUTES,
    SHEETS.ANNOTATIONS,
    SHEETS.CHECKLIST_TEMPLATES,
    SHEETS.PLATFORMS,
    SHEETS.USERS
  ];

  let totalUpdated = 0;
  const existingIds = new Set();

  sheetsToProcess.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return;

    const headers = values[0].map(h => String(h || '').toLowerCase().trim());
    const idxId = headers.indexOf('id');
    if (idxId === -1) return;

    for (let i = 1; i < values.length; i++) {
      const currentId = String(values[i][idxId] || '').trim();
      // Se não tem ID, ou é sequencial pequeno (1, 2, 0001, etc), ou já apareceu antes duplicado
      const isShortSequential = /^\d{1,5}$/.test(currentId);
      const isDuplicate = existingIds.has(currentId);
      const needsNewId = !currentId || isShortSequential || isDuplicate;

      if (needsNewId) {
        let newId = '';
        do {
          const rand = Math.floor(1000 + Math.random() * 9000);
          newId = String(Date.now()).slice(-6) + String(rand);
        } while (existingIds.has(newId));

        existingIds.add(newId);
        sheet.getRange(i + 1, idxId + 1).setValue(newId);
        totalUpdated++;
      } else {
        existingIds.add(currentId);
      }
    }
  });

  SpreadsheetApp.getUi().alert('Sucesso! Foram gerados ' + totalUpdated + ' novos IDs aleatórios únicos e anti-colisão.');
}

/**
 * Função para inicializar ou atualizar a estrutura das abas da planilha com coluna ID
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Aba Usuários: [ID, Nome, Email, Senha, Plataformas_JSON]
  let userSheet = ss.getSheetByName(SHEETS.USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEETS.USERS);
    userSheet.appendRow(['ID', 'Nome', 'Email', 'Senha', 'Plataformas_JSON']);
    userSheet.appendRow(['00001', 'JBC Eletro', 'eletrojbc@gmail.com', 'Jbc29378125@', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee Principal', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Loja 2', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ])]);
    userSheet.appendRow(['00002', 'Mariana Souza', 'mariana@jbceletro.com', '123', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee Oficial', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Secundária', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ])]);
    userSheet.appendRow(['00003', 'Carlos Oliveira', 'carlos@jbceletro.com', '123', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee', color: '#f97316' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' }
    ])]);
    styleHeader(userSheet);
  } else {
    ensureIdColumn(userSheet, 'ID');
  }

  // 2. Aba Produtos: [ID, SKU, Produto, Foto, Custo, Largura, Comprimento, Altura, Peso, PrecosMarketplaces_JSON]
  let prodSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!prodSheet) {
    prodSheet = ss.insertSheet(SHEETS.PRODUCTS);
    prodSheet.appendRow(['ID', 'SKU', 'Produto', 'Foto', 'Custo', 'Largura', 'Comprimento', 'Altura', 'Peso', 'PrecosMarketplaces_JSON']);
    prodSheet.appendRow(['00001', 'FOG-02-BOC', 'Fogão 2 Bocas Alta Pressão Inox', '', 145.00, 32, 54, 18, 4.80, '{}']);
    prodSheet.appendRow(['00002', 'PAN-ELE-05L', 'Panela Elétrica Multifunção 5L Inox', '', 120.00, 30, 30, 35, 3.50, '{}']);
    prodSheet.appendRow(['00003', 'VENT-COL-40', 'Ventilador Coluna 40cm Turbo Silencioso', '', 89.90, 45, 45, 130, 5.20, '{}']);
    prodSheet.appendRow(['00004', 'FRIT-AIR-4L', 'Fritadeira Air Fryer 4L Digital Preto', '', 185.00, 33, 33, 38, 4.60, '{}']);
    styleHeader(prodSheet);
  } else {
    ensureIdColumn(prodSheet, 'ID');
    ensureProductHeaders(prodSheet);
  }

  // 3. Aba Plataformas: [ID, Nome, Cor]
  let platSheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!platSheet) {
    platSheet = ss.insertSheet(SHEETS.PLATFORMS);
    platSheet.appendRow(['ID', 'Nome', 'Cor']);
    platSheet.appendRow(['00001', 'Shopee', '#f97316']);
    platSheet.appendRow(['00002', 'Mercado Livre', '#facc15']);
    platSheet.appendRow(['00003', 'Amazon', '#334155']);
    platSheet.appendRow(['00004', 'Magalu', '#38bdf8']);
    platSheet.appendRow(['00005', 'Shein', '#000000']);
    platSheet.appendRow(['00006', 'TikTok Shop', '#ff004f']);
    styleHeader(platSheet);
  } else {
    ensureIdColumn(platSheet, 'ID');
  }

  // 4. Aba Tarefas Ativas: [ID, Tipo, SKU, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, AtualizadoEm]
  let taskSheet = ss.getSheetByName(SHEETS.TASKS);
  if (!taskSheet) {
    taskSheet = ss.insertSheet(SHEETS.TASKS);
    taskSheet.appendRow([
      'ID',
      'Tipo',
      'SKU',
      'AtribuidoPara',
      'AtribuidoPor',
      'CriadoPor',
      'Prazo',
      'Status',
      'Marketplaces_JSON',
      'Checklist_JSON',
      'Observacoes',
      'AtualizadoEm'
    ]);
    styleHeader(taskSheet);
  } else {
    ensureIdColumn(taskSheet, 'ID');
    fixTaskSheetHeaders(taskSheet, 'AtualizadoEm');
  }

  // 5. Aba Tarefas Finalizadas: [ID, Tipo, SKU, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, FinalizadoEm]
  let compTaskSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  if (!compTaskSheet) {
    compTaskSheet = ss.insertSheet(SHEETS.COMPLETED_TASKS);
    compTaskSheet.appendRow([
      'ID',
      'Tipo',
      'SKU',
      'AtribuidoPara',
      'AtribuidoPor',
      'CriadoPor',
      'Prazo',
      'Status',
      'Marketplaces_JSON',
      'Checklist_JSON',
      'Observacoes',
      'FinalizadoEm'
    ]);
    styleHeader(compTaskSheet);
  } else {
    ensureIdColumn(compTaskSheet, 'ID');
    fixTaskSheetHeaders(compTaskSheet, 'FinalizadoEm');
  }

  // 6. Aba Configurações da Precificadora (Margens e Taxas)
  let pricingSheet = ss.getSheetByName(SHEETS.PRICING);
  if (!pricingSheet) {
    pricingSheet = ss.insertSheet(SHEETS.PRICING);
    pricingSheet.appendRow(['Plataforma', 'Taxa_Porcentagem', 'Taxa_Fixa', 'Frete_Padrao']);
    pricingSheet.appendRow(['Shopee', 20.0, 4.00, 0.00]);
    pricingSheet.appendRow(['Mercado Livre', 16.5, 6.50, 22.90]);
    pricingSheet.appendRow(['Amazon', 15.0, 0.00, 19.50]);
    pricingSheet.appendRow(['Magalu', 16.0, 3.00, 21.00]);
    styleHeader(pricingSheet);
  }

  // 7. Aba Modelos de Checklist: [ID, Nome, Itens_JSON, AtualizadoEm]
  let tmplSheet = ss.getSheetByName(SHEETS.CHECKLIST_TEMPLATES);
  if (!tmplSheet) {
    tmplSheet = ss.insertSheet(SHEETS.CHECKLIST_TEMPLATES);
    tmplSheet.appendRow(['ID', 'Nome', 'Itens_JSON', 'AtualizadoEm']);
    tmplSheet.appendRow([
      '00001',
      'Padrão Anúncio Completo',
      JSON.stringify([
        'Foto de Capa Ambientada 1 IA Pura',
        'Foto de Capa Ambientada 2 IA Realista',
        'Descrição 1',
        'Foto Ambientada outro Contexto',
        'Sem Fundo Crua',
        'Medidas'
      ]),
      new Date().toISOString()
    ]);
    styleHeader(tmplSheet);
  } else {
    ensureIdColumn(tmplSheet, 'ID');
  }

  // 8. Aba Anotação: [ID, Data, Tipo, Plataforma, Pedido, Valor, Observação, Usuário]
  let noteSheet = ss.getSheetByName(SHEETS.ANNOTATIONS) || ss.getSheetByName('Anotacao') || ss.getSheetByName('Anotações');
  if (!noteSheet) {
    noteSheet = ss.insertSheet(SHEETS.ANNOTATIONS);
    noteSheet.appendRow(['ID', 'Data', 'Tipo', 'Plataforma', 'Pedido', 'Valor', 'Observação', 'Usuário']);
    styleHeader(noteSheet);
  } else {
    realignAndFixAnnotationRows(noteSheet);
  }

  // 9. Aba Disputas: [ID, Plataforma, Data, Produto, Pedido, Descrição, Observação, Devolução, Situação]
  let disputeSheet = ss.getSheetByName(SHEETS.DISPUTES) || ss.getSheetByName('Disputa');
  if (!disputeSheet) {
    disputeSheet = ss.insertSheet(SHEETS.DISPUTES);
    disputeSheet.appendRow(['ID', 'Plataforma', 'Data', 'Produto', 'Pedido', 'Descrição', 'Observação', 'Devolução', 'Situação']);
    styleHeader(disputeSheet);
  } else {
    ensureIdColumn(disputeSheet, 'ID');
  }

  // 10. Aba Contas (Contas a Pagar): [ID, Dia, Mês, Ano, Descrição, Valor, Status, Categoria]
  let billSheet = ss.getSheetByName(SHEETS.BILLS) || ss.getSheetByName('Contas a Pagar');
  if (!billSheet) {
    billSheet = ss.insertSheet(SHEETS.BILLS);
    billSheet.appendRow(['ID', 'Dia', 'Mês', 'Ano', 'Descrição', 'Valor', 'Status', 'Categoria']);
    styleHeader(billSheet);
  } else {
    ensureIdColumn(billSheet, 'ID');
    // Garante que a coluna H tenha o cabeçalho 'Categoria'
    const values = billSheet.getDataRange().getValues();
    if (values.length > 0) {
      const headers = values[0].map(h => String(h).toLowerCase().trim());
      if (headers.indexOf('categoria') === -1 && headers.indexOf('tipo') !== -1) {
        const colIdx = headers.indexOf('tipo') + 1;
        billSheet.getRange(1, colIdx).setValue('Categoria');
      } else if (headers.indexOf('categoria') === -1) {
        billSheet.getRange(1, 8).setValue('Categoria');
      }
    }
  }

  Logger.log('Todas as abas do Taresk foram configuradas e corrigidas com sucesso!');
}

/**
 * Corrige, realinha e padroniza as colunas e dados existentes da aba Anotação.
 */
function realignAndFixAnnotationRows(sheet) {
  if (!sheet) return;
  const standardHeaders = ['ID', 'Data', 'Tipo', 'Plataforma', 'Pedido', 'Valor', 'Observação', 'Usuário'];
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), 1);

  if (lastRow <= 1) {
    sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
    styleHeader(sheet);
    return;
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const rawHeaders = values[0].map(h => String(h || '').trim().toLowerCase());
  const dataRows = values.slice(1);

  const idxId = rawHeaders.indexOf('id');
  const idxData = rawHeaders.findIndex(h => h.includes('data'));
  const idxTipo = rawHeaders.findIndex(h => h.includes('tipo'));
  const idxPlat = rawHeaders.findIndex(h => h.includes('plat'));
  const idxPedido = rawHeaders.findIndex(h => h.includes('ped'));
  const idxValor = rawHeaders.findIndex(h => h.includes('val'));
  const idxObs = rawHeaders.findIndex(h => h.includes('obs'));
  const idxUser = rawHeaders.findIndex(h => h.includes('usu'));

  const knownPlatforms = [
    'shopee jbc', 'shopee izabela', 'shopee principal', 'shopee oficial', 'shopee',
    'mercado livre jbc', 'mercado livre', 'mercado l', 'amazon jbc', 'amazon',
    'magalu jbc', 'magalu', 'shein jbc', 'shein', 'geral / outros', 'geral', 'outros'
  ];

  const cleanedRows = dataRows.map((r, i) => {
    const seqNum = i + 1;
    const formattedId = String(seqNum).padStart(4, '0');

    let rawDate = idxData !== -1 ? r[idxData] : '';
    let dateStr = '';
    if (rawDate instanceof Date) {
      const dd = String(rawDate.getDate()).padStart(2, '0');
      const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
      dateStr = `${dd}/${mm}`;
    } else {
      dateStr = String(rawDate || '').trim();
      if (dateStr.includes('/') && dateStr.length > 5) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length >= 2) dateStr = parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0');
      }
    }
    if (!dateStr) dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'dd/MM');

    let rawTipo = idxTipo !== -1 ? String(r[idxTipo] || '').trim() : '';
    let rawPlat = idxPlat !== -1 ? String(r[idxPlat] || '').trim() : '';
    let rawPedido = idxPedido !== -1 ? String(r[idxPedido] || '').trim() : '';
    let rawValor = idxValor !== -1 ? String(r[idxValor] || '').trim() : '';
    let rawObs = idxObs !== -1 ? String(r[idxObs] || '').trim() : '';
    let rawUser = idxUser !== -1 ? String(r[idxUser] || '').trim() : '';

    let platform = rawPlat;
    let value = rawValor;
    let user = rawUser;
    let notes = rawObs;
    let orderNumber = rawPedido;
    let type = rawTipo;

    if (knownPlatforms.some(kp => value.toLowerCase().includes(kp))) {
      if (!platform) platform = value;
      value = '';
    }

    if ((!value || value === '-') && (notes.includes('R$') || /^\s*R?\$?\s*\d+([.,]\d{2})?\s*$/.test(notes))) {
      value = notes;
      notes = '';
    }

    if (notes.includes('R$') && (!value.includes('R$') && !/\d+,\d{2}/.test(value))) {
      const temp = value;
      value = notes;
      notes = temp;
    }

    if (user.includes('R$') || ((!value || value === '-') && /\d+,\d{2}/.test(user))) {
      value = user;
      user = '';
    }

    if (type.toLowerCase().includes('envio') || type.toLowerCase().includes('direta')) {
      type = 'Entrega Direta';
    } else if (type.toLowerCase().includes('manual') || type.toLowerCase().includes('pontual')) {
      type = 'Gasto Pontual';
    } else if (type.toLowerCase().includes('local')) {
      type = 'Entrega Local';
    } else if (type.toLowerCase().includes('retirada') || type.toLowerCase().includes('fabrica')) {
      type = 'Retirada Fábrica';
    } else if (type.toLowerCase().includes('preju')) {
      type = 'Prejuízo';
    } else if (!type || type.toLowerCase().includes('anota')) {
      type = 'Anotação';
    }

    if (value && !value.startsWith('R$')) {
      const num = parseFloat(value.replace(/[^0-9,-.]/g, '').replace(',', '.'));
      if (!isNaN(num)) {
        value = 'R$ ' + num.toFixed(2).replace('.', ',');
      }
    }

    if (!platform || platform.toLowerCase() === 'nenhuma' || platform.trim() === '-') {
      platform = '-';
    }

    if (!user) user = 'Allyson';

    return [formattedId, dateStr, type, platform, orderNumber, value, notes, user];
  });

  sheet.clear();
  sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  if (cleanedRows.length > 0) {
    sheet.getRange(2, 1, cleanedRows.length, standardHeaders.length).setValues(cleanedRows);
  }
  styleHeader(sheet);
}

function fixAnnotationSheetHeaders(sheet) {
  realignAndFixAnnotationRows(sheet);
}

function fixTaskSheetHeaders(sheet, dateHeaderName) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());

  if (headers.length >= 2) {
    const col2 = headers[1].toLowerCase();
    if (col2 === 'x' || col2 === '' || col2 === 'tipo' || col2 === 'type') {
      sheet.getRange(1, 2).setValue('Tipo');
    }
  }

  const expected = [
    'ID', 'Tipo', 'SKU', 'AtribuidoPara', 'AtribuidoPor', 'CriadoPor',
    'Prazo', 'Status', 'Marketplaces_JSON', 'Checklist_JSON', 'Observacoes', dateHeaderName || 'AtualizadoEm'
  ];

  for (let c = 0; c < expected.length; c++) {
    const currentVal = headers[c] ? headers[c].toLowerCase() : '';
    if (!headers[c] || currentVal === 'x') {
      sheet.getRange(1, c + 1).setValue(expected[c]);
    }
  }

  styleHeader(sheet);
}

function ensureProductHeaders(sheet) {
  let lastCol = Math.max(sheet.getLastColumn(), 1);
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toLowerCase().trim());

  const hasProduto = headers.some(h => h === 'produto' || h === 'titulo' || h === 'título' || h === 'nome' || h === 'descricao' || h === 'descrição');
  if (!hasProduto) {
    const idxSku = headers.indexOf('sku');
    const insertIndex = idxSku !== -1 ? (idxSku + 2) : 2;
    sheet.insertColumnAfter(insertIndex - 1);
    sheet.getRange(1, insertIndex).setValue('Produto');
    lastCol = Math.max(sheet.getLastColumn(), 1);
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toLowerCase().trim());
  }

  const hasFoto = headers.some(h => h.includes('foto') || h.includes('imagem') || h.includes('img') || h.includes('url'));
  if (!hasFoto) {
    const idxProd = headers.findIndex(h => h === 'produto' || h === 'titulo' || h === 'título' || h === 'nome');
    const idxSku = headers.indexOf('sku');
    const insertIndex = idxProd !== -1 ? (idxProd + 2) : (idxSku !== -1 ? (idxSku + 2) : 3);
    sheet.insertColumnAfter(insertIndex - 1);
    sheet.getRange(1, insertIndex).setValue('Foto');
    lastCol = Math.max(sheet.getLastColumn(), 1);
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toLowerCase().trim());
  }

  // Garante a coluna PrecosMarketplaces_JSON na aba Produtos para salvar os preços de Shopee, ML, Magalu, Amazon etc.
  const hasChannelPrices = headers.some(h => h.includes('precos') || h.includes('channelprices') || h.includes('marketplaces_precos'));
  if (!hasChannelPrices) {
    sheet.getRange(1, lastCol + 1).setValue('PrecosMarketplaces_JSON');
  }

  styleHeader(sheet);
}

function ensureIdColumn(sheet, headerName) {
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return;

  const firstHeader = String(values[0][0] || '').toLowerCase().trim();
  if (firstHeader === 'id') {
    for (let i = 1; i < values.length; i++) {
      if (!values[i][0]) {
        sheet.getRange(i + 1, 1).setValue(formatToFiveDigits(i));
      }
    }
    return;
  }

  sheet.insertColumnBefore(1);
  sheet.getRange(1, 1).setValue(headerName || 'ID');
  for (let i = 1; i < values.length; i++) {
    sheet.getRange(i + 1, 1).setValue(formatToFiveDigits(i));
  }
  styleHeader(sheet);
}

function styleHeader(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#5925dc');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function formatToFourDigits(num) {
  if (typeof num === 'string' && /^\d{4,}$/.test(num)) return num;
  const parsed = parseInt(String(num || '').replace(/\D/g, ''), 10);
  if (isNaN(parsed) || parsed < 0) return getNextFormattedId();
  return String(parsed);
}

function formatToFiveDigits(num) {
  if (typeof num === 'string' && /^\d{5,}$/.test(num)) return num;
  const parsed = parseInt(num, 10);
  if (isNaN(parsed) || parsed < 0) return getNextFormattedId();
  return String(parsed);
}

function getNextFormattedId(sheetNames) {
  // Gera um ID numérico aleatório único baseado no timestamp atual e um número aleatório de 4 dígitos
  // garantindo unicidade absoluta sem risco de colisão entre tarefas simples, produtos ou recorrentes
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return String(Date.now()).slice(-6) + String(randomSuffix);
}

/**
 * Endpoint GET: Permite ler todas as coleções de dados
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAllData';
    let responseData = {};

    if (action === 'getAllData') {
      responseData = {
        users: getUsersDataAsJson(),
        products: getProductsDataAsJson(),
        platforms: getPlatformsDataAsJson(),
        tasks: getTasksDataAsJson(SHEETS.TASKS),
        completedTasks: getTasksDataAsJson(SHEETS.COMPLETED_TASKS),
        pricing: getSheetDataAsJson(SHEETS.PRICING),
        checklistTemplates: getChecklistTemplatesDataAsJson(),
        disputes: getDisputesDataAsJson(),
        annotations: getAnnotationsDataAsJson(),
        bills: getBillsDataAsJson()
      };
    } else if (action === 'getBills') {
      responseData = getBillsDataAsJson();
    } else if (action === 'getAnnotations') {
      responseData = getAnnotationsDataAsJson();
    } else if (action === 'getDisputes') {
      responseData = getDisputesDataAsJson();
    } else if (action === 'getTasks') {
      responseData = getTasksDataAsJson(SHEETS.TASKS);
    } else if (action === 'getCompletedTasks') {
      responseData = getTasksDataAsJson(SHEETS.COMPLETED_TASKS);
    } else if (action === 'getProducts') {
      responseData = getProductsDataAsJson();
    } else if (action === 'getPlatforms') {
      responseData = getPlatformsDataAsJson();
    } else if (action === 'getUsers') {
      responseData = getUsersDataAsJson();
    } else if (action === 'getChecklistTemplates') {
      responseData = getChecklistTemplatesDataAsJson();
    } else if (action === 'getFinancialData') {
      const monthSheet = (e && e.parameter && e.parameter.monthSheet) ? e.parameter.monthSheet : 'Nov 26';
      responseData = getFinancialDataFromMonth(monthSheet);
    } else if (action === 'getFinancialSheets') {
      responseData = getAvailableFinancialSheets();
    } else {
      responseData = { error: 'Ação não reconhecida: ' + action };
    }

    return createJsonResponse({ status: 'success', data: responseData });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Endpoint POST: Permite Criar, Atualizar ou Excluir dados pelo App
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;

    let result = {};

    switch (action) {
      case 'syncAllData':
        if (data.tasks) saveTasksBatch(data.tasks);
        if (data.products) saveProductsBatch(data.products);
        if (data.users) saveUsersBatch(data.users);
        if (data.platforms) savePlatformsBatch(data.platforms);
        result = { message: 'Todos os dados foram sincronizados com sucesso!' };
        break;

      case 'saveTask':
        result = upsertTask(data);
        break;

      case 'deleteTask':
        result = deleteTaskRecord(SHEETS.TASKS, data);
        break;

      case 'saveProduct':
        result = upsertProduct(data);
        break;

      case 'deleteProduct':
        result = deleteProductRecord(data);
        break;

      case 'savePlatform':
      case 'updatePlatform':
        result = upsertPlatform(data);
        break;

      case 'deletePlatform':
        result = deletePlatformRecord(data);
        break;

      case 'saveUser':
      case 'updateUser':
        result = upsertUser(data);
        break;

      case 'deleteUser':
        result = deleteUserRecord(data);
        break;

      case 'finishTask':
        result = moveTaskToCompleted(data);
        break;

      case 'unfinishTask':
        result = moveTaskToActive(data);
        break;

      case 'saveCompletedTask':
        result = upsertCompletedTask(data);
        break;

      case 'deleteCompletedTask':
        result = deleteTaskRecord(SHEETS.COMPLETED_TASKS, data);
        break;

      case 'saveChecklistTemplate':
        result = upsertChecklistTemplate(data);
        break;

      case 'deleteChecklistTemplate':
        result = deleteChecklistTemplateRecord(data);
        break;

      case 'saveAnnotation':
        result = saveAnnotationRecord(data);
        break;

      case 'deleteAnnotation':
        result = deleteAnnotationRecord(data);
        break;

      case 'saveDispute':
        result = upsertDisputeRecord(data);
        break;

      case 'deleteDispute':
        result = deleteDisputeRecord(data);
        break;

      case 'saveBill':
        result = upsertBillRecord(data);
        break;

      case 'deleteBill':
        result = deleteBillRecord(data);
        break;

      case 'getFinancialData':
        result = getFinancialDataFromMonth(data && data.monthSheet ? data.monthSheet : 'Nov 26');
        break;

      case 'getFinancialSheets':
        result = getAvailableFinancialSheets();
        break;

      default:
        result = { error: 'Ação POST não reconhecida: ' + action };
    }

    return createJsonResponse({ status: 'success', result: result });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function parseBrazilianNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  var str = String(val).replace(/[^0-9,-.]/g, '').trim();
  if (!str) return 0;

  if (str.indexOf('.') !== -1 && str.indexOf(',') !== -1) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.indexOf(',') !== -1) {
    str = str.replace(',', '.');
  }
  var parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function formatDueDateToDdMm(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var day = String(val.getDate()).padStart(2, '0');
    var month = String(val.getMonth() + 1).padStart(2, '0');
    return day + '/' + month;
  }
  var str = String(val).trim();
  if (!str) return '';
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    var parts = str.split('/');
    return parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0');
  }
  var d = new Date(str);
  if (!isNaN(d.getTime())) {
    var day2 = String(d.getDate()).padStart(2, '0');
    var month2 = String(d.getMonth() + 1).padStart(2, '0');
    return day2 + '/' + month2;
  }
  return str;
}

function getSheetDataAsJson(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    let item = {};
    headers.forEach((header, index) => {
      let key = String(header).toLowerCase();
      if (key === 'custo' || key === 'largura' || key === 'comprimento' || key === 'altura' || key === 'peso') {
        item[key] = parseBrazilianNumber(row[index]);
      } else {
        item[key] = row[index];
      }
    });
    return item;
  });
}

function getUsersDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  const idxNome = headers.findIndex(h => h === 'nome' || h.includes('usuario'));
  const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('e-mail') || h.includes('login'));
  const idxSenha = headers.findIndex(h => h.includes('senha') || h.includes('password'));
  const idxCargo = headers.indexOf('cargo');
  const idxAvatar = headers.indexOf('avatar');
  const idxBadge = headers.indexOf('badge');
  const idxPlat = headers.findIndex(h => h.includes('plataforma'));

  return rows.map((r, index) => {
    const rawId = idxId !== -1 && r[idxId] ? String(r[idxId]).trim() : '';
    const email = idxEmail !== -1 ? String(r[idxEmail] || '').trim() : String(r[1] || '').trim();
    const name = idxNome !== -1 ? String(r[idxNome] || '').trim() : String(r[0] || '').trim();
    const password = idxSenha !== -1 ? String(r[idxSenha] || '') : String(r[2] || '');

    let platforms = [];
    if (idxPlat !== -1 && r[idxPlat]) {
      try { platforms = JSON.parse(r[idxPlat]); } catch (e) { platforms = []; }
    }

    const isMaster = email.toLowerCase() === 'eletrojbc@gmail.com' || (idxCargo !== -1 && String(r[idxCargo]).includes('admin')) || index === 0;
    const role = isMaster ? 'premium_admin' : (idxCargo !== -1 && r[idxCargo] ? String(r[idxCargo]) : 'operator');
    const avatar = (idxAvatar !== -1 && r[idxAvatar]) ? String(r[idxAvatar]) : ('👤');
    const badge = (idxBadge !== -1 && r[idxBadge]) ? String(r[idxBadge]) : (isMaster ? 'Admin' : 'Operador');
    const id = rawId || (isMaster ? 'user_master' : 'user_' + encodeURIComponent(email).replace(/[^a-zA-Z0-9_]/g, '_'));

    return {
      id: id,
      name: name,
      email: email,
      password: password,
      role: role,
      avatar: avatar,
      badge: badge,
      platforms: platforms
    };
  });
}

function getProductsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  const idxSku = headers.indexOf('sku');
  const idxFoto = headers.findIndex(h => h.includes('foto') || h.includes('imagem') || h.includes('img') || h.includes('url'));
  const idxTitulo = headers.findIndex(h => h === 'produto' || h.includes('produto') || h.includes('titulo') || h.includes('título') || h.includes('nome'));
  const idxCusto = headers.indexOf('custo');
  const idxLargura = headers.indexOf('largura');
  const idxComp = headers.findIndex(h => h.includes('comp'));
  const idxAltura = headers.indexOf('altura');
  const idxPeso = headers.indexOf('peso');
  const idxPrecos = headers.findIndex(h => h.includes('precos') || h.includes('channelprices') || h.includes('marketplaces_precos'));

  return rows.map((r, i) => {
    const rawId = idxId !== -1 && r[idxId] ? String(r[idxId]).trim() : '';
    const sku = idxSku !== -1 ? String(r[idxSku] || '').trim() : String(r[0] || '').trim();
    const titulo = idxTitulo !== -1 && r[idxTitulo] ? String(r[idxTitulo]).trim() : '';
    const rawFoto = idxFoto !== -1 && r[idxFoto] ? String(r[idxFoto]).trim() : '';

    let channelPrices = {};
    if (idxPrecos !== -1 && r[idxPrecos]) {
      try {
        if (typeof r[idxPrecos] === 'string' && (r[idxPrecos].trim().startsWith('{') || r[idxPrecos].trim().startsWith('['))) {
          channelPrices = JSON.parse(r[idxPrecos]);
        } else if (typeof r[idxPrecos] === 'object') {
          channelPrices = r[idxPrecos];
        }
      } catch (errJson) {
        channelPrices = {};
      }
    }

    return {
      id: rawId || sku || ('prod_' + (i + 1)),
      sku: sku,
      title: titulo,
      product: titulo,
      imageUrl: rawFoto,
      cost: idxCusto !== -1 ? parseBrazilianNumber(r[idxCusto]) : 0,
      width: idxLargura !== -1 ? parseBrazilianNumber(r[idxLargura]) : 0,
      length: idxComp !== -1 ? parseBrazilianNumber(r[idxComp]) : 0,
      height: idxAltura !== -1 ? parseBrazilianNumber(r[idxAltura]) : 0,
      weight: idxPeso !== -1 ? parseBrazilianNumber(r[idxPeso]) : 0,
      channelPrices: channelPrices
    };
  });
}

function getPlatformsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  const idxNome = headers.findIndex(h => h === 'nome' || h.includes('plataforma'));
  const idxCor = headers.indexOf('cor');
  const idxDesc = headers.findIndex(h => h.includes('desc'));

  return rows.map((r, i) => {
    const rawId = idxId !== -1 && r[idxId] ? String(r[idxId]).trim() : '';
    const nome = idxNome !== -1 ? String(r[idxNome] || '').trim() : String(r[1] || r[0] || '').trim();
    const cor = idxCor !== -1 && r[idxCor] ? String(r[idxCor]).trim() : '#5925dc';
    const desc = idxDesc !== -1 && r[idxDesc] ? String(r[idxDesc]).trim() : '';

    return {
      id: rawId || ('plat_' + encodeURIComponent(nome).toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_')),
      name: nome,
      color: cor,
      description: desc
    };
  });
}

function getTasksDataAsJson(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  let idxTipo = headers.findIndex(h => h.includes('tipo') || h === 'type' || h === 'x');
  if (idxTipo === -1 && headers.indexOf('id') === 0 && headers.length > 1) {
    idxTipo = 1;
  }

  const idxProdId = headers.findIndex(h => h.includes('produtoid') || h.includes('produto') || h.includes('sku'));
  const idxTitulo = headers.findIndex(h => h.includes('titulo') || h.includes('nome'));
  const idxAtribPara = headers.findIndex(h => h.includes('atrib') && h.includes('para'));
  const idxAtribPor = headers.findIndex(h => h.includes('atrib') && h.includes('por'));
  const idxCriadoPor = headers.findIndex(h => h.includes('criado'));
  const idxPrazo = headers.findIndex(h => h.includes('prazo') || h.includes('data'));
  const idxStatus = headers.findIndex(h => h.includes('status'));
  const idxMarketplaces = headers.findIndex(h => h.includes('market') || h.includes('canal'));
  const idxChecklist = headers.findIndex(h => h.includes('check'));
  const idxObs = headers.findIndex(h => h.includes('obs') || h.includes('nota'));
  const idxDataHora = headers.findIndex(h => h.includes('atualizado') || h.includes('finalizado') || h.includes('timestamp'));

  return rows.map((r, index) => {
    let marketplaces = {};
    let checklist = [];

    const rawId = idxId !== -1 && r[idxId] ? String(r[idxId]).trim() : '';
    const rawMp = idxMarketplaces !== -1 ? r[idxMarketplaces] : r[8];
    const rawChk = idxChecklist !== -1 ? r[idxChecklist] : r[9];

    try { marketplaces = rawMp ? JSON.parse(rawMp) : {}; } catch (e) { }
    try { checklist = rawChk ? JSON.parse(rawChk) : []; } catch (e) { }

    const rawTypeVal = idxTipo !== -1 ? String(r[idxTipo] || '').trim().toLowerCase() : '';
    let type = 'product_catalog';
    if (rawTypeVal === 'simple' || rawTypeVal === 'simples') {
      type = 'simple';
    } else if (rawTypeVal === 'special' || rawTypeVal === 'especial') {
      type = 'special';
    } else if (rawTypeVal === 'recurrent' || rawTypeVal === 'recorrente') {
      type = 'recurrent';
    } else if (rawTypeVal === 'product_catalog' || rawTypeVal === 'cadastro' || rawTypeVal === 'produto') {
      type = 'product_catalog';
    } else if (rawTypeVal) {
      type = rawTypeVal;
    } else {
      type = (rawMp || rawChk) ? 'product_catalog' : 'simple';
    }

    const sku = (idxProdId !== -1 && r[idxProdId]) ? String(r[idxProdId]).trim() : String(r[2] || r[1] || '').trim();
    const title = (idxTitulo !== -1 && r[idxTitulo]) ? String(r[idxTitulo]).trim() : sku;
    const assignedTo = (idxAtribPara !== -1 && r[idxAtribPara]) ? String(r[idxAtribPara]).trim() : String(r[3] || '').trim();
    const assignedByName = (idxAtribPor !== -1 && r[idxAtribPor]) ? String(r[idxAtribPor]).trim() : String(r[4] || '').trim();
    const createdById = (idxCriadoPor !== -1 && r[idxCriadoPor]) ? String(r[idxCriadoPor]).trim() : String(r[5] || '').trim();
    const dueDate = formatDueDateToDdMm(idxPrazo !== -1 ? r[idxPrazo] : r[6]);
    const status = (idxStatus !== -1 && r[idxStatus]) ? String(r[idxStatus]).trim() : (sheetName === SHEETS.COMPLETED_TASKS ? 'completed' : 'in_progress');
    var notes = (idxObs !== -1 && r[idxObs]) ? String(r[idxObs]) : '';
    var recurrenceData = null;
    if (notes && notes.indexOf('__RECURRENCE__:') !== -1) {
      try {
        var recIndex = notes.indexOf('__RECURRENCE__:');
        var jsonPart = notes.substring(recIndex + 15).trim();
        recurrenceData = JSON.parse(jsonPart);
        notes = notes.substring(0, recIndex).trim();
      } catch (e) { }
    }

    const timeField = (idxDataHora !== -1 && r[idxDataHora]) ? String(r[idxDataHora]) : '';
    const taskId = rawId || formatToFiveDigits(index + 1);

    return {
      id: taskId,
      type: type,
      productId: sku,
      sku: sku,
      title: title || sku || ('Tarefa ' + (index + 1)),
      assignedTo: assignedTo,
      assignedByName: assignedByName,
      createdById: createdById,
      dueDate: dueDate,
      status: status,
      recurrence: recurrenceData,
      marketplaces: marketplaces,
      checklist: checklist,
      notes: notes,
      updatedAt: timeField,
      finalizadoEm: timeField
    };
  });
}

function upsertTask(task) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.TASKS);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEETS.TASKS);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;
  const idxId = hasIdCol ? headers.indexOf('id') : -1;
  const idxSku = headers.indexOf('sku') !== -1 ? headers.indexOf('sku') : (hasIdCol ? 2 : 1);
  const idxAssignee = headers.findIndex(h => h.includes('atrib') && h.includes('para'));

  let rowIndex = -1;
  const targetId = String(task.id || '').trim();
  const targetSku = String(task.sku || task.productId || task.title || '').trim().toLowerCase();
  const targetAssignee = String(task.assignedTo || '').trim().toLowerCase();

  // 1. Prioridade máxima: busca por ID exato
  if (hasIdCol && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // 2. Se não encontrou por ID E o targetId não foi fornecido (ou é novo), busca por SKU/Título + Atribuído
  // Se targetId foi fornecido e NÃO foi achado por ID, NÃO sobrescreve outra tarefa que tenha o mesmo SKU!
  if (rowIndex === -1 && !targetId && targetSku) {
    for (let i = 1; i < values.length; i++) {
      const rowSku = String(values[i][idxSku] || '').trim().toLowerCase();
      const rowAssignee = idxAssignee !== -1 ? String(values[i][idxAssignee] || '').trim().toLowerCase() : '';
      if (rowSku === targetSku && (!targetAssignee || !rowAssignee || rowAssignee === targetAssignee)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  let finalId = '';
  if (rowIndex > 0 && hasIdCol) {
    finalId = String(values[rowIndex - 1][idxId] || '').trim();
  }
  if (!finalId && targetId) {
    finalId = targetId;
  }
  if (!finalId) {
    finalId = getNextFormattedId([SHEETS.TASKS, SHEETS.COMPLETED_TASKS]);
  }

  var finalNotes = task.notes || '';
  if (task.recurrence && typeof task.recurrence === 'object') {
    finalNotes = (finalNotes ? (finalNotes + '\n') : '') + '__RECURRENCE__:' + JSON.stringify(task.recurrence);
  }

  const baseData = [
    task.type || 'product_catalog',
    task.sku || task.productId || task.title || '',
    task.assignedTo || '',
    task.assignedByName || '',
    task.createdById || '',
    formatDueDateToDdMm(task.dueDate) || '25/10',
    task.status || 'in_progress',
    JSON.stringify(task.marketplaces || {}),
    JSON.stringify(task.checklist || []),
    finalNotes,
    new Date().toISOString()
  ];

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: finalId, updated: true };
}

function upsertCompletedTask(task) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let compSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  if (!compSheet) {
    setupSheets();
    compSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  }

  const values = compSheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;
  const idxId = hasIdCol ? headers.indexOf('id') : -1;
  const idxSku = headers.indexOf('sku') !== -1 ? headers.indexOf('sku') : (hasIdCol ? 2 : 1);
  const idxAssignee = headers.findIndex(h => h.includes('atrib') && h.includes('para'));

  let rowIndex = -1;
  const targetId = String(task.id || '').trim();
  const targetSku = String(task.sku || task.productId || task.title || '').trim().toLowerCase();
  const targetAssignee = String(task.assignedTo || '').trim().toLowerCase();

  // 1. Busca por ID exato
  if (hasIdCol && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // 2. Busca por SKU/Título apenas se targetId não foi fornecido
  if (rowIndex === -1 && !targetId && targetSku) {
    for (let i = 1; i < values.length; i++) {
      const rowSku = String(values[i][idxSku] || '').trim().toLowerCase();
      const rowAssignee = idxAssignee !== -1 ? String(values[i][idxAssignee] || '').trim().toLowerCase() : '';
      if (rowSku === targetSku && (!targetAssignee || !rowAssignee || rowAssignee === targetAssignee)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  let finalId = targetId || '';
  if (!finalId && rowIndex > 0 && hasIdCol) {
    finalId = String(values[rowIndex - 1][idxId] || '').trim();
  }
  if (!finalId) {
    finalId = getNextFormattedId([SHEETS.TASKS, SHEETS.COMPLETED_TASKS]);
  }

  const baseData = [
    task.type || 'product_catalog',
    task.sku || task.productId || task.title || '',
    task.assignedTo || '',
    task.assignedByName || '',
    task.createdById || '',
    formatDueDateToDdMm(task.dueDate) || '25/10',
    'completed',
    JSON.stringify(task.marketplaces || {}),
    JSON.stringify(task.checklist || []),
    task.notes || '',
    new Date().toISOString()
  ];

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;

  if (rowIndex > 0) {
    compSheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    compSheet.appendRow(rowData);
  }

  return { id: finalId, updated: true };
}

function moveTaskToCompleted(task) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let compSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  if (!compSheet) {
    setupSheets();
    compSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  }

  deleteTaskRecord(SHEETS.TASKS, task);

  const values = compSheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;

  let finalId = String(task.id || '').trim();
  if (!finalId) {
    finalId = getNextFormattedId([SHEETS.TASKS, SHEETS.COMPLETED_TASKS]);
  }

  const targetSku = task.sku || task.productId || task.title || '';
  const baseData = [
    task.type || 'product_catalog',
    targetSku,
    task.assignedTo || '',
    task.assignedByName || '',
    task.createdById || '',
    formatDueDateToDdMm(task.dueDate) || '25/10',
    'completed',
    JSON.stringify(task.marketplaces || {}),
    JSON.stringify(task.checklist || []),
    task.notes || '',
    new Date().toISOString()
  ];

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;
  compSheet.appendRow(rowData);
  return { id: finalId, movedToCompleted: true };
}

function moveTaskToActive(task) {
  deleteTaskRecord(SHEETS.COMPLETED_TASKS, task);
  return upsertTask({ ...task, status: 'in_progress' });
}

function saveTasksBatch(tasksList) {
  tasksList.forEach(t => upsertTask(t));
}

function upsertProduct(prod) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  } else {
    ensureProductHeaders(sheet);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;
  const idxId = hasIdCol ? headers.indexOf('id') : -1;
  const idxSku = headers.indexOf('sku') !== -1 ? headers.indexOf('sku') : (hasIdCol ? 1 : 0);

  let rowIndex = -1;
  const targetId = String(prod.id || '').trim();
  const targetSku = String(prod.sku || prod.id || '').toUpperCase().trim();

  // 1. Busca por ID exato
  if (hasIdCol && targetId && !targetId.startsWith('prod_')) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // 2. Busca por SKU apenas se estiver editando um produto existente com o mesmo SKU
  if (rowIndex === -1 && targetSku) {
    for (let i = 1; i < values.length; i++) {
      const rowSku = String(values[i][idxSku] || '').toUpperCase().trim();
      if (rowSku === targetSku) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // Se já existe na planilha, mantém o ID original da linha; se for novo, gera um ID totalmente único
  let finalId = '';
  if (rowIndex > 0 && hasIdCol) {
    finalId = String(values[rowIndex - 1][idxId] || '').trim();
  }
  if (!finalId) {
    // Gera ID aleatório único que nunca colide com 1, 2, 3...
    finalId = getNextFormattedId(SHEETS.PRODUCTS);
  }

  const hasFotoCol = headers.some(h => h.includes('foto') || h.includes('imagem') || h.includes('img') || h.includes('url'));
  const fotoVal = prod.imageUrl || prod.foto || prod.image || '';

  const hasProdutoCol = headers.some(h => h === 'produto' || h.includes('produto') || h.includes('titulo') || h.includes('título') || h.includes('nome'));
  const prodNomeVal = prod.product || prod.title || prod.nome || prod.descricao || prod.sku || '';

  const hasPrecosCol = headers.some(h => h.includes('precos') || h.includes('channelprices') || h.includes('marketplaces_precos'));
  const precosVal = JSON.stringify(prod.channelPrices || {});

  let baseData = [];
  if (hasProdutoCol && hasFotoCol) {
    baseData = [
      prod.sku || prod.id || '',
      prodNomeVal,
      fotoVal,
      parseBrazilianNumber(prod.cost),
      parseBrazilianNumber(prod.width),
      parseBrazilianNumber(prod.length),
      parseBrazilianNumber(prod.height),
      parseBrazilianNumber(prod.weight)
    ];
  } else if (hasProdutoCol && !hasFotoCol) {
    baseData = [
      prod.sku || prod.id || '',
      prodNomeVal,
      parseBrazilianNumber(prod.cost),
      parseBrazilianNumber(prod.width),
      parseBrazilianNumber(prod.length),
      parseBrazilianNumber(prod.height),
      parseBrazilianNumber(prod.weight)
    ];
  } else if (hasFotoCol) {
    baseData = [
      prod.sku || prod.id || '',
      fotoVal,
      parseBrazilianNumber(prod.cost),
      parseBrazilianNumber(prod.width),
      parseBrazilianNumber(prod.length),
      parseBrazilianNumber(prod.height),
      parseBrazilianNumber(prod.weight)
    ];
  } else {
    baseData = [
      prod.sku || prod.id || '',
      parseBrazilianNumber(prod.cost),
      parseBrazilianNumber(prod.width),
      parseBrazilianNumber(prod.length),
      parseBrazilianNumber(prod.height),
      parseBrazilianNumber(prod.weight)
    ];
  }

  if (hasPrecosCol) {
    baseData.push(precosVal);
  }

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  try {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow > 2) {
      const colSkuIndex = idxSku !== -1 ? (idxSku + 1) : (hasIdCol ? 2 : 1);
      sheet.getRange(2, 1, lastRow - 1, lastCol).sort({ column: colSkuIndex, ascending: true });
    }
  } catch (errSort) {
    Logger.log('Erro ao ordenar produtos: ' + errSort);
  }

  return { id: finalId, sku: prod.sku, updated: true };
}

function saveProductsBatch(productsList) {
  productsList.forEach(p => upsertProduct(p));
}

function upsertPlatform(plat) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;
  const idxId = hasIdCol ? headers.indexOf('id') : -1;
  const idxNome = headers.findIndex(h => h === 'nome' || h.includes('plataforma'));

  let rowIndex = -1;
  const targetId = String(plat.id || '').trim();
  const targetName = String(plat.name || '').toLowerCase().trim();

  if (hasIdCol && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === targetId || rowId.toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1 && targetName) {
    const colName = idxNome !== -1 ? idxNome : (hasIdCol ? 1 : 0);
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][colName]).toLowerCase().trim() === targetName) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  let finalId = targetId && /^\d{5}$/.test(targetId) ? targetId : '';
  if (!finalId && rowIndex > 0 && hasIdCol) {
    finalId = String(values[rowIndex - 1][idxId] || '').trim();
  }
  if (!finalId) {
    finalId = getNextFormattedId(SHEETS.PLATFORMS);
  }

  const baseData = [
    plat.name || '',
    plat.color || '#5925dc'
  ];

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: finalId, name: plat.name, updated: true };
}

function savePlatformsBatch(platformsList) {
  platformsList.forEach(p => upsertPlatform(p));
}

function upsertUser(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEETS.USERS);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;
  const idxId = hasIdCol ? headers.indexOf('id') : -1;
  const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('login'));

  let rowIndex = -1;
  const targetId = String(user.id || '').trim();
  const targetEmail = String(user.email || '').toLowerCase().trim();

  if (hasIdCol && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === targetId || rowId.toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1 && targetEmail) {
    const colEmail = idxEmail !== -1 ? idxEmail : (hasIdCol ? 2 : 1);
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][colEmail]).toLowerCase().trim() === targetEmail) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  let finalId = targetId && /^\d{5}$/.test(targetId) ? targetId : '';
  if (!finalId && rowIndex > 0 && hasIdCol) {
    finalId = String(values[rowIndex - 1][idxId] || '').trim();
  }
  if (!finalId) {
    finalId = getNextFormattedId(SHEETS.USERS);
  }

  const baseData = [
    user.name || '',
    user.email || '',
    user.password || '123',
    JSON.stringify(user.platforms || [])
  ];

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: finalId, email: user.email, updated: true };
}

function saveUsersBatch(usersList) {
  usersList.forEach(u => upsertUser(u));
}

function deleteUserRecord(userOrData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { deleted: false };

  const id = String((userOrData && userOrData.id) || '').trim();
  const email = String((userOrData && (userOrData.email || userOrData.id)) || '').toLowerCase().trim();

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('login'));

  if (idxId !== -1 && id) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId === id || rowId.toLowerCase() === id.toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { id: id, deleted: true, matchedBy: 'id' };
      }
    }
  }

  const colEmail = idxEmail !== -1 ? idxEmail : 1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colEmail]).toLowerCase().trim() === email) {
      sheet.deleteRow(i + 1);
      return { email: email, deleted: true, matchedBy: 'email' };
    }
  }

  return { deleted: false };
}

function deleteProductRecord(prodOrData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) return { deleted: false };

  const id = String((prodOrData && prodOrData.id) || '').trim();
  const sku = String((prodOrData && (prodOrData.sku || prodOrData.id)) || '').toUpperCase().trim();

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxSku = headers.indexOf('sku') !== -1 ? headers.indexOf('sku') : 0;

  if (idxId !== -1 && id) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId === id || rowId.toLowerCase() === id.toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { id: id, deleted: true, matchedBy: 'id' };
      }
    }
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idxSku]).toUpperCase().trim() === sku) {
      sheet.deleteRow(i + 1);
      return { sku: sku, deleted: true, matchedBy: 'sku' };
    }
  }

  return { deleted: false };
}

function deletePlatformRecord(platOrData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!sheet) return { deleted: false };

  const id = String((platOrData && platOrData.id) || '').trim();
  const name = String((platOrData && (platOrData.name || platOrData.id)) || '').toLowerCase().trim();

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxNome = headers.findIndex(h => h === 'nome' || h.includes('plataforma'));

  if (idxId !== -1 && id) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId === id || rowId.toLowerCase() === id.toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { id: id, deleted: true, matchedBy: 'id' };
      }
    }
  }

  const colNome = idxNome !== -1 ? idxNome : 0;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colNome]).toLowerCase().trim() === name) {
      sheet.deleteRow(i + 1);
      return { name: name, deleted: true, matchedBy: 'name' };
    }
  }

  return { deleted: false };
}

function deleteTaskRecord(sheetName, taskOrData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { deleted: false };

  const id = String((taskOrData && taskOrData.id) || '').trim();
  const sku = String((taskOrData && (taskOrData.sku || taskOrData.productId)) || '').trim().toLowerCase();
  const title = String((taskOrData && taskOrData.title) || '').trim().toLowerCase();
  const assignedTo = String((taskOrData && (taskOrData.assignedTo || taskOrData.assignedByName)) || '').trim().toLowerCase();

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { deleted: false };

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxSku = headers.indexOf('sku') !== -1 ? headers.indexOf('sku') : headers.findIndex(h => h.includes('produto') || h.includes('sku'));
  const idxAssignee = headers.findIndex(h => h.includes('atrib') && h.includes('para'));

  // 1. Prioridade absoluta: Se tem ID, busca e exclui única e exclusivamente pelo ID
  if (idxId !== -1 && id) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === id || String(rowId).toLowerCase() === id.toLowerCase())) {
        sheet.deleteRow(i + 1);
        return { deleted: true, matchedBy: 'id', id: id };
      }
    }
  }

  // 2. Se e somente se NÃO tem ID (legado), busca por SKU + Atribuído
  if (!id) {
    for (let i = 1; i < values.length; i++) {
      const rowSku = idxSku !== -1 ? String(values[i][idxSku] || '').trim().toLowerCase() : String(values[i][1] || '').trim().toLowerCase();
      const rowAssignee = idxAssignee !== -1 ? String(values[i][idxAssignee] || '').trim().toLowerCase() : String(values[i][2] || '').trim().toLowerCase();

      const matchesAssignee = !assignedTo || rowAssignee === assignedTo || !rowAssignee;

      if (sku && rowSku === sku) {
        if (matchesAssignee) {
          sheet.deleteRow(i + 1);
          return { deleted: true, matchedBy: 'sku' };
        }
      }

      if (title && rowSku === title) {
        if (matchesAssignee) {
          sheet.deleteRow(i + 1);
          return { deleted: true, matchedBy: 'title' };
        }
      }
    }
  }

  return { deleted: false };
}

function getChecklistTemplatesDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.CHECKLIST_TEMPLATES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CHECKLIST_TEMPLATES);
    sheet.appendRow(['ID', 'Nome', 'Itens_JSON', 'AtualizadoEm']);
    styleHeader(sheet);
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxName = headers.findIndex(h => h.includes('nome') || h.includes('modelo'));
  const idxItems = headers.findIndex(h => h.includes('itens') || h.includes('checklist'));

  const templates = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const name = String(row[idxName !== -1 ? idxName : 1] || '').trim();
    if (!name) continue;

    const id = idxId !== -1 && row[idxId] ? String(row[idxId]).trim() : formatToFiveDigits(i);
    let items = [];
    const rawItems = row[idxItems !== -1 ? idxItems : 2];
    if (typeof rawItems === 'string' && rawItems.trim().startsWith('[')) {
      try {
        items = JSON.parse(rawItems);
      } catch (e) {
        items = [];
      }
    } else if (Array.isArray(rawItems)) {
      items = rawItems;
    }

    templates.push({
      id: id,
      name: name,
      items: Array.isArray(items) ? items : []
    });
  }

  return templates;
}

function upsertChecklistTemplate(templateData) {
  if (!templateData || !templateData.name) {
    return { error: 'Nome do modelo é obrigatório.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.CHECKLIST_TEMPLATES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CHECKLIST_TEMPLATES);
    sheet.appendRow(['ID', 'Nome', 'Itens_JSON', 'AtualizadoEm']);
    styleHeader(sheet);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxName = headers.findIndex(h => h.includes('nome') || h.includes('modelo'));
  const idxItems = headers.findIndex(h => h.includes('itens') || h.includes('checklist'));
  const idxUpdated = headers.findIndex(h => h.includes('atualizado') || h.includes('data'));

  const nameToMatch = String(templateData.name || '').trim().toLowerCase();
  const idToMatch = templateData.id ? String(templateData.id).trim() : '';
  const itemsJson = JSON.stringify(Array.isArray(templateData.items) ? templateData.items : []);
  const nowStr = new Date().toISOString();

  for (let i = 1; i < values.length; i++) {
    const rowId = idxId !== -1 ? String(values[i][idxId] || '').trim() : '';
    const rowName = idxName !== -1 ? String(values[i][idxName] || '').trim().toLowerCase() : '';

    const isMatch = (idToMatch && (rowId === idToMatch || rowId.toLowerCase() === idToMatch.toLowerCase())) ||
      (rowName && rowName === nameToMatch);

    if (isMatch) {
      const rowNum = i + 1;
      if (idxName !== -1) sheet.getRange(rowNum, idxName + 1).setValue(templateData.name.trim());
      if (idxItems !== -1) sheet.getRange(rowNum, idxItems + 1).setValue(itemsJson);
      if (idxUpdated !== -1) sheet.getRange(rowNum, idxUpdated + 1).setValue(nowStr);
      return { status: 'updated', id: rowId || templateData.id, name: templateData.name.trim() };
    }
  }

  const newId = getNextFormattedId([SHEETS.CHECKLIST_TEMPLATES]);
  const newRow = [];
  const colCount = Math.max(headers.length, 4);

  for (let c = 0; c < colCount; c++) {
    if (c === idxId) newRow.push(newId);
    else if (c === (idxName !== -1 ? idxName : 1)) newRow.push(templateData.name.trim());
    else if (c === (idxItems !== -1 ? idxItems : 2)) newRow.push(itemsJson);
    else if (c === (idxUpdated !== -1 ? idxUpdated : 3)) newRow.push(nowStr);
    else newRow.push('');
  }

  sheet.appendRow(newRow);
  return { status: 'created', id: newId, name: templateData.name.trim() };
}

function deleteChecklistTemplateRecord(templateData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CHECKLIST_TEMPLATES);
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { deleted: false };

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxName = headers.findIndex(h => h.includes('nome') || h.includes('modelo'));

  const id = templateData && templateData.id ? String(templateData.id).trim() : '';
  const name = templateData && templateData.name ? String(templateData.name).trim().toLowerCase() : '';

  for (let i = 1; i < values.length; i++) {
    const rowId = idxId !== -1 ? String(values[i][idxId] || '').trim() : '';
    const rowName = idxName !== -1 ? String(values[i][idxName] || '').trim().toLowerCase() : '';

    const isMatch = (id && (rowId === id || rowId.toLowerCase() === id.toLowerCase())) ||
      (name && rowName === name);

    if (isMatch) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: rowId, name: rowName };
    }
  }

  return { deleted: false };
}

function getAnnotationsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.ANNOTATIONS) || ss.getSheetByName('Anotacao') || ss.getSheetByName('Anotações');
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  const idxData = headers.findIndex(h => h.includes('data'));
  const idxTipo = headers.findIndex(h => h.includes('tipo'));
  const idxPlat = headers.findIndex(h => h.includes('plat'));
  const idxPedido = headers.findIndex(h => h.includes('ped'));
  const idxValor = headers.findIndex(h => h.includes('val'));
  const idxObs = headers.findIndex(h => h.includes('obs'));
  const idxUser = headers.findIndex(h => h.includes('usu'));

  const knownPlatforms = [
    'shopee jbc', 'shopee izabela', 'shopee principal', 'shopee oficial', 'shopee',
    'mercado livre jbc', 'mercado livre', 'mercado l', 'amazon jbc', 'amazon',
    'magalu jbc', 'magalu', 'shein jbc', 'shein', 'geral / outros', 'geral', 'outros'
  ];

  return rows.map((r, index) => {
    let rawDate = idxData !== -1 ? r[idxData] : '';
    let formattedDate = '';
    if (rawDate instanceof Date) {
      const dd = String(rawDate.getDate()).padStart(2, '0');
      const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
      formattedDate = dd + '/' + mm;
    } else {
      formattedDate = String(rawDate || '').trim();
      if (formattedDate.includes('/') && formattedDate.length > 5) {
        const parts = formattedDate.split(' ')[0].split('/');
        if (parts.length >= 2) formattedDate = parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0');
      }
    }

    let rawId = (idxId !== -1 && r[idxId]) ? String(r[idxId]).trim() : '';
    let formattedId = rawId || ('anot_' + (index + 1));

    let typeVal = idxTipo !== -1 && r[idxTipo] ? String(r[idxTipo]).trim() : '';
    let platVal = idxPlat !== -1 && r[idxPlat] ? String(r[idxPlat]).trim() : '';
    let orderVal = idxPedido !== -1 && r[idxPedido] ? String(r[idxPedido]).trim() : '';
    let valStr = idxValor !== -1 && r[idxValor] !== '' && r[idxValor] !== undefined ? String(r[idxValor]).trim() : '';
    let obsVal = idxObs !== -1 && r[idxObs] ? String(r[idxObs]).trim() : '';
    let userVal = idxUser !== -1 && r[idxUser] ? String(r[idxUser]).trim() : '';

    if (knownPlatforms.some(kp => valStr.toLowerCase().includes(kp))) {
      if (!platVal) platVal = valStr;
      valStr = '';
    }

    if ((!valStr || valStr === '-') && (obsVal.includes('R$') || /^\s*R?\$?\s*\d+([.,]\d{2})?\s*$/.test(obsVal))) {
      valStr = obsVal;
      obsVal = '';
    }

    if (obsVal.includes('R$') && (!valStr.includes('R$') && !/\d+,\d{2}/.test(valStr))) {
      const temp = valStr;
      valStr = obsVal;
      obsVal = temp;
    }

    if (userVal.includes('R$') || ((!valStr || valStr === '-') && /\d+,\d{2}/.test(userVal))) {
      valStr = userVal;
      userVal = '';
    }

    if (typeVal.toLowerCase().includes('envio') || typeVal.toLowerCase().includes('direta')) {
      typeVal = 'Entrega Direta';
    } else if (typeVal.toLowerCase().includes('manual') || typeVal.toLowerCase().includes('pontual')) {
      typeVal = 'Gasto Pontual';
    } else if (typeVal.toLowerCase().includes('local')) {
      typeVal = 'Entrega Local';
    } else if (typeVal.toLowerCase().includes('retirada') || typeVal.toLowerCase().includes('fabrica')) {
      typeVal = 'Retirada Fábrica';
    } else if (typeVal.toLowerCase().includes('preju')) {
      typeVal = 'Prejuízo';
    } else if (!typeVal || typeVal.toLowerCase().includes('anota')) {
      typeVal = 'Anotação';
    }

    if (valStr && !valStr.startsWith('R$')) {
      const num = parseFloat(valStr.replace(/[^0-9,-.]/g, '').replace(',', '.'));
      if (!isNaN(num)) {
        valStr = 'R$ ' + num.toFixed(2).replace('.', ',');
      }
    }

    if (!userVal) userVal = 'Allyson';

    return {
      id: formattedId,
      date: formattedDate,
      type: typeVal,
      platform: platVal,
      orderNumber: orderVal,
      value: valStr,
      notes: obsVal,
      usuario: userVal
    };
  });
}

function saveAnnotationRecord(annotationData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.ANNOTATIONS) || ss.getSheetByName('Anotacao') || ss.getSheetByName('Anotações');
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.ANNOTATIONS);
    sheet.appendRow(['ID', 'Data', 'Tipo', 'Plataforma', 'Pedido', 'Valor', 'Observação', 'Usuário']);
    styleHeader(sheet);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const idxId = headers.indexOf('id');
  const targetId = annotationData.id ? String(annotationData.id).trim() : '';

  let rowIndex = -1;
  if (idxId !== -1 && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === targetId || rowId.toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const hasIdCol = idxId !== -1;

  let finalId = '';
  if (rowIndex > 0 && hasIdCol) {
    finalId = String(values[rowIndex - 1][idxId] || '').trim();
  }
  if (!finalId && targetId) {
    finalId = targetId;
  }
  if (!finalId) {
    finalId = getNextFormattedId([SHEETS.ANNOTATIONS]);
  }

  let dateStr = annotationData.date || annotationData.data || '';
  if (!dateStr) {
    const now = new Date();
    dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'dd/MM');
  }

  let type = String(annotationData.type || annotationData.tipo || 'Anotação').trim();
  if (type.toLowerCase().includes('envio') || type.toLowerCase().includes('direta')) {
    type = 'Entrega Direta';
  } else if (type.toLowerCase().includes('manual') || type.toLowerCase().includes('pontual')) {
    type = 'Gasto Pontual';
  }

  let platform = String(annotationData.platform || '').trim();
  if (!platform || platform.toLowerCase() === 'nenhuma' || platform === '-') {
    platform = '-';
  }
  const orderNumber = String(annotationData.orderNumber || annotationData.pedido || '').trim();

  let value = String(annotationData.value || annotationData.valor || '').trim();
  if (value && !value.startsWith('R$')) {
    const num = parseFloat(value.replace(/[^0-9,-.]/g, '').replace(',', '.'));
    if (!isNaN(num)) {
      value = 'R$ ' + num.toFixed(2).replace('.', ',');
    }
  }

  const notes = String(annotationData.notes || annotationData.observacao || annotationData.observation || '').trim();
  const user = String(annotationData.usuario || annotationData.userName || annotationData.user || 'Allyson').trim();

  const finalRow = hasIdCol
    ? [finalId, dateStr, type, platform, orderNumber, value, notes, user]
    : [dateStr, type, platform, orderNumber, value, notes, user];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, finalRow.length).setValues([finalRow]);
  } else {
    sheet.appendRow(finalRow);
  }

  return { status: 'success', id: finalId, date: dateStr, platform: platform };
}

function deleteAnnotationRecord(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.ANNOTATIONS) || ss.getSheetByName('Anotacao') || ss.getSheetByName('Anotações');
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { deleted: false };

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const targetId = data && data.id ? String(data.id).trim() : String(data || '').trim();

  for (let i = 1; i < values.length; i++) {
    const rowId = idxId !== -1 ? String(values[i][idxId] || '').trim() : '';
    if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: targetId };
    }
  }

  return { deleted: false };
}

function getDisputesDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.DISPUTES) || ss.getSheetByName('Disputa');
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  const idxPlat = headers.findIndex(h => h.includes('plat'));
  const idxData = headers.findIndex(h => h.includes('data'));
  const idxProd = headers.findIndex(h => h.includes('prod'));
  const idxPedido = headers.findIndex(h => h.includes('ped'));
  const idxDesc = headers.findIndex(h => h.includes('desc'));
  const idxObs = headers.findIndex(h => h.includes('obs'));
  const idxDev = headers.findIndex(h => h.includes('devol'));
  const idxSit = headers.findIndex(h => h.includes('situa'));

  return rows.map((r, index) => {
    let rawDate = idxData !== -1 ? r[idxData] : '';
    let formattedDate = '';
    if (rawDate instanceof Date) {
      const dd = String(rawDate.getDate()).padStart(2, '0');
      const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
      formattedDate = `${dd}/${mm}`;
    } else {
      formattedDate = String(rawDate || '').trim();
    }

    return {
      id: idxId !== -1 && r[idxId] ? String(r[idxId]).trim() : ('disp_' + (index + 1)),
      platform: idxPlat !== -1 ? String(r[idxPlat] || '').trim() : 'SH',
      date: formattedDate,
      product: idxProd !== -1 ? String(r[idxProd] || '').trim() : '',
      orderNumber: idxPedido !== -1 ? String(r[idxPedido] || '').trim() : '',
      description: idxDesc !== -1 ? String(r[idxDesc] || '').trim() : '',
      notes: idxObs !== -1 ? String(r[idxObs] || '').trim() : '',
      returnCode: idxDev !== -1 ? String(r[idxDev] || '').trim() : '',
      status: idxSit !== -1 && r[idxSit] ? String(r[idxSit] || '').trim() : 'Em Disputa'
    };
  });
}

function upsertDisputeRecord(dispute) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.DISPUTES) || ss.getSheetByName('Disputa');
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.DISPUTES);
    sheet.appendRow(['ID', 'Plataforma', 'Data', 'Produto', 'Pedido', 'Descrição', 'Observação', 'Devolução', 'Situação']);
    styleHeader(sheet);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const targetId = dispute.id ? String(dispute.id).trim() : '';

  let rowIndex = -1;
  if (idxId !== -1 && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId] || '').trim();
      if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const hasIdCol = idxId !== -1;
  const finalId = targetId || (hasIdCol ? getNextFormattedId([SHEETS.DISPUTES, 'Disputa']) : '');

  const rowData = [
    dispute.platform || 'SH',
    dispute.date || '',
    dispute.product || '',
    dispute.orderNumber || '',
    dispute.description || '',
    dispute.notes || '',
    dispute.returnCode || '',
    dispute.status || 'Em Disputa'
  ];

  const fullRow = hasIdCol ? [finalId, ...rowData] : rowData;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, fullRow.length).setValues([fullRow]);
  } else {
    sheet.appendRow(fullRow);
  }

  return { status: 'success', id: finalId };
}

function deleteDisputeRecord(disputeData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.DISPUTES) || ss.getSheetByName('Disputa');
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { deleted: false };

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const targetId = disputeData && disputeData.id ? String(disputeData.id).trim() : String(disputeData || '').trim();

  for (let i = 1; i < values.length; i++) {
    const rowId = idxId !== -1 ? String(values[i][idxId] || '').trim() : '';
    if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: targetId };
    }
  }

  return { deleted: false };
}

function getBillsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.BILLS) || ss.getSheetByName('Contas a Pagar');
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const idxDia = headers.findIndex(h => h === 'dia' || h === 'day');
  const idxMes = headers.findIndex(h => h === 'mês' || h === 'mes' || h === 'month');
  const idxAno = headers.findIndex(h => h === 'ano' || h === 'year');
  const idxDesc = headers.findIndex(h => h === 'descrição' || h === 'descricao' || h === 'description');
  const idxValor = headers.findIndex(h => h === 'valor' || h === 'value');
  const idxStatus = headers.findIndex(h => h === 'status' || h === 'situação' || h === 'situacao');
  const idxTipo = headers.findIndex(h => h === 'categoria' || h === 'tipo' || h === 'recorrente' || h === 'recorrencia' || h === 'recurring');
  const idxPaidMonths = headers.findIndex(h => h === 'paidmonths' || h.includes('paidmonths') || h.includes('mesespagos') || h.includes('histórico') || h.includes('historico'));

  const bills = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const desc = idxDesc !== -1 ? String(row[idxDesc] || '').trim() : '';
    const day = idxDia !== -1 ? parseInt(row[idxDia], 10) : 1;
    if (!desc && isNaN(day)) continue;

    const rawTipo = idxTipo !== -1 ? String(row[idxTipo] || '').trim() : '';
    const rawTipoLower = rawTipo.toLowerCase();
    
    // Mapeia a categoria/tipo salvo exatamente como na interface
    let billType = 'pontual';
    let categoriaLabel = 'Pontual';
    if (rawTipoLower === 'mensal') { billType = 'mensal'; categoriaLabel = 'Mensal'; }
    else if (rawTipoLower === 'cartão de crédito' || rawTipoLower === 'cartao de credito' || rawTipoLower === 'cartao') { billType = 'cartao'; categoriaLabel = 'Cartão de Crédito'; }
    else if (rawTipoLower === 'boleto') { billType = 'boleto'; categoriaLabel = 'Boleto'; }
    else if (rawTipoLower === 'empréstimo' || rawTipoLower === 'emprestimo') { billType = 'emprestimo'; categoriaLabel = 'Empréstimo'; }
    else if (rawTipoLower === 'cheque') { billType = 'cheque'; categoriaLabel = 'Cheque'; }
    else if (rawTipoLower === 'pontual') { billType = 'pontual'; categoriaLabel = 'Pontual'; }
    else {
      // Detecção inteligente por nome se for legado
      const descLower = desc.toLowerCase();
      if (descLower.includes('cart') || descLower.includes('mercado pago') || descLower.includes('inter') || descLower.includes('c6') || descLower.includes('nubank')) {
        billType = 'cartao';
        categoriaLabel = 'Cartão de Crédito';
      }
      else if (descLower.includes('empr')) { billType = 'emprestimo'; categoriaLabel = 'Empréstimo'; }
      else if (descLower.includes('cheq')) { billType = 'cheque'; categoriaLabel = 'Cheque'; }
      else if (descLower.includes('boleto')) { billType = 'boleto'; categoriaLabel = 'Boleto'; }
      else if (rawTipoLower === 'sim' || rawTipoLower === 'true') { billType = 'mensal'; categoriaLabel = 'Mensal'; }
    }

    const isRecurring = billType === 'mensal' || billType === 'cartao';

    let paidMonthsData = {};
    if (idxPaidMonths !== -1 && row[idxPaidMonths]) {
      try {
        paidMonthsData = JSON.parse(String(row[idxPaidMonths]));
      } catch (e) {
        paidMonthsData = {};
      }
    }

    bills.push({
      id: idxId !== -1 && row[idxId] ? String(row[idxId]).trim() : ('bill_' + i),
      day: isNaN(day) ? 1 : day,
      month: idxMes !== -1 ? (parseInt(row[idxMes], 10) || 1) : 1,
      year: idxAno !== -1 ? (parseInt(row[idxAno], 10) || new Date().getFullYear()) : new Date().getFullYear(),
      description: desc,
      value: idxValor !== -1 ? (row[idxValor] !== '' && row[idxValor] !== null ? row[idxValor] : '') : '',
      status: idxStatus !== -1 && row[idxStatus] ? String(row[idxStatus]).trim() : 'pending',
      paidMonths: paidMonthsData,
      billType: billType,
      tipo: categoriaLabel,
      categoria: categoriaLabel,
      isRecurring: isRecurring,
      recurringType: isRecurring ? 'monthly' : 'once'
    });
  }

  return bills;
}

function upsertBillRecord(bill) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.BILLS) || ss.getSheetByName('Contas a Pagar');
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.BILLS);
    sheet.appendRow(['ID', 'Dia', 'Mês', 'Ano', 'Descrição', 'Valor', 'Status', 'Categoria', 'PaidMonths']);
    styleHeader(sheet);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const targetId = bill && bill.id ? String(bill.id).trim() : '';

  let rowIndex = -1;
  if (idxId !== -1 && targetId) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId] || '').trim();
      if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const hasIdCol = idxId !== -1;
  const finalId = targetId || (hasIdCol ? ('bill_' + Date.now()) : '');

  // Formata o nome da Categoria para gravação elegante na coluna da planilha
  let categoriaLabel = 'Pontual';
  const bt = String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase();
  if (bt === 'cartao' || bt === 'cartão de crédito' || bt === 'cartao de credito') categoriaLabel = 'Cartão de Crédito';
  else if (bt === 'mensal') categoriaLabel = 'Mensal';
  else if (bt === 'boleto') categoriaLabel = 'Boleto';
  else if (bt === 'emprestimo' || bt === 'empréstimo') categoriaLabel = 'Empréstimo';
  else if (bt === 'cheque') categoriaLabel = 'Cheque';
  else if (bill.isRecurring || bill.recurringType === 'monthly') categoriaLabel = 'Mensal';

  const paidMonthsStr = (bill.paidMonths && typeof bill.paidMonths === 'object' && Object.keys(bill.paidMonths).length > 0)
    ? JSON.stringify(bill.paidMonths)
    : '';

  const hasPaidMonthsCol = headers.findIndex(h => h === 'paidmonths' || h.includes('paidmonths') || h.includes('mesespagos')) !== -1;

  const rowData = [
    bill.day || 1,
    bill.month || 1,
    bill.year || new Date().getFullYear(),
    bill.description || '',
    bill.value || '',
    bill.status || 'pending',
    categoriaLabel
  ];

  if (hasPaidMonthsCol || paidMonthsStr) {
    rowData.push(paidMonthsStr);
  }

  const fullRow = hasIdCol ? [finalId, ...rowData] : rowData;

  if (rowIndex > 0) {
    // Se a planilha ainda não tem a coluna de cabeçalho PaidMonths mas precisa salvar
    if (paidMonthsStr && !hasPaidMonthsCol && headers.length < fullRow.length) {
      sheet.getRange(1, fullRow.length).setValue('PaidMonths');
    }
    sheet.getRange(rowIndex, 1, 1, fullRow.length).setValues([fullRow]);
  } else {
    if (paidMonthsStr && !hasPaidMonthsCol && headers.length < fullRow.length) {
      sheet.getRange(1, fullRow.length).setValue('PaidMonths');
    }
    sheet.appendRow(fullRow);
  }

  return { status: 'success', id: finalId };
}

function deleteBillRecord(billData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.BILLS) || ss.getSheetByName('Contas a Pagar');
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { deleted: false };

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idxId = headers.indexOf('id');
  const targetId = billData && billData.id ? String(billData.id).trim() : String(billData || '').trim();

  for (let i = 1; i < values.length; i++) {
    const rowId = idxId !== -1 ? String(values[i][idxId] || '').trim() : '';
    if (rowId && (rowId === targetId || String(rowId).toLowerCase() === targetId.toLowerCase())) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: targetId };
    }
  }

  return { deleted: false };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================================================
 * MÓDULO FINANCEIRO (Resumo de Marketplaces e Pedidos por Mês)
 * ============================================================================
 */

/**
 * Retorna as abas mensais disponíveis na planilha (ex: "Nov 26", "Dez 26", "Jan 27")
 */
function getAvailableFinancialSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();
  const monthRegex = /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*\d{2}$/i;
  
  const monthSheets = [];
  allSheets.forEach(sheet => {
    const name = sheet.getName().trim();
    if (monthRegex.test(name)) {
      monthSheets.push(name);
    }
  });

  // Se não encontrou pelo regex exato, procura abas que contenham nomes de meses e ano
  if (monthSheets.length === 0) {
    allSheets.forEach(sheet => {
      const name = sheet.getName().trim();
      if (/Nov\s*26/i.test(name) || /Dez\s*26/i.test(name) || /Jan\s*27/i.test(name)) {
        monthSheets.push(name);
      }
    });
  }

  // Fallback garantido
  if (monthSheets.length === 0) {
    monthSheets.push('Nov 26');
  }

  return monthSheets;
}

/**
 * Extrai os dados de Resumo (B1:J16) e Pedidos (B154:N1010) de uma aba mensal (ex: 'Nov 26')
 */
function getFinancialDataFromMonth(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetName = sheetName || 'Nov 26';
  let sheet = ss.getSheetByName(targetName);

  if (!sheet) {
    // Procura por aproximação
    const all = ss.getSheets();
    sheet = all.find(s => s.getName().trim().toLowerCase() === targetName.trim().toLowerCase());
  }

  if (!sheet) {
    return {
      sheetName: targetName,
      availableSheets: getAvailableFinancialSheets(),
      resumo: [],
      pedidos: [],
      error: 'Aba não encontrada: ' + targetName
    };
  }

  // 1. EXTRAI RESUMO: B1:J16 (Linhas 1 a 16, Colunas B=2 até J=10)
  // B: Plataforma, C: Margem, D: Faturamento, E: Descontos, F: Recebido, G: Lucro Bruto, H: Comissão, I: Lucro Líquido, J: Qtd
  const resumoValues = sheet.getRange(1, 2, 16, 9).getValues();
  const resumoList = [];

  // Linha 0 (linha 1 da planilha) pode ser o título "MARKETPLACES" ou cabeçalho.
  // Vamos ler as linhas a partir de onde começa os cabeçalhos/dados
  for (let r = 0; r < resumoValues.length; r++) {
    const row = resumoValues[r];
    const plataforma = String(row[0] || '').trim();
    if (!plataforma) continue;
    if (plataforma.toUpperCase() === 'MARKETPLACES') continue;
    if (plataforma.toLowerCase() === 'plataforma') continue; // cabeçalho

    resumoList.push({
      plataforma: plataforma,
      margem: row[1],
      faturamento: row[2],
      descontos: row[3],
      recebido: row[4],
      lucroBruto: row[5],
      comissao: row[6],
      lucroLiquido: row[7],
      qtd: row[8],
      isTotal: plataforma.toUpperCase() === 'TOTAL'
    });
  }

  // 2. EXTRAI PEDIDOS: B154:N1010
  // B: Marketplace, C: Unid, D: Produto, E: Preço, F: Recebido, G: Lucro Bruto, H: Comissão, I: Lucro Liq, J: P (pago?), K: Pedido, L: Situação, M: Entrega, N: Margem
  let pedidosList = [];
  const startRow = 154;
  const numRows = Math.min(sheet.getLastRow() - startRow + 1, 857); // até linha 1010 max

  if (numRows > 0) {
    const pedidosValues = sheet.getRange(startRow, 2, numRows, 13).getValues();
    for (let i = 0; i < pedidosValues.length; i++) {
      const row = pedidosValues[i];
      const mkp = String(row[0] || '').trim();
      const prod = String(row[2] || '').trim();
      const order = String(row[9] || '').trim();

      // Pula linha de cabeçalho "Marketplace" ou "MARKETPLACES" ou linhas em branco
      if (!mkp && !prod && !order) continue;
      if (mkp.toUpperCase() === 'MARKETPLACES' || mkp.toLowerCase() === 'marketplace') continue;

      pedidosList.push({
        id: 'ped_' + (startRow + i),
        marketplace: mkp,
        unid: row[1],
        produto: prod,
        preco: row[3],
        recebido: row[4],
        lucroBruto: row[5],
        comissao: row[6],
        lucroLiquido: row[7],
        pago: row[8] === true || String(row[8]).toLowerCase() === 'true' || String(row[8]).trim() === '✔' || String(row[8]).trim() === '✓',
        pedido: order,
        situacao: String(row[10] || '').trim(),
        entrega: String(row[11] || '').trim(),
        margem: row[12]
      });
    }
  }

  return {
    sheetName: targetName,
    availableSheets: getAvailableFinancialSheets(),
    resumo: resumoList,
    pedidos: pedidosList
  };
}