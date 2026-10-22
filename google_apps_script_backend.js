/**
 * ============================================================================
 * TARESK - BACKEND GOOGLE APPS SCRIPT (JBC ELETRO)
 * ============================================================================
 * Este script transforma sua Planilha do Google Sheets em uma API REST completa
 * para sincronizar Usuários, Produtos, Plataformas, Tarefas, Checklists e Precificações.
 * 
 * ESTRUTURA COM SUPORTE A ID FORMATADO (00001, 00002, ...):
 * - Tarefas / Tarefas_Finalizadas: [ID, Tipo, SKU, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, AtualizadoEm]
 * - Produtos: [ID, SKU, Custo, Largura, Comprimento, Altura, Peso]
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
  PRICING: 'Precificadora'
};

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

  // 2. Aba Produtos: [ID, SKU, Custo, Largura, Comprimento, Altura, Peso]
  let prodSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!prodSheet) {
    prodSheet = ss.insertSheet(SHEETS.PRODUCTS);
    prodSheet.appendRow(['ID', 'SKU', 'Custo', 'Largura', 'Comprimento', 'Altura', 'Peso']);
    prodSheet.appendRow(['00001', 'FOG-02-BOC', 145.00, 32, 54, 18, 4.80]);
    prodSheet.appendRow(['00002', 'PAN-ELE-05L', 120.00, 30, 30, 35, 3.50]);
    prodSheet.appendRow(['00003', 'VENT-COL-40', 89.90, 45, 45, 130, 5.20]);
    prodSheet.appendRow(['00004', 'FRIT-AIR-4L', 185.00, 33, 33, 38, 4.60]);
    styleHeader(prodSheet);
  } else {
    ensureIdColumn(prodSheet, 'ID');
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

  Logger.log('Todas as abas do Taresk foram configuradas com suporte a ID (00001, 00002...)!');
}

/**
 * Se a aba já existir sem coluna ID, insere a coluna ID como primeira coluna e gera números sequenciais
 */
function ensureIdColumn(sheet, headerName) {
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return;

  const firstHeader = String(values[0][0] || '').toLowerCase().trim();
  if (firstHeader === 'id') {
    // Se a coluna ID já existir, preenche eventuais linhas vazias
    for (let i = 1; i < values.length; i++) {
      if (!values[i][0]) {
        sheet.getRange(i + 1, 1).setValue(formatToFiveDigits(i));
      }
    }
    return;
  }

  // Se não existir, insere a coluna ID no início
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

/**
 * Converte um número ou string numérica para 5 dígitos com zeros à esquerda (ex: 1 -> "00001")
 */
function formatToFiveDigits(num) {
  if (typeof num === 'string' && /^\d{5}$/.test(num)) return num;
  const parsed = parseInt(num, 10);
  if (isNaN(parsed) || parsed < 0) return '00001';
  return String(parsed).padStart(5, '0');
}

/**
 * Calcula o próximo ID sequencial em formato "00001" procurando em uma ou mais abas
 */
function getNextFormattedId(sheetNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const names = Array.isArray(sheetNames) ? sheetNames : [sheetNames];
  let maxId = 0;

  names.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return;

    const headers = values[0].map(h => String(h).toLowerCase().trim());
    const idxId = headers.indexOf('id');
    const colIndex = idxId !== -1 ? idxId : 0;

    for (let i = 1; i < values.length; i++) {
      const val = values[i][colIndex];
      const match = String(val || '').match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (!isNaN(n) && n > maxId) {
          maxId = n;
        }
      }
    }
  });

  return formatToFiveDigits(maxId + 1);
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
        pricing: getSheetDataAsJson(SHEETS.PRICING)
      };
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

      default:
        result = { error: 'Ação POST não reconhecida: ' + action };
    }

    return createJsonResponse({ status: 'success', result: result });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Converte qualquer valor em número Float válido
 */
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

/**
 * Normaliza qualquer data para o formato dd/mm
 */
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

/**
 * Retorna linhas de uma aba genérica convertidas em Objetos JSON
 */
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

/**
 * Retorna Usuários da aba "Usuarios"
 */
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
    const avatar = (idxAvatar !== -1 && r[idxAvatar]) ? String(r[idxAvatar]) : (isMaster ? '⚡' : '👤');
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

