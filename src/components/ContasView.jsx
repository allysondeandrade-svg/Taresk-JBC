import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight, ChevronDown,
  Calendar as CalendarIcon, Check, Landmark,
  CreditCard, FileText, Landmark as BankIcon, FileSpreadsheet,
  Pin, CalendarDays, Search
} from 'lucide-react';
import { fetchNationalHolidays } from '../services/holidayService';

// Helper para verificar se a conta foi paga em um mês e ano específicos
export function isBillPaidInMonth(bill, year, month) {
  if (!bill) return false;
  const rawType = String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase();
  const isRec = bill.isRecurring || bill.recurringType === 'monthly' || rawType === 'mensal' || rawType.includes('cart');

  // Se não for conta recorrente (pontual, boleto, empréstimo, etc), usa o status direto da conta
  if (!isRec) {
    return bill.status === 'paid';
  }

  const monthKey = `${year}_${month}`;

  // Se já possui registro específico para esse mês no paidMonths:
  if (bill.paidMonths && typeof bill.paidMonths === 'object') {
    if (Array.isArray(bill.paidMonths)) {
      return bill.paidMonths.includes(monthKey);
    }
    if (bill.paidMonths[monthKey] !== undefined) {
      return Boolean(bill.paidMonths[monthKey]);
    }
  }

  // Se não tiver registro específico no paidMonths:
  // Se for exatamente o mês original de criação da conta, herda bill.status
  const origYear = parseInt(bill.year, 10) || year;
  const origMonth = parseInt(bill.month, 10) || month;
  if (year === origYear && month === origMonth) {
    return bill.status === 'paid';
  }

  // Qualquer outro mês (futuro ou diferente) inicia como pendente (não pago) por padrão!
  return false;
}

// Categorias de conta (exclusivas entre si) com seus respectivos ícones e rótulos
const ALL_BILL_TYPES = [
  { id: 'pontual', label: 'Pontual', icon: Pin, isRecurring: false },
  { id: 'mensal', label: 'Mensal', icon: CalendarDays, isRecurring: true },
  { id: 'boleto', label: 'Boleto', icon: FileText, isRecurring: false },
  { id: 'cartao', label: 'Cartão de Crédito', icon: CreditCard, isRecurring: true },
  { id: 'emprestimo', label: 'Empréstimo', icon: BankIcon, isRecurring: false },
  { id: 'cheque', label: 'Cheque', icon: FileSpreadsheet, isRecurring: false }
];

// Helper para obter o ícone e informações da categoria da conta
function getBillTypeIcon(bill) {
  const raw = String(bill?.categoria || bill?.billType || bill?.tipo || '').toLowerCase().trim();
  if (raw === 'pontual') return Pin;
  if (raw === 'mensal') return CalendarDays;
  if (raw === 'cartao' || raw.includes('cart')) return CreditCard;
  if (raw === 'boleto') return FileText;
  if (raw === 'emprestimo' || raw.includes('empr')) return BankIcon;
  if (raw === 'cheque' || raw.includes('cheq')) return FileSpreadsheet;

  // Detecção inteligente por palavras-chave na descrição
  const desc = (bill?.description || '').toLowerCase();
  if (desc.includes('cartão') || desc.includes('cartao') || desc.includes('mercado pago') || desc.includes('inter') || desc.includes('c6') || desc.includes('nubank') || desc.includes('picpay')) {
    return CreditCard;
  }
  if (desc.includes('empréstimo') || desc.includes('emprestimo') || desc.includes('banco') || desc.includes('financiamento')) {
    return BankIcon;
  }
  if (desc.includes('cheque')) {
    return FileSpreadsheet;
  }
  if (desc.includes('boleto')) {
    return FileText;
  }
  if (bill?.isRecurring || bill?.recurringType === 'monthly') {
    return CalendarDays;
  }
  return Pin; // Default
}

// Normaliza o rótulo da Categoria para exibição e busca
function getBillCategoryLabel(bill) {
  const raw = String(bill?.categoria || bill?.billType || bill?.tipo || '').toLowerCase().trim();
  if (raw === 'mensal') return 'Mensal';
  if (raw === 'cartao' || raw.includes('cart')) return 'Cartão de Crédito';
  if (raw === 'boleto') return 'Boleto';
  if (raw === 'emprestimo' || raw.includes('empr')) return 'Empréstimo';
  if (raw === 'cheque' || raw.includes('cheq')) return 'Cheque';
  if (raw === 'pontual') return 'Pontual';

  const desc = (bill?.description || '').toLowerCase();
  if (desc.includes('cartão') || desc.includes('cartao') || desc.includes('mercado pago') || desc.includes('inter') || desc.includes('c6') || desc.includes('nubank') || desc.includes('picpay')) {
    return 'Cartão de Crédito';
  }
  if (desc.includes('empréstimo') || desc.includes('emprestimo')) return 'Empréstimo';
  if (desc.includes('cheque')) return 'Cheque';
  if (desc.includes('boleto')) return 'Boleto';
  if (bill?.isRecurring || bill?.recurringType === 'monthly') return 'Mensal';
  return 'Pontual';
}

