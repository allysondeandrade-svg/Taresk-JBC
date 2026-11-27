import React, { useState, useEffect, useMemo } from 'react';
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
  Edit2,
  Send,
  ArrowUpDown,
  Search,
  RotateCcw,
  Box
} from 'lucide-react';
import { SheetsApi } from '../services/sheetsApi';

export default function FullPlanningView({
  platforms = [],
  products = [],
  currentUser,
  plannings: propsPlannings,
  onSavePlanning: propsOnSavePlanning,
  onDeletePlanning: propsOnDeletePlanning,
  onToggleItemComplete: propsOnToggleItemComplete,
  onDeleteItem: propsOnDeleteItem
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
  const [localPlannings, setLocalPlannings] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_full_plannings');
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      return [];
    }
  });

  const plannings = propsPlannings !== undefined ? propsPlannings : localPlannings;
  const setPlannings = (updater) => {
    if (typeof updater === 'function') {
      setLocalPlannings(prev => {
        const next = updater(propsPlannings !== undefined ? propsPlannings : prev);
        try { localStorage.setItem('taresk_full_plannings', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } else {
      setLocalPlannings(updater);
      try { localStorage.setItem('taresk_full_plannings', JSON.stringify(updater)); } catch (e) {}
    }
  };

  // Carrega da planilha caso venha vazio localmente
  useEffect(() => {
    if (!propsPlannings) {
      SheetsApi.fetchFullPlannings().then(remoteList => {
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          setLocalPlannings(prev => {
            const map = new Map();
            remoteList.forEach(p => map.set(String(p.id), p));
            prev.forEach(p => map.set(String(p.id), p));
            const merged = Array.from(map.values());
            try { localStorage.setItem('taresk_full_plannings', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }).catch(err => console.warn('Erro ao carregar full do sheets:', err));
    }
  }, [propsPlannings]);

  // Salvar no localStorage sempre que plannings mudar
  useEffect(() => {
    try {
      localStorage.setItem('taresk_full_plannings', JSON.stringify(plannings));
    } catch (e) {
      console.error('Erro ao salvar planejamentos full:', e);
    }
  }, [plannings]);

  // Controle de abas da página Full: 'embalar' e 'enviado'
  const [activeFullTab, setActiveFullTab] = useState('embalar');

  // Ajuste do tamanho da fonte dos itens a embalar (P, M, G, GG - conforme Contas a Pagar)
  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    return localStorage.getItem('taresk_full_font_size') || 'large';
  });

  const handleFontSizeChange = (size) => {
    setFontSizeLevel(size);
    try {
      localStorage.setItem('taresk_full_font_size', size);
    } catch (e) {}
  };

  const fontStyles = useMemo(() => {
    switch (fontSizeLevel) {
      case 'small':
        return {
          circleSize: '30px',
          checkIconSize: 18,
          itemFontSize: '16px',
          gap: '12px',
          padding: '6px 10px'
        };
      case 'medium':
        return {
          circleSize: '36px',
          checkIconSize: 20,
          itemFontSize: '18px',
          gap: '14px',
          padding: '8px 12px'
        };
      case 'xlarge':
        return {
          circleSize: '46px',
          checkIconSize: 28,
          itemFontSize: '26px',
          gap: '20px',
          padding: '12px 16px'
        };
      case 'large':
      default:
        return {
          circleSize: '40px',
          checkIconSize: 24,
          itemFontSize: '21px',
          gap: '16px',
          padding: '10px 14px'
        };
    }
  }, [fontSizeLevel]);

  // Filtros da aba "Enviado": Período (Todos, Hoje, Esta Semana, Este Mês, Personalizado) e Ordenação (Recentes / Antigos)
  const [sentPeriodFilter, setSentPeriodFilter] = useState('all');
  const [sentStartDate, setSentStartDate] = useState('');
  const [sentEndDate, setSentEndDate] = useState('');
  const [sentSortOrder, setSentSortOrder] = useState('desc'); // 'desc' = mais recentes, 'asc' = mais antigos
  const [sentSearchTerm, setSentSearchTerm] = useState('');

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
      status: 'embalar',
      createdAt: new Date().toISOString()
    };

    setPlannings(prev => [newPlanning, ...prev]);
    if (propsOnSavePlanning) {
      propsOnSavePlanning(newPlanning);
    } else {
      try {
        SheetsApi.saveFullPlanning(newPlanning);
      } catch (err) {
        console.warn('Erro ao salvar no sheets:', err);
      }
    }
    setIsModalOpen(false);
  };

  // Alternar checkbox de item individual
  const handleToggleItemComplete = (planningId, itemId) => {
    let updatedTarget = null;
    setPlannings(prev => prev.map(plan => {
      if (plan.id !== planningId) return plan;
      const updated = {
        ...plan,
        items: plan.items.map(it => {
          if (it.id !== itemId) return it;
          return { ...it, completed: !it.completed };
        })
      };
      updatedTarget = updated;
      return updated;
    }));

    if (propsOnToggleItemComplete) {
      propsOnToggleItemComplete(planningId, itemId);
    } else if (updatedTarget) {
      try {
        SheetsApi.saveFullPlanning(updatedTarget);
      } catch (err) {
        console.warn('Erro ao sincronizar checkbox full:', err);
      }
    }
  };

  // Excluir planejamento inteiro
  const handleDeletePlanning = (planningId) => {
    if (window.confirm('Deseja realmente remover este planejamento Full?')) {
      setPlannings(prev => prev.filter(p => p.id !== planningId));
      if (propsOnDeletePlanning) {
        propsOnDeletePlanning(planningId);
      } else {
        try {
          SheetsApi.deleteFullPlanning(planningId);
        } catch (err) {
          console.warn('Erro ao deletar no sheets:', err);
        }
      }
    }
  };

  // Excluir item individual de um planejamento
  const handleDeleteItem = (planningId, itemId) => {
    let updatedTarget = null;
    let willRemoveAll = false;
    setPlannings(prev => prev.map(p => {
      if (p.id !== planningId) return p;
      const newItems = p.items.filter(it => it.id !== itemId);
      if (newItems.length === 0) {
        willRemoveAll = true;
      }
      const updated = { ...p, items: newItems };
      updatedTarget = updated;
      return updated;
    }).filter(p => p.items.length > 0)); // Se ficar sem itens, remove o bloco

    if (propsOnDeleteItem) {
      propsOnDeleteItem(planningId, itemId);
    } else if (willRemoveAll) {
      try { SheetsApi.deleteFullPlanning(planningId); } catch (e) {}
    } else if (updatedTarget) {
      try { SheetsApi.saveFullPlanning(updatedTarget); } catch (e) {}
    }
  };

  // Mudar status de um planejamento (ex: 'embalar' <-> 'enviado')
  const handleSetPlanningStatus = (planningId, newStatus) => {
    const currentList = propsPlannings !== undefined ? propsPlannings : localPlannings;
    const targetItem = currentList.find(p => String(p.id) === String(planningId));
    
    const updatedTarget = targetItem ? {
      ...targetItem,
      status: newStatus,
      sentAt: newStatus === 'enviado' ? new Date().toISOString() : targetItem.sentAt
    } : null;

    // Atualiza o estado
    setPlannings(prev => {
      const list = prev || [];
      return list.map(p => {
        if (String(p.id) !== String(planningId)) return p;
        return {
          ...p,
          status: newStatus,
          sentAt: newStatus === 'enviado' ? new Date().toISOString() : p.sentAt
        };
      });
    });

    // Se estiver na aba pai (App.jsx), invoca propsOnSavePlanning para atualizar fullPlannings
    if (updatedTarget && propsOnSavePlanning) {
      propsOnSavePlanning(updatedTarget);
    } else if (updatedTarget) {
      try {
        SheetsApi.saveFullPlanning(updatedTarget);
      } catch (err) {
        console.warn('Erro ao atualizar status do Full:', err);
      }
    }
  };

  // Separação dos planejamentos por status: Embalar vs Enviado
  const embalarPlannings = useMemo(() => {
    return plannings.filter(p => String(p.status || 'embalar').toLowerCase() !== 'enviado');
  }, [plannings]);

  const enviadoPlannings = useMemo(() => {
    let list = plannings.filter(p => String(p.status || '').toLowerCase() === 'enviado');

    // Filtro de busca textual
    if (sentSearchTerm.trim()) {
      const term = sentSearchTerm.toLowerCase().trim();
      list = list.filter(p => {
        const plat = String(p.platformName || '').toLowerCase();
        const date = String(p.date || '').toLowerCase();
        const hasItem = (p.items || []).some(it => String(it.sku || '').toLowerCase().includes(term));
        return plat.includes(term) || date.includes(term) || hasItem;
      });
    }

    // Filtro por período
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (sentPeriodFilter === 'today') {
      list = list.filter(p => {
        if (p.date === todayStr) return true;
        if (p.rawDate && p.rawDate === now.toISOString().split('T')[0]) return true;
        if (p.sentAt && p.sentAt.split('T')[0] === now.toISOString().split('T')[0]) return true;
        return false;
      });
    } else if (sentPeriodFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      list = list.filter(p => {
        const itemDate = p.sentAt ? new Date(p.sentAt) : (p.rawDate ? new Date(p.rawDate) : (p.createdAt ? new Date(p.createdAt) : null));
        if (itemDate && !isNaN(itemDate.getTime())) {
          return itemDate >= weekAgo && itemDate <= now;
        }
        return true;
      });
    } else if (sentPeriodFilter === 'month') {
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      list = list.filter(p => {
        if (p.date && p.date.includes('/')) {
          const parts = p.date.split('/');
          if (parseInt(parts[1], 10) === currentMonth) return true;
        }
        if (p.sentAt) {
          const d = new Date(p.sentAt);
          if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) return true;
        }
        return false;
      });
    } else if (sentPeriodFilter === 'custom') {
      if (sentStartDate) {
        list = list.filter(p => {
          const dateStr = p.rawDate || (p.sentAt ? p.sentAt.split('T')[0] : (p.createdAt ? p.createdAt.split('T')[0] : ''));
          return dateStr >= sentStartDate;
        });
      }
      if (sentEndDate) {
        list = list.filter(p => {
          const dateStr = p.rawDate || (p.sentAt ? p.sentAt.split('T')[0] : (p.createdAt ? p.createdAt.split('T')[0] : ''));
          return dateStr <= sentEndDate;
        });
      }
    }

    // Ordenação (Mais recentes vs Mais antigos)
    return [...list].sort((a, b) => {
      const getTime = (p) => {
        if (p.sentAt) return new Date(p.sentAt).getTime();
        if (p.createdAt) return new Date(p.createdAt).getTime();
        if (p.rawDate) return new Date(p.rawDate).getTime();
        return 0;
      };
      const timeA = getTime(a);
      const timeB = getTime(b);
      if (timeA && timeB) {
        return sentSortOrder === 'desc' ? (timeB - timeA) : (timeA - timeB);
      }
      return sentSortOrder === 'desc' ? String(b.id).localeCompare(String(a.id)) : String(a.id).localeCompare(String(b.id));
    });
  }, [plannings, sentSearchTerm, sentPeriodFilter, sentStartDate, sentEndDate, sentSortOrder]);

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
          width: var(--full-circle-size, 38px);
          height: var(--full-circle-size, 38px);
          border-radius: 50%;
          border: 2.5px solid #0f172a;
          display: flex;
          align-items: center;
          justifyContent: center;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .custom-big-circle:hover {
          transform: scale(1.08);
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }

        .custom-big-circle.checked {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #059669;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
          animation: popCheck 0.25s ease-out;
        }

        @keyframes popCheck {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* ÁREA DE CABEÇALHO */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Título e Sub-abas: [ Embalar (X) ] [ Enviado (Y) ] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '900',
            color: '#1e293b',
            letterSpacing: '-0.5px'
          }}>
            Planejamento Full
          </h1>

          {/* Abas Embalar vs Enviado */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setActiveFullTab('embalar')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                background: activeFullTab === 'embalar' ? '#ffffff' : 'transparent',
                color: activeFullTab === 'embalar' ? '#5925dc' : '#64748b',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeFullTab === 'embalar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Box size={14} strokeWidth={2.4} />
              <span>Embalar</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '9999px',
                background: activeFullTab === 'embalar' ? '#f3e8ff' : '#e2e8f0',
                color: activeFullTab === 'embalar' ? '#6b21a8' : '#64748b',
                fontWeight: '900'
              }}>
                {embalarPlannings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFullTab('enviado')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                background: activeFullTab === 'enviado' ? '#ffffff' : 'transparent',
                color: activeFullTab === 'enviado' ? '#059669' : '#64748b',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeFullTab === 'enviado' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={13} />
              <span>Enviado</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '9999px',
                background: activeFullTab === 'enviado' ? '#dcfce7' : '#e2e8f0',
                color: activeFullTab === 'enviado' ? '#15803d' : '#64748b',
                fontWeight: '900'
              }}>
                {enviadoPlannings.length}
              </span>
            </button>
          </div>
        </div>

        {/* Botões do topo: Ajuste de Fonte (na aba Embalar), Impressora e Adicionar (+) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Seletor de Tamanho da Fonte (apenas na aba Embalar, como em Contas a Pagar) */}
          {activeFullTab === 'embalar' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              padding: '4px 8px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1'
            }}>
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
          )}

          {/* Botão de Impressão Refinado e Moderno */}
          <button
            onClick={handlePrint}
            title="Imprimir Resumo em PDF com Checklist"
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '9999px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.borderColor = '#0f172a';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
            }}
          >
            <Printer size={18} strokeWidth={2.4} />
            <span>Imprimir PDF</span>
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
      <div
        className="full-print-zone"
        style={{
          '--full-circle-size': fontStyles.circleSize
        }}
      >
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

        {/* ============================================================ */}
        {/* ABA 1: EMBALAR (Lista de envios pendentes com checklist)     */}
        {/* ============================================================ */}
        {activeFullTab === 'embalar' && (
          <div>
            {embalarPlannings.length === 0 ? (
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
                  Nenhum Envio para Embalar
                </h3>
                <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>
                  Todos os envios foram enviados ou ainda não foram cadastrados. Clique no botão circular com <b>(+)</b> acima para adicionar.
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
                {embalarPlannings.map((plan) => {
                  const platColor = getPlatformColor(plan.platformId, plan.platformName);
                  const totalUnits = (plan.items || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
                  const completedUnits = (plan.items || []).reduce((acc, curr) => acc + (curr.completed ? (Number(curr.quantity) || 0) : 0), 0);
                  const allCompleted = (plan.items || []).length > 0 && (plan.items || []).every(it => it.completed);

                  return (
                    <div
                      key={plan.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: allCompleted ? '2px solid #86efac' : '1.5px solid #e2e8f0',
                        boxShadow: allCompleted ? '0 6px 18px rgba(34, 197, 94, 0.08)' : '0 4px 14px rgba(0,0,0,0.03)',
                        padding: '24px 28px',
                        pageBreakInside: 'avoid',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Cabeçalho do Grupo: Data - Plataforma com Badge Colorida e Botão "Marcar como Enviado" */}
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
                            color: allCompleted ? '#166534' : '#64748b',
                            background: allCompleted ? '#dcfce7' : '#f1f5f9',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {allCompleted && <CheckCircle2 size={15} color="#16a34a" />}
                            Total: <b>{totalUnits}</b> un ({completedUnits}/{totalUnits} prontos)
                          </span>
                        </div>

                        {/* Ações da direita: Botão "Marcar como Enviado" (quando todos marcados) e Excluir */}
                        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {allCompleted && (
                            <button
                              type="button"
                              onClick={() => handleSetPlanningStatus(plan.id, 'enviado')}
                              title="Passar status para Enviado e mover para a aba Enviado"
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '9999px',
                                fontSize: '13px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#059669';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <Send size={15} /> Marcar como Enviado
                            </button>
                          )}

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

                      {/* Checklist dos itens: Círculo grande + Qtd - SKU com tamanho de fonte dinâmico */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: fontStyles.gap }}>
                        {plan.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px',
                              padding: fontStyles.padding,
                              borderRadius: '12px',
                              background: item.completed ? '#f0fdf4' : 'transparent',
                              border: item.completed ? '1px solid #bbf7d0' : '1px solid transparent',
                              boxShadow: item.completed ? '0 2px 6px rgba(34, 197, 94, 0.06)' : 'none',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <div
                              onClick={() => handleToggleItemComplete(plan.id, item.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: fontStyles.gap,
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              {/* Círculo Checklist Estilo Foto do Usuário */}
                              <div
                                className={`custom-big-circle print-circle ${item.completed ? 'checked' : ''}`}
                                title="Clique para marcar / desmarcar"
                              >
                                {item.completed && <Check size={fontStyles.checkIconSize} strokeWidth={3.5} />}
                              </div>

                              {/* Qtd - SKU com tamanho ajustável */}
                              <div style={{
                                fontSize: fontStyles.itemFontSize,
                                fontWeight: item.completed ? '700' : '800',
                                color: item.completed ? '#15803d' : '#0f172a',
                                opacity: item.completed ? 0.9 : 1,
                                letterSpacing: '-0.2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}>
                                <span>{item.quantity} - {item.sku}</span>
                                {item.completed && (
                                  <span
                                    className="no-print"
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#dcfce7',
                                      color: '#16a34a',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Check size={11} strokeWidth={3} /> Pronto
                                  </span>
                                )}
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
        )}

        {/* ============================================================ */}
        {/* ABA 2: ENVIADO (Lista simples dos envios concluídos com filtros) */}
        {/* ============================================================ */}
        {activeFullTab === 'enviado' && (
          <div className="no-print">
            {/* Barra de Filtros da Aba Enviado: Busca, Filtro de Período e Ordenação */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Busca de Envios */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                minWidth: '240px',
                flex: '1 1 240px'
              }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  placeholder="Buscar plataforma, data ou SKU..."
                  value={sentSearchTerm}
                  onChange={(e) => setSentSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    fontWeight: '600'
                  }}
                />
                {sentSearchTerm && (
                  <button
                    onClick={() => setSentSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Controles de Período e Ordenação */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Seletor de Período */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} color="#64748b" />
                  <select
                    value={sentPeriodFilter}
                    onChange={(e) => setSentPeriodFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#334155',
                      background: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Todo o período</option>
                    <option value="today">Hoje</option>
                    <option value="week">Últimos 7 dias</option>
                    <option value="month">Este Mês</option>
                    <option value="custom">Data Personalizada</option>
                  </select>
                </div>

                {/* Datas personalizadas se selecionado 'custom' */}
                {sentPeriodFilter === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="date"
                      value={sentStartDate}
                      onChange={(e) => setSentStartDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#334155'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>até</span>
                    <input
                      type="date"
                      value={sentEndDate}
                      onChange={(e) => setSentEndDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#334155'
                      }}
                    />
                  </div>
                )}

                {/* Alternador de Ordenação (Mais Recentes vs Mais Antigos) */}
                <button
                  type="button"
                  onClick={() => setSentSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title="Clique para alternar ordem de exibição"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowUpDown size={14} />
                  <span>{sentSortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}</span>
                </button>
              </div>
            </div>

            {/* Lista Simples de Envios Já Feitos */}
            {enviadoPlannings.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <Send size={44} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', margin: '0 0 6px 0' }}>
                  Nenhum Envio Registrado
                </h3>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  Quando concluir a checagem dos itens na aba <b>Embalar</b>, clique no botão <b>"Marcar como Enviado"</b> para arquivar os envios aqui.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {enviadoPlannings.map((plan) => {
                  const platColor = getPlatformColor(plan.platformId, plan.platformName);
                  const totalUnits = (plan.items || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
                  const sentDateDisplay = plan.sentAt
                    ? new Date(plan.sentAt).toLocaleDateString('pt-BR')
                    : (plan.date || '-');

                  return (
                    <div
                      key={plan.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        border: '1.5px solid #e2e8f0',
                        padding: '18px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '900',
                            color: '#0f172a'
                          }}>
                            {plan.date} -
                          </span>

                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: '800',
                              padding: '3px 12px',
                              borderRadius: '6px',
                              backgroundColor: platColor,
                              color: '#ffffff'
                            }}
                          >
                            {plan.platformName}
                          </span>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#15803d',
                            background: '#dcfce7',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={13} />
                            Enviado ({totalUnits} unidades)
                          </span>

                          {plan.sentAt && (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Enviado em: <b>{new Date(plan.sentAt).toLocaleDateString('pt-BR')} {new Date(plan.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</b>
                            </span>
                          )}
                        </div>

                        {/* Botões de Ação na Aba Enviados: Retornar para Embalar ou Excluir */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleSetPlanningStatus(plan.id, 'embalar')}
                            title="Mover este envio de volta para a aba Embalar"
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RotateCcw size={13} /> Voltar para Embalar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePlanning(plan.id)}
                            title="Excluir este envio do histórico"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Lista resumida e limpa de itens enviados */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {plan.items.map((it, idx) => (
                          <span
                            key={it.id || idx}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155'
                            }}
                          >
                            <b>{it.quantity}x</b> {it.sku}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
