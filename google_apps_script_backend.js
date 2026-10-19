/**
 * ============================================================================
 * TARESK - BACKEND GOOGLE APPS SCRIPT (JBC ELETRO)
 * ============================================================================
 * Este script transforma sua Planilha do Google Sheets em uma API REST completa
 * para sincronizar Usuários, Produtos, Plataformas, Tarefas, Checklists e Precificações.
 * 
 * INSTRUÇÕES RÁPIDAS DE INSTALAÇÃO:
 * 1. Abra sua planilha no Google Sheets (ex: "Banco_Dados_Taresk").
 * 2. Clique no menu superior em: "Extensões" > "Apps Script".
 * 3. Cole todo este código no arquivo "Código.gs" (substituindo o anterior).
 * 4. Selecione a função "setupSheets" no topo e clique em "Executar" para criar/atualizar
 *    automaticamente as abas com os cabeçalhos corretos!
 * 5. Clique no botão azul no topo direito: "Implantar" > "Gerenciar implantações".
 *    - Clique no ícone de lápis (Editar).
 *    - Em Versão: selecione "Nova versão" (New version).
 *    - Clique em "Implantar".
 * 6. Copie a URL gerada (termina em /exec) e cole no seu Taresk (Configurações ⚙️)!
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
 * Função para inicializar/atualizar a estrutura das abas da planilha automaticamente
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Aba Usuários
  let userSheet = ss.getSheetByName(SHEETS.USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEETS.USERS);
    userSheet.appendRow(['ID', 'Nome', 'Email', 'Senha', 'Cargo', 'Avatar', 'Badge', 'Plataformas_JSON']);
    userSheet.appendRow(['user_master', 'JBC Eletro (Admin)', 'eletrojbc@gmail.com', 'Jbc29378125@', 'premium_admin', '⚡', 'Administrador Premium', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee Principal', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Loja 2', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ])]);
    userSheet.appendRow(['user_colab_1', 'Mariana Souza', 'mariana@jbceletro.com', '123', 'operator', '👩‍💻', 'Especialista em Catálogo', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee Oficial', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Secundária', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ])]);
    userSheet.appendRow(['user_colab_2', 'Carlos Oliveira', 'carlos@jbceletro.com', '123', 'operator', '👨‍🔧', 'Mídia & Imagens', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee', color: '#f97316' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' }
    ])]);
    styleHeader(userSheet);
  }

  // 2. Aba Produtos (SKU, Custo, Largura, Comp, Altura, Peso)
  let prodSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!prodSheet) {
    prodSheet = ss.insertSheet(SHEETS.PRODUCTS);
    prodSheet.appendRow(['ID', 'SKU', 'Titulo', 'Custo', 'Largura', 'Comprimento', 'Altura', 'Peso']);
    prodSheet.appendRow(['p1', 'FOG-02-BOC', 'Fogão 2 Bocas Alta Pressão Inox', 145.00, 32, 54, 18, 4.80]);
    prodSheet.appendRow(['p2', 'PAN-ELE-05L', 'Panela Elétrica Multifunção 5L Inox', 120.00, 30, 30, 35, 3.50]);
    prodSheet.appendRow(['p3', 'VENT-COL-40', 'Ventilador Coluna 40cm Turbo Silencioso', 89.90, 45, 45, 130, 5.20]);
    prodSheet.appendRow(['p4', 'FRIT-AIR-4L', 'Fritadeira Air Fryer 4L Digital Preto', 185.00, 33, 33, 38, 4.60]);
    styleHeader(prodSheet);
  }

  // 3. Aba Plataformas (Canais de Vendas)
  let platSheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!platSheet) {
    platSheet = ss.insertSheet(SHEETS.PLATFORMS);
    platSheet.appendRow(['ID', 'Nome', 'Cor', 'Descricao']);
    platSheet.appendRow(['plat_shopee', 'Shopee', '#f97316', 'Marketplace Shopee Brasil']);
    platSheet.appendRow(['plat_ml', 'Mercado Livre', '#facc15', 'Mercado Livre Oficial & Filiais']);
    platSheet.appendRow(['plat_amazon', 'Amazon', '#334155', 'Amazon Seller Central']);
    platSheet.appendRow(['plat_magalu', 'Magalu', '#38bdf8', 'Magazine Luiza Marketplace']);
    platSheet.appendRow(['plat_shein', 'Shein', '#000000', 'Shein Marketplace']);
    platSheet.appendRow(['plat_tiktok', 'TikTok Shop', '#ff004f', 'TikTok E-commerce']);
    styleHeader(platSheet);
  }

  // 4. Aba Tarefas Ativas
  let taskSheet = ss.getSheetByName(SHEETS.TASKS);
  if (!taskSheet) {
    taskSheet = ss.insertSheet(SHEETS.TASKS);
    taskSheet.appendRow([
      'ID',
      'Tipo',
      'ProdutoID',
      'Titulo',
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
  }

  // 5. Aba Tarefas Finalizadas (Concluídas)
  let compTaskSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  if (!compTaskSheet) {
    compTaskSheet = ss.insertSheet(SHEETS.COMPLETED_TASKS);
    compTaskSheet.appendRow([
      'ID',
      'Tipo',
      'ProdutoID',
      'Titulo',
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

  Logger.log('Todas as abas do Taresk foram criadas/atualizadas com sucesso no Google Sheets!');
}

function styleHeader(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#5925dc');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Endpoint GET: Permite ler todas as coleções de dados
 * Exemplo: ?action=getAllData ou ?action=getTasks ou ?action=getProducts
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAllData';
    let responseData = {};

    if (action === 'getAllData') {
      responseData = {
        users: getUsersDataAsJson(),
        products: getSheetDataAsJson(SHEETS.PRODUCTS),
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
      responseData = getSheetDataAsJson(SHEETS.PRODUCTS);
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
        result = deleteRowById(SHEETS.TASKS, data.id);
        break;

      case 'saveProduct':
        result = upsertProduct(data);
        break;

      case 'deleteProduct':
        result = deleteRowById(SHEETS.PRODUCTS, data.id);
        break;

      case 'savePlatform':
      case 'updatePlatform':
        result = upsertPlatform(data);
        break;

      case 'deletePlatform':
        result = deleteRowById(SHEETS.PLATFORMS, data.id);
        break;

      case 'saveUser':
      case 'updateUser':
        result = upsertUser(data);
        break;

      case 'deleteUser':
        result = deleteRowById(SHEETS.USERS, data.id);
        break;

      case 'finishTask':
        result = moveTaskToCompleted(data);
        break;

      case 'unfinishTask':
        result = moveTaskToActive(data);
        break;

      case 'deleteCompletedTask':
        result = deleteRowById(SHEETS.COMPLETED_TASKS, data.id);
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
 * Converte qualquer valor (incluindo texto com vírgula "91,00" ou "R$ 91,00") em número Float válido
 */
function parseBrazilianNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Remove R$, espaços e caracteres não numéricos exceto vírgula, ponto e sinal de menos
  var str = String(val).replace(/[^0-9,-.]/g, '').trim();
  if (!str) return 0;

  // Se tiver formato brasileiro como 1.250,50
  if (str.indexOf('.') !== -1 && str.indexOf(',') !== -1) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.indexOf(',') !== -1) {
    // Formato simples como 91,00
    str = str.replace(',', '.');
  }
  var parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
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
 * Retorna usuários com o array de plataformas decodificado
 */
function getUsersDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const rows = values.slice(1);

  return rows.map(r => {
    let platforms = [];
    try {
      platforms = r[7] ? JSON.parse(r[7]) : [];
    } catch (e) {
      platforms = [];
    }

    return {
      id: String(r[0]),
      name: String(r[1]),
      email: String(r[2]),
      password: String(r[3]),
      role: String(r[4]),
      avatar: String(r[5] || '👤'),
      badge: String(r[6] || 'Operador'),
      platforms: platforms
    };
  });
}

/**
 * Retorna plataformas cadastradas
 */
function getPlatformsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const rows = values.slice(1);

  return rows.map(r => ({
    id: String(r[0]),
    name: String(r[1]),
    color: String(r[2] || '#5925dc'),
    description: String(r[3] || '')
  }));
}

