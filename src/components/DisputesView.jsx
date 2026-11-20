import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Filter, AlertTriangle, ArrowUpDown, ChevronDown, Calendar, Copy } from 'lucide-react';
import ProductSearchAutocomplete from './ProductSearchAutocomplete';

export default function DisputesView({
  disputes = [],
  platforms = [],
  products = [],
  users = [],
  onAddDispute,
  onUpdateDispute,
  onDeleteDispute
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDispute, setEditingDispute] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const dateInputModalRef = useRef(null);

  const handleCopyOrderNumber = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const availableMonths = [
    { value: '01', label: 'Janeiro (01)' },
    { value: '02', label: 'Fevereiro (02)' },
    { value: '03', label: 'Março (03)' },
    { value: '04', label: 'Abril (04)' },
    { value: '05', label: 'Maio (05)' },
    { value: '06', label: 'Junho (06)' },
    { value: '07', label: 'Julho (07)' },
    { value: '08', label: 'Agosto (08)' },
    { value: '09', label: 'Setembro (09)' },
    { value: '10', label: 'Outubro (10)' },
    { value: '11', label: 'Novembro (11)' },
    { value: '12', label: 'Dezembro (12)' }
  ];

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMonthFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Lista dinâmica de plataformas unificadas (Shopee Allyson, Shopee Jeremias, Shopee JBC, Mercado Livre, etc)
  const availablePlatforms = useMemo(() => {
    const namesSet = new Set();

    // 1. Plataformas dos usuários cadastrados
    (users || []).forEach(u => {
      if (Array.isArray(u.platforms)) {
        u.platforms.forEach(p => {
          const n = typeof p === 'string' ? p : (p?.name || p?.label);
          if (n && n.trim()) namesSet.add(n.trim());
        });
      }
    });

    // 2. Plataformas globais
    (platforms || []).forEach(p => {
      const n = typeof p === 'string' ? p : (p?.name || p?.label);
      if (n && n.trim()) namesSet.add(n.trim());
    });

    // 3. Plataformas já usadas em disputas
    (disputes || []).forEach(d => {
      if (d.platform && d.platform.trim()) namesSet.add(d.platform.trim());
    });

    // 4. Padrões comuns
    const defaults = ['Shopee JBC', 'Mercado Livre', 'Amazon', 'Magalu', 'Shopee Izabela', 'Shopee Allyson', 'Shopee Jeremias', 'Shopee Johnathan', 'Nuvemshop', 'SHEIN'];
    defaults.forEach(d => namesSet.add(d));

    return Array.from(namesSet).filter(Boolean);
  }, [users, platforms, disputes]);

  // Lista dinâmica e ordenada de SKUs e Produtos
  const productsList = useMemo(() => {
    const list = [];
    const seen = new Set();

    (products || []).forEach(p => {
      const sku = (p.sku || p.id || '').trim();
      const title = (p.title || p.name || '').trim();
      const val = sku || title;
      if (val && !seen.has(val)) {
        seen.add(val);
        list.push({
          sku: sku || title,
          title: title || sku,
          display: sku && title && sku !== title ? `${sku} - ${title}` : (sku || title)
        });
      }
    });

    // Se houver produtos em disputas que não estão no cadastro
    (disputes || []).forEach(d => {
      const prod = (d.product || '').trim();
      if (prod && !seen.has(prod)) {
        seen.add(prod);
        list.push({
          sku: prod,
          title: prod,
          display: prod
        });
      }
    });

    return list.sort((a, b) => a.sku.localeCompare(b.sku, 'pt-BR', { sensitivity: 'base' }));
  }, [products, disputes]);

  // Data de hoje padrão formatada como dd/mm
  const getTodayFormatted = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Formulário de nova disputa / edição
  const [formData, setFormData] = useState({
    platform: 'Shopee JBC',
    date: getTodayFormatted(),
    product: '',
    orderNumber: '',
    description: 'Avaria',
    notes: '',
    returnCode: '',
    status: 'Em Disputa'
  });

  const handleOpenAdd = () => {
    const defaultPlat = availablePlatforms[0] || 'Shopee JBC';
    setFormData({
      platform: defaultPlat,
      date: getTodayFormatted(),
      product: '',
      orderNumber: '',
      description: 'Avaria',
      notes: '',
      returnCode: '',
      status: 'Em Disputa'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dispute) => {
    setEditingDispute(dispute);
    setFormData({
      platform: dispute.platform || availablePlatforms[0] || 'Shopee JBC',
      date: dispute.date || getTodayFormatted(),
      product: dispute.product || '',
      orderNumber: dispute.orderNumber || '',
      description: dispute.description || 'Avaria',
      notes: dispute.notes || '',
      returnCode: dispute.returnCode || '',
      status: dispute.status || 'Em Disputa'
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingDispute(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingDispute) {
      if (onUpdateDispute) {
        onUpdateDispute(editingDispute.id, formData);
      }
    } else {
      if (onAddDispute) {
        onAddDispute({
          ...formData,
          id: `disp_${Date.now()}`
        });
      }
    }
    handleCloseModal();
  };

  const handleInlineStatusChange = (dispute, newStatus) => {
    if (onUpdateDispute) {
      onUpdateDispute(dispute.id, { ...dispute, status: newStatus });
    }
  };

  const handleInlinePlatformChange = (dispute, newPlat) => {
    if (onUpdateDispute) {
      onUpdateDispute(dispute.id, { ...dispute, platform: newPlat });
    }
  };

  // Cores de status conforme o padrão da foto (Em Disputa = amarelo, Disputa Perdida = vermelho, Disputa Ganha = verde)
  const getStatusBadgeStyle = (status) => {
    const norm = String(status || '').toLowerCase();
    if (norm.includes('perd') || norm.includes('recusada') || norm.includes('cancel')) {
      return {
        background: '#fecaca',
        color: '#dc2626',
        border: '1px solid #fca5a5'
      };
    }
    if (norm.includes('ganh') || norm.includes('aprovad') || norm.includes('conclu')) {
      return {
        background: '#dcfce7',
        color: '#16a34a',
        border: '1px solid #86efac'
      };
    }
    // Padrão: Em Disputa
    return {
      background: '#fef08a',
      color: '#854d0e',
      border: '1px solid #fde047'
    };
  };

  // Cores de plataforma (SH = Shopee laranja/bege, ML = Mercado Livre amarelo, etc.)
  const getPlatformBadgeStyle = (plat) => {
    const p = String(plat || 'SH').toUpperCase();
    if (p.includes('SH')) {
      return {
        background: '#ffedd5',
        color: '#c2410c',
        border: '1px solid #fed7aa'
      };
    }
    if (p.includes('ML')) {
      return {
        background: '#fef9c3',
        color: '#854d0e',
        border: '1px solid #fef08a'
      };
    }
    if (p.includes('AMZ') || p.includes('AM')) {
      return {
        background: '#e2e8f0',
        color: '#334155',
        border: '1px solid #cbd5e1'
      };
    }
    return {
      background: '#ede9fe',
      color: '#6d28d9',
      border: '1px solid #ddd6fe'
    };
  };

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      const matchSearch = (
        (d.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.returnCode || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;
      if (statusFilter !== 'all') {
        const normStatus = (d.status || '').toLowerCase();
        if (statusFilter === 'em_disputa' && !normStatus.includes('em disputa')) return false;
        if (statusFilter === 'ganha' && !normStatus.includes('ganh')) return false;
        if (statusFilter === 'perdida' && !normStatus.includes('perd')) return false;
      }

      // Filtro de tempo (Mês e Período de Data com Calendário)
      const rawDateStr = String(d.date || '').trim();
      const currentYear = new Date().getFullYear();
      let itemMonth = null;
      let itemDateObj = null;

      if (/^\d{1,2}\/\d{1,2}$/.test(rawDateStr)) {
        const [day, m] = rawDateStr.split('/').map(Number);
        if (!isNaN(day) && !isNaN(m)) {
          itemMonth = String(m).padStart(2, '0');
          itemDateObj = new Date(currentYear, m - 1, day);
        }
      } else if (rawDateStr) {
        const parsed = new Date(rawDateStr);
        if (!isNaN(parsed.getTime())) {
          itemMonth = String(parsed.getMonth() + 1).padStart(2, '0');
          itemDateObj = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
      }

      // Filtro por Mês
      if (monthFilter !== 'all') {
        if (itemMonth !== monthFilter) return false;
      }

      // Filtro por Período de Data (Início / Fim)
      if (startDate && itemDateObj) {
        const [sY, sM, sD] = startDate.split('-').map(Number);
        const startObj = new Date(sY, sM - 1, sD);
        if (itemDateObj < startObj) return false;
      }

      if (endDate && itemDateObj) {
        const [eY, eM, eD] = endDate.split('-').map(Number);
        const endObj = new Date(eY, eM - 1, eD, 23, 59, 59);
        if (itemDateObj > endObj) return false;
      }

      return true;
    });
  }, [disputes, searchTerm, statusFilter, monthFilter, startDate, endDate]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', minHeight: '80vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Barra Superior de Título e Botão Nova Disputa */}
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
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '900',
            color: '#1e293b',
            letterSpacing: '-0.5px'
          }}
        >
          Disputas
        </h1>

        {/* Botão Circular Roxo com + igual ao de Contas a Pagar */}
        <button
          type="button"
          onClick={handleOpenAdd}
          title="Nova Disputa"
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = '#9e84f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = '#b8a6f8';
          }}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          background: '#f8fafc',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderRadius: '16px 16px 0 0',
          border: '1.5px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Buscar por produto, pedido ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Filtro por Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Mês:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todos os Meses</option>
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Período de Data com Calendário */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            padding: '3px 8px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1'
          }}>
            <Calendar size={14} color="#64748b" />
            <input
              type="date"
              title="Data inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>até</span>
            <input
              type="date"
              title="Data final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            {(startDate || endDate) && (
              <X
                size={14}
                color="#ef4444"
                title="Limpar período"
                style={{ cursor: 'pointer', marginLeft: '4px' }}
                onClick={() => { setStartDate(''); setEndDate(''); }}
              />
            )}
          </div>

          {/* Botão Limpar Filtro */}
          {(searchTerm || statusFilter !== 'all' || monthFilter !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1.5px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Limpar Filtro
            </button>
          )}

          <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginLeft: '4px' }}>Status:</span>
          {['all', 'em_disputa', 'ganha', 'perdida'].map((st) => {
            const labels = {
              all: 'Todos',
              em_disputa: 'Em Disputa',
              ganha: 'Disputa Ganha',
              perdida: 'Disputa Perdida'
            };
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: active ? '800' : '600',
                  border: active ? '1.5px solid #5925dc' : '1px solid #cbd5e1',
                  background: active ? '#ede9fe' : '#ffffff',
                  color: active ? '#5925dc' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabela de Disputas com visual idêntico à imagem de referência da planilha */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          border: '1.5px solid #e2e8f0',
          borderTop: 'none',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            {/* Cabeçalho preto com texto branco conforme imagem de referência */}
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Plataf
              </th>
              <th style={{ padding: '14px 14px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Data
              </th>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Produto
              </th>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Pedido
              </th>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Descrição
              </th>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Observação
              </th>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Devolução
              </th>
              <th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Situação
              </th>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDisputes.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  Nenhuma disputa encontrada. Clique no botão <b>+</b> acima para registrar uma disputa.
                </td>
              </tr>
            ) : (
              filteredDisputes.map((item, idx) => {
                const statusStyle = getStatusBadgeStyle(item.status);
                const platStyle = getPlatformBadgeStyle(item.platform);

                return (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fcfcfd'; }}
                  >
                    {/* Plataf com seletor/badge com setinha dropdown */}
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #f1f5f9' }}>
                      <select
                        value={item.platform || (availablePlatforms[0] || 'Shopee JBC')}
                        onChange={(e) => handleInlinePlatformChange(item, e.target.value)}
                        style={{
                          ...platStyle,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          outline: 'none',
                          border: platStyle.border,
                          maxWidth: '130px'
                        }}
                      >
                        {availablePlatforms.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>

                    {/* Data (ex: 06/10) */}
                    <td style={{
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#000000',
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      borderRight: '1px solid #f1f5f9'
                    }}>
                      {item.date}
                    </td>

                    {/* Produto (ex: ET 4 Band Dupla) */}
                    <td style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#000000',
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      borderRight: '1px solid #f1f5f9'
                    }}>
                      {item.product}
                    </td>

                    {/* Pedido (ex: 260910NPVMRD39) com opção de copiar e fonte preta regular */}
                    <td style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#000000',
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      borderRight: '1px solid #f1f5f9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.orderNumber}</span>
                        {item.orderNumber && (
                          <button
                            type="button"
                            title={copiedId === (item.id || idx) ? 'Copiado!' : 'Copiar Pedido'}
                            onClick={() => handleCopyOrderNumber(item.orderNumber, item.id || idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: copiedId === (item.id || idx) ? '#16a34a' : '#94a3b8',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (copiedId !== (item.id || idx)) e.currentTarget.style.color = '#5925dc';
                            }}
                            onMouseLeave={(e) => {
                              if (copiedId !== (item.id || idx)) e.currentTarget.style.color = '#94a3b8';
                            }}
                          >
                            {copiedId === (item.id || idx) ? (
                              <Check size={14} color="#16a34a" strokeWidth={2.5} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Descrição (ex: Vidro Quebrado) */}
                    <td style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#000000',
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      borderRight: '1px solid #f1f5f9'
                    }}>
                      {item.description}
                    </td>

                    {/* Observação (ex: Shopee Izabela) */}
                    <td style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#000000',
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      borderRight: '1px solid #f1f5f9'
                    }}>
                      {item.notes}
                    </td>

                    {/* Devolução (código de devolução) */}
                    <td style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#000000',
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      borderRight: '1px solid #f1f5f9'
                    }}>
                      {item.returnCode}
                    </td>

                    {/* Situação com seletor dropdown e cores fiéis */}
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #f1f5f9' }}>
                      <select
                        value={item.status || 'Em Disputa'}
                        onChange={(e) => handleInlineStatusChange(item, e.target.value)}
                        style={{
                          ...statusStyle,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          outline: 'none',
                          border: statusStyle.border
                        }}
                      >
                        <option value="Em Disputa">Em Disputa</option>
                        <option value="Disputa Perdida">Disputa Perdida</option>
                        <option value="Disputa Ganha">Disputa Ganha</option>
                      </select>
                    </td>

                    {/* Ações: Editar e Excluir */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar disputa"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#5925dc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja excluir a disputa do pedido "${item.orderNumber || item.product}"?`)) {
                              if (onDeleteDispute) onDeleteDispute(item.id || item);
                            }
                          }}
                          title="Excluir disputa"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação / Edição de Disputa */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(89, 37, 220, 0.25)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingDispute ? 'Editar Disputa' : 'Cadastrar Nova Disputa'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Plataforma
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    {availablePlatforms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Data (dd/mm)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d/]/g, '');
                        if (val.length === 2 && !val.includes('/') && formData.date.length < 2) {
                          val = val + '/';
                        }
                        if (val.length > 5) val = val.substring(0, 5);
                        setFormData({ ...formData, date: val });
                      }}
                      placeholder="dd/mm"
                      style={{
                        width: '100%',
                        padding: '9px 38px 9px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '700',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      type="date"
                      ref={dateInputModalRef}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: '36px',
                        height: '100%',
                        opacity: 0,
                        pointerEvents: 'none'
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [y, m, d] = val.split('-');
                          setFormData({ ...formData, date: `${d}/${m}` });
                        }
                      }}
                    />
                    <button
                      type="button"
                      title="Selecionar data no calendário"
                      onClick={() => {
                        if (dateInputModalRef.current) {
                          if (typeof dateInputModalRef.current.showPicker === 'function') {
                            dateInputModalRef.current.showPicker();
                          } else {
                            dateInputModalRef.current.focus();
                            dateInputModalRef.current.click();
                          }
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6d28d9',
                        padding: '4px'
                      }}
                    >
                      <Calendar size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Produto / SKU
                </label>
                <ProductSearchAutocomplete
                  products={products}
                  value={formData.product}
                  onChange={(val) => setFormData({ ...formData, product: val })}
                  onSelect={(p) => setFormData({ ...formData, product: p.sku || p.title || '' })}
                  placeholder="Selecione ou digite o SKU / Produto..."
                  showCost={true}
                  inputStyle={{
                    borderRadius: '8px',
                    padding: '9px 12px 9px 36px',
                    fontWeight: '700'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Número do Pedido
                </label>
                <input
                  type="text"
                  placeholder="Ex: 260910NPVMRD39"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Descrição do Motivo
                  </label>
                  <select
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Avaria">Avaria</option>
                    <option value="Perdido">Perdido</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Situação
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Em Disputa">Em Disputa</option>
                    <option value="Disputa Perdida">Disputa Perdida</option>
                    <option value="Disputa Ganha">Disputa Ganha</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Código de Devolução
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 26092602CW990RN"
                    value={formData.returnCode}
                    onChange={(e) => setFormData({ ...formData, returnCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Observação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Shopee Izabela"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
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
                    padding: '9px 24px',
                    borderRadius: '8px',
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