// Helper para verificar se uma conta de cartão de crédito está a 7 dias ou menos do vencimento no mês focado
function isCardInvoiceClosingSoon(bill, currentYear, currentMonthIndex) {
  const isCard = bill.billType === 'cartao' || (bill.description || '').toLowerCase().includes('cart');
  if (!isCard) return false;

  const dueDay = parseInt(bill.day, 10) || 1;
  const dueDate = new Date(currentYear, currentMonthIndex, dueDay);

  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dueDate.getTime() - todayZero.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 7;
}

// Helper para obter o valor a exibir na linha da conta
function getDisplayBillValue(bill, currentYear, currentMonthIndex) {
  const isCard = bill.billType === 'cartao' || (bill.description || '').toLowerCase().includes('cart');
  if (!isCard) return bill.value || '';

  const origYear = parseInt(bill.year, 10) || currentYear;
  const origMonth = parseInt(bill.month, 10) || (currentMonthIndex + 1);

  // Se o mês/ano focado for posterior ao mês de cadastro original da conta:
  const isFutureMonth = (currentYear > origYear) || (currentYear === origYear && (currentMonthIndex + 1) > origMonth);

  // Se for mês futuro e não foi preenchido valor customizado neste mês, deixa em branco
  if (isFutureMonth && !bill.hasCustomMonthValue && !bill.monthValues?.[`${currentYear}_${currentMonthIndex + 1}`]) {
    return '';
  }

  return bill.monthValues?.[`${currentYear}_${currentMonthIndex + 1}`] || bill.value || '';
}

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Formata número para string monetária brasileira R$ 00,00
function formatCurrencyInput(val) {
  if (val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ContasView({
  bills = [],
  onAddBill,
  onUpdateBill,
  onDeleteBill
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth()); // 0 a 11
  const [searchQuery, setSearchQuery] = useState(''); // Barra de pesquisa de contas e categorias

  // Tamanho da fonte da lista de contas à direita
  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    return localStorage.getItem('taresk_contas_font_size') || 'large'; // 'small' | 'medium' | 'large' | 'xlarge'
  });

  const handleFontSizeChange = (size) => {
    setFontSizeLevel(size);
    localStorage.setItem('taresk_contas_font_size', size);
  };

  // Garantir que ao abrir a aba o mês atual fique sempre em evidência
  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonthIndex(now.getMonth());
  }, []);

  // Feriados Nacionais consultados da BrasilAPI
  const [holidaysMap, setHolidaysMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadHolidays() {
      const yearsToFetch = [currentYear - 1, currentYear, currentYear + 1];
      const mergedMap = {};

      for (const y of yearsToFetch) {
        const list = await fetchNationalHolidays(y);
        list.forEach(h => {
          // h.date formato "YYYY-MM-DD"
          if (h.date) {
            const parts = h.date.split('-');
            if (parts.length === 3) {
              const yNum = parseInt(parts[0], 10);
              const mNum = parseInt(parts[1], 10);
              const dNum = parseInt(parts[2], 10);
              mergedMap[`${yNum}-${mNum}-${dNum}`] = h.name;
            }
          }
        });
      }

      if (isMounted) {
        setHolidaysMap(mergedMap);
      }
    }

    loadHolidays();
    return () => { isMounted = false; };
  }, [currentYear]);

  // Modal de Adicionar/Editar Conta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    day: String(today.getDate()).padStart(2, '0'),
    month: String(today.getMonth() + 1).padStart(2, '0'),
    year: today.getFullYear(),
    value: '',
    billType: 'pontual', // 'pontual' | 'mensal' | 'boleto' | 'cartao' | 'emprestimo' | 'cheque'
    status: 'pending' // 'pending' | 'paid'
  });

  // Datas adicionais ("Mais de uma data")
  const [showExtraDates, setShowExtraDates] = useState(false);
  const [extraDates, setExtraDates] = useState([]); // [{ id, day, month, year }]

  // Referências para os inputs de dia e mês principal
  const dayInputRef = useRef(null);
  const monthInputRef = useRef(null);
  const datePickerRef = useRef(null);

  const handleOpenAdd = (presetDay = null, presetMonth = null, presetYear = null) => {
    setEditingBill(null);
    setShowExtraDates(false);
    setExtraDates([]);
    setFormData({
      description: '',
      day: String(presetDay || today.getDate()).padStart(2, '0'),
      month: String(presetMonth || (currentMonthIndex + 1)).padStart(2, '0'),
      year: presetYear || currentYear,
      value: '',
      billType: 'pontual',
      status: 'pending'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill) => {
    setEditingBill(bill);
    setShowExtraDates(false);
    setExtraDates([]);
    const rawType = String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase().trim();
    let detectedType = 'pontual';
    if (rawType === 'mensal') detectedType = 'mensal';
    else if (rawType === 'cartao' || rawType.includes('cart')) detectedType = 'cartao';
    else if (rawType === 'boleto') detectedType = 'boleto';
    else if (rawType === 'emprestimo' || rawType.includes('empr')) detectedType = 'emprestimo';
    else if (rawType === 'cheque' || rawType.includes('cheq')) detectedType = 'cheque';
    else if (rawType === 'pontual') detectedType = 'pontual';
    else {
      detectedType = (
        (bill.description || '').toLowerCase().includes('cart') ? 'cartao' :
        (bill.description || '').toLowerCase().includes('empr') ? 'emprestimo' :
        (bill.description || '').toLowerCase().includes('cheq') ? 'cheque' :
        (bill.description || '').toLowerCase().includes('boleto') ? 'boleto' :
        (bill.isRecurring || bill.recurringType === 'monthly') ? 'mensal' : 'pontual'
      );
    }
    setFormData({
      description: bill.description || '',
      day: String(bill.day || today.getDate()).padStart(2, '0'),
      month: String(bill.month || (today.getMonth() + 1)).padStart(2, '0'),
      year: bill.year || today.getFullYear(),
      value: bill.value || '',
      billType: detectedType,
      status: bill.status || 'pending'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBill(null);
    setShowExtraDates(false);
    setExtraDates([]);
  };

  // Adiciona mais uma data sugerindo o mesmo dia do próximo mês
  const handleAddExtraDate = () => {
    const lastDate = extraDates.length > 0 ? extraDates[extraDates.length - 1] : formData;
    let nextM = (parseInt(lastDate.month, 10) || 1) + 1;
    let nextY = parseInt(lastDate.year, 10) || currentYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setExtraDates(prev => [
      ...prev,
      {
        id: `extra_${Date.now()}_${prev.length}`,
        day: String(lastDate.day || '01').padStart(2, '0'),
        month: String(nextM).padStart(2, '0'),
        year: nextY
      }
    ]);
  };

  const handleSaveBill = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Informe a descrição da conta.');
      return;
    }

    const isRec = formData.billType === 'mensal' || formData.billType === 'cartao';
    const tipoItem = ALL_BILL_TYPES.find(t => t.id === formData.billType);
    const tipoLabel = tipoItem ? tipoItem.label : 'Pontual';

    const basePayload = {
      description: formData.description.trim(),
      day: parseInt(formData.day, 10) || today.getDate(),
      month: parseInt(formData.month, 10) || (today.getMonth() + 1),
      year: parseInt(formData.year, 10) || today.getFullYear(),
      value: formData.value || '',
      isRecurring: isRec,
      recurringType: isRec ? 'monthly' : 'once',
      billType: formData.billType,
      tipo: tipoLabel,
      categoria: tipoLabel,
      status: formData.status || 'pending',
      id: editingBill ? editingBill.id : `bill_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    };

    if (editingBill) {
      if (onUpdateBill) onUpdateBill(editingBill.id, basePayload);
    } else {
      if (onAddBill) onAddBill(basePayload);

      // Se houver datas extras configuradas, salva cada uma como uma conta vinculada
      if (showExtraDates && extraDates.length > 0) {
        extraDates.forEach((ed, idx) => {
          const extraPayload = {
            ...basePayload,
            id: `bill_${Date.now()}_${idx + 1}_${Math.floor(Math.random() * 100000)}`,
            day: parseInt(ed.day, 10) || basePayload.day,
            month: parseInt(ed.month, 10) || basePayload.month,
            year: parseInt(ed.year, 10) || basePayload.year
          };
          if (onAddBill) onAddBill(extraPayload);
        });
      }
    }

    handleCloseModal();
  };

  const handleDelete = (bill) => {
    if (window.confirm(`Deseja excluir a conta "${bill.description}"?`)) {
      if (onDeleteBill) onDeleteBill(bill.id || bill);
    }
  };

  const handleToggleStatus = (bill) => {
    if (onUpdateBill) {
      const rawType = String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase();
      const isRec = bill.isRecurring || bill.recurringType === 'monthly' || rawType === 'mensal' || rawType.includes('cart');
      const focusedMonth = currentMonthIndex + 1;
      const focusedYear = currentYear;
      const monthKey = `${focusedYear}_${focusedMonth}`;

      if (isRec) {
        // Para contas recorrentes (mensal, cartão), alterna apenas o status do mês/ano atualmente focado
        const currentPaid = isBillPaidInMonth(bill, focusedYear, focusedMonth);
        const nextPaid = !currentPaid;

        const currentPaidMonths = (bill.paidMonths && typeof bill.paidMonths === 'object' && !Array.isArray(bill.paidMonths))
          ? { ...bill.paidMonths }
          : {};

        currentPaidMonths[monthKey] = nextPaid;

        const origYear = parseInt(bill.year, 10) || focusedYear;
        const origMonth = parseInt(bill.month, 10) || focusedMonth;
        const isOrigMonth = (focusedYear === origYear && focusedMonth === origMonth);

        onUpdateBill(bill.id, {
          ...bill,
          paidMonths: currentPaidMonths,
          // Se for o mês original de criação, atualiza também bill.status para manter compatibilidade
          ...(isOrigMonth ? { status: nextPaid ? 'paid' : 'pending' } : {})
        });
      } else {
        const nextStatus = bill.status === 'paid' ? 'pending' : 'paid';
        onUpdateBill(bill.id, { ...bill, status: nextStatus });
      }
    }
  };

  // Gera meses sequenciais para a rolagem/arrastar:
  // - Retorna 1 ano (12 meses) conforme solicitado.
  // - As colunas esquerda (calendários) e direita (contas) possuem barras de rolagem independentes.
  const displayedMonths = useMemo(() => {
    const realNow = new Date();
    const realYear = realNow.getFullYear();
    const realMonth = realNow.getMonth();

    // Compara se a data selecionada no topo é anterior ao mês real atual
    const isPastSelection = (currentYear < realYear) || (currentYear === realYear && currentMonthIndex < realMonth);

    // Se for anterior, inicia do mês anterior selecionado; se for o atual ou futuro, inicia do mês real atual
    const startMonth = isPastSelection ? currentMonthIndex : realMonth;
    const startYear = isPastSelection ? currentYear : realYear;

    const list = [];
    for (let offset = 0; offset <= 11; offset++) {
      let m = startMonth + offset;
      let y = startYear;
      while (m < 0) {
        m += 12;
        y -= 1;
      }
      while (m > 11) {
        m -= 12;
        y += 1;
      }
      list.push({ monthIndex: m, year: y });
    }
    return list;
  }, [currentMonthIndex, currentYear]);

  // Contas filtradas do mês/ano atualmente selecionado e pelo termo da barra de pesquisa
  // Se for conta mensal ou cartão de crédito (recorrente), aparece em todos os meses a partir do mês/ano de início
  const focusedMonthBills = useMemo(() => {
    const targetMonth = currentMonthIndex + 1;
    const targetYear = currentYear;
    const searchLower = searchQuery.trim().toLowerCase();

    return bills
      .filter(b => {
        const bMonth = parseInt(b.month, 10) || 1;
        const bYear = parseInt(b.year, 10) || targetYear;
        const rawType = String(b.categoria || b.billType || b.tipo || '').toLowerCase();
        const isRec = b.isRecurring || b.recurringType === 'monthly' || rawType === 'mensal' || rawType.includes('cart');

        let matchesMonth = false;
        if (isRec) {
          // Conta recorrente (Mensal / Cartão) aparece no mês/ano inicial e em todos os meses/anos futuros
          if (targetYear > bYear) matchesMonth = true;
          else if (targetYear === bYear && targetMonth >= bMonth) matchesMonth = true;
        } else {
          // Conta de ocorrência única (Pontual, Boleto, Empréstimo, Cheque): apenas naquele mês e ano específico
          matchesMonth = bMonth === targetMonth && (!b.year || bYear === targetYear);
        }

        if (!matchesMonth) return false;

        // Filtro de pesquisa por texto: busca tanto no nome da conta quanto na categoria (tipo)
        if (searchLower) {
          const desc = String(b.description || '').toLowerCase();
          const catLabel = getBillCategoryLabel(b).toLowerCase();
          const catRaw = rawType;
          const val = String(b.value || '').toLowerCase();
          const matchesSearch = desc.includes(searchLower) || catLabel.includes(searchLower) || catRaw.includes(searchLower) || val.includes(searchLower);
          if (!matchesSearch) return false;
        }

        return true;
      })
      .sort((a, b) => (parseInt(a.day, 10) || 0) - (parseInt(b.day, 10) || 0));
  }, [bills, currentMonthIndex, currentYear, searchQuery]);

  // Mapa de contas por "ano-mes-dia" para destacar nos blocos de calendário
  const billsByDateMap = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const bDay = parseInt(b.day, 10) || 1;
      const bMonth = parseInt(b.month, 10) || 1;
      const bYear = parseInt(b.year, 10) || currentYear;
      const rawType = String(b.billType || b.tipo || '').toLowerCase();
      const isRec = b.isRecurring || b.recurringType === 'monthly' || rawType === 'mensal' || rawType.includes('cart');

      if (isRec) {
        // Espalha para os meses exibidos se a data for igual ou posterior ao início da recorrência
        displayedMonths.forEach(({ monthIndex, year }) => {
          const m = monthIndex + 1;
          const y = year;
          const isEligible = (y > bYear) || (y === bYear && m >= bMonth);
          if (isEligible) {
            const key = `${y}-${m}-${bDay}`;
            if (!map[key]) map[key] = [];
            map[key].push(b);
          }
        });
      } else {
        const key = `${bYear}-${bMonth}-${bDay}`;
        if (!map[key]) map[key] = [];
        map[key].push(b);
      }
    });
    return map;
  }, [bills, currentYear, displayedMonths]);

  // Estilos de fonte configuráveis para a descrição e valor à direita
  const fontStyles = useMemo(() => {
    switch (fontSizeLevel) {
      case 'small':
        return {
          dayBoxSize: '36px',
          dayFontSize: '16px',
          descFontSize: '18px',
          gap: '12px'
        };
      case 'medium':
        return {
          dayBoxSize: '46px',
          dayFontSize: '20px',
          descFontSize: '24px',
          gap: '16px'
        };
      case 'xlarge':
        return {
          dayBoxSize: '68px',
          dayFontSize: '32px',
          descFontSize: '36px',
          gap: '24px'
        };
      case 'large':
      default:
        return {
          dayBoxSize: '56px',
          dayFontSize: '26px',
          descFontSize: '30px',
          gap: '20px'
        };
    }
  }, [fontSizeLevel]);

  // Navegação de meses
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonthIndex(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonthIndex(m => m + 1);
    }
  };

  // Renderiza a grade de dias de um mês específico
  const renderMonthCalendarCard = (monthIndex, year) => {
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 (Dom) a 6 (Sáb)
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const calendarCells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarCells.push({ empty: true, key: `empty-pre-${i}` });
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${year}-${monthIndex + 1}-${day}`;
      const dayBills = billsByDateMap[dateKey] || [];
      const holidayName = holidaysMap[dateKey] || null;

      // Filtra se existem contas pendentes e pagas especificamente neste mês
      const pendingBills = dayBills.filter(b => !isBillPaidInMonth(b, year, monthIndex + 1));
      const hasPendingBills = pendingBills.length > 0;
      const allBillsPaid = dayBills.length > 0 && !hasPendingBills;

      calendarCells.push({
        empty: false,
        day,
        dateKey,
        bills: dayBills,
        pendingBills,
        hasBills: dayBills.length > 0,
        hasPendingBills,
        allBillsPaid,
        holidayName,
        isToday: day === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear()
      });
    }

    const isCurrentActive = monthIndex === currentMonthIndex && year === currentYear;

    return (
      <div
        key={`${year}-${monthIndex}`}
        onClick={() => {
          setCurrentMonthIndex(monthIndex);
          setCurrentYear(year);
        }}
        style={{
          width: '320px',
          minWidth: '320px',
          background: '#f8fafc',
          borderRadius: '16px',
          border: isCurrentActive ? '3px solid #5925dc' : '2px solid #cbd5e1',
          boxShadow: isCurrentActive ? '0 8px 24px rgba(89, 37, 220, 0.2)' : '0 4px 12px rgba(0,0,0,0.04)',
          padding: '16px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        {/* Cabeçalho do Card: Ano (pílula roxa) e Nome do Mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div
            style={{
              background: '#b8a6f8',
              color: '#1e1b4b',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '18px',
              letterSpacing: '0.5px'
            }}
          >
            {year}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '900',
              color: '#1e293b',
              letterSpacing: '1px'
            }}
          >
            {MONTH_NAMES[monthIndex]}
          </div>
        </div>

        {/* Linha dos Dias da Semana */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: '#b8a6f8',
            borderRadius: '6px',
            padding: '5px 2px',
            marginBottom: '6px',
            textAlign: 'center'
          }}
        >
          {WEEK_DAYS.map(d => (
            <span
              key={d}
              style={{
                fontSize: '10px',
                fontWeight: '800',
                color: '#1e1b4b',
                textTransform: 'uppercase'
              }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Grade de Dias */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            background: '#ffffff',
            borderRadius: '10px',
            padding: '8px 4px',
            border: '1px solid #e2e8f0'
          }}
        >
          {calendarCells.map((cell, idx) => {
            if (cell.empty) {
              return (
                <div
                  key={cell.key || idx}
                  style={{
                    height: '32px',
                    borderRadius: '6px',
                    background: '#f1f5f9'
                  }}
                />
              );
            }

            const isHighlighted = cell.hasBills;
            const tooltipParts = [];
            if (cell.holidayName) tooltipParts.push(`🎉 Feriado Nacional: ${cell.holidayName}`);
            if (cell.hasBills) tooltipParts.push(`📌 ${cell.bills.length} conta(s): ${cell.bills.map(b => b.description).join(', ')}`);
            if (tooltipParts.length === 0) tooltipParts.push(`Adicionar conta no dia ${cell.day}`);

            return (
              <div
                key={cell.dateKey}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMonthIndex(monthIndex);
                  setCurrentYear(year);
                  handleOpenAdd(cell.day, monthIndex + 1, year);
                }}
                title={tooltipParts.join(' | ')}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: isHighlighted ? '900' : '700',
                  color: isHighlighted ? '#ffffff' : (cell.holidayName ? '#dc2626' : '#1e293b'),
                  background: isHighlighted ? '#b8a6f8' : (cell.isToday ? '#ede9fe' : (cell.holidayName ? '#fef2f2' : 'transparent')),
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                  border: cell.isToday && !isHighlighted ? '1.5px dashed #7c3aed' : 'none',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  if (!isHighlighted) e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!isHighlighted) e.currentTarget.style.background = cell.isToday ? '#ede9fe' : (cell.holidayName ? '#fef2f2' : 'transparent');
                }}
              >
                {cell.day}

                {/* Ícone no canto superior direito do dia se for Feriado Nacional que não se trabalha */}
                {cell.holidayName && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1px',
                      right: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}
                    title={`Feriado Nacional: ${cell.holidayName}`}
                  >
                    <Landmark
                      size={9}
                      color={isHighlighted ? '#ffffff' : '#ef4444'}
                      strokeWidth={3}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '1440px',
      width: '100%',
      margin: '0 auto',
      padding: '24px 20px 16px',
      height: '100%',
      maxHeight: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Barra Superior de Controle e Opções */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>
            Contas a Pagar
          </h1>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#6d28d9', background: '#ecebfa', padding: '4px 12px', borderRadius: '9999px' }}>
            {MONTH_NAMES[currentMonthIndex]} {currentYear}
          </span>
        </div>

        {/* Controles: Barra de Pesquisa, Navegação de Mês, Ajuste de Fonte e Botão de Nova Conta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Barra de Pesquisa (à esquerda do navegador de mês) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              padding: '6px 12px',
              minWidth: '220px'
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Buscar conta ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1e293b',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Limpar busca"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Navegador de Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', borderRadius: '10px', border: '1.5px solid #cbd5e1', padding: '2px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Mês anterior"
              style={{ padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px' }}
            >
              <ChevronLeft size={18} color="#475569" />
            </button>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', minWidth: '120px', textAlign: 'center' }}>
              {MONTH_NAMES[currentMonthIndex].slice(0, 3)} / {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              title="Próximo mês"
              style={{ padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px' }}
            >
              <ChevronRight size={18} color="#475569" />
            </button>
          </div>

          {/* Seletor de Tamanho da Fonte */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 8px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Tamanho:</span>
            {[
              { id: 'small', label: 'P' },
              { id: 'medium', label: 'M' },
              { id: 'large', label: 'G' },
              { id: 'xlarge', label: 'GG' }
            ].map(sz => (
              <button
                key={sz.id}
                type="button"
                onClick={() => handleFontSizeChange(sz.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: fontSizeLevel === sz.id ? '1.5px solid #5925dc' : '1px solid transparent',
                  background: fontSizeLevel === sz.id ? '#ecebfa' : 'transparent',
                  color: fontSizeLevel === sz.id ? '#5925dc' : '#64748b',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {sz.label}
              </button>
            ))}
          </div>

          {/* Botão Circular Roxo com + padronizado */}
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            title="Adicionar Nova Conta"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#5925dc',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(89, 37, 220, 0.4)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#4e1fc4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#5925dc'; }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Grid Principal: Esquerda com Calendários | Direita com Lista das Contas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(330px, 420px) 1fr',
        gap: '32px',
        alignItems: 'stretch',
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden'
      }}>
        
        {/* Coluna Esquerda: Calendários dos meses com rolagem/arrastar independente */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          {/* Container com scroll vertical independente para os calendários */}
          <div
            style={{
              height: '100%',
              maxHeight: '100%',
              overflowY: 'auto',
              paddingRight: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {displayedMonths.map(item => renderMonthCalendarCard(item.monthIndex, item.year))}
          </div>
        </div>

        {/* Coluna Direita: Lista de Contas com rolagem independente */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          height: '100%',
          maxHeight: '100%',
          boxSizing: 'border-box',
          overflowY: 'auto',
          minHeight: 0
        }}>
          {focusedMonthBills.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <CalendarIcon size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#64748b' }}>
                Nenhuma conta cadastrada para {MONTH_NAMES[currentMonthIndex]} de {currentYear}.
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Clique no botão <b>+</b> acima ou em qualquer dia do calendário para agendar uma conta.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: fontStyles.gap }}>
              {focusedMonthBills.map((bill) => {
                const isPaid = isBillPaidInMonth(bill, currentYear, currentMonthIndex + 1);
                const isRec = bill.isRecurring || bill.recurringType === 'monthly' || bill.billType === 'mensal' || bill.billType === 'cartao';
                const isCard = bill.billType === 'cartao' || (bill.description || '').toLowerCase().includes('cart');
                const displayValue = getDisplayBillValue(bill, currentYear, currentMonthIndex);
                const closingSoon = isCard && !displayValue && isCardInvoiceClosingSoon(bill, currentYear, currentMonthIndex);

                return (
                  <div
                    key={bill.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isPaid ? '#f8fafc' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isPaid ? '#f8fafc' : 'transparent'; }}
                  >
                    {/* Lado Esquerdo: Bloco do Dia Cinza + Descrição da conta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, minWidth: 0 }}>
                      {/* Quadrado Cinza com o Dia */}
                      <div
                        style={{
                          width: fontStyles.dayBoxSize,
                          height: fontStyles.dayBoxSize,
                          minWidth: fontStyles.dayBoxSize,
                          background: '#dcdcdc',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          fontSize: fontStyles.dayFontSize,
                          color: isPaid ? '#94a3b8' : '#000000',
                          textDecoration: isPaid ? 'line-through' : 'none',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                        }}
                      >
                        {bill.day}
                      </div>

                      {/* Descrição da Conta com Ícone da Categoria */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {(() => {
                          const IconComp = getBillTypeIcon(bill);
                          const catLabel = getBillCategoryLabel(bill);
                          return (
                            <div
                              title={`Categoria: ${catLabel}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isPaid ? '#94a3b8' : '#475569',
                                flexShrink: 0
                              }}
                            >
                              <IconComp size={16} strokeWidth={2.2} />
                            </div>
                          );
                        })()}
                        <span
                          style={{
                            fontSize: fontStyles.descFontSize,
                            fontWeight: '900',
                            color: isPaid ? '#94a3b8' : '#000000',
                            textDecoration: isPaid ? 'line-through' : 'none',
                            letterSpacing: '-0.5px',
                            lineHeight: 1.2,
                            wordBreak: 'break-word'
                          }}
                        >
                          {bill.description}
                        </span>

                        {/* Selo Fatura Fechada (para cartões quando faltar 7 dias ou menos e ainda não tiver valor) */}
                        {closingSoon ? (
                          <span
                            title="Fatura fechada - insira o valor desta fatura"
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: '#b45309',
                              background: '#fef3c7',
                              border: '1px solid #fde68a',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Fatura Fechada
                          </span>
                        ) : (
                          isRec && (
                            <span
                              title={isCard ? 'Cartão de Crédito Recorrente' : 'Conta Mensal Recorrente'}
                              style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: '#6d28d9',
                                background: '#f3e8ff',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Mensal
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Lado Direito: Valor em Real (mesma fonte, tamanho e preto) + Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      {displayValue ? (
                        <span
                          style={{
                            fontSize: fontStyles.descFontSize,
                            fontWeight: '900',
                            color: isPaid ? '#94a3b8' : '#000000',
                            textDecoration: isPaid ? 'line-through' : 'none',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {displayValue}
                        </span>
                      ) : null}

                      {/* Botões: Pagar, Editar, Excluir */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(bill)}
                          title={isPaid ? 'Marcar como pendente' : 'Marcar como paga'}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isPaid ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                            background: isPaid ? '#dcfce7' : '#ffffff',
                            color: isPaid ? '#16a34a' : '#64748b',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isPaid && <Check size={14} />} {isPaid ? 'Paga' : 'Pagar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bill)}
                          title="Editar conta"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '6px',
                            borderRadius: '6px'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#5925dc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(bill)}
                          title="Excluir conta"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '6px',
                            borderRadius: '6px'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Conta */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 28px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
                {editingBill ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Descrição */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Descrição da Conta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel, Boleto Grenada, Conta de Água..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Valor e Data lado a lado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'flex-start' }}>
                {/* Valor (R$) */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={formData.value}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setFormData({ ...formData, value: formatted });
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '15px',
                      fontWeight: '800',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Data: Campo com dia/mês e botão de calendário */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Data
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      background: '#ffffff'
                    }}>
                      <input
                        ref={dayInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        required
                        placeholder="DD"
                        value={formData.day}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, day: val });
                          if (val.length === 2 && monthInputRef.current) {
                            monthInputRef.current.focus();
                            monthInputRef.current.select();
                          }
                        }}
                        style={{
                          width: '32px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '16px',
                          fontWeight: '800',
                          textAlign: 'center',
                          color: '#0f172a'
                        }}
                      />
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#94a3b8', margin: '0 6px' }}>/</span>
                      <input
                        ref={monthInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        required
                        placeholder="MM"
                        value={formData.month}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, month: val });
                        }}
                        onBlur={() => {
                          if (formData.month && formData.month.length === 1) {
                            setFormData(prev => ({ ...prev, month: prev.month.padStart(2, '0') }));
                          }
                        }}
                        style={{
                          width: '32px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '16px',
                          fontWeight: '800',
                          textAlign: 'center',
                          color: '#0f172a'
                        }}
                      />
                    </div>

                    {/* Botão de Calendário nativo HTML5 invisível com acionamento ao clicar no ícone */}
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={datePickerRef}
                        type="date"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [y, m, d] = e.target.value.split('-');
                            setFormData({
                              ...formData,
                              day: String(d).padStart(2, '0'),
                              month: String(m).padStart(2, '0'),
                              year: parseInt(y, 10) || currentYear
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        title="Abrir calendário"
                        onClick={() => {
                          if (datePickerRef.current) {
                            if (typeof datePickerRef.current.showPicker === 'function') {
                              datePickerRef.current.showPicker();
                            } else {
                              datePickerRef.current.focus();
                            }
                          }
                        }}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: '#ede9fe',
                          border: '1px solid #ddd6fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0,
                          cursor: 'pointer'
                        }}
                      >
                        🗓️
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Categoria (comportamento de rádio exclusivo: Pontual, Mensal, Boleto, Cartão de Crédito, Empréstimo, Cheque) */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Categoria
                </label>

                {/* Linha 1 de Categorias: Pontual (com pino) e Mensal (com calendário) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billType: 'pontual' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.billType === 'pontual' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.billType === 'pontual' ? '#ecebfa' : '#ffffff',
                      color: formData.billType === 'pontual' ? '#5925dc' : '#475569',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Pin size={16} />
                    <span>Pontual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billType: 'mensal' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.billType === 'mensal' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.billType === 'mensal' ? '#ecebfa' : '#ffffff',
                      color: formData.billType === 'mensal' ? '#5925dc' : '#475569',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CalendarDays size={16} />
                    <span>Mensal</span>
                  </button>
                </div>

                {/* Linha 2 de Categorias: Boleto e Cartão de Crédito */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billType: 'boleto' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.billType === 'boleto' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.billType === 'boleto' ? '#ecebfa' : '#ffffff',
                      color: formData.billType === 'boleto' ? '#5925dc' : '#475569',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <FileText size={16} />
                    <span>Boleto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billType: 'cartao' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.billType === 'cartao' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.billType === 'cartao' ? '#ecebfa' : '#ffffff',
                      color: formData.billType === 'cartao' ? '#5925dc' : '#475569',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CreditCard size={16} />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>

                {/* Linha 3 de Tipos: Empréstimo e Cheque */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billType: 'emprestimo' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.billType === 'emprestimo' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.billType === 'emprestimo' ? '#ecebfa' : '#ffffff',
                      color: formData.billType === 'emprestimo' ? '#5925dc' : '#475569',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BankIcon size={16} />
                    <span>Empréstimo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billType: 'cheque' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.billType === 'cheque' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.billType === 'cheque' ? '#ecebfa' : '#ffffff',
                      color: formData.billType === 'cheque' ? '#5925dc' : '#475569',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Cheque</span>
                  </button>
                </div>

                {/* Botão cinza "Mais de uma data v" */}
                {!editingBill && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !showExtraDates;
                        setShowExtraDates(nextState);
                        if (nextState && extraDates.length === 0) {
                          handleAddExtraDate();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    >
                      <span>Mais de uma data</span>
                      <ChevronDown
                        size={15}
                        style={{
                          transform: showExtraDates ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </button>

                    {/* Lista de Datas Adicionais */}
                    {showExtraDates && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>
                            Datas Adicionais
                          </span>
                          <button
                            type="button"
                            onClick={handleAddExtraDate}
                            title="Adicionar outra data"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              border: 'none',
                              background: '#5925dc',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(89, 37, 220, 0.3)'
                            }}
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        {extraDates.map((ed, idx) => (
                          <div key={ed.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', minWidth: '50px' }}>
                              Data {idx + 2}
                            </span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              flex: 1,
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '12px',
                              padding: '8px 12px',
                              background: '#ffffff'
                            }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={ed.day}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setExtraDates(prev => prev.map(item => item.id === ed.id ? { ...item, day: val } : item));
                                }}
                                style={{
                                  width: '30px',
                                  border: 'none',
                                  outline: 'none',
                                  fontSize: '15px',
                                  fontWeight: '800',
                                  textAlign: 'center',
                                  color: '#0f172a'
                                }}
                              />
                              <span style={{ fontSize: '15px', fontWeight: '800', color: '#94a3b8', margin: '0 4px' }}>/</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={ed.month}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setExtraDates(prev => prev.map(item => item.id === ed.id ? { ...item, month: val } : item));
                                }}
                                onBlur={() => {
                                  if (ed.month && ed.month.length === 1) {
                                    setExtraDates(prev => prev.map(item => item.id === ed.id ? { ...item, month: item.month.padStart(2, '0') } : item));
                                  }
                                }}
                                style={{
                                  width: '30px',
                                  border: 'none',
                                  outline: 'none',
                                  fontSize: '15px',
                                  fontWeight: '800',
                                  textAlign: 'center',
                                  color: '#0f172a'
                                }}
                              />
                            </div>

                            {/* Calendário nativo para data adicional */}
                            <div style={{ position: 'relative' }}>
                              <input
                                type="date"
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  opacity: 0,
                                  width: '100%',
                                  height: '100%',
                                  cursor: 'pointer',
                                  zIndex: 2
                                }}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const [y, m, d] = e.target.value.split('-');
                                    setExtraDates(prev => prev.map(item => item.id === ed.id ? {
                                      ...item,
                                      day: String(d).padStart(2, '0'),
                                      month: String(m).padStart(2, '0'),
                                      year: parseInt(y, 10) || currentYear
                                    } : item));
                                  }
                                }}
                              />
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: '#ede9fe',
                                  border: '1px solid #ddd6fe',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '18px',
                                  cursor: 'pointer'
                                }}
                              >
                                🗓️
                              </div>
                            </div>

                            {/* Remover data adicional */}
                            <button
                              type="button"
                              onClick={() => setExtraDates(prev => prev.filter(item => item.id !== ed.id))}
                              title="Remover data"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botões do Rodapé: Cancelar e Salvar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(89, 37, 220, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
