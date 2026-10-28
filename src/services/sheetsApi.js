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
   * Exclui um produto da planilha
   */
  async deleteProduct(productId) {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteProduct',
          data: { id: productId }
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
   * Salva uma Anotação na aba 'Anotação' da planilha Google
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
  }
};
