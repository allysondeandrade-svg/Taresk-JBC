import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, DollarSign } from 'lucide-react';

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function ContasView({
  bills = [],
  onAddBill,
  onUpdateBill,
  onDeleteBill
}) {
  // Controle de ano e mês base para os blocos de calendário
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth()); // 0 a 11

  // Tamanho da fonte da lista de contas à direita (opção configurável pelo usuário)
  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    return localStorage.getItem('taresk_contas_font_size') || 'large'; // 'small' | 'medium' | 'large' | 'xlarge'
  });

  const handleFontSizeChange = (size) => {
    setFontSizeLevel(size);
    localStorage.setItem('taresk_contas_font_size', size);
  };

  // Modal de Adicionar/Editar Conta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    day: today.getDate(),
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    value: '',
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

  // Gera meses sequenciais para a rolagem/arrastar horizontal ou vertical
  // Mostra um intervalo de meses ao redor do mês selecionado
  const displayedMonths = useMemo(() => {
    const list = [];
    // Gera 12 meses a partir do mês atual selecionado
    for (let offset = -2; offset <= 9; offset++) {
      let m = currentMonthIndex + offset;
      let y = currentYear;
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

  // Contas filtradas do mês/ano atualmente em foco ou selecionado
  const focusedMonthBills = useMemo(() => {
    return bills
      .filter(b => {
        const bMonth = parseInt(b.month, 10);
        const bYear = parseInt(b.year, 10);
        return bMonth === (currentMonthIndex + 1) && (!b.year || bYear === currentYear);
      })
      .sort((a, b) => (parseInt(a.day, 10) || 0) - (parseInt(b.day, 10) || 0));
  }, [bills, currentMonthIndex, currentYear]);

  // Mapa de contas por "ano-mes-dia" para destacar nos blocos de calendário
  const billsByDateMap = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const y = b.year || currentYear;
      const m = b.month;
      const d = b.day;
      const key = `${y}-${m}-${d}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bills, currentYear]);

  // Estilos de fonte configuráveis para as linhas da direita
  const fontStyles = useMemo(() => {
    switch (fontSizeLevel) {
      case 'small':
        return {
          dayBoxSize: '36px',
          dayFontSize: '16px',
          descFontSize: '18px',
          valFontSize: '14px',
          gap: '12px'
        };
      case 'medium':
        return {
          dayBoxSize: '46px',
          dayFontSize: '20px',
          descFontSize: '24px',
          valFontSize: '16px',
          gap: '16px'
        };
      case 'xlarge':
        return {
          dayBoxSize: '68px',
          dayFontSize: '32px',
          descFontSize: '36px',
          valFontSize: '20px',
          gap: '24px'
        };
      case 'large':
      default:
        return {
          dayBoxSize: '56px',
          dayFontSize: '26px',
          descFontSize: '30px',
          valFontSize: '18px',
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

  // Renderiza a grade de dias de um mês específico no estilo do PDF/imagem
  const renderMonthCalendarCard = (monthIndex, year) => {
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 (Dom) a 6 (Sáb)
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const calendarCells = [];
    // Células vazias antes do dia 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarCells.push({ empty: true, key: `empty-pre-${i}` });
    }
    // Dias do mês
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${year}-${monthIndex + 1}-${day}`;
      const dayBills = billsByDateMap[dateKey] || [];
      calendarCells.push({
        empty: false,
        day,
        dateKey,
        bills: dayBills,
        hasBills: dayBills.length > 0,
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

        {/* Linha dos Dias da Semana: SUN MON TUE... em roxo conforme a imagem */}
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

            return (
              <div
                key={cell.dateKey}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMonthIndex(monthIndex);
                  setCurrentYear(year);
                  handleOpenAdd(cell.day, monthIndex + 1, year);
                }}
                title={cell.hasBills ? `${cell.bills.length} conta(s) no dia ${cell.day}: ${cell.bills.map(b => b.description).join(', ')}` : `Adicionar conta no dia ${cell.day}`}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: isHighlighted ? '900' : '700',
                  color: isHighlighted ? '#ffffff' : '#1e293b',
                  background: isHighlighted ? '#b8a6f8' : (cell.isToday ? '#ede9fe' : 'transparent'),
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                  border: cell.isToday && !isHighlighted ? '1.5px dashed #7c3aed' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  if (!isHighlighted) e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!isHighlighted) e.currentTarget.style.background = cell.isToday ? '#ede9fe' : 'transparent';
                }}
              >
                {cell.day}
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

          {/* Seletor de Tamanho da Fonte da lista à direita (solicitado pelo usuário) */}
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

          {/* Botão Circular Roxo com + conforme a foto */}
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            title="Adicionar Nova Conta"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#b8a6f8',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(184, 166, 248, 0.6)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#9e84f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#b8a6f8'; }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Grid Principal: Esquerda com Calendários Arrastáveis | Direita com Lista das Contas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 420px) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Coluna Esquerda: Calendários dos meses com rolagem/arrastar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Meses / Calendário
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Role para ver outros meses
            </span>
          </div>

          {/* Container com scroll vertical/horizontal suave para arrastar e navegar pelos meses */}
          <div
            style={{
              maxHeight: '75vh',
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
          {/* Cabeçalho da Lista: Data Descrição e Total */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#000000', letterSpacing: '-0.3px' }}>
                Data Descrição
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
              {focusedMonthBills.length} conta(s) em {MONTH_NAMES[currentMonthIndex]}
            </div>
          </div>

          {/* Linhas das Contas conforme a foto: [ Quadrado Cinza com Dia ] [ Descrição ] */}
          {focusedMonthBills.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
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

                return (
                  <div
                    key={bill.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: isPaid ? '#f8fafc' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isPaid ? '#f8fafc' : 'transparent'; }}
                  >
                    {/* Lado Esquerdo: Bloco do Dia Cinza + Descrição grande da conta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1 }}>
                      {/* Quadrado Cinza com o Dia (idêntico à foto enviada) */}
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
                          color: '#000000',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                        }}
                      >
                        {bill.day}
                      </div>

                      {/* Descrição da Conta */}
                      <div>
                        <div
                          style={{
                            fontSize: fontStyles.descFontSize,
                            fontWeight: '900',
                            color: isPaid ? '#94a3b8' : '#000000',
                            textDecoration: isPaid ? 'line-through' : 'none',
                            letterSpacing: '-0.5px',
                            lineHeight: 1.2
                          }}
                        >
                          {bill.description}
                        </div>

                        {/* Valor opcional */}
                        {bill.value && (
                          <div style={{ fontSize: fontStyles.valFontSize, fontWeight: '700', color: isPaid ? '#94a3b8' : '#16a34a', marginTop: '2px' }}>
                            {String(bill.value).startsWith('R$') ? bill.value : `R$ ${bill.value}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações: Status Pago, Editar e Excluir */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              maxWidth: '440px',
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
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Descrição da Conta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boleto Grenada, Conta de Água..."
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
                    Mês
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
                    Ano
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

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Valor (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: R$ 150,00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
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
