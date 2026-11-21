/**
 * Serviço de Notificações para Contas a Pagar (PWA / Mobile / Desktop)
 * Envia avisos no dia anterior e no próprio dia de vencimento da conta.
 */

const STORAGE_KEY_ENABLED = 'taresk_notifications_enabled';
const STORAGE_KEY_SENT_LOG = 'taresk_notifications_sent_log'; // Registra notificações já disparadas no dia
const STORAGE_KEY_SOUND = 'taresk_notifications_sound'; // 'chime' | 'bell' | 'cash' | 'alert' | 'none'
const STORAGE_KEY_TIME = 'taresk_notifications_time'; // formato 'HH:MM', padrão '08:00'

// Sons disponíveis com tons sintéticos da Web Audio API
export const NOTIFICATION_SOUNDS = [
  { id: 'chime', name: '🎵 Chime Moderno (Padrão)', desc: 'Tom duplo suave e agradável' },
  { id: 'bell', name: '🔔 Sino de Cristal', desc: 'Sino ressonante e elegante' },
  { id: 'cash', name: '💰 Moedas / Caixa', desc: 'Som de moedas e caixa registradora' },
  { id: 'alert', name: '⚡ Alerta Enérgico', desc: 'Tom triplo para chamar atenção' },
  { id: 'none', name: '🔕 Silencioso', desc: 'Apenas aviso visual sem som' }
];

export const NotificationService = {
  /**
   * Toca o som de notificação selecionado usando Web Audio API
   */
  playSound(soundId = null) {
    const selected = soundId || localStorage.getItem(STORAGE_KEY_SOUND) || 'chime';
    if (selected === 'none') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (selected === 'bell') {
        // Sino de cristal com decay longo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // Nota Lá (A5)
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (selected === 'cash') {
        // Moedas / Caixa registradora
        const freqs = [987.77, 1318.51, 1760.00]; // B5, E6, A6
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + (idx * 0.08));
          gain.gain.setValueAtTime(0.25, now + (idx * 0.08));
          gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + (idx * 0.08));
          osc.stop(now + (idx * 0.08) + 0.35);
        });
      } else if (selected === 'alert') {
        // Alerta Triplo enfático
        [523.25, 659.25, 783.99].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + (idx * 0.1));
          gain.gain.setValueAtTime(0.25, now + (idx * 0.1));
          gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.1) + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + (idx * 0.1));
          osc.stop(now + (idx * 0.1) + 0.2);
        });
      } else {
        // 'chime' (Padrão) - dois acordes ascendentes
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.4);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.25, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.7);
      }
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  },

  /**
   * Retorna o som configurado
   */
  getSound() {
    return localStorage.getItem(STORAGE_KEY_SOUND) || 'chime';
  },

  /**
   * Salva o som escolhido
   */
  setSound(soundId) {
    localStorage.setItem(STORAGE_KEY_SOUND, soundId);
    this.playSound(soundId);
  },

  /**
   * Retorna o horário configurado para disparar as notificações (ex: "08:00")
   */
  getNotificationTime() {
    return localStorage.getItem(STORAGE_KEY_TIME) || '08:00';
  },

  /**
   * Salva o horário desejado para as notificações
   */
  setNotificationTime(timeStr) {
    if (timeStr) {
      localStorage.setItem(STORAGE_KEY_TIME, timeStr);
    }
  },
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

    // Toca o som configurado
    this.playSound();

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

    // Checa o horário configurado pelo usuário (ex: '08:00')
    const configuredTime = this.getNotificationTime();
    const [cfgHour, cfgMin] = (configuredTime || '08:00').split(':').map(Number);
    const now = new Date();
    const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    const targetMinutesFromMidnight = (isNaN(cfgHour) ? 8 : cfgHour) * 60 + (isNaN(cfgMin) ? 0 : cfgMin);

    // Se o horário atual ainda for anterior ao horário configurado, aguarda chegar o horário
    if (currentMinutesFromMidnight < targetMinutesFromMidnight) {
      return;
    }

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

      const formatVal = bill.value ? ` ${bill.value}` : '';
      const billTitle = `${bill.description}${formatVal}`.trim();

      // Formatação no padrão solicitado:
      // Exemplo Foto 2:
      // Linha de Título: "⚠️ Hoje 20/11" ou "🟢 Amanhã 21/11" ou "🚨 Atrasado 19/11"
      // Linha de Conteúdo (Body): "Aluguel R$ 850,00"
      const ddToday = String(currentDay).padStart(2, '0');
      const mmToday = String(currentMonth).padStart(2, '0');
      const ddTomorrow = String(tomorrowDay).padStart(2, '0');
      const mmTomorrow = String(tomorrowMonth).padStart(2, '0');

      // 1. Checa se está ATRASADA (não marcada como paga e dia já passou)
      let isOverdue = false;
      let overdueDateStr = '';

      if (isRecurring) {
        // Se for recorrente mensal, se o dia da conta for menor que o dia atual do mês vigente
        if (bDay < currentDay) {
          isOverdue = true;
          overdueDateStr = `${String(bDay).padStart(2, '0')}/${mmToday}`;
        }
      } else {
        const bMonth = parseInt(bill.month, 10);
        const bYear = parseInt(bill.year, 10) || currentYear;
        const billDate = new Date(bYear, bMonth - 1, bDay, 23, 59, 59);
        if (billDate < today && !(bDay === currentDay && bMonth === currentMonth && bYear === currentYear)) {
          isOverdue = true;
          overdueDateStr = `${String(bDay).padStart(2, '0')}/${String(bMonth).padStart(2, '0')}`;
        }
      }

      if (isOverdue) {
        const notifId = `overdue_${bill.id}_${todayDateString}`;
        if (!alreadySentIds.includes(notifId)) {
          this.sendImmediateNotification(
            `🚨 Atrasado ${overdueDateStr}`,
            billTitle
          );
          alreadySentIds.push(notifId);
        }
      }

      // 2. Checa se vence HOJE
      const isToday = isRecurring
        ? bDay === currentDay
        : (bDay === currentDay && parseInt(bill.month, 10) === currentMonth && (!bill.year || parseInt(bill.year, 10) === currentYear));

      if (isToday) {
        const notifId = `today_${bill.id}_${todayDateString}`;
        if (!alreadySentIds.includes(notifId)) {
          this.sendImmediateNotification(
            `⚠️ Hoje ${ddToday}/${mmToday}`,
            billTitle
          );
          alreadySentIds.push(notifId);
        }
      }

      // 3. Checa se vence AMANHÃ (dia anterior ao vencimento)
      const isTomorrow = isRecurring
        ? bDay === tomorrowDay
        : (bDay === tomorrowDay && parseInt(bill.month, 10) === tomorrowMonth && (!bill.year || parseInt(bill.year, 10) === tomorrowYear));

      if (isTomorrow) {
        const notifId = `tomorrow_${bill.id}_${todayDateString}`;
        if (!alreadySentIds.includes(notifId)) {
          this.sendImmediateNotification(
            `🟢 Amanhã ${ddTomorrow}/${mmTomorrow}`,
            billTitle
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
