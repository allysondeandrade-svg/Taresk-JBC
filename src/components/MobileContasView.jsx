import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Check, Landmark,
  CreditCard, FileText, Landmark as BankIcon, FileSpreadsheet,
  Pin, CalendarDays, Search, CheckCircle2, DollarSign
} from 'lucide-react';
import { fetchNationalHolidays } from '../services/holidayService';
import { isBillPaidInMonth } from './ContasView';

const ALL_BILL_TYPES = [
  { id: 'pontual', label: 'Pontual', icon: Pin, isRecurring: false },
  { id: 'mensal', label: 'Mensal', icon: CalendarDays, isRecurring: true },
  { id: 'boleto', label: 'Boleto', icon: FileText, isRecurring: false },
  { id: 'cartao', label: 'Cartão de Crédito', icon: CreditCard, isRecurring: true },
  { id: 'emprestimo', label: 'Empréstimo', icon: BankIcon, isRecurring: false },
  { id: 'cheque', label: 'Cheque', icon: FileSpreadsheet, isRecurring: false }
];

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

function getBillTypeIcon(bill) {
  const raw = String(bill?.categoria || bill?.billType || bill?.tipo || '').toLowerCase().trim();
  if (raw === 'pontual') return Pin;
  if (raw === 'mensal') return CalendarDays;
  if (raw === 'cartao' || raw.includes('cart')) return CreditCard;
  if (raw === 'boleto') return FileText;
  if (raw === 'emprestimo' || raw.includes('empr')) return BankIcon;
  if (raw === 'cheque' || raw.includes('cheq')) return FileSpreadsheet;

  const desc = (bill?.description || '').toLowerCase();
  if (desc.includes('cartão') || desc.includes('cartao')) return CreditCard;
  if (desc.includes('empréstimo') || desc.includes('emprestimo')) return BankIcon;
  if (desc.includes('cheque')) return FileSpreadsheet;
  if (desc.includes('boleto')) return FileText;
  if (bill?.isRecurring || bill?.recurringType === 'monthly') return CalendarDays;
  return Pin;
}

