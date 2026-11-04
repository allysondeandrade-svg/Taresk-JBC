import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, Copy, Check, X, Search, Calendar, FileText, ArrowUpDown, ChevronDown } from 'lucide-react';

function formatCurrencyInput(val) {
  const digits = String(val || '').replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getTodayFormatted() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export default function AnnotationsView({
  annotations = [],
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentUser,
  platforms = [],
  users = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Input de data (calendário nativo oculto acionado pelo botão)
  const dateInputAddRef = useRef(null);
  const dateInputEditRef = useRef(null);

  // Lista dinâmica e unificada de todas as plataformas cadastradas
  const allPlatformNames = useMemo(() => {
    const namesSet = new Set();
    
    // Plataformas dos usuários (ex: Shopee JBC, Shopee Izabela, Mercado Livre, etc)
    (users || []).forEach(u => {
      if (Array.isArray(u.platforms)) {
        u.platforms.forEach(p => {
          const n = typeof p === 'string' ? p : (p?.name || p?.label);
          if (n && n.trim()) namesSet.add(n.trim());
        });
      }
    });

    // Plataformas globais cadastradas no sistema
    (platforms || []).forEach(p => {
      const n = typeof p === 'string' ? p : (p?.name || p?.label);
      if (n && n.trim()) namesSet.add(n.trim());
    });

    // Anotações existentes caso haja alguma personalizada já salva
    annotations.forEach(a => {
      if (a.platform && a.platform.trim()) namesSet.add(a.platform.trim());
    });

    // Fallbacks padrão caso o banco ainda esteja limpo
    const defaults = ['Shopee', 'Shopee JBC', 'Shopee Izabela', 'Mercado Livre', 'Amazon', 'Magalu', 'Shein', 'Geral'];
    defaults.forEach(d => namesSet.add(d));

    return Array.from(namesSet);
  }, [users, platforms, annotations]);

  // Modal / Formulário de Adição
  const [isAdding, setIsAdding] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    date: getTodayFormatted(),
    platform: allPlatformNames[0] || 'Shopee',
    orderNumber: '',
    client: '',
    value: '',
    notes: ''
  });

  // Edição inline ou modal
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleOpenAdd = () => {
    setNewAnnotation({
      date: getTodayFormatted(),
      platform: allPlatformNames[0] || 'Shopee',
      orderNumber: '',
      client: '',
      value: '',
      notes: ''
    });
    setIsAdding(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnotation.orderNumber.trim() && !newAnnotation.client.trim() && !newAnnotation.notes.trim()) {
      alert('Preencha ao menos o Pedido, Cliente ou Observação.');
      return;
    }

    const item = {
      id: 'anot_' + Date.now(),
      date: newAnnotation.date.trim() || getTodayFormatted(),
      platform: newAnnotation.platform || 'Shopee',
      orderNumber: newAnnotation.orderNumber.trim(),
      client: newAnnotation.client.trim(),
      value: newAnnotation.value.trim(),
      notes: newAnnotation.notes.trim(),
      usuario: currentUser?.name || 'Vendedor'
    };

    if (onAddAnnotation) {
      await onAddAnnotation(item);
    }
    setIsAdding(false);
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      id: item.id,
      date: item.date || getTodayFormatted(),
      platform: item.platform || allPlatformNames[0] || 'Shopee',
      orderNumber: item.orderNumber || item.pedido || '',
      client: item.client || item.cliente || '',
      value: item.value || item.valor || '',
      notes: item.notes || item.observacao || item.obs || '',
      usuario: item.usuario || currentUser?.name || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (onUpdateAnnotation) {
      await onUpdateAnnotation(editingId, editForm);
    }
    setEditingId(null);
  };

  // Duplicar anotação
  const handleDuplicate = async (item) => {
    const duplicated = {
      ...item,
      id: 'anot_' + Date.now(),
      date: getTodayFormatted(),
      usuario: currentUser?.name || item.usuario || 'Vendedor'
    };
    if (onAddAnnotation) {
      await onAddAnnotation(duplicated);
    }
  };

  const handleDelete = (id, clientName) => {
    if (window.confirm(`Deseja excluir permanentemente a anotação ${clientName ? `do cliente "${clientName}"` : ''}?`)) {
      if (onDeleteAnnotation) {
        onDeleteAnnotation(id);
      }
    }
  };

  // Helper para máscara dd/mm enquanto digita
  const handleDateMask = (val, setter, currentObj) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + '/' + clean.slice(2, 4);
    }
    setter({ ...currentObj, date: clean });
  };

  const filteredList = useMemo(() => {
    return annotations.filter(item => {
      const matchSearch = (
        (item.orderNumber || item.pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.client || item.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || item.observacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.value || item.valor || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
      return true;
    });
  }, [annotations, searchTerm, platformFilter]);

  const getPlatformBadge = (platName) => {
    const lower = String(platName || '').toLowerCase();
    if (lower.includes('shopee')) return { background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' };
    if (lower.includes('mercado') || lower.includes('ml')) return { background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a' };
    if (lower.includes('amazon')) return { background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' };
    if (lower.includes('magalu')) return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
    if (lower.includes('shein')) return { background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' };
    return { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' };
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Banner Superior Roxo Estilizado (sem texto de descrição abaixo do título) */}
      <div style={{
        background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
        borderRadius: '24px',
        padding: '24px 32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.3)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📝</span>
          <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>
            Anotações
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            background: '#ffffff',
            color: '#6d28d9',
            border: 'none',
            borderRadius: '14px',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={18} strokeWidth={3} />
          Nova Anotação
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            padding: '8px 12px',
            flex: 1
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar por pedido, cliente, valor, observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                width: '100%',
                color: '#1e293b'
              }}
            />
            {searchTerm && (
              <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Plataforma:</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="all">Todas as Plataformas</option>
            {allPlatformNames.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
            {filteredList.length} registro{filteredList.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tabela Interativa de Anotações (Estilo Planilha) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DATA
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PLATAFORMA
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PEDIDO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CLIENTE
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  VALOR
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  OBSERVAÇÃO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '36px' }}>📋</span>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#334155', margin: 0 }}>
                        Nenhuma anotação encontrada
                      </h4>
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        Clique em "Nova Anotação" acima para adicionar uma linha.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isEditing = editingId === item.id;
                  const platStyle = getPlatformBadge(item.platform);

                  if (isEditing) {
                    return (
                      <tr key={item.id} style={{ background: '#fdf4ff', borderBottom: '1px solid #f0abfc' }}>
                        {/* Data com input dd/mm + botão de calendário */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={editForm.date}
                              maxLength={5}
                              placeholder="dd/mm"
                              onChange={(e) => handleDateMask(e.target.value, setEditForm, editForm)}
                              style={{
                                width: '60px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1.5px solid #a855f7',
                                fontSize: '13px',
                                fontWeight: '700',
                                textAlign: 'center'
                              }}
                            />
                            <div style={{ position: 'relative' }}>
                              <input
                                ref={dateInputEditRef}
                                type="date"
                                value={(() => {
                                  if (editForm.date && editForm.date.includes('/')) {
                                    const parts = editForm.date.split('/');
                                    if (parts[0] && parts[1]) {
                                      const y = new Date().getFullYear();
                                      return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                    }
                                  }
                                  return '';
                                })()}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const [year, month, day] = e.target.value.split('-');
                                    setEditForm({ ...editForm, date: `${day}/${month}` });
                                  }
                                }}
                                style={{
                                  position: 'absolute',
                                  opacity: 0,
                                  width: '1px',
                                  height: '1px',
                                  pointerEvents: 'none',
                                  bottom: 0,
                                  right: 0
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (dateInputEditRef.current) {
                                    if (typeof dateInputEditRef.current.showPicker === 'function') {
                                      dateInputEditRef.current.showPicker();
                                    } else {
                                      dateInputEditRef.current.focus();
                                    }
                                  }
                                }}
                                title="Abrir calendário"
                                style={{
                                  background: '#ede9fe',
                                  border: '1px solid #c4b5fd',
                                  borderRadius: '6px',
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                📅
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Plataforma */}
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={editForm.platform}
                            onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              background: '#ffffff'
                            }}
                          >
                            {allPlatformNames.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>

                        {/* Pedido */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.orderNumber}
                            onChange={(e) => setEditForm({ ...editForm, orderNumber: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              fontFamily: 'monospace'
                            }}
                          />
                        </td>

                        {/* Cliente */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.client}
                            onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px'
                            }}
                          />
                        </td>

                        {/* Valor */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.value}
                            onChange={(e) => setEditForm({ ...editForm, value: formatCurrencyInput(e.target.value) })}
                            style={{
                              width: '100px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#15803d'
                            }}
                          />
                        </td>

                        {/* Observação */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px'
                            }}
                          />
                        </td>

                        {/* Salvar / Cancelar */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              onClick={handleSaveEdit}
                              title="Salvar alterações"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#22c55e',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Check size={16} strokeWidth={2.8} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              title="Cancelar edição"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#e2e8f0',
                                color: '#475569',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <X size={16} strokeWidth={2.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#faf5ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Data */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                        {item.date || '-'}
                      </td>

                      {/* Plataforma */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          display: 'inline-block',
                          ...platStyle
                        }}>
                          {item.platform || 'Shopee'}
                        </span>
                      </td>

                      {/* Pedido */}
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                        {item.orderNumber || item.pedido || '-'}
                      </td>

                      {/* Cliente */}
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {item.client || item.cliente || '-'}
                      </td>

                      {/* Valor */}
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {item.value || item.valor || '-'}
                      </td>

                      {/* Observação */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', maxWidth: '320px', wordBreak: 'break-word' }}>
                        {item.notes || item.observacao || '-'}
                      </td>

                      {/* Ações: Duplicar, Editar e Excluir */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleDuplicate(item)}
                            title="Duplicar anotação"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #d1fae5',
                              background: '#ecfdf5',
                              color: '#059669',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#059669';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ecfdf5';
                              e.currentTarget.style.color = '#059669';
                            }}
                          >
                            <Copy size={14} />
                          </button>

                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Editar anotação"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ede9fe';
                              e.currentTarget.style.color = '#6d28d9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, item.client || item.cliente)}
                            title="Excluir anotação"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #fee2e2',
                              background: '#fff5f5',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff5f5';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Modal de Criação Rápida */}
      {isAdding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '28px 24px',
            boxShadow: '0 25px 50px -12px rgba(109, 40, 217, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                Adicionar Anotação
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Data</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="dd/mm"
                      value={newAnnotation.date}
                      onChange={(e) => handleDateMask(e.target.value, setNewAnnotation, newAnnotation)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '14px',
                        fontWeight: '700',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={dateInputAddRef}
                        type="date"
                        value={(() => {
                          if (newAnnotation.date && newAnnotation.date.includes('/')) {
                            const parts = newAnnotation.date.split('/');
                            if (parts[0] && parts[1]) {
                              const y = new Date().getFullYear();
                              return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                          }
                          return '';
                        })()}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split('-');
                            setNewAnnotation({ ...newAnnotation, date: `${day}/${month}` });
                          }
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '1px',
                          height: '1px',
                          pointerEvents: 'none',
                          bottom: 0,
                          right: 0
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (dateInputAddRef.current) {
                            if (typeof dateInputAddRef.current.showPicker === 'function') {
                              dateInputAddRef.current.showPicker();
                            } else {
                              dateInputAddRef.current.focus();
                            }
                          }
                        }}
                        title="Abrir calendário"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 12px',
                          borderRadius: '10px',
                          background: '#ede9fe',
                          border: '1.5px solid #c4b5fd',
                          fontSize: '16px',
                          height: '42px',
                          cursor: 'pointer'
                        }}
                      >
                        📅
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Plataforma</label>
                  <select
                    value={newAnnotation.platform}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, platform: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      background: '#ffffff'
                    }}
                  >
                    {allPlatformNames.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Pedido</label>
                <input
                  type="text"
                  placeholder="Ex: 241028-ABC"
                  value={newAnnotation.orderNumber}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, orderNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Cliente</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newAnnotation.client}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, client: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Valor</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={newAnnotation.value}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, value: formatCurrencyInput(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#16a34a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Observação</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais..."
                  value={newAnnotation.notes}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
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
                    background: '#6d28d9',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
                  }}
                >
                  Salvar Linha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
