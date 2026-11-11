import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';

// Helper de formatação de moeda R$ xx,yy
function formatCurrencyInput(val) {
  const digits = String(val || '').replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Retorna data formatada dd/mm
function getTodayFormatted() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

// Os 6 tipos solicitados pelo usuário com os ícones fiéis
export const ANNOTATION_TYPES = [
  {
    id: 'entrega_local',
    label: 'Entrega Local',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    )
  },
  {
    id: 'retirada_fabrica',
    label: 'Retirada Fábrica',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <rect x="3" y="16" width="4" height="4" rx="1" />
        <rect x="17" y="16" width="4" height="4" rx="1" />
      </svg>
    )
  },
  {
    id: 'entrega_direta',
    label: 'Entrega Direta',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
        <path d="m7 17-4 2" />
        <path d="m5 13-2 1" />
      </svg>
    )
  },
  {
    id: 'gasto_pontual',
    label: 'Gasto Pontual',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    id: 'prejuizo',
    label: 'Prejuízo',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="m16.24 16.24 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="m4.93 19.07 2.83-2.83" />
        <path d="m16.24 7.76 2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  },
  {
    id: 'anotacao',
    label: 'Anotação',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
        <path d="m18 14-6 6" />
      </svg>
    )
  }
];

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
  
  // Filtros
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Ordenação: 'desc' (mais recentes / último adicionado primeiro) ou 'asc' (primeiro adicionado / mais antigos primeiro)
  const [sortOrder, setSortOrder] = useState('desc');

  // ID do item em edição inline
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Input oculto para o calendário na edição de linha
  const dateInputEditRef = useRef(null);

  // Lista dinâmica de usuários (Allyson, Jeremias, João, etc)
  const availableUserNames = useMemo(() => {
    const list = (users || []).map(u => u.name).filter(Boolean);
    if (!list.includes('Allyson')) list.unshift('Allyson');
    if (!list.includes('Jeremias')) list.push('Jeremias');
    if (currentUser?.name && !list.includes(currentUser.name)) list.push(currentUser.name);
    return Array.from(new Set(list));
  }, [users, currentUser]);

  // Lista dinâmica de plataformas unificadas (Shopee JBC, Shopee Izabela, Mercado Livre, etc)
  const allPlatformNames = useMemo(() => {
    const namesSet = new Set();
    
    // Plataformas dos usuários cadastrados
    (users || []).forEach(u => {
      if (Array.isArray(u.platforms)) {
        u.platforms.forEach(p => {
          const n = typeof p === 'string' ? p : (p?.name || p?.label);
          if (n && n.trim()) namesSet.add(n.trim());
        });
      }
    });

    // Plataformas globais
    (platforms || []).forEach(p => {
      const n = typeof p === 'string' ? p : (p?.name || p?.label);
      if (n && n.trim()) namesSet.add(n.trim());
    });

    // Anotações existentes
    annotations.forEach(a => {
      if (a.platform && a.platform.trim()) namesSet.add(a.platform.trim());
    });

    // Padrões do sistema JBC Eletro
    const defaults = ['Shopee JBC', 'Shopee Izabela', 'Mercado Livre', 'Amazon', 'Magalu', 'Shein'];
    defaults.forEach(d => namesSet.add(d));

    return Array.from(namesSet);
  }, [users, platforms, annotations]);

  // Lista de meses disponíveis para filtrar
  const availableMonths = useMemo(() => {
    return [
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
  }, []);

  // Botão "Nova Anotação": adiciona linha direto na tabela e já entra em modo de edição
  const handleAddNewRow = async () => {
    // Próximo ID sequencial de 4 dígitos: 0001, 0002...
    let maxId = 0;
    annotations.forEach(a => {
      const num = parseInt(String(a.id || '').replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    const newId = String(maxId + 1).padStart(4, '0');

    const today = getTodayFormatted();
    const defaultPlat = allPlatformNames[0] || 'Shopee JBC';
    const defaultType = 'Entrega Local';
    const defaultUser = currentUser?.name || availableUserNames[0] || 'Allyson';

    const newRow = {
      id: newId,
      date: today,
      type: defaultType,
      platform: defaultPlat,
      orderNumber: '',
      value: '',
      notes: '',
      usuario: defaultUser
    };

    // Salva local e na planilha imediatamente
    if (onAddAnnotation) {
      await onAddAnnotation(newRow);
    }

    // Já inicia editando diretamente na linha adicionada
    setEditingId(newId);
    setEditForm({ ...newRow });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      id: item.id,
      date: item.date || getTodayFormatted(),
      type: item.type || item.tipo || 'Anotação',
      platform: item.platform || allPlatformNames[0] || 'Shopee JBC',
      orderNumber: item.orderNumber || item.pedido || '',
      value: item.value || item.valor || '',
      notes: item.notes || item.observacao || item.obs || '',
      usuario: item.usuario || currentUser?.name || 'Allyson'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (onUpdateAnnotation) {
      await onUpdateAnnotation(editingId, editForm);
    }
    setEditingId(null);
  };

  const handleDuplicate = async (item) => {
    let maxId = 0;
    annotations.forEach(a => {
      const num = parseInt(String(a.id || '').replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    const newId = String(maxId + 1).padStart(4, '0');

    const duplicated = {
      ...item,
      id: newId,
      date: getTodayFormatted(),
      usuario: currentUser?.name || item.usuario || 'Allyson'
    };
    if (onAddAnnotation) {
      await onAddAnnotation(duplicated);
    }
  };

  const handleDelete = (id, orderOrNotes) => {
    if (window.confirm(`Deseja excluir permanentemente a anotação ${id ? `#${id}` : ''}?`)) {
      if (onDeleteAnnotation) {
        onDeleteAnnotation(id);
      }
      if (editingId === id) setEditingId(null);
    }
  };

  // Máscara dd/mm para digitação
  const handleDateMask = (val) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + '/' + clean.slice(2, 4);
    }
    setEditForm(prev => ({ ...prev, date: clean }));
  };

  // Filtragem completa: Busca textual, Plataforma, Tipo, Mês e Período com calendário
  const filteredList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const knownPlatformsList = [
      'shopee jbc', 'shopee izabela', 'shopee principal', 'shopee oficial', 'shopee',
      'mercado livre jbc', 'mercado livre', 'mercado l', 'amazon jbc', 'amazon',
      'magalu jbc', 'magalu', 'shein jbc', 'shein', 'geral / outros', 'geral', 'outros'
    ];

    return annotations.map(item => {
      // Normaliza id para formato 0001
      const rawNum = parseInt(String(item.id || '').replace(/\D/g, ''), 10);
      const formattedId = !isNaN(rawNum) && rawNum > 0 ? String(rawNum).padStart(4, '0') : item.id;

      let plat = item.platform || '';
      let val = item.value || item.valor || '';
      let usr = item.usuario || '';

      // Defensiva contra inversão antiga caso a planilha ainda não tenha sido rodada:
      // Se val contém nome de plataforma e plat está vazio
      if (!plat && val && knownPlatformsList.some(kp => String(val).toLowerCase().includes(kp))) {
        plat = val;
        val = '';
      }
      // Se usr contém R$ e val está vazio ou não tem R$
      if (usr && (String(usr).includes('R$') || (val === '' && /\d+,\d{2}/.test(String(usr))))) {
        if (!val || !String(val).includes('R$')) {
          val = usr;
        }
        usr = 'Allyson';
      }

      return {
        ...item,
        formattedId,
        platform: plat,
        value: val,
        valor: val,
        usuario: usr || 'Allyson'
      };
    }).filter(item => {
      // 1. Busca textual
      const matchSearch = (
        (item.formattedId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.orderNumber || item.pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || item.observacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type || item.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.value || item.valor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.usuario || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;

      // 2. Filtro de Plataforma
      if (platformFilter !== 'all') {
        const p1 = String(item.platform || '').trim().toLowerCase();
        const p2 = String(platformFilter).trim().toLowerCase();
        if (p1 !== p2) return false;
      }

      // 3. Filtro de Tipo
      if (typeFilter !== 'all') {
        const t1 = String(item.type || item.tipo || '').trim().toLowerCase();
        const t2 = String(typeFilter).trim().toLowerCase();
        if (t1 !== t2) return false;
      }

      // Converte data dd/mm para objeto Date comparável
      const itemDateStr = String(item.date || '').trim();
      let itemMonth = '';
      let itemDateObj = null;

      if (itemDateStr.includes('/')) {
        const parts = itemDateStr.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(day) && !isNaN(month)) {
          itemMonth = String(month).padStart(2, '0');
          itemDateObj = new Date(currentYear, month - 1, day);
        }
      }

      // 4. Filtro por Mês
      if (monthFilter !== 'all') {
        if (itemMonth !== monthFilter) return false;
      }

      // 5. Filtro por Período de Data (Início / Fim)
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
    }).sort((a, b) => {
      // Ordenação: 'desc' = do último ao primeiro (maior ID / mais novo no topo)
      //            'asc'  = do primeiro ao último (menor ID / mais antigo no topo)
      const numA = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 0;

      // Se ambos têm IDs numéricos válidos
      if (numA && numB && numA !== numB) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      // Fallback para comparação por data (dd/mm)
      const parseDate = (dStr) => {
        if (!dStr || !dStr.includes('/')) return 0;
        const [d, m] = dStr.split('/').map(Number);
        return (m || 0) * 100 + (d || 0);
      };
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (dateA !== dateB) {
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      return 0;
    });
  }, [annotations, searchTerm, platformFilter, typeFilter, monthFilter, startDate, endDate, sortOrder]);

  // Cálculo do Valor Total de todas as linhas filtradas
  const totalFilteredValue = useMemo(() => {
    return filteredList.reduce((acc, item) => {
      if (!item.valor) return acc;
      const clean = String(item.valor)
        .replace(/[^0-9,-]/g, '')
        .replace(',', '.');
      const n = parseFloat(clean);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
  }, [filteredList]);

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setPlatformFilter('all');
    setTypeFilter('all');
    setMonthFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Helper para renderizar o ícone e estilo do Tipo
  const getTypeObj = (typeLabel) => {
    const found = ANNOTATION_TYPES.find(t => t.label.toLowerCase() === String(typeLabel || '').toLowerCase());
    return found || ANNOTATION_TYPES[5]; // Anotação default
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Título simples em Roxo no canto superior esquerdo */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: '900',
          color: '#6d28d9',
          letterSpacing: '-0.5px',
          margin: 0
        }}>
          Anotação
        </h1>
      </div>

      {/* Barra de Filtros e Busca Completa: Plataforma, Tipo, Mês e Período por Calendário */}
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
        {/* Campo de Busca Textual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '200px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            padding: '8px 12px',
            width: '100%'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar por ID, pedido, valor, usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: '#1e293b'
              }}
            />
            {searchTerm && (
              <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
            )}
          </div>
        </div>

        {/* Filtros lado a lado */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* 1. Filtro de Plataforma */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Plataforma:</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12px',
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
          </div>

          {/* 2. Filtro de Tipo (os 6 tipos de anotação) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Tipo:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todos os Tipos</option>
              {ANNOTATION_TYPES.map(t => (
                <option key={t.id} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* 3. Filtro por Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Mês:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{
                padding: '7px 10px',
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

          {/* 4. Filtro por Período de Data com Calendário */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1.5px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            Limpar Filtro
          </button>

          {/* Botão de Ordenação: Do Último ao Primeiro / Do Primeiro ao Último */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title={sortOrder === 'desc' ? 'Ordenado: Do último ao primeiro (clique para inverter)' : 'Ordenado: Do primeiro ao último (clique para inverter)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              background: sortOrder === 'desc' ? '#f5f3ff' : '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              color: sortOrder === 'desc' ? '#6d28d9' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <ArrowUpDown size={14} color={sortOrder === 'desc' ? '#6d28d9' : '#64748b'} />
            <span>{sortOrder === 'desc' ? 'Último ao Primeiro' : 'Primeiro ao Último'}</span>
          </button>

          {/* Valor Total de todas as linhas filtradas */}
          <div style={{
            fontSize: '14px',
            fontWeight: '800',
            color: '#0f172a',
            padding: '4px 8px',
            whiteSpace: 'nowrap'
          }}>
            Total: <span style={{ color: '#16a34a' }}>{totalFilteredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>

          {/* Botão circular roxo com ícone de + */}
          <button
            type="button"
            onClick={handleAddNewRow}
            title="Adicionar Linha"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(139, 92, 246, 0.35)',
              transition: 'transform 0.15s ease, background 0.15s ease',
              flexShrink: 0,
              marginLeft: '4px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#7c3aed'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#8b5cf6'; }}
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Tabela Interativa de Anotações com as colunas EXATAS:
          DATA | TIPO | PLATAFORMA | PEDIDO | VALOR | OBSERVAÇÃO | USUÁRIO | AÇÕES */}
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
                <th
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title="Clique para alternar a ordenação (Último ao primeiro / Primeiro ao último)"
                  style={{
                    padding: '14px 16px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>DATA</span>
                    <ArrowUpDown size={13} color="#8b5cf6" />
                  </div>
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TIPO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PLATAFORMA
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PEDIDO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  VALOR
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  OBSERVAÇÃO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  USUÁRIO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '36px' }}>📋</span>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#334155', margin: 0 }}>
                        Nenhuma anotação encontrada
                      </h4>
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        Clique em "Nova Anotação" acima para adicionar uma linha e editar direto aqui.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isEditing = editingId === item.id;
                  const typeObj = getTypeObj(item.type || item.tipo);

                  // Linha em modo de edição direta
                  if (isEditing) {
                    return (
                      <tr key={item.id} style={{ background: '#fdf4ff', borderBottom: '1px solid #f0abfc' }}>
                        {/* 1. Data com input dd/mm + botão de calendário */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={editForm.date}
                              maxLength={5}
                              placeholder="dd/mm"
                              onChange={(e) => handleDateMask(e.target.value)}
                              style={{
                                width: '56px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1.5px solid #a855f7',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#334155',
                                textAlign: 'center',
                                outline: 'none'
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
                                    setEditForm(prev => ({ ...prev, date: `${day}/${month}` }));
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

                        {/* 2. Tipo (Seletor com os 6 tipos oficiais) */}
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={editForm.type}
                            onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              background: '#ffffff',
                              outline: 'none'
                            }}
                          >
                            {ANNOTATION_TYPES.map(t => (
                              <option key={t.id} value={t.label}>{t.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* 3. Plataforma (Shopee JBC, Shopee Izabela...) */}
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={editForm.platform}
                            onChange={(e) => setEditForm(prev => ({ ...prev, platform: e.target.value }))}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              background: '#ffffff',
                              outline: 'none'
                            }}
                          >
                            {allPlatformNames.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>

                        {/* 4. Pedido */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            placeholder="Ex: 261104..."
                            value={editForm.orderNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              outline: 'none'
                            }}
                          />
                        </td>

                        {/* 5. Valor com formatação de moeda R$ xx,yy */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            placeholder="R$ 0,00"
                            value={editForm.value}
                            onChange={(e) => setEditForm(prev => ({ ...prev, value: formatCurrencyInput(e.target.value) }))}
                            style={{
                              width: '90px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              outline: 'none'
                            }}
                          />
                        </td>

                        {/* 6. Observação */}
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            placeholder="Observação..."
                            value={editForm.notes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              outline: 'none'
                            }}
                          />
                        </td>

                        {/* 7. Usuário */}
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={editForm.usuario}
                            onChange={(e) => setEditForm(prev => ({ ...prev, usuario: e.target.value }))}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #a855f7',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              background: '#ffffff',
                              outline: 'none'
                            }}
                          >
                            {availableUserNames.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>

                        {/* 8. Ações: Salvar / Cancelar */}
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

                  // Linha normal: mesma fonte e cor simples da coluna Data (#334155, 13px, 700)
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
                      {/* Data: dd/mm */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                        {item.date || '-'}
                      </td>

                      {/* Tipo: Entrega Local, Retirada Fábrica, Entrega Direta, Gasto Pontual, Prejuízo, Anotação */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: typeObj.bg,
                            color: typeObj.color,
                            border: `1px solid ${typeObj.border}`
                          }}>
                            {typeObj.svg}
                          </span>
                          <span>{item.type || item.tipo || 'Anotação'}</span>
                        </div>
                      </td>

                      {/* Plataforma: Shopee JBC, Shopee Izabela... */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                        {item.platform || '-'}
                      </td>

                      {/* Pedido */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                        {item.orderNumber || item.pedido || '-'}
                      </td>

                      {/* Valor: R$ xx,yy */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                        {item.value || item.valor || '-'}
                      </td>

                      {/* Observação */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', maxWidth: '300px', wordBreak: 'break-word' }}>
                        {item.notes || item.observacao || '-'}
                      </td>

                      {/* Usuário: Allyson, Jeremias, etc */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                        {item.usuario || 'Allyson'}
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
                            title="Editar diretamente nesta linha"
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
                            onClick={() => handleDelete(item.id, item.orderNumber || item.notes)}
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
    </div>
  );
}
