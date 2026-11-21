import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Landmark } from 'lucide-react';
import { fetchNationalHolidays } from '../services/holidayService';

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
    day: today.getDate(),
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    value: '',
    isRecurring: false, // true = Conta Mensal (aparece em todos os meses seguintes), false = Conta Pontual
    status: 'pending' // 'pending' | 'paid'
  });

  const handleOpenAdd = (presetDay = null, presetMonth = null, presetYear = null) => {
    setEditingBill(null);
    setFormData({
      description: '',
      day: presetDay || today.getDate(),
      month: presetMonth || (currentMonthIndex + 1),
      year: presetYear || currentYear,
      value: '',
      isRecurring: false,
      status: 'pending'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      description: bill.description || '',
      day: bill.day || today.getDate(),
      month: bill.month || (today.getMonth() + 1),
      year: bill.year || today.getFullYear(),
      value: bill.value || '',
      isRecurring: !!(bill.isRecurring || bill.recurringType === 'monthly'),
      status: bill.status || 'pending'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBill(null);
  };

  const handleSaveBill = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Informe a descrição da conta.');
      return;
    }

    const payload = {
      ...formData,
      description: formData.description.trim(),
      day: parseInt(formData.day, 10) || today.getDate(),
      month: parseInt(formData.month, 10) || (today.getMonth() + 1),
      year: parseInt(formData.year, 10) || today.getFullYear(),
      value: formData.value || '',
      isRecurring: formData.isRecurring,
      recurringType: formData.isRecurring ? 'monthly' : 'once',
      id: editingBill ? editingBill.id : `bill_${Date.now()}`
    };

    if (editingBill) {
      if (onUpdateBill) onUpdateBill(editingBill.id, payload);
    } else {
      if (onAddBill) onAddBill(payload);
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
      const nextStatus = bill.status === 'paid' ? 'pending' : 'paid';
      onUpdateBill(bill.id, { ...bill, status: nextStatus });
    }
  };

  // Gera meses sequenciais para a rolagem/arrastar:
  // - Se o mês selecionado no topo for o mês atual ou futuro: o primeiro mês da rolagem é SEMPRE o mês atual (hoje), permitindo ver hoje e os meses futuros (ex: Nov, Dez, Jan...).
  // - Se o usuário selecionou no topo um mês anterior (passado): a rolagem inicia daquele mês anterior selecionado para permitir ver o histórico daquele período.
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

  // Contas filtradas do mês/ano atualmente selecionado
  // Se for conta mensal (isRecurring / monthly), aparece em todos os meses a partir do mês/ano de início
  const focusedMonthBills = useMemo(() => {
    const targetMonth = currentMonthIndex + 1;
    const targetYear = currentYear;

    return bills
      .filter(b => {
        const bMonth = parseInt(b.month, 10) || 1;
        const bYear = parseInt(b.year, 10) || targetYear;
        const isRec = b.isRecurring || b.recurringType === 'monthly';

        if (isRec) {
          // Conta mensal aparece no mês/ano inicial e em todos os meses/anos futuros
          if (targetYear > bYear) return true;
          if (targetYear === bYear && targetMonth >= bMonth) return true;
          return false;
        }

        // Conta pontual: apenas naquele mês e ano específico
        return bMonth === targetMonth && (!b.year || bYear === targetYear);
      })
      .sort((a, b) => (parseInt(a.day, 10) || 0) - (parseInt(b.day, 10) || 0));
  }, [bills, currentMonthIndex, currentYear]);

  // Mapa de contas por "ano-mes-dia" para destacar nos blocos de calendário
  const billsByDateMap = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const bDay = parseInt(b.day, 10) || 1;
      const bMonth = parseInt(b.month, 10) || 1;
      const bYear = parseInt(b.year, 10) || currentYear;
      const isRec = b.isRecurring || b.recurringType === 'monthly';

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

      calendarCells.push({
        empty: false,
        day,
        dateKey,
        bills: dayBills,
        hasBills: dayBills.length > 0,
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', minHeight: '85vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Barra Superior de Controle e Opções */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
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

        {/* Controles: Navegação de Mês, Ajuste de Fonte e Botão de Nova Conta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 420px) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Coluna Esquerda: Calendários dos meses com rolagem/arrastar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Container com scroll vertical/horizontal suave para arrastar e navegar pelos meses */}
          <div
            style={{
              maxHeight: '78vh',
              overflowY: 'auto',
              paddingRight: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {displayedMonths.map(item => renderMonthCalendarCard(item.monthIndex, item.year))}
          </div>
        </div>

        {/* Coluna Direita: Lista de Contas com a aparência fiel à foto do usuário */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px 28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
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
                const isPaid = bill.status === 'paid';
                const isRec = bill.isRecurring || bill.recurringType === 'monthly';

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

                      {/* Descrição da Conta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
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
                        {isRec && (
                          <span
                            title="Conta Mensal Recorrente"
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
                        )}
                      </div>
                    </div>

                    {/* Lado Direito: Valor em Real (mesma fonte, tamanho e preto) + Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      {bill.value ? (
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
                          {bill.value}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>
                {editingBill ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Descrição */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
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
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Frequência: Pontual vs Mensal */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Frequência
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isRecurring: false })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: !formData.isRecurring ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: !formData.isRecurring ? '#ecebfa' : '#ffffff',
                      color: !formData.isRecurring ? '#5925dc' : '#64748b',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Pontual
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isRecurring: true })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: formData.isRecurring ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
                      background: formData.isRecurring ? '#ecebfa' : '#ffffff',
                      color: formData.isRecurring ? '#5925dc' : '#64748b',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Mensal
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  {formData.isRecurring
                    ? 'Aparece em todos os meses seguintes neste mesmo dia.'
                    : 'Aparece somente na data específica selecionada abaixo.'}
                </span>
              </div>

              {/* Data: Dia / Mês / Ano */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '800',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Mês {formData.isRecurring && '(Início)'}
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 8px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m.slice(0, 3)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Ano {formData.isRecurring && '(Início)'}
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '800',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Valor com máscara em Real R$ 00,00 */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
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
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(89, 37, 220, 0.3)'
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