/**
 * Retorna as tarefas com os JSONs internos (Checklist e Marketplaces) decodificados
 */
function getTasksDataAsJson(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const rows = values.slice(1);

  return rows.map(r => {
    let marketplaces = {};
    let checklist = [];

    try { marketplaces = r[9] ? JSON.parse(r[9]) : {}; } catch (e) { }
    try { checklist = r[10] ? JSON.parse(r[10]) : []; } catch (e) { }

    return {
      id: String(r[0]),
      type: r[1],
      productId: r[2],
      title: r[3],
      assignedTo: r[4],
      assignedByName: r[5],
      createdById: r[6],
      dueDate: r[7],
      status: r[8],
      marketplaces: marketplaces,
      checklist: checklist,
      notes: r[11],
      updatedAt: r[12]
    };
  });
}

/**
 * Salva ou atualiza uma Tarefa específica
 */
function upsertTask(task) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.TASKS);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEETS.TASKS);
  }

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(task.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    task.id,
    task.type || 'product_catalog',
    task.productId || '',
    task.title || '',
    task.assignedTo || '',
    task.assignedByName || '',
    task.createdById || '',
    task.dueDate || '',
    task.status || 'in_progress',
    JSON.stringify(task.marketplaces || {}),
    JSON.stringify(task.checklist || []),
    task.notes || '',
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: task.id, updated: true };
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

  deleteRowById(SHEETS.TASKS, task.id);

  const values = compSheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(task.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    task.id,
    task.type || 'product_catalog',
    task.productId || '',
    task.title || '',
    task.assignedTo || '',
    task.assignedByName || '',
    task.createdById || '',
    task.dueDate || '',
    'completed',
    JSON.stringify(task.marketplaces || {}),
    JSON.stringify(task.checklist || []),
    task.notes || '',
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    compSheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    compSheet.appendRow(rowData);
  }

  return { id: task.id, movedToCompleted: true };
}

/**
 * Move tarefa de volta para tarefas ativas
 */
function moveTaskToActive(task) {
  deleteRowById(SHEETS.COMPLETED_TASKS, task.id);
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
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(prod.id) || String(values[i][1]).toUpperCase() === String(prod.sku).toUpperCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    prod.id,
    prod.sku,
    prod.title || prod.sku,
    parseBrazilianNumber(prod.cost),
    parseBrazilianNumber(prod.width),
    parseBrazilianNumber(prod.length),
    parseBrazilianNumber(prod.height),
    parseBrazilianNumber(prod.weight)
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: prod.id, updated: true };
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
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(plat.id) || String(values[i][1]).toLowerCase() === String(plat.name).toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    plat.id,
    plat.name,
    plat.color || '#5925dc',
    plat.description || ''
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: plat.id, updated: true };
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
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(user.id) || String(values[i][2]).toLowerCase() === String(user.email).toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    user.id,
    user.name,
    user.email,
    user.password || '123',
    user.role || 'operator',
    user.avatar || '👤',
    user.badge || 'Operador',
    JSON.stringify(user.platforms || [])
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: user.id, updated: true };
}

function saveUsersBatch(usersList) {
  usersList.forEach(u => upsertUser(u));
}

/**
 * Remove linha pelo ID na coluna A
 */
function deleteRowById(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }
  return { id: id, deleted: false };
}

/**
 * Helper para resposta JSON compatível com CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
