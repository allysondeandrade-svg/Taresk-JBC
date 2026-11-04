import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Calendar, FileText, ArrowUpDown, ChevronDown } from 'lucide-react';

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

const PLATFORM_OPTIONS = [
  { value: 'Shopee', label: 'Shopee', color: '#ffedd5', textColor: '#c2410c', border: '#fed7aa' },
  { value: 'Mercado Livre', label: 'Mercado Livre', color: '#fef9c3', textColor: '#854d0e', border: '#fef08a' },
  { value: 'Amazon', label: 'Amazon', color: '#e2e8f0', textColor: '#334155', border: '#cbd5e1' },
  { value: 'Magalu', label: 'Magalu', color: '#e0f2fe', textColor: '#0369a1', border: '#bae6fd' },
  { value: 'Shein', label: 'Shein', color: '#f1f5f9', textColor: '#0f172a', border: '#cbd5e1' },
  { value: 'Geral', label: 'Geral / Outros', color: '#ede9fe', textColor: '#6d28d9', border: '#ddd6fe' }
];

export default function AnnotationsView({
  annotations = [],
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Modal / Formulário de Adição
  const [isAdding, setIsAdding] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    date: getTodayFormatted(),
    platform: 'Shopee',
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
      platform: 'Shopee',
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
      platform: newAnnotation.platform,
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
      platform: item.platform || 'Shopee',
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

  const handleDelete = (id, clientName) => {
    if (window.confirm(`Deseja excluir a anotação ${clientName ? `do cliente "${clientName}"` : ''}?`)) {
      if (onDeleteAnnotation) {
        onDeleteAnnotation(id);
      }
    }
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
    const found = PLATFORM_OPTIONS.find(p => p.value === platName) || PLATFORM_OPTIONS[0];
    return {
      background: found.color,
      color: found.textColor,
      border: `1px solid ${found.border}`
    };
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Banner Superior Roxo Estilizado */}
      <div style={{
        background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
        borderRadius: '24px',
        padding: '28px 32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.3)',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>📝</span>
            <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>
              Anotações
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#e9d5ff', maxWidth: '600px', lineHeight: '1.4' }}>
            Planilha interativa de notas rápidas para todos os vendedores. Sincronizada automaticamente com a aba Anotação do Google Sheets.
          </p>
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
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Todas as Plataformas</option>
            {PLATFORM_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
            {filteredList.length} {filteredList.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* Tabela Interativa de Anotações (Estilo Planilha) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Data</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Plataforma</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Pedido</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Valor</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Observação</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center', width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>Nenhuma anotação encontrada</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Clique em "Nova Anotação" acima para adicionar uma linha.</div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isEditing = editingId === item.id;
                  const platStyle = getPlatformBadge(item.platform);

                  if (isEditing) {
                    return (
                      <tr key={item.id} style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            style={{
                              width: '75px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={editForm.platform}
                            onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            {PLATFORM_OPTIONS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.orderNumber}
                            onChange={(e) => setEditForm({ ...editForm, orderNumber: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.client}
                            onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.value}
                            onChange={(e) => setEditForm({ ...editForm, value: formatCurrencyInput(e.target.value) })}
                            style={{
                              width: '110px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#15803d'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #a855f7',
                              fontSize: '13px'
                            }}
                          />
                        </td>
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

                      {/* Ações */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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

      {/* Modal para Adicionar Anotação Rápida */}
      {isAdding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Data</label>
                  <input
                    type="text"
                    value={newAnnotation.date}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '700',
                      boxSizing: 'border-box'
                    }}
                  />
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
                      boxSizing: 'border-box'
                    }}
                  >
                    {PLATFORM_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
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
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#6d28d9',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

