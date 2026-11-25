import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Printer, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Calendar, 
  Building2, 
  Layers, 
  Package, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle,
  Clock,
  Edit2
} from 'lucide-react';

export default function FullPlanningView({
  platforms = [],
  products = [],
  currentUser
}) {
  // Ordenação das plataformas agrupando por marketplace: Shopee (JBC, Jeremias, Izabela...), Mercado Livre, Amazon, Magalu, Shein, Nuvemshop etc.
  const sortedPlatforms = React.useMemo(() => {
    const list = [...platforms];
    const getPlatformPriority = (name = '') => {
      const n = name.toLowerCase();
      if (n.includes('shopee')) return 1;
      if (n.includes('mercado') || n.includes('ml')) return 2;
      if (n.includes('amazon')) return 3;
      if (n.includes('magalu') || n.includes('magazine')) return 4;
      if (n.includes('shein')) return 5;
      if (n.includes('nuvem')) return 6;
      if (n.includes('tiktok')) return 7;
      return 8;
    };

    return list.sort((a, b) => {
      const prioA = getPlatformPriority(a.name);
      const prioB = getPlatformPriority(b.name);
      if (prioA !== prioB) return prioA - prioB;
      return String(a.name).localeCompare(String(b.name), 'pt-BR');
    });
  }, [platforms]);

  // Estado com os planejamentos salvos no localStorage
  const [plannings, setPlannings] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_full_plannings');
      if (saved) return JSON.parse(saved);
      // Dados de exemplo se vazio
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dateStr = `${dd}/${mm}`;
      return [
        {
          id: 'full_demo_1',
          date: dateStr,
          rawDate: new Date().toISOString().split('T')[0],
          platformId: platforms[0]?.id || 'shopee',
          platformName: platforms[0]?.name || 'Shopee',
          items: [
            { id: 'item_1', sku: products[0]?.sku || 'SKU-001', quantity: 10, completed: false },
            { id: 'item_2', sku: products[1]?.sku || 'SKU-002', quantity: 5, completed: false }
          ],
          createdAt: new Date().toISOString()
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Salvar no localStorage sempre que plannings mudar
  useEffect(() => {
    try {
      localStorage.setItem('taresk_full_plannings', JSON.stringify(plannings));
    } catch (e) {
      console.error('Erro ao salvar planejamentos full:', e);
    }
  }, [plannings]);

  // Modal de cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Formulário do novo planejamento
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    dateInput: getTodayISO(),
    platformId: platforms[0]?.id || '',
    items: [{ sku: '', quantity: 1 }]
  });

  // Resetar / Abrir Modal
  const handleOpenModal = () => {
    setFormData({
      dateInput: getTodayISO(),
      platformId: platforms[0]?.id || '',
      items: [{ sku: products[0]?.sku || '', quantity: 1 }]
    });
    setIsModalOpen(true);
  };

  // Gerenciamento de itens dentro do modal
  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { sku: '', quantity: 1 }]
    }));
  };

  const handleRemoveItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  // Salvar Planejamento
  const handleSavePlanning = (e) => {
    e.preventDefault();
    if (!formData.platformId) {
      alert('Selecione uma plataforma.');
      return;
    }

    const validItems = formData.items
      .filter(it => it.sku && String(it.sku).trim() !== '')
      .map((it, idx) => ({
        id: `it_${Date.now()}_${idx}`,
        sku: String(it.sku).trim(),
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
        completed: false
      }));

    if (validItems.length === 0) {
      alert('Adicione pelo menos um SKU com quantidade.');
      return;
    }

    // Formatar data para dd/mm
    let formattedDate = '';
    if (formData.dateInput) {
      const parts = formData.dateInput.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}`;
      }
    }
    if (!formattedDate) {
      const now = new Date();
      formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const targetPlat = platforms.find(p => String(p.id) === String(formData.platformId)) || {
      id: formData.platformId,
      name: formData.platformId
    };

    const newPlanning = {
      id: `full_${Date.now()}`,
      date: formattedDate,
      rawDate: formData.dateInput,
      platformId: targetPlat.id,
      platformName: targetPlat.name,
      platformColor: targetPlat.color,
      items: validItems,
      createdAt: new Date().toISOString()
    };

    setPlannings(prev => [newPlanning, ...prev]);
    setIsModalOpen(false);
  };

  // Alternar checkbox de item individual
  const handleToggleItemComplete = (planningId, itemId) => {
    setPlannings(prev => prev.map(plan => {
      if (plan.id !== planningId) return plan;
      return {
        ...plan,
        items: plan.items.map(it => {
          if (it.id !== itemId) return it;
          return { ...it, completed: !it.completed };
        })
      };
    }));
  };

  // Excluir planejamento inteiro
  const handleDeletePlanning = (planningId) => {
    if (window.confirm('Deseja realmente remover este planejamento Full?')) {
      setPlannings(prev => prev.filter(p => p.id !== planningId));
    }
  };

  // Excluir item individual de um planejamento
  const handleDeleteItem = (planningId, itemId) => {
    setPlannings(prev => prev.map(p => {
      if (p.id !== planningId) return p;
      return {
        ...p,
        items: p.items.filter(it => it.id !== itemId)
      };
    }).filter(p => p.items.length > 0)); // Se ficar sem itens, remove o bloco
  };

  // Obter cor da plataforma
  const getPlatformColor = (platformId, platformName) => {
    const plat = platforms.find(p => 
      String(p.id).toLowerCase() === String(platformId).toLowerCase() || 
      String(p.name).toLowerCase() === String(platformName).toLowerCase()
    );
    if (plat?.color) return plat.color;
    
    // Cores padrões conhecidas
    const nameLower = String(platformName || platformId || '').toLowerCase();
    if (nameLower.includes('shopee')) return '#ee4d2d';
    if (nameLower.includes('mercado') || nameLower.includes('ml')) return '#eab308';
    if (nameLower.includes('amazon')) return '#0284c7';
    if (nameLower.includes('magalu')) return '#2563eb';
    if (nameLower.includes('shein')) return '#0f172a';
    return '#8b5cf6';
  };

  // Impressão em PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="full-planning-container" style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Estilos para tela e impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .full-print-zone, .full-print-zone * {
            visibility: visible !important;
          }
          .full-print-zone {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
          .print-circle {
            border: 2.5px solid #000000 !important;
            background: transparent !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-badge {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }

        .custom-big-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 3px solid #111827;
          display: flex;
          align-items: center;
          justifyContent: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          background: #ffffff;
        }

        .custom-big-circle:hover {
          transform: scale(1.06);
          border-color: #6366f1;
        }

        .custom-big-circle.checked {
          background: #10b981;
          border-color: #059669;
          color: #ffffff;
        }
      `}</style>

      {/* ÁREA DE CABEÇALHO */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '900',
          color: '#1e293b',
          letterSpacing: '-0.5px'
        }}>
          Planejamento Full
        </h1>

        {/* Botões do topo: Impressora e Adicionar (+) como no padrão do Tarefas/Disputas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handlePrint}
            title="Imprimir Resumo em PDF com Checklist"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            <Printer size={22} strokeWidth={2.2} />
          </button>

          {/* Botão Circular Roxo com + padronizado idêntico a Tarefas, Disputas, etc. */}
          <button
            onClick={handleOpenModal}
            title="Novo Planejamento Full"
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.background = '#4e1fc4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#5925dc';
            }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO / IMPRESSÃO */}
      <div className="full-print-zone">
        {/* Cabeçalho que sai apenas na impressão */}
        <div style={{ display: 'none' }} className="print-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
              PLANEJAMENTO FULL - JBC ELETRO
            </h1>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>
              Impresso em: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {plannings.length === 0 ? (
          <div className="no-print" style={{
            background: '#f8fafc',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Zap size={48} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', margin: '0 0 6px 0' }}>
              Nenhum Planejamento Full cadastrado
            </h3>
            <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>
              Clique no botão circular com <b>(+)</b> acima para adicionar seu primeiro planejamento com Data, Plataforma e lista de SKUs.
            </p>
            <button
              onClick={handleOpenModal}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} /> Novo Planejamento
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {plannings.map((plan) => {
              const platColor = getPlatformColor(plan.platformId, plan.platformName);
              const totalUnits = (plan.items || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
              const completedUnits = (plan.items || []).reduce((acc, curr) => acc + (curr.completed ? (Number(curr.quantity) || 0) : 0), 0);

              return (
                <div
                  key={plan.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                    padding: '24px 28px',
                    pageBreakInside: 'avoid'
                  }}
                >
                  {/* Cabeçalho do Grupo: Data - Plataforma com Badge Colorida */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    marginBottom: '20px',
                    borderBottom: '1.5px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        color: '#0f172a',
                        letterSpacing: '-0.3px'
                      }}>
                        {plan.date} -
                      </span>

                      <span
                        className="print-badge"
                        style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          padding: '4px 14px',
                          borderRadius: '8px',
                          backgroundColor: platColor,
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        {plan.platformName}
                      </span>

                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}>
                        Total: <b>{totalUnits}</b> un ({completedUnits}/{totalUnits} prontos)
                      </span>
                    </div>

                    <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleDeletePlanning(plan.id)}
                        title="Excluir este bloco de planejamento"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <Trash2 size={16} /> Excluir
                      </button>
                    </div>
                  </div>

                  {/* Checklist dos itens: Círculo grande + Qtd - SKU */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {plan.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: item.completed ? '#f0fdf4' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div
                          onClick={() => handleToggleItemComplete(plan.id, item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '18px',
                            cursor: 'pointer',
                            flex: 1
                          }}
                        >
                          {/* Círculo Checklist Estilo Foto do Usuário */}
                          <div
                            className={`custom-big-circle print-circle ${item.completed ? 'checked' : ''}`}
                            title="Clique para marcar / desmarcar"
                          >
                            {item.completed && <Check size={22} strokeWidth={3.2} />}
                          </div>

                          {/* Qtd - SKU */}
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            color: item.completed ? '#15803d' : '#0f172a',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            letterSpacing: '-0.2px'
                          }}>
                            {item.quantity} - {item.sku}
                          </div>
                        </div>

                        {/* Botão de excluir item individual (apenas tela) */}
                        <div className="no-print">
                          <button
                            onClick={() => handleDeleteItem(plan.id, item.id)}
                            title="Remover este SKU"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE NOVO PLANEJAMENTO FULL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Topo do Modal */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f59e0b',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} fill="#ffffff" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Novo Planejamento Full
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Selecione a data, a plataforma e os SKUs com quantidade
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário com Scroll se necessário */}
            <form onSubmit={handleSavePlanning} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Linha 1: Data e Plataforma */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Data */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Data do Envio *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        required
                        value={formData.dateInput}
                        onChange={e => setFormData({ ...formData, dateInput: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Plataforma */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Plataforma *
                    </label>
                    <select
                      value={formData.platformId}
                      onChange={e => setFormData({ ...formData, platformId: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="" disabled>Selecione a plataforma</option>
                      {sortedPlatforms.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Linha 2: Seção de SKUs e Quantidades */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                      Produtos e Quantidades (SKU) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} /> Adicionar SKU
                    </button>
                  </div>

                  {/* Lista de itens dinâmicos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {formData.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Quantidade */}
                        <div style={{ width: '90px' }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            required
                            value={it.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '14px',
                              fontWeight: '700',
                              textAlign: 'center',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* SKU com datalist/dropdown */}
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type="text"
                            list={`sku-list-${idx}`}
                            placeholder="Digite ou escolha o SKU..."
                            required
                            value={it.sku}
                            onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '14px',
                              fontWeight: '600',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <datalist id={`sku-list-${idx}`}>
                            {products.map(p => (
                              <option key={p.id || p.sku} value={p.sku}>
                                {p.sku} {p.title ? `- ${p.title}` : ''}
                              </option>
                            ))}
                          </datalist>
                        </div>

                        {/* Botão Remover linha se tiver mais de 1 */}
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            style={{
                              background: '#fee2e2',
                              border: 'none',
                              color: '#ef4444',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Rodapé do Modal */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#f8fafc'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    background: '#0f172a',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)'
                  }}
                >
                  Salvar Planejamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