/**
 * Retorna Produtos da aba "Produtos"
 */
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
  const idxTitulo = headers.findIndex(h => h.includes('titulo') || h.includes('nome'));
  const idxCusto = headers.indexOf('custo');
  const idxLargura = headers.indexOf('largura');
  const idxComp = headers.findIndex(h => h.includes('comp'));
  const idxAltura = headers.indexOf('altura');
  const idxPeso = headers.indexOf('peso');

  return rows.map((r, i) => {
    const rawId = idxId !== -1 && r[idxId] ? String(r[idxId]).trim() : '';
    const sku = idxSku !== -1 ? String(r[idxSku] || '').trim() : String(r[0] || '').trim();
    const titulo = idxTitulo !== -1 && r[idxTitulo] ? String(r[idxTitulo]).trim() : '';

    return {
      id: rawId || sku || ('prod_' + (i + 1)),
      sku: sku,
      title: titulo,
      cost: idxCusto !== -1 ? parseBrazilianNumber(r[idxCusto]) : 0,
      width: idxLargura !== -1 ? parseBrazilianNumber(r[idxLargura]) : 0,
      length: idxComp !== -1 ? parseBrazilianNumber(r[idxComp]) : 0,
      height: idxAltura !== -1 ? parseBrazilianNumber(r[idxAltura]) : 0,
      weight: idxPeso !== -1 ? parseBrazilianNumber(r[idxPeso]) : 0
    };
  });
}

/**
 * Retorna Plataformas da aba "Plataformas"
 */
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

/**
 * Retorna as tarefas com IDs físicos de 5 dígitos (00001...)
 */
function getTasksDataAsJson(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxId = headers.indexOf('id');
  const idxTipo = headers.findIndex(h => h.includes('tipo'));
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

    const type = (idxTipo !== -1 && r[idxTipo]) ? r[idxTipo] : (r[0] || 'product_catalog');
    const sku = (idxProdId !== -1 && r[idxProdId]) ? String(r[idxProdId]).trim() : String(r[1] || '').trim();
    const title = (idxTitulo !== -1 && r[idxTitulo]) ? String(r[idxTitulo]).trim() : sku;
    const assignedTo = (idxAtribPara !== -1 && r[idxAtribPara]) ? String(r[idxAtribPara]).trim() : String(r[2] || '').trim();
    const assignedByName = (idxAtribPor !== -1 && r[idxAtribPor]) ? String(r[idxAtribPor]).trim() : String(r[3] || '').trim();
    const createdById = (idxCriadoPor !== -1 && r[idxCriadoPor]) ? String(r[idxCriadoPor]).trim() : String(r[4] || '').trim();
    const dueDate = formatDueDateToDdMm(idxPrazo !== -1 ? r[idxPrazo] : r[5]);
    const status = (idxStatus !== -1 && r[idxStatus]) ? String(r[idxStatus]).trim() : (sheetName === SHEETS.COMPLETED_TASKS ? 'completed' : 'in_progress');
    const notes = (idxObs !== -1 && r[idxObs]) ? String(r[idxObs]) : '';
    const timeField = (idxDataHora !== -1 && r[idxDataHora]) ? String(r[idxDataHora]) : '';

    // Usa o ID físico se existir; se não, formata o índice como 00001
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
      marketplaces: marketplaces,
      checklist: checklist,
      notes: notes,
      updatedAt: timeField,
      finalizadoEm: timeField
    };
  });
}

