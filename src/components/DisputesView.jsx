import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Filter, AlertTriangle, ArrowUpDown, ChevronDown } from 'lucide-react';

export default function DisputesView({
  disputes = [],
  onAddDispute,
  onUpdateDispute,
  onDeleteDispute
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDispute, setEditingDispute] = useState(null);

  // Formulário de nova disputa / edição
  const [formData, setFormData] = useState({
    platform: 'SH',
    date: (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    })(),
    product: '',
    orderNumber: '',
    description: '',
    notes: '',
    returnCode: '',
    status: 'Em Disputa'
  });

  const handleOpenAdd = () => {
    const d = new Date();
    setFormData({
      platform: 'SH',
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      product: '',
      orderNumber: '',
      description: '',
      notes: '',
      returnCode: '',
      status: 'Em Disputa'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dispute) => {
    setEditingDispute(dispute);
    setFormData({
      platform: dispute.platform || 'SH',
      date: dispute.date || '',
      product: dispute.product || '',
      orderNumber: dispute.orderNumber || '',
      description: dispute.description || '',
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
      return true;
    });
  }, [disputes, searchTerm, statusFilter]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', minHeight: '80vh' }}>
      {/* Banner Principal Superior: DISPUTAS em roxo do aplicativo conforme solicitado */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #5925dc 0%, #4318ac 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(89, 37, 220, 0.25)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '40px' }} /> {/* Espaçador para centralizar título */}

        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}
        >
          DISPUTAS
        </h1>

        {/* Botão Circular com ícone + exatamente como na referência */}
        <button
          type="button"
          onClick={handleOpenAdd}
          title="Nova Disputa"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.22)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backdropFilter: 'blur(4px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#5925dc';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Barra de Filtros e Busca logo abaixo do banner */}
      <div
        style={{
          background: '#f8fafc',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '1.5px solid #e2e8f0',
          borderRight: '1.5px solid #e2e8f0',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Status:</span>
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
            <tr style={{ background: '#000000', color: '#ffffff' }}>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', width: '85px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Plataf <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', fontSize: '14px', fontWeight: '800', width: '80px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Data <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', width: '150px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Produto <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', width: '180px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Pedido <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', minWidth: '150px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Descrição <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', minWidth: '150px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Observação <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', width: '160px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Devolução <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '800', width: '160px', borderRight: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Situação <ChevronDown size={14} />
                </div>
              </th>
              <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '700', width: '70px', textAlign: 'center' }}>
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
                        value={item.platform || 'SH'}
                        onChange={(e) => handleInlinePlatformChange(item, e.target.value)}
                        style={{
                          ...platStyle,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          outline: 'none',
                          border: platStyle.border
                        }}
                      >
                        <option value="SH">SH</option>
                        <option value="ML">ML</option>
                        <option value="AMZ">AMZ</option>
                        <option value="MAG">MAG</option>
                        <option value="SHEIN">SHEIN</option>
                      </select>
                    </td>

                    {/* Data (ex: 06/10) */}
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#1e293b', borderRight: '1px solid #f1f5f9' }}>
                      {item.date}
                    </td>

                    {/* Produto (ex: ET 4 Band Dupla) */}
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#0f172a', borderRight: '1px solid #f1f5f9' }}>
                      {item.product}
                    </td>

                    {/* Pedido (ex: 260910NPVMRD39) */}
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#334155', fontFamily: 'monospace', borderRight: '1px solid #f1f5f9' }}>
                      {item.orderNumber}
                    </td>

                    {/* Descrição (ex: Vidro Quebrado) */}
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b', borderRight: '1px solid #f1f5f9' }}>
                      {item.description}
                    </td>

                    {/* Observação (ex: Shopee Izabela) */}
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#475569', borderRight: '1px solid #f1f5f9' }}>
                      {item.notes}
                    </td>

                    {/* Devolução (código de devolução) */}
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#334155', fontFamily: 'monospace', borderRight: '1px solid #f1f5f9' }}>
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
                    <option value="SH">Shopee (SH)</option>
                    <option value="ML">Mercado Livre (ML)</option>
                    <option value="AMZ">Amazon (AMZ)</option>
                    <option value="MAG">Magalu (MAG)</option>
                    <option value="SHEIN">SHEIN</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Data (dd/mm)
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="dd/mm"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Produto / SKU
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ET 4 Band Dupla, CH 40X80..."
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box'
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
                  <input
                    type="text"
                    placeholder="Ex: Vidro Quebrado, Avariado..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
