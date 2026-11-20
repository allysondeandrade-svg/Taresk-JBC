/**
 * Serviço de Feriados Nacionais Brasileiros (Feriados Oficiais em que não se trabalha)
 * Puxa da BrasilAPI com fallback robusto e cache local (localStorage).
 */

// Feriados nacionais fixos e de cálculo anual padrão para fallback offline
const KNOWN_HOLIDAYS = {
  2025: [
    { date: '2025-01-01', name: 'Confraternização Universal' },
    { date: '2025-03-03', name: 'Carnaval' },
    { date: '2025-03-04', name: 'Carnaval' },
    { date: '2025-04-18', name: 'Sexta-feira Santa' },
    { date: '2025-04-20', name: 'Páscoa' },
    { date: '2025-04-21', name: 'Tiradentes' },
    { date: '2025-05-01', name: 'Dia do Trabalho' },
    { date: '2025-06-19', name: 'Corpus Christi' },
    { date: '2025-09-07', name: 'Independência do Brasil' },
    { date: '2025-10-12', name: 'Nossa Senhora Aparecida' },
    { date: '2025-11-02', name: 'Finados' },
    { date: '2025-11-15', name: 'Proclamação da República' },
    { date: '2025-11-20', name: 'Dia da Consciência Negra' },
    { date: '2025-12-25', name: 'Natal' }
  ],
  2026: [
    { date: '2026-01-01', name: 'Confraternização Universal' },
    { date: '2026-02-16', name: 'Carnaval' },
    { date: '2026-02-17', name: 'Carnaval' },
    { date: '2026-04-03', name: 'Sexta-feira Santa' },
    { date: '2026-04-05', name: 'Páscoa' },
    { date: '2026-04-21', name: 'Tiradentes' },
    { date: '2026-05-01', name: 'Dia do Trabalho' },
    { date: '2026-06-04', name: 'Corpus Christi' },
    { date: '2026-09-07', name: 'Independência do Brasil' },
    { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
    { date: '2026-11-02', name: 'Finados' },
    { date: '2026-11-15', name: 'Proclamação da República' },
    { date: '2026-11-20', name: 'Dia da Consciência Negra' },
    { date: '2026-12-25', name: 'Natal' }
  ],
  2027: [
    { date: '2027-01-01', name: 'Confraternização Universal' },
    { date: '2027-02-08', name: 'Carnaval' },
    { date: '2027-02-09', name: 'Carnaval' },
    { date: '2027-03-26', name: 'Sexta-feira Santa' },
    { date: '2027-03-28', name: 'Páscoa' },
    { date: '2027-04-21', name: 'Tiradentes' },
    { date: '2027-05-01', name: 'Dia do Trabalho' },
    { date: '2027-05-27', name: 'Corpus Christi' },
    { date: '2027-09-07', name: 'Independência do Brasil' },
    { date: '2027-10-12', name: 'Nossa Senhora Aparecida' },
    { date: '2027-11-02', name: 'Finados' },
    { date: '2027-11-15', name: 'Proclamação da República' },
    { date: '2027-11-20', name: 'Dia da Consciência Negra' },
    { date: '2027-12-25', name: 'Natal' }
  ]
};

// Em memória durante a sessão
const memoryCache = {};

export async function fetchNationalHolidays(year) {
  const currentYear = year || new Date().getFullYear();

  if (memoryCache[currentYear]) {
    return memoryCache[currentYear];
  }

  // Tenta ler do localStorage primeiro
  const storageKey = `taresk_holidays_${currentYear}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache[currentYear] = parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache de feriados:', e);
  }

  // Busca na BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${currentYear}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(h => ({
          date: h.date, // "YYYY-MM-DD"
          name: h.name,
          type: h.type || 'national'
        }));
        memoryCache[currentYear] = formatted;
        try {
          localStorage.setItem(storageKey, JSON.stringify(formatted));
        } catch (e) {}
        return formatted;
      }
    }
  } catch (err) {
    console.warn(`Não foi possível puxar feriados da BrasilAPI para ${currentYear}, usando base interna:`, err);
  }

  // Fallback se a API falhar ou estiver offline
  if (memoryCache[currentYear]) {
    return memoryCache[currentYear];
  }

  const fallback = KNOWN_HOLIDAYS[currentYear] || [
    { date: `${currentYear}-01-01`, name: 'Confraternização Universal' },
    { date: `${currentYear}-04-21`, name: 'Tiradentes' },
    { date: `${currentYear}-05-01`, name: 'Dia do Trabalho' },
    { date: `${currentYear}-09-07`, name: 'Independência do Brasil' },
    { date: `${currentYear}-10-12`, name: 'Nossa Senhora Aparecida' },
    { date: `${currentYear}-11-02`, name: 'Finados' },
    { date: `${currentYear}-11-15`, name: 'Proclamação da República' },
    { date: `${currentYear}-11-20`, name: 'Dia da Consciência Negra' },
    { date: `${currentYear}-12-25`, name: 'Natal' }
  ];

  memoryCache[currentYear] = fallback;
  return fallback;
}
