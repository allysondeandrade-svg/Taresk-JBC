/**
 * ============================================================================
 * TARESK - BACKEND GOOGLE APPS SCRIPT (JBC ELETRO)
 * ============================================================================
 * Este script transforma sua Planilha do Google Sheets em uma API REST completa
 * para sincronizar Usuários, Produtos, Plataformas, Tarefas, Checklists e Precificações.
 * 
 * ESTRUTURA ATUALIZADA:
 * - Sem coluna ID em nenhuma das páginas.
 * - Usuários: [Nome, Email, Senha, Plataformas_JSON] (sem Cargo, Avatar, Badge).
 * - Plataformas: [Nome, Cor] (sem Descrição).
 * - Produtos: [SKU, Titulo, Custo, Largura, Comprimento, Altura, Peso].
 * - Tarefas / Tarefas_Finalizadas: [Tipo, ProdutoID, Titulo, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, AtualizadoEm].
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

  // 1. Aba Usuários: [Nome, Email, Senha, Plataformas_JSON]
  let userSheet = ss.getSheetByName(SHEETS.USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEETS.USERS);
    userSheet.appendRow(['Nome', 'Email', 'Senha', 'Plataformas_JSON']);
    userSheet.appendRow(['JBC Eletro', 'eletrojbc@gmail.com', 'Jbc29378125@', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee Principal', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Loja 2', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ])]);
    userSheet.appendRow(['Mariana Souza', 'mariana@jbceletro.com', '123', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee Oficial', color: '#f97316' },
      { id: 'plat_shopee_2', name: 'Shopee Secundária', color: '#ea580c' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' },
      { id: 'plat_magalu_1', name: 'Magalu', color: '#38bdf8' }
    ])]);
    userSheet.appendRow(['Carlos Oliveira', 'carlos@jbceletro.com', '123', JSON.stringify([
      { id: 'plat_shopee_1', name: 'Shopee', color: '#f97316' },
      { id: 'plat_ml_1', name: 'Mercado L', color: '#facc15' },
      { id: 'plat_amazon_1', name: 'Amazon', color: '#334155' }
    ])]);
    styleHeader(userSheet);
  }

  // 2. Aba Produtos: [SKU, Titulo, Custo, Largura, Comprimento, Altura, Peso]
  let prodSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!prodSheet) {
    prodSheet = ss.insertSheet(SHEETS.PRODUCTS);
    prodSheet.appendRow(['SKU', 'Titulo', 'Custo', 'Largura', 'Comprimento', 'Altura', 'Peso']);
    prodSheet.appendRow(['FOG-02-BOC', 'Fogão 2 Bocas Alta Pressão Inox', 145.00, 32, 54, 18, 4.80]);
    prodSheet.appendRow(['PAN-ELE-05L', 'Panela Elétrica Multifunção 5L Inox', 120.00, 30, 30, 35, 3.50]);
    prodSheet.appendRow(['VENT-COL-40', 'Ventilador Coluna 40cm Turbo Silencioso', 89.90, 45, 45, 130, 5.20]);
    prodSheet.appendRow(['FRIT-AIR-4L', 'Fritadeira Air Fryer 4L Digital Preto', 185.00, 33, 33, 38, 4.60]);
    styleHeader(prodSheet);
  }

  // 3. Aba Plataformas: [Nome, Cor]
  let platSheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!platSheet) {
    platSheet = ss.insertSheet(SHEETS.PLATFORMS);
    platSheet.appendRow(['Nome', 'Cor']);
    platSheet.appendRow(['Shopee', '#f97316']);
    platSheet.appendRow(['Mercado Livre', '#facc15']);
    platSheet.appendRow(['Amazon', '#334155']);
    platSheet.appendRow(['Magalu', '#38bdf8']);
    platSheet.appendRow(['Shein', '#000000']);
    platSheet.appendRow(['TikTok Shop', '#ff004f']);
    styleHeader(platSheet);
  }

  // 4. Aba Tarefas Ativas: [Tipo, ProdutoID, Titulo, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, AtualizadoEm]
  let taskSheet = ss.getSheetByName(SHEETS.TASKS);
  if (!taskSheet) {
    taskSheet = ss.insertSheet(SHEETS.TASKS);
    taskSheet.appendRow([
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

  // 5. Aba Tarefas Finalizadas: [Tipo, ProdutoID, Titulo, AtribuidoPara, AtribuidoPor, CriadoPor, Prazo, Status, Marketplaces_JSON, Checklist_JSON, Observacoes, FinalizadoEm]
  let compTaskSheet = ss.getSheetByName(SHEETS.COMPLETED_TASKS);
  if (!compTaskSheet) {
    compTaskSheet = ss.insertSheet(SHEETS.COMPLETED_TASKS);
    compTaskSheet.appendRow([
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

  Logger.log('Todas as abas do Taresk foram configuradas com sucesso no Google Sheets!');
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
 * Colunas: [Nome (0), Email (1), Senha (2), Plataformas_JSON (3)]
 * Deriva role, avatar e badge automaticamente para compatibilidade total com a interface
 */
function getUsersDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const rows = values.slice(1);

  return rows.map((r, index) => {
    const name = String(r[0] || '').trim();
    const email = String(r[1] || '').trim();
    const password = String(r[2] || '');
    let platforms = [];
    try {
      platforms = r[3] ? JSON.parse(r[3]) : [];
    } catch (e) {
      platforms = [];
    }

    const isMaster = email.toLowerCase() === 'eletrojbc@gmail.com' || index === 0;
    const role = isMaster ? 'premium_admin' : 'operator';
    const avatar = isMaster ? '⚡' : '👤';
    const badge = isMaster ? 'Admin' : 'Operador';
    const id = isMaster ? 'user_master' : 'user_' + encodeURIComponent(email).replace(/[^a-zA-Z0-9_]/g, '_');

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
 * Detecta cabeçalhos dinamicamente (SKU, Titulo, Custo, Largura, Comprimento, Altura, Peso)
 */
function getProductsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxSku = headers.indexOf('sku');
  const idxTitulo = headers.findIndex(h => h.includes('titulo') || h.includes('nome'));
  const idxCusto = headers.indexOf('custo');
  const idxLargura = headers.indexOf('largura');
  const idxComp = headers.findIndex(h => h.includes('comp'));
  const idxAltura = headers.indexOf('altura');
  const idxPeso = headers.indexOf('peso');

  return rows.map((r, i) => {
    // Se a coluna SKU existir pelo cabeçalho, usa ela. Senão pega a coluna 0 ou 1.
    const sku = idxSku !== -1 ? String(r[idxSku] || '').trim() : String(r[0] || '').trim();
    const titulo = idxTitulo !== -1 && r[idxTitulo] ? String(r[idxTitulo]).trim() : '';

    return {
      id: sku || ('prod_' + (i + 1)),
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
 * Detecta cabeçalhos dinamicamente (Nome, Cor, Descricao)
 */
function getPlatformsDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  const idxNome = headers.findIndex(h => h === 'nome' || h.includes('plataforma'));
  const idxCor = headers.indexOf('cor');
  const idxDesc = headers.findIndex(h => h.includes('desc'));

  return rows.map((r, i) => {
    const nome = idxNome !== -1 ? String(r[idxNome] || '').trim() : String(r[1] || r[0] || '').trim();
    const cor = idxCor !== -1 && r[idxCor] ? String(r[idxCor]).trim() : '#5925dc';
    const desc = idxDesc !== -1 && r[idxDesc] ? String(r[idxDesc]).trim() : '';

    return {
      id: 'plat_' + encodeURIComponent(nome).toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_'),
      name: nome,
      color: cor,
      description: desc
    };
  });
}

/**
 * Retorna as tarefas
 * Colunas: [Tipo (0), ProdutoID (1), Titulo (2), AtribuidoPara (3), AtribuidoPor (4), CriadoPor (5), Prazo (6), Status (7), Marketplaces_JSON (8), Checklist_JSON (9), Observacoes (10), DataHora (11)]
 */
function getTasksDataAsJson(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const rows = values.slice(1);

  return rows.map((r, index) => {
    let marketplaces = {};
    let checklist = [];

    try { marketplaces = r[8] ? JSON.parse(r[8]) : {}; } catch (e) { }
    try { checklist = r[9] ? JSON.parse(r[9]) : []; } catch (e) { }

    const type = r[0] || 'product_catalog';
    const productId = r[1] || '';
    const title = r[2] || '';
    const assignedTo = r[3] || '';
    const assignedByName = r[4] || '';
    const createdById = r[5] || '';
    const dueDate = r[6] || '';
    const status = r[7] || (sheetName === SHEETS.COMPLETED_TASKS ? 'completed' : 'in_progress');
    const notes = r[10] || '';
    const timeField = r[11] || '';

    // ID derivado estável para a interface
    const taskId = 'task_' + (productId ? (productId + '_') : '') + encodeURIComponent(title).replace(/[^a-zA-Z0-9_]/g, '_');

    return {
      id: taskId || ('task_' + (index + 1)),
      type: type,
      productId: productId,
      title: title,
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
    const rowProdId = String(values[i][1] || '').trim();
    const rowTitle = String(values[i][2] || '').trim();
    const targetProdId = String(task.productId || '').trim();
    const targetTitle = String(task.title || '').trim();

    if ((targetProdId && rowProdId === targetProdId) || (targetTitle && rowTitle === targetTitle)) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
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

  return { id: task.id || task.title, updated: true };
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
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    const rowProdId = String(values[i][1] || '').trim();
    const rowTitle = String(values[i][2] || '').trim();
    const targetProdId = String(task.productId || '').trim();
    const targetTitle = String(task.title || '').trim();

    if ((targetProdId && rowProdId === targetProdId) || (targetTitle && rowTitle === targetTitle)) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
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

  return { id: task.id || task.title, updated: true };
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

  const rowData = [
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

  compSheet.appendRow(rowData);
  return { id: task.id || task.title, movedToCompleted: true };
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
 * Linha: [SKU, Titulo, Custo, Largura, Comprimento, Altura, Peso]
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
  const targetSku = String(prod.sku || prod.id || '').toUpperCase().trim();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase().trim() === targetSku) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    prod.sku || prod.id || '',
    prod.title || prod.sku || '',
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

  return { sku: prod.sku, updated: true };
}

function saveProductsBatch(productsList) {
  productsList.forEach(p => upsertProduct(p));
}

/**
 * Salva ou atualiza uma Plataforma
 * Linha: [Nome, Cor]
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
  const targetName = String(plat.name || '').toLowerCase().trim();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === targetName) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    plat.name || '',
    plat.color || '#5925dc'
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { name: plat.name, updated: true };
}

function savePlatformsBatch(platformsList) {
  platformsList.forEach(p => upsertPlatform(p));
}

/**
 * Salva ou atualiza usuário
 * Linha: [Nome, Email, Senha, Plataformas_JSON]
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
  const targetEmail = String(user.email || '').toLowerCase().trim();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toLowerCase().trim() === targetEmail) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    user.name || '',
    user.email || '',
    user.password || '123',
    JSON.stringify(user.platforms || [])
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { email: user.email, updated: true };
}

function saveUsersBatch(usersList) {
  usersList.forEach(u => upsertUser(u));
}

/**
 * Remove usuário pelo Email (coluna B)
 */
function deleteUserRecord(userOrData) {
  const email = String((userOrData && (userOrData.email || userOrData.id)) || '').toLowerCase().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toLowerCase().trim() === email) {
      sheet.deleteRow(i + 1);
      return { email: email, deleted: true };
    }
  }
  return { email: email, deleted: false };
}

/**
 * Remove produto pelo SKU (coluna A)
 */
function deleteProductRecord(prodOrData) {
  const sku = String((prodOrData && (prodOrData.sku || prodOrData.id)) || '').toUpperCase().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase().trim() === sku) {
      sheet.deleteRow(i + 1);
      return { sku: sku, deleted: true };
    }
  }
  return { sku: sku, deleted: false };
}

/**
 * Remove plataforma pelo Nome (coluna A)
 */
function deletePlatformRecord(platOrData) {
  const name = String((platOrData && (platOrData.name || platOrData.id)) || '').toLowerCase().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PLATFORMS);
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === name) {
      sheet.deleteRow(i + 1);
      return { name: name, deleted: true };
    }
  }
  return { name: name, deleted: false };
}

/**
 * Remove tarefa por Titulo ou ProdutoID
 */
function deleteTaskRecord(sheetName, taskOrData) {
  const targetId = String((taskOrData && taskOrData.id) || '');
  const targetProdId = String((taskOrData && taskOrData.productId) || '');
  const targetTitle = String((taskOrData && taskOrData.title) || '');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { deleted: false };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const rowProdId = String(values[i][1] || '').trim();
    const rowTitle = String(values[i][2] || '').trim();

    if ((targetProdId && rowProdId === targetProdId) || (targetTitle && rowTitle === targetTitle)) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
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