/**
 * Salva ou atualiza uma Tarefa ativa
 */
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

  // 1. Procura primeiro pelo ID exato
  if (hasIdCol && targetId && /^\d{5}$/.test(targetId)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === targetId) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // 2. Fallback por SKU + Responsável se não encontrou por ID
  if (rowIndex === -1 && targetSku) {
    for (let i = 1; i < values.length; i++) {
      const rowSku = String(values[i][idxSku] || '').trim().toLowerCase();
      const rowAssignee = idxAssignee !== -1 ? String(values[i][idxAssignee] || '').trim().toLowerCase() : '';
      if (rowSku === targetSku && (!targetAssignee || !rowAssignee || rowAssignee === targetAssignee)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // Define ou mantém o ID de 5 dígitos
  let finalId = targetId && /^\d{5}$/.test(targetId) ? targetId : '';
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
    task.status || 'in_progress',
    JSON.stringify(task.marketplaces || {}),
    JSON.stringify(task.checklist || []),
    task.notes || '',
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

/**
 * Salva ou atualiza tarefa concluída
 */
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

  if (hasIdCol && targetId && /^\d{5}$/.test(targetId)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === targetId) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1 && targetSku) {
    for (let i = 1; i < values.length; i++) {
      const rowSku = String(values[i][idxSku] || '').trim().toLowerCase();
      const rowAssignee = idxAssignee !== -1 ? String(values[i][idxAssignee] || '').trim().toLowerCase() : '';
      if (rowSku === targetSku && (!targetAssignee || !rowAssignee || rowAssignee === targetAssignee)) {
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

/**
 * Move tarefa para a aba de Tarefas_Finalizadas
 */
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
  if (!finalId || !/^\d{5}$/.test(finalId)) {
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

/**
 * Move tarefa de volta para tarefas ativas
 */
function moveTaskToActive(task) {
  deleteTaskRecord(SHEETS.COMPLETED_TASKS, task);
  return upsertTask({ ...task, status: 'in_progress' });
}

function saveTasksBatch(tasksList) {
  tasksList.forEach(t => upsertTask(t));
}

/**
 * Salva ou atualiza um Produto no catálogo
 */
function upsertProduct(prod) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(h => String(h).toLowerCase().trim()) : [];
  const hasIdCol = headers.indexOf('id') !== -1;
  const idxId = hasIdCol ? headers.indexOf('id') : -1;
  const idxSku = headers.indexOf('sku') !== -1 ? headers.indexOf('sku') : (hasIdCol ? 1 : 0);

  let rowIndex = -1;
  const targetId = String(prod.id || '').trim();
  const targetSku = String(prod.sku || prod.id || '').toUpperCase().trim();

  if (hasIdCol && targetId && /^\d{5}$/.test(targetId)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === targetId) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1 && targetSku) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxSku]).toUpperCase().trim() === targetSku) {
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
    finalId = getNextFormattedId(SHEETS.PRODUCTS);
  }

  const baseData = [
    prod.sku || prod.id || '',
    parseBrazilianNumber(prod.cost),
    parseBrazilianNumber(prod.width),
    parseBrazilianNumber(prod.length),
    parseBrazilianNumber(prod.height),
    parseBrazilianNumber(prod.weight)
  ];

  const rowData = hasIdCol ? [finalId, ...baseData] : baseData;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: finalId, sku: prod.sku, updated: true };
}

function saveProductsBatch(productsList) {
  productsList.forEach(p => upsertProduct(p));
}

/**
 * Salva ou atualiza uma Plataforma
 */
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

  if (hasIdCol && targetId && /^\d{5}$/.test(targetId)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === targetId) {
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

/**
 * Salva ou atualiza usuário
 */
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

  if (hasIdCol && targetId && /^\d{5}$/.test(targetId)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === targetId) {
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

/**
 * Remove usuário por ID ou Email
 */
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

  // 1. Tenta por ID
  if (idxId !== -1 && id && /^\d{5}$/.test(id)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === id) {
        sheet.deleteRow(i + 1);
        return { id: id, deleted: true, matchedBy: 'id' };
      }
    }
  }

  // 2. Tenta por Email
  const colEmail = idxEmail !== -1 ? idxEmail : 1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colEmail]).toLowerCase().trim() === email) {
      sheet.deleteRow(i + 1);
      return { email: email, deleted: true, matchedBy: 'email' };
    }
  }

  return { deleted: false };
}

/**
 * Remove produto por ID ou SKU
 */
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

  // 1. Tenta por ID
  if (idxId !== -1 && id && /^\d{5}$/.test(id)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === id) {
        sheet.deleteRow(i + 1);
        return { id: id, deleted: true, matchedBy: 'id' };
      }
    }
  }

  // 2. Tenta por SKU
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idxSku]).toUpperCase().trim() === sku) {
      sheet.deleteRow(i + 1);
      return { sku: sku, deleted: true, matchedBy: 'sku' };
    }
  }

  return { deleted: false };
}

/**
 * Remove plataforma por ID ou Nome
 */
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

  // 1. Tenta por ID
  if (idxId !== -1 && id && /^\d{5}$/.test(id)) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxId]).trim() === id) {
        sheet.deleteRow(i + 1);
        return { id: id, deleted: true, matchedBy: 'id' };
      }
    }
  }

  // 2. Tenta por Nome
  const colNome = idxNome !== -1 ? idxNome : 0;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colNome]).toLowerCase().trim() === name) {
      sheet.deleteRow(i + 1);
      return { name: name, deleted: true, matchedBy: 'name' };
    }
  }

  return { deleted: false };
}

/**
 * Remove tarefa por ID (00001...) ou SKU/Responsável
 */
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

  // 1. Tenta por ID de 5 dígitos (00001, etc.) ou id exato
  if (idxId !== -1 && id) {
    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][idxId]).trim();
      if (rowId && (rowId === id || formatToFiveDigits(rowId) === formatToFiveDigits(id))) {
        sheet.deleteRow(i + 1);
        return { deleted: true, matchedBy: 'id', id: id };
      }
    }
  }

  // 2. Se não encontrou por ID, tenta por SKU + Responsável
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

  return { deleted: false };
}

/**
 * Helper para resposta JSON compatível com CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
