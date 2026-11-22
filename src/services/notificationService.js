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
            tag: 'taresk-notif-' + Date.now(),
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
   * Dispara notificação quando uma nova tarefa for atribuída ao usuário
   */
  notifyTaskAssigned(task, currentUser, users = []) {
    if (!task) return;
    if (!this.isEnabled()) return;
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    // Se houver um usuário logado no dispositivo, verifica se a tarefa foi atribuída a ele
    if (currentUser) {
      const norm = (s) => String(s || '').toLowerCase().trim();
      const uId = norm(currentUser.id);
      const uName = norm(currentUser.name);
      const tAssignee = norm(task.assignedTo);
      const tAssigneeName = norm(task.assignedByName);

      let isAssignedToCurrent = false;

      // 1. Comparação direta por ID ou ID numérico (ex: "user_colab_1" ou "00001" / "1")
      if (tAssignee && (tAssignee === uId || (parseInt(tAssignee, 10) && parseInt(tAssignee, 10) === parseInt(uId, 10)))) {
        isAssignedToCurrent = true;
      }

      // 2. Comparação por nome
      if (!isAssignedToCurrent && uName && (tAssignee === uName || tAssigneeName === uName || tAssignee.includes(uName) || uName.includes(tAssignee))) {
        isAssignedToCurrent = true;
      }

      // 3. Comparação mapeando a lista de usuários
      if (!isAssignedToCurrent && Array.isArray(users) && users.length > 0) {
        const matched = users.find(u =>
          norm(u.id) === tAssignee ||
          norm(u.name) === tAssignee ||
          (parseInt(u.id, 10) && parseInt(u.id, 10) === parseInt(tAssignee, 10))
        );
        if (matched && (norm(matched.id) === uId || norm(matched.name) === uName)) {
          isAssignedToCurrent = true;
        }
      }

      if (!isAssignedToCurrent) {
        return; // A tarefa não é para este usuário, não notifica
      }
    }

    const taskTitle = task.title || task.sku || 'Nova Tarefa';
    this.sendImmediateNotification(
      'Nova Tarefa! Confira os detalhes',
      taskTitle
    );
  },

  /**
   * Verifica a lista de contas e dispara no máximo UMA única notificação por dia,
   * alertando apenas contas com vencimento em:
   * - Ontem (atrasada há exatamente 1 dia)
   * - Hoje (vencendo no dia)
   * - Amanhã (vencendo no dia seguinte)
   * Se a conta venceu há 2 dias ou mais (anteontem ou antes), NÃO notifica.
   * Se houver mais de uma conta para pagar, resume todas em uma única mensagem (ex: "Aluguel, Boleto Grenada, Dinheiro Express").
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

    // Data de hoje zerada em meia-noite para comparações de dias exatos
    const todayMidnight = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0, 0);

    const todayDateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    // Obtém log de notificações já enviadas hoje para garantir no máximo 1 notificação diária
    let sentLog = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SENT_LOG);
      if (saved) sentLog = JSON.parse(saved);
    } catch (e) {
      sentLog = {};
    }

    // Se já foi enviada a notificação diária de hoje, não manda outra
    if (sentLog[todayDateString] && sentLog[todayDateString].length > 0) {
      return;
    }

    // Coleta as contas elegíveis nos 3 dias permitidos (ontem, hoje, amanhã)
    const billsYesterday = [];
    const billsToday = [];
    const billsTomorrow = [];

    bills.forEach(bill => {
      const bDay = parseInt(bill.day, 10);
      if (isNaN(bDay) || bDay < 1 || bDay > 31) return;

      const isRecurring = bill.isRecurring || bill.recurringType === 'monthly' ||
        String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase() === 'mensal' ||
        String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase().includes('cart');

      // 1. Checa se já está paga no mês corrente
      let isPaidThisMonth = false;
      if (!isRecurring) {
        isPaidThisMonth = bill.status === 'paid';
      } else {
        const monthKey = `${currentYear}_${currentMonth}`;
        if (bill.paidMonths && typeof bill.paidMonths === 'object') {
          if (Array.isArray(bill.paidMonths)) {
            isPaidThisMonth = bill.paidMonths.includes(monthKey);
          } else if (bill.paidMonths[monthKey] !== undefined) {
            isPaidThisMonth = Boolean(bill.paidMonths[monthKey]);
          }
        } else {
          const origYear = parseInt(bill.year, 10) || currentYear;
          const origMonth = parseInt(bill.month, 10) || currentMonth;
          if (currentYear === origYear && currentMonth === origMonth) {
            isPaidThisMonth = bill.status === 'paid';
          }
        }
      }

      if (isPaidThisMonth) return; // Conta já paga neste mês: ignorar

      // Determina a data de vencimento exata da conta para comparação
      let billDate;
      if (isRecurring) {
        // Para recorrente, avalia no mês atual.
        // Tratamento de virada de mês (ex: dia 1 no final do mês ou dia 31 no começo do mês)
        billDate = new Date(currentYear, currentMonth - 1, bDay, 0, 0, 0, 0);

        // Se hoje for dia 1 e a conta for do dia anterior (último dia do mês anterior)
        if (currentDay === 1 && bDay >= 28) {
          billDate = new Date(currentYear, currentMonth - 2, bDay, 0, 0, 0, 0);
        }
        // Se a conta for dia 1 e hoje for o último dia do mês (vence amanhã no próximo mês)
        const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
        if (currentDay === daysInCurrentMonth && bDay === 1) {
          billDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
        }
      } else {
        const bMonth = parseInt(bill.month, 10) || currentMonth;
        const bYear = parseInt(bill.year, 10) || currentYear;
        billDate = new Date(bYear, bMonth - 1, bDay, 0, 0, 0, 0);
      }

      // Calcula a diferença exata em dias inteiros:
      // diffDays = -1 -> Venceu ontem
      // diffDays = 0  -> Vence hoje
      // diffDays = 1  -> Vence amanhã
      // diffDays <= -2 -> Venceu anteontem ou antes (NÃO notificar)
      // diffDays >= 2  -> Vence depois de amanhã (NÃO notificar)
      const diffMs = billDate.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const billDesc = String(bill.description || 'Conta').trim();
      const formatVal = bill.value ? ` (${bill.value})` : '';
      const billLabel = `${billDesc}${formatVal}`;

      if (diffDays === 0) {
        billsToday.push(billLabel);
      } else if (diffDays === 1) {
        billsTomorrow.push(billLabel);
      } else if (diffDays === -1) {
        billsYesterday.push(billLabel);
      }
      // Se diffDays <= -2 (passou 2 dias ou mais) ou diffDays > 1: ignorado conforme regra!
    });

    const totalEligible = billsYesterday.length + billsToday.length + billsTomorrow.length;
    if (totalEligible === 0) return;

    // Constrói uma ÚNICA notificação resumindo todas as contas dos 3 dias
    let title = '🔔 Lembrete de Contas a Pagar';
    const bodyParts = [];

    if (billsToday.length > 0) {
      bodyParts.push(`⚠️ Hoje: ${billsToday.join(', ')}`);
    }
    if (billsTomorrow.length > 0) {
      bodyParts.push(`🟢 Amanhã: ${billsTomorrow.join(', ')}`);
    }
    if (billsYesterday.length > 0) {
      bodyParts.push(`🚨 Ontem (pendente): ${billsYesterday.join(', ')}`);
    }

    if (billsToday.length > 0 && billsTomorrow.length === 0 && billsYesterday.length === 0) {
      title = `⚠️ Contas para Pagar Hoje (${billsToday.length})`;
    } else if (billsTomorrow.length > 0 && billsToday.length === 0 && billsYesterday.length === 0) {
      title = `🟢 Contas de Amanhã (${billsTomorrow.length})`;
    } else if (billsYesterday.length > 0 && billsToday.length === 0 && billsTomorrow.length === 0) {
      title = `🚨 Contas Pendentes de Ontem (${billsYesterday.length})`;
    }

    const notificationBody = bodyParts.join('\n');

    // Dispara a única notificação do dia
    this.sendImmediateNotification(title, notificationBody);

    // Registra no sentLog para garantir que NÃO mande mais de uma mensagem no mesmo dia
    sentLog = { [todayDateString]: ['daily_bills_summary_sent'] };
    try {
      localStorage.setItem(STORAGE_KEY_SENT_LOG, JSON.stringify(sentLog));
    } catch (e) {}
  }
};
