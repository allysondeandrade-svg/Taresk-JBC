/**
 * Serviço de Conexão com o Google Sheets (Apps Script Web App)
 */

// URL do Apps Script oficial da JBC Eletro
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8f8_gggTpEgxWEblfw5o4JU1OVh0CYZpmD7rhcpoMNaR-FSC87Tql3_TbIl7-GeBn/exec';

export const SheetsApi = {
  getUrl: () => localStorage.getItem('taresk_sheets_api_url') || DEFAULT_APPS_SCRIPT_URL,
  setUrl: (url) => localStorage.setItem('taresk_sheets_api_url', url.trim()),

  /**
   * Baixa todos os dados da planilha Google (Tarefas, Produtos, Usuários, Precificações)
   */
  async fetchAllData() {
    const url = this.getUrl();
    if (!url) return null;

    try {
      const resp = await fetch(`${url}?action=getAllData&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const json = await resp.json();
      if (json.status === 'success') {
        return json.data;
      }
      console.warn('Erro ao carregar dados do Sheets:', json.message);
      return null;
    } catch (err) {
      console.error('Falha de rede ao conectar com Google Apps Script:', err);
      return null;
    }
  },

  /**
   * Sincroniza uma tarefa criada/editada diretamente na planilha
   */
  async syncTask(task) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // text/plain evita bloqueio de preflight CORS no Apps Script
        body: JSON.stringify({
          action: 'saveTask',
          data: task
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar tarefa com Sheets:', err);
      return false;
    }
  },

  /**
   * Sincroniza um produto cadastrado ou atualizado
   */
  async syncProduct(product) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveProduct',
          data: product
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar produto com Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui uma tarefa ativa
   */
  async deleteTask(taskOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payloadData = typeof taskOrId === 'object'
      ? {
          id: taskOrId.id,
          sku: taskOrId.sku || taskOrId.productId || taskOrId.title,
          title: taskOrId.title,
          productId: taskOrId.productId,
          assignedTo: taskOrId.assignedTo,
          assignedByName: taskOrId.assignedByName
        }
      : { id: taskOrId, sku: taskOrId, title: taskOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteTask',
          data: payloadData
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir tarefa no Sheets:', err);
      return false;
    }
  },

  /**
   * Finaliza uma tarefa (move para aba Tarefas_Finalizadas)
   */
  async finishTask(task) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'finishTask',
          data: task
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao finalizar tarefa no Sheets:', err);
      return false;
    }
  },

  /**
   * Reativa uma tarefa finalizada
   */
  async unfinishTask(task) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'unfinishTask',
          data: task
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao reativar tarefa no Sheets:', err);
      return false;
    }
  },

  /**
   * Sincroniza / atualiza tarefa finalizada
   */
  async syncCompletedTask(task) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveCompletedTask',
          data: task
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao atualizar tarefa finalizada no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui tarefa finalizada
   */
  async deleteCompletedTask(taskOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payloadData = typeof taskOrId === 'object'
      ? {
          id: taskOrId.id,
          sku: taskOrId.sku || taskOrId.productId || taskOrId.title,
          title: taskOrId.title,
          productId: taskOrId.productId,
          assignedTo: taskOrId.assignedTo,
          assignedByName: taskOrId.assignedByName
        }
      : { id: taskOrId, sku: taskOrId, title: taskOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteCompletedTask',
          data: payloadData
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir tarefa concluída no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui um produto da planilha (envia id, sku e título para garantir exclusão perfeita)
   */
  async deleteProduct(prodOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payloadData = typeof prodOrId === 'object' && prodOrId !== null
      ? {
          id: prodOrId.id,
          sku: prodOrId.sku || prodOrId.id,
          title: prodOrId.title || prodOrId.product || prodOrId.nome || ''
        }
      : { id: prodOrId, sku: prodOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteProduct',
          data: payloadData
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir produto no Sheets:', err);
      return false;
    }
  },

  /**
   * Salva ou atualiza um usuário (Nome, Email, Senha, Cargo)
   */
  async syncUser(user) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveUser',
          data: user
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao salvar usuário no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui um usuário da planilha
   */
  async deleteUser(userId) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteUser',
          data: { id: userId }
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir usuário no Sheets:', err);
      return false;
    }
  },

  /**
   * Salva ou atualiza uma plataforma (Shopee, ML, etc)
   */
  async syncPlatform(platform) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'savePlatform',
          data: platform
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao salvar plataforma no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui uma plataforma da planilha
   */
  async deletePlatform(platformId) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deletePlatform',
          data: { id: platformId }
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir plataforma no Sheets:', err);
      return false;
    }
  },

  /**
   * Sincronização em lote de todas as coleções
   */
  async syncAllBatch(tasks, products, users, platforms) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'syncAllData',
          data: { tasks, products, users, platforms }
        })
      });
      return true;
    } catch (err) {
      console.error('Erro na sincronização em lote com Sheets:', err);
      return false;
    }
  },

  /**
   * Salva um Modelo de Checklist na planilha Google
   */
  async saveChecklistTemplate(template) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveChecklistTemplate',
          data: template
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao salvar modelo de checklist no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui um Modelo de Checklist da planilha Google
   */
  async deleteChecklistTemplate(templateOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payload = typeof templateOrId === 'object'
      ? templateOrId
      : { id: templateOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteChecklistTemplate',
          data: payload
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir modelo de checklist no Sheets:', err);
      return false;
    }
  },

  /**
   * Salva ou atualiza uma Anotação na aba 'Anotação' da planilha Google
   */
  async saveAnnotation(annotation) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveAnnotation',
          data: annotation
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao salvar anotação no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui uma Anotação da aba 'Anotação' da planilha Google
   */
  async deleteAnnotation(annotationOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payload = typeof annotationOrId === 'object' ? annotationOrId : { id: annotationOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteAnnotation',
          data: payload
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir anotação no Sheets:', err);
      return false;
    }
  },

  /**
   * Sincroniza (salva ou atualiza) uma disputa na aba Disputas
   */
  async syncDispute(dispute) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveDispute',
          data: dispute
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar disputa no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui uma disputa da planilha
   */
  async deleteDispute(disputeOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payload = typeof disputeOrId === 'object' ? disputeOrId : { id: disputeOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteDispute',
          data: payload
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir disputa no Sheets:', err);
      return false;
    }
  },

  /**
   * Salva ou atualiza uma Conta a Pagar na planilha
   */
  async syncBill(bill) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveBill',
          data: bill
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao salvar conta no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui uma Conta a Pagar da planilha
   */
  async deleteBill(billOrId) {
    const url = this.getUrl();
    if (!url) return false;

    const payload = typeof billOrId === 'object' ? billOrId : { id: billOrId };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteBill',
          data: payload
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir conta no Sheets:', err);
      return false;
    }
  },

  /**
   * Carrega os dados Financeiros (Resumo B1:J16 e Pedidos B154:N1010) de uma aba mensal (ex: 'Nov 26')
   */
  async fetchFinancialData(monthSheet = 'Nov 26') {
    const url = this.getUrl();
    if (!url) return null;

    try {
      const resp = await fetch(`${url}?action=getFinancialData&monthSheet=${encodeURIComponent(monthSheet)}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const json = await resp.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
      return null;
    } catch (err) {
      console.warn('Erro ao carregar dados financeiros via GET, tentando POST fallback:', err);
      try {
        const resp2 = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'getFinancialData',
            data: { monthSheet }
          })
        });
        const json2 = await resp2.json();
        if (json2.status === 'success' && json2.result) {
          return json2.result;
        }
      } catch (e2) {
        console.error('Erro no fallback financeiro:', e2);
      }
      return null;
    }
  },

  /**
   * Retorna a lista de abas mensais disponíveis na planilha (ex: ["Nov 26", "Dez 26", "Jan 27"])
   */
  async fetchFinancialSheets() {
    const url = this.getUrl();
    if (!url) return ['Nov 26'];

    try {
      const resp = await fetch(`${url}?action=getFinancialSheets&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const json = await resp.json();
      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
      return ['Nov 26'];
    } catch (err) {
      return ['Nov 26'];
    }
  },

  /**
   * Sincroniza / salva um planejamento Full no Google Sheets
   */
  async saveFullPlanning(planning) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveFullPlanning',
          data: planning
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao salvar Planejamento Full no Sheets:', err);
      return false;
    }
  },

  /**
   * Exclui um planejamento Full no Google Sheets
   */
  async deleteFullPlanning(planningOrId) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      const payload = typeof planningOrId === 'object' ? planningOrId : { id: planningOrId };
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteFullPlanning',
          data: payload
        })
      });
      return true;
    } catch (err) {
      console.error('Erro ao excluir Planejamento Full no Sheets:', err);
      return false;
    }
  }
};