function getDisplayBillValue(bill, currentYear, currentMonthIndex) {
  const isCard = bill.billType === 'cartao' || (bill.description || '').toLowerCase().includes('cart');
  if (!isCard) return bill.value || '';

  const origYear = parseInt(bill.year, 10) || currentYear;
  const origMonth = parseInt(bill.month, 10) || (currentMonthIndex + 1);
  const isFutureMonth = (currentYear > origYear) || (currentYear === origYear && (currentMonthIndex + 1) > origMonth);

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

function formatCurrencyInput(val) {
  if (val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MobileContasView({
  bills = [],
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  isDark = false
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState(null); // Dia clicado para filtrar ou null para o mês todo
  const [holidaysMap, setHolidaysMap] = useState({});

  // Carregar feriados nacionais
  useEffect(() => {
    let isMounted = true;
    async function loadHolidays() {
      const list = await fetchNationalHolidays(currentYear);
      const mergedMap = {};
      list.forEach(h => {
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
      if (isMounted) setHolidaysMap(mergedMap);
    }
    loadHolidays();
    return () => { isMounted = false; };
  }, [currentYear]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    day: String(today.getDate()).padStart(2, '0'),
    month: String(today.getMonth() + 1).padStart(2, '0'),
    year: today.getFullYear(),
    value: '',
    billType: 'pontual',
    status: 'pending'
  });
  const [showExtraDates, setShowExtraDates] = useState(false);
  const [extraDates, setExtraDates] = useState([]);
  const datePickerRef = useRef(null);

  const handleOpenAdd = (presetDay = null) => {
    setEditingBill(null);
    setShowExtraDates(false);
    setExtraDates([]);
    setFormData({
      description: '',
      day: String(presetDay || selectedDayFilter || today.getDate()).padStart(2, '0'),
      month: String(currentMonthIndex + 1).padStart(2, '0'),
      year: currentYear,
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
          ...(isOrigMonth ? { status: nextPaid ? 'paid' : 'pending' } : {})
        });
      } else {
        const nextStatus = bill.status === 'paid' ? 'pending' : 'paid';
        onUpdateBill(bill.id, { ...bill, status: nextStatus });
      }
    }
  };

  const handlePrevMonth = () => {
    setSelectedDayFilter(null);
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonthIndex(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDayFilter(null);
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonthIndex(m => m + 1);
    }
  };

  // Contas filtradas do mês
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
          if (targetYear > bYear) matchesMonth = true;
          else if (targetYear === bYear && targetMonth >= bMonth) matchesMonth = true;
        } else {
          matchesMonth = bMonth === targetMonth && (!b.year || bYear === targetYear);
        }

        if (!matchesMonth) return false;

        if (selectedDayFilter !== null) {
          if (parseInt(b.day, 10) !== selectedDayFilter) return false;
        }

        if (searchLower) {
          const desc = String(b.description || '').toLowerCase();
          const catLabel = getBillCategoryLabel(b).toLowerCase();
          const val = String(b.value || '').toLowerCase();
          const matchesSearch = desc.includes(searchLower) || catLabel.includes(searchLower) || val.includes(searchLower);
          if (!matchesSearch) return false;
        }

        return true;
      })
      .sort((a, b) => (parseInt(a.day, 10) || 0) - (parseInt(b.day, 10) || 0));
  }, [bills, currentMonthIndex, currentYear, searchQuery, selectedDayFilter]);

  // Contas do mês inteiro (sem filtro de dia) para calcular totais e mapear dias no calendário
  const allMonthBills = useMemo(() => {
    const targetMonth = currentMonthIndex + 1;
    const targetYear = currentYear;

    return bills.filter(b => {
      const bMonth = parseInt(b.month, 10) || 1;
      const bYear = parseInt(b.year, 10) || targetYear;
      const rawType = String(b.categoria || b.billType || b.tipo || '').toLowerCase();
      const isRec = b.isRecurring || b.recurringType === 'monthly' || rawType === 'mensal' || rawType.includes('cart');

      if (isRec) {
        if (targetYear > bYear) return true;
        if (targetYear === bYear && targetMonth >= bMonth) return true;
        return false;
      }
      return bMonth === targetMonth && (!b.year || bYear === targetYear);
    });
  }, [bills, currentMonthIndex, currentYear]);

  // Resumo financeiro do mês (Total, Pendente, Pago)
  const monthTotals = useMemo(() => {
    let totalPending = 0;
    let totalPaid = 0;

    allMonthBills.forEach(b => {
      const isPaid = isBillPaidInMonth(b, currentYear, currentMonthIndex + 1);
      const valStr = getDisplayBillValue(b, currentYear, currentMonthIndex);
      const cleanVal = parseFloat(String(valStr).replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      if (isPaid) {
        totalPaid += cleanVal;
      } else {
        totalPending += cleanVal;
      }
    });

    return {
      pending: totalPending,
      paid: totalPaid,
      total: totalPending + totalPaid
    };
  }, [allMonthBills, currentYear, currentMonthIndex]);

  // Mapa de contas por dia do mês atual para o mini calendário
  const daysWithBillsMap = useMemo(() => {
    const map = {};
    allMonthBills.forEach(b => {
      const d = parseInt(b.day, 10) || 1;
      if (!map[d]) map[d] = { total: 0, pending: 0, paid: 0 };
      map[d].total += 1;
      if (isBillPaidInMonth(b, currentYear, currentMonthIndex + 1)) {
        map[d].paid += 1;
      } else {
        map[d].pending += 1;
      }
    });
    return map;
  }, [allMonthBills, currentYear, currentMonthIndex]);

  // Células do Mini Calendário
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${currentYear}-${currentMonthIndex + 1}-${day}`;
      const stats = daysWithBillsMap[day] || null;
      const holidayName = holidaysMap[dateKey] || null;

      cells.push({
        empty: false,
        day,
        dateKey,
        stats,
        holidayName,
        isToday: day === today.getDate() && currentMonthIndex === today.getMonth() && currentYear === today.getFullYear(),
        isSelected: selectedDayFilter === day
      });
    }

    return cells;
  }, [currentYear, currentMonthIndex, daysWithBillsMap, holidaysMap, selectedDayFilter, today]);

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <div style={{ padding: '0 12px 80px 12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Barra de Topo: Mês & Navegação + Ação Rápida */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: cardBg,
        padding: '10px 14px',
        borderRadius: '16px',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isDark ? '#334155' : '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textColor
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <span style={{
            fontSize: '15px',
            fontWeight: '900',
            color: '#6d28d9',
            letterSpacing: '0.2px'
          }}>
            {MONTH_NAMES[currentMonthIndex]} {currentYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isDark ? '#334155' : '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textColor
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Botão Adicionar Conta */}
        <button
          type="button"
          onClick={() => handleOpenAdd()}
          style={{
            background: '#5925dc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 3px 10px rgba(89,37,220,0.3)'
          }}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Cards de Resumo Financeiro do Mês */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{
          background: isDark ? '#1e293b' : '#fff5f5',
          border: isDark ? '1.5px solid #ef4444' : '1.5px solid #fecaca',
          borderRadius: '14px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase' }}>
            A Pagar ({allMonthBills.filter(b => !isBillPaidInMonth(b, currentYear, currentMonthIndex + 1)).length})
          </span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#991b1b' }}>
            {monthTotals.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div style={{
          background: isDark ? '#1e293b' : '#f0fdf4',
          border: isDark ? '1.5px solid #22c55e' : '1.5px solid #bbf7d0',
          borderRadius: '14px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>
            Pago ({allMonthBills.filter(b => isBillPaidInMonth(b, currentYear, currentMonthIndex + 1)).length})
          </span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#166534' }}>
            {monthTotals.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Mini Calendário Mensal Responsivo */}
      <div style={{
        background: cardBg,
        borderRadius: '16px',
        padding: '12px 10px',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Cabeçalho dos dias da semana */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: '#d8b4fe',
          borderRadius: '8px',
          padding: '5px 0',
          marginBottom: '6px',
          textAlign: 'center'
        }}>
          {WEEK_DAYS.map(d => (
            <span key={d} style={{ fontSize: '10px', fontWeight: '800', color: '#3b0764' }}>
              {d}
            </span>
          ))}
        </div>

        {/* Grade de dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {calendarCells.map((cell, idx) => {
            if (cell.empty) {
              return (
                <div
                  key={cell.key || idx}
                  style={{
                    height: '34px',
                    borderRadius: '6px',
                    background: isDark ? '#0f172a' : '#f8fafc'
                  }}
                />
              );
            }

            const hasBills = Boolean(cell.stats && cell.stats.total > 0);
            const hasPending = Boolean(cell.stats && cell.stats.pending > 0);
            const isAllPaid = Boolean(cell.stats && cell.stats.total > 0 && cell.stats.pending === 0);

            // Cores de destaque
            let cellBg = isDark ? '#0f172a' : 'transparent';
            let cellColor = textColor;
            let borderStyle = 'none';

            if (cell.isSelected) {
              cellBg = '#5925dc';
              cellColor = '#ffffff';
              borderStyle = '2px solid #31108a';
            } else if (hasPending) {
              cellBg = isDark ? '#7c2d12' : '#fed7aa'; // Laranja suave para pendente
              cellColor = isDark ? '#ffedd5' : '#9a3412';
            } else if (isAllPaid) {
              cellBg = isDark ? '#14532d' : '#bbf7d0'; // Verde suave para 100% pago
              cellColor = isDark ? '#dcfce7' : '#166534';
            } else if (cell.isToday) {
              cellBg = isDark ? '#312e81' : '#ede9fe';
              borderStyle = '1.5px dashed #7c3aed';
            }

            return (
              <div
                key={cell.dateKey}
                onClick={() => {
                  if (selectedDayFilter === cell.day) {
                    setSelectedDayFilter(null);
                  } else {
                    setSelectedDayFilter(cell.day);
                  }
                }}
                style={{
                  height: '34px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: hasBills || cell.isSelected ? '900' : '700',
                  color: cellColor,
                  background: cellBg,
                  border: borderStyle,
                  cursor: 'pointer',
                  position: 'relative',
                  userSelect: 'none'
                }}
              >
                <span>{cell.day}</span>
                {/* Ponto indicador de feriado */}
                {cell.holidayName && (
                  <span
                    title={`Feriado: ${cell.holidayName}`}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }}
                  />
                )}
                {/* Indicador de quantidade de contas */}
                {hasBills && !cell.isSelected && (
                  <span style={{
                    fontSize: '9px',
                    lineHeight: '9px',
                    fontWeight: '800',
                    opacity: 0.85
                  }}>
                    {cell.stats.total}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legenda do calendário & Botão de Limpar Filtro de Dia */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: `1px solid ${borderColor}`,
          fontSize: '11px',
          color: subTextColor
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fb923c' }} />
              Pendente
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
              Pago
            </span>
          </div>

          {selectedDayFilter !== null && (
            <button
              type="button"
              onClick={() => setSelectedDayFilter(null)}
              style={{
                border: 'none',
                background: '#f3e8ff',
                color: '#6b21a8',
                fontSize: '11px',
                fontWeight: '800',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer'
              }}
            >
              Ver mês todo (Dia {selectedDayFilter} ativo) ✕
            </button>
          )}
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: cardBg,
        borderRadius: '12px',
        border: `1.5px solid ${borderColor}`,
        padding: '8px 12px'
      }}>
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
            fontSize: '14px',
            fontWeight: '600',
            color: textColor,
            width: '100%'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Título da Seção de Contas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: textColor }}>
          {selectedDayFilter ? `Contas do dia ${selectedDayFilter}` : 'Todas as contas do mês'} ({focusedMonthBills.length})
        </h3>
      </div>

      {/* Lista de Contas */}
      {focusedMonthBills.length === 0 ? (
        <div style={{
          background: cardBg,
          borderRadius: '16px',
          padding: '36px 16px',
          textAlign: 'center',
          border: `1.5px dashed ${borderColor}`
        }}>
          <CalendarIcon size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: textColor }}>
            Nenhuma conta encontrada
          </p>
          <p style={{ margin: '4px 0 14px', fontSize: '12px', color: subTextColor }}>
            {selectedDayFilter ? `Não há contas agendadas para o dia ${selectedDayFilter}.` : 'Toque em "Nova Conta" para cadastrar.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAdd(selectedDayFilter)}
            style={{
              background: '#5925dc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            + Adicionar Agora
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {focusedMonthBills.map(bill => {
            const isPaid = isBillPaidInMonth(bill, currentYear, currentMonthIndex + 1);
            const IconComp = getBillTypeIcon(bill);
            const catLabel = getBillCategoryLabel(bill);
            const displayValue = getDisplayBillValue(bill, currentYear, currentMonthIndex);
            const rawType = String(bill.categoria || bill.billType || bill.tipo || '').toLowerCase();
            const isRec = bill.isRecurring || bill.recurringType === 'monthly' || rawType === 'mensal' || rawType.includes('cart');

            return (
              <div
                key={bill.id}
                style={{
                  background: cardBg,
                  borderRadius: '14px',
                  padding: '12px 14px',
                  border: `1.5px solid ${isPaid ? (isDark ? '#14532d' : '#bbf7d0') : borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  opacity: isPaid ? 0.75 : 1
                }}
              >
                {/* Lado Esquerdo: Quadrado com Dia + Descrição e Detalhes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    background: isPaid ? '#e2e8f0' : '#dcdcdc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '18px',
                    color: isPaid ? '#64748b' : '#000000',
                    textDecoration: isPaid ? 'line-through' : 'none'
                  }}>
                    {bill.day}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        color: isPaid ? '#64748b' : textColor,
                        textDecoration: isPaid ? 'line-through' : 'none',
                        lineHeight: 1.2,
                        wordBreak: 'break-word'
                      }}>
                        {bill.description}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: '800',
                        color: '#6d28d9',
                        background: '#f3e8ff',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        <IconComp size={11} />
                        {catLabel}
                      </span>

                      {isRec && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#0369a1',
                          background: '#e0f2fe',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Recorrente
                        </span>
                      )}

                      {displayValue && (
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '900',
                          color: isPaid ? '#64748b' : '#000000',
                          textDecoration: isPaid ? 'line-through' : 'none',
                          marginLeft: '2px'
                        }}>
                          {displayValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Botão Status Pago e Ações */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(bill)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: isPaid ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                      background: isPaid ? '#dcfce7' : '#ffffff',
                      color: isPaid ? '#16a34a' : '#64748b',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isPaid ? <Check size={14} strokeWidth={3} /> : null}
                    {isPaid ? 'Paga' : 'Pagar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(bill)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(bill)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar / Editar Conta */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 0
        }}>
          <div style={{
            background: cardBg,
            width: '100%',
            maxWidth: '520px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px 18px 30px 18px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Header do Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: textColor }}>
                {editingBill ? 'Editar Conta' : 'Nova Conta a Pagar'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: isDark ? '#334155' : '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: textColor
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Descrição */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: subTextColor, display: 'block', marginBottom: '4px' }}>
                  Descrição / Nome da Conta *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel, Cartão Nubank, Luz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${borderColor}`,
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: textColor,
                    fontSize: '14px',
                    fontWeight: '700',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              {/* Data e Valor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: subTextColor, display: 'block', marginBottom: '4px' }}>
                    Data (Dia/Mês)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="DD"
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value.replace(/\D/g, '') })}
                      style={{
                        width: '100%',
                        padding: '10px 4px',
                        borderRadius: '10px',
                        border: `1.5px solid ${borderColor}`,
                        background: isDark ? '#0f172a' : '#ffffff',
                        color: textColor,
                        fontSize: '14px',
                        fontWeight: '800',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontWeight: '800', color: subTextColor }}>/</span>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="MM"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value.replace(/\D/g, '') })}
                      style={{
                        width: '100%',
                        padding: '10px 4px',
                        borderRadius: '10px',
                        border: `1.5px solid ${borderColor}`,
                        background: isDark ? '#0f172a' : '#ffffff',
                        color: textColor,
                        fontSize: '14px',
                        fontWeight: '800',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: subTextColor, display: 'block', marginBottom: '4px' }}>
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: formatCurrencyInput(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${borderColor}`,
                      background: isDark ? '#0f172a' : '#ffffff',
                      color: textColor,
                      fontSize: '14px',
                      fontWeight: '800',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Categorias em Grade Touch-friendly */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: subTextColor, display: 'block', marginBottom: '6px' }}>
                  Categoria da Conta
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {ALL_BILL_TYPES.map(t => {
                    const isSelected = formData.billType === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, billType: t.id })}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #5925dc' : `1.5px solid ${borderColor}`,
                          background: isSelected ? '#ecebfa' : (isDark ? '#0f172a' : '#ffffff'),
                          color: isSelected ? '#5925dc' : textColor,
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Icon size={16} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datas adicionais (Apenas ao adicionar) */}
              {!editingBill && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showExtraDates) {
                        setShowExtraDates(true);
                        if (extraDates.length === 0) handleAddExtraDate();
                      } else {
                        setShowExtraDates(false);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6d28d9',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showExtraDates ? '− Ocultar datas extras' : '+ Repetir em mais datas'}
                  </button>

                  {showExtraDates && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {extraDates.map((ed, idx) => (
                        <div key={ed.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: subTextColor, width: '40px' }}>
                            Data {idx + 2}:
                          </span>
                          <input
                            type="text"
                            maxLength={2}
                            value={ed.day}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setExtraDates(prev => prev.map(item => item.id === ed.id ? { ...item, day: val } : item));
                            }}
                            style={{
                              width: '42px',
                              padding: '6px 2px',
                              textAlign: 'center',
                              borderRadius: '8px',
                              border: `1.5px solid ${borderColor}`,
                              fontWeight: '800',
                              fontSize: '13px'
                            }}
                          />
                          <span>/</span>
                          <input
                            type="text"
                            maxLength={2}
                            value={ed.month}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setExtraDates(prev => prev.map(item => item.id === ed.id ? { ...item, month: val } : item));
                            }}
                            style={{
                              width: '42px',
                              padding: '6px 2px',
                              textAlign: 'center',
                              borderRadius: '8px',
                              border: `1.5px solid ${borderColor}`,
                              fontWeight: '800',
                              fontSize: '13px'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setExtraDates(prev => prev.filter(item => item.id !== ed.id))}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddExtraDate}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#475569',
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        + Adicionar mais um mês
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Botões Salvar e Cancelar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1.5px solid ${borderColor}`,
                    background: 'transparent',
                    color: textColor,
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(89,37,220,0.3)'
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
