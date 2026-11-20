/**
 * Serviço de Notificações para Contas a Pagar (PWA / Mobile / Desktop)
 * Envia avisos no dia anterior e no próprio dia de vencimento da conta.
 */

const STORAGE_KEY_ENABLED = 'taresk_notifications_enabled';
const STORAGE_KEY_SENT_LOG = 'taresk_notifications_sent_log'; // Registra notificações já disparadas no dia

export const NotificationService = {
  /**
   * Verifica se o navegador tem suporte a notificações
   */
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Retorna se as notificações estão ativadas nas preferências do usuário
   */
  isEnabled() {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  },

  /**
   * Ativa ou desativa notificações nas configurações
   */
  async setEnabled(enable) {
    if (enable) {
      if (!this.isSupported()) {
        alert('Seu navegador não oferece suporte nativo a Notificações.');
        return false;
      }

      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
        this.sendImmediateNotification(
          '🔔 Notificações Ativadas!',
          'Você receberá lembretes das suas contas no dia anterior e no dia do vencimento.'
        );
        return true;
      } else {
        localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
        alert('Permissão de notificações não foi concedida pelo navegador.');
        return false;
      }
    } else {
      localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
      return true;
    }
  },

  /**
   * Dispara notificação imediata usando ServiceWorker (se disponível para funcionar em background) ou Notification API
   */
  async sendImmediateNotification(title, body) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(title, {
            body: body,
            icon: '/Taresk-JBC/icon.svg',
            badge: '/Taresk-JBC/icon.svg',
            vibrate: [200, 100, 200],
            tag: 'taresk-bill-' + Date.now(),
            renotify: true
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao disparar via ServiceWorker:', e);
    }

    try {
      new Notification(title, {
        body: body,
        icon: '/Taresk-JBC/icon.svg'
      });
    } catch (e) {
      console.warn('Erro ao disparar notificação clássica:', e);
    }
  },

  /**
   * Verifica a lista de contas e dispara alertas para hoje e amanhã
   */
  checkAndNotifyBills(bills = []) {
    if (!this.isEnabled()) return;
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (!Array.isArray(bills) || bills.length === 0) return;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1 a 12
    const currentYear = today.getFullYear();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth() + 1;
    const tomorrowYear = tomorrow.getFullYear();

    // Obtém log de notificações já enviadas hoje para não duplicar spam
    let sentLog = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SENT_LOG);
      if (saved) sentLog = JSON.parse(saved);
    } catch (e) {
      sentLog = {};
    }

    const todayDateString = `${currentYear}-${currentMonth}-${currentDay}`;
    if (!sentLog[todayDateString]) {
      sentLog = { [todayDateString]: [] }; // Limpa dias anteriores
    }

    const alreadySentIds = sentLog[todayDateString] || [];

    bills.forEach(bill => {
      if (bill.status === 'paid') return; // Se já foi paga, não avisa

      const bDay = parseInt(bill.day, 10);
      const isRecurring = bill.isRecurring || bill.recurringType === 'monthly';

      // 1. Checa se vence HOJE
      const isToday = isRecurring
        ? bDay === currentDay
        : (bDay === currentDay && parseInt(bill.month, 10) === currentMonth && (!bill.year || parseInt(bill.year, 10) === currentYear));

      if (isToday) {
        const notifId = `today_${bill.id}_${todayDateString}`;
        if (!alreadySentIds.includes(notifId)) {
          const valText = bill.value ? ` (${bill.value})` : '';
          this.sendImmediateNotification(
            `⚠️ Conta Vencendo HOJE: ${bill.description}`,
            `Lembrete Taresk: A conta "${bill.description}"${valText} vence hoje dia ${currentDay}!`
          );
          alreadySentIds.push(notifId);
        }
      }

      // 2. Checa se vence AMANHÃ (dia anterior)
      const isTomorrow = isRecurring
        ? bDay === tomorrowDay
        : (bDay === tomorrowDay && parseInt(bill.month, 10) === tomorrowMonth && (!bill.year || parseInt(bill.year, 10) === tomorrowYear));

      if (isTomorrow) {
        const notifId = `tomorrow_${bill.id}_${todayDateString}`;
        if (!alreadySentIds.includes(notifId)) {
          const valText = bill.value ? ` (${bill.value})` : '';
          this.sendImmediateNotification(
            `🔔 Conta Vence Amanhã: ${bill.description}`,
            `Atenção: A conta "${bill.description}"${valText} vence amanhã dia ${tomorrowDay}!`
          );
          alreadySentIds.push(notifId);
        }
      }
    });

    sentLog[todayDateString] = alreadySentIds;
    try {
      localStorage.setItem(STORAGE_KEY_SENT_LOG, JSON.stringify(sentLog));
    } catch (e) {}
  }
};
