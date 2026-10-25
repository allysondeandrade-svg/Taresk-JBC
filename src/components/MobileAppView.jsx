import React, { useState } from 'react';
import { Eye, Copy, Edit2, Trash2, CheckCircle2, User, Plus, RefreshCw, X, Check, Search, Package, DollarSign, Settings } from 'lucide-react';

// Helper para formatar dd/mm
function formatDueDateDisplay(val) {
  if (!val) return '25/10';
  const str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    const [d, m] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }
  return str;
}

export default function MobileAppView({
  tasks,
  completedTasks = [],
  users,
  platforms = [],
  currentUser,
  products,
  onOpenChecklistModal,
  onToggleMarketplace,
  onOpenNewTaskModal,
  onFinishTask,
  onToggleChecklistItem,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onLogout,
  onChangeCurrentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenSettings,
  onSync,
  isSyncing,
  appTheme,
  onSwitchToDesktop
}) {
  const isDark = appTheme === 'dark';
  // Abas do topo: 'tarefas', 'cadastro', 'precificadora'
  const [activeMainTab, setActiveMainTab] = useState('tarefas');
  // Sub-abas de tarefas: 'atuais' ou 'concluidas'
  const [taskSubTab, setTaskSubTab] = useState('atuais');
  // Filtro de usuário opcional
  const [selectedUserFilter, setSelectedUserFilter] = useState(
    currentUser?.role === 'premium_admin' ? 'all' : currentUser?.id || 'all'
  );

  // Estados da página de Cadastro de Produtos no Mobile
  const [productSearchMobile, setProductSearchMobile] = useState('');
  const [isAddingProductMobile, setIsAddingProductMobile] = useState(false);
  const [newProdMobile, setNewProdMobile] = useState({
    sku: '',
    title: '',
    cost: '',
    width: '',
    length: '',
    height: '',
    weight: ''
  });
  const [editingProductIdMobile, setEditingProductIdMobile] = useState(null);
  const [editingProdFormMobile, setEditingProdFormMobile] = useState({});

  // Edição rápida de tarefa no mobile
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Helper de responsável com resolução inteligente de nomes humanos
  function getAssignee(userId) {
    if (!userId) return { id: null, name: 'Colaborador', avatar: '👤' };
    const norm = (s) => String(s || '').toLowerCase().trim();
    const target = norm(userId);
    const parsedTargetNum = parseInt(target, 10);

    const found = users.find(u => {
      const uId = norm(u.id);
      const uName = norm(u.name);
      const uEmail = norm(u.email);
      if (uId === target || uName === target || uEmail === target) return true;
      if (!isNaN(parsedTargetNum) && parseInt(uId, 10) === parsedTargetNum) return true;
      if (uName && (target.includes(uName) || uName.includes(target))) return true;
      if (uEmail && (target.includes(uEmail.replace(/[@.]/g, '_')) || target.includes(norm(uEmail)))) return true;
      return false;
    });

    if (found) return found;

    // Se o backend gravou o ID técnico como 'user_master', trata como Administrador / JBC Eletro
    if (target === 'user_master' || target.includes('master') || target.includes('admin')) {
      const adminUser = users.find(u => u.role === 'premium_admin' || norm(u.name).includes('admin') || norm(u.name).includes('jbc'));
      return adminUser || { id: userId, name: 'JBC Eletro (Admin)', avatar: '⚡' };
    }

    // Se o ID for baseado em e-mail (ex: user_jeremiaseltroltda_40gmail_com), extrai um nome legível
    if (target.startsWith('user_')) {
      let clean = target.replace(/^user_/, '').replace(/_40gmail.*$/i, '').replace(/_40.*$/i, '').replace(/@.*$/, '');
      clean = clean.replace(/_+/g, ' ').trim();
      // Capitaliza a primeira letra de cada palavra
      const formattedName = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (formattedName) {
        // Tenta achar na lista de usuários pelo nome aproximado
        const approxUser = users.find(u => norm(u.name).includes(norm(formattedName)) || norm(formattedName).includes(norm(u.name)));
        if (approxUser) return approxUser;
        return { id: userId, name: formattedName, avatar: '👤' };
      }
    }

    return { id: null, name: String(userId), avatar: '👤' };
  }

  // Helper de plataformas atribuídas
  function getTaskPlatforms(task) {
    const assignee = getAssignee(task.assignedTo);
    if (assignee && assignee.platforms && assignee.platforms.length > 0) {
      return assignee.platforms;
    }
    if (task.marketplaces && Object.keys(task.marketplaces).length > 0) {
      const keys = Object.keys(task.marketplaces);
      const matched = [];
      keys.forEach(k => {
        const item = task.marketplaces[k];
        const plat = platforms.find(p => p.id === k || p.name.toLowerCase() === k.toLowerCase());
        matched.push({
          id: k,
          name: item?.name || plat?.name || k,
          color: item?.color || plat?.color || '#5925dc'
        });
      });
      if (matched.length > 0) return matched;
    }
    if (platforms && platforms.length > 0) {
      return platforms.slice(0, 4);
    }
    return [
      { id: 'shopee', name: 'Shopee', color: '#f97316' },
      { id: 'mercadoLivre', name: 'Mercado Livre', color: '#facc15' },
      { id: 'amazon', name: 'Amazon', color: '#334155' },
      { id: 'magalu', name: 'Magalu', color: '#38bdf8' }
    ];
  }

  // Progresso da tarefa
  function calculateTaskProgress(task) {
    if (task.type === 'special' || task.type === 'simple') {
      if (!task.checklist || task.checklist.length === 0) return 0;
      const completed = task.checklist.filter(c => c.completed).length;
      return Math.round((completed / task.checklist.length) * 100);
    }

    const taskPlats = getTaskPlatforms(task);

    const totalChecks = task.checklist?.length || 0;
    const doneChecks = task.checklist?.filter(c => c.completed).length || 0;
    const photoProgress = totalChecks > 0 ? (doneChecks / totalChecks) * 40 : 0;

    const totalButtons = Math.max(taskPlats.length * 2, 2);
    const mp = task.marketplaces || {};
    let mpButtonsCount = 0;

    taskPlats.forEach(plat => {
      const channel = mp[plat.id] || mp[plat.name] || mp[plat.name.toLowerCase()] || mp[plat.name.replace(/\s+/g, '')];
      if (channel) {
        if (channel.u) mpButtonsCount++;
        if (channel.o) mpButtonsCount++;
        if (channel.active && !channel.u && !channel.o) mpButtonsCount += 2;
      }
    });

    const mpProgress = (mpButtonsCount / totalButtons) * 60;
    return Math.round(photoProgress + mpProgress);
  }

  // Filtragem de tarefas
  const currentList = taskSubTab === 'atuais' ? tasks : completedTasks;
  const filteredTasks = currentList.filter(task => {
    if (selectedUserFilter !== 'all') {
      const norm = (s) => String(s || '').toLowerCase().trim();
      const target = norm(selectedUserFilter);
      const isDirect = norm(task.assignedTo) === target || norm(task.assignedByName) === target;
      if (!isDirect) return false;
    }
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      maxWidth: '520px',
      margin: '0 auto',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#1e293b',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }} className={isDark ? 'dark-mode' : ''}>
      {/* 0. Barra superior compacta mobile com utilitários */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 6px 14px',
        borderBottom: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
        fontSize: '12px',
        color: isDark ? '#94a3b8' : '#64748b',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #6c5ce7 0%, #4834d4 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '12px'
          }}>
            T
          </div>
          <span style={{ fontWeight: '800', color: isDark ? '#f8fafc' : '#1e293b', fontSize: '13px' }}>Taresk Mobile</span>
          {isSyncing && <RefreshCw size={12} className="animate-spin" color="#8b5cf6" />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onSync && (
            <button
              onClick={() => onSync(true)}
              title="Sincronizar Planilha"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#334155',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={11} /> Planilha
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Configurações"
              style={{
                background: isDark ? '#1e293b' : '#f8fafc',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 7px',
                color: isDark ? '#cbd5e1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Settings size={15} />
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              Sair
            </button>
          )}
        </div>
      </div>

      {/* 1. TOPO: Três abas principais como no print [ Tarefas ] [ Cadastro ] [ Precificadora ] */}
      <div style={{
        padding: '12px 14px 8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={() => setActiveMainTab('tarefas')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: activeMainTab === 'tarefas' ? '1.5px solid #d8b4fe' : 'none',
            background: activeMainTab === 'tarefas' ? '#f3e8ff' : 'transparent',
            color: activeMainTab === 'tarefas' ? '#6b21a8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Tarefas
        </button>

        <button
          onClick={() => setActiveMainTab('cadastro')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: activeMainTab === 'cadastro' ? '1.5px solid #d8b4fe' : 'none',
            background: activeMainTab === 'cadastro' ? '#f3e8ff' : 'transparent',
            color: activeMainTab === 'cadastro' ? '#6b21a8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Cadastro
        </button>

        <button
          onClick={() => setActiveMainTab('precificadora')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: activeMainTab === 'precificadora' ? '1.5px solid #d8b4fe' : 'none',
            background: activeMainTab === 'precificadora' ? '#f3e8ff' : 'transparent',
            color: activeMainTab === 'precificadora' ? '#6b21a8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Precificadora
        </button>
      </div>

      {/* ABA CADASTRO: APENAS PRODUTOS RESPONSIVO (LINHA ÚNICA SEM QUEBRA, SEM ÍCONES DE PLATAFORMAS) */}
      {activeMainTab === 'cadastro' && (
        <div style={{
          padding: '0 12px 60px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          {/* Topo do Cadastro: Busca e Botão + Novo Produto */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '4px'
          }}>
            {/* Barra de Busca de Produtos */}
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Buscar SKU ou Produto..."
                value={productSearchMobile}
                onChange={(e) => setProductSearchMobile(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '9999px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#1e293b',
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {productSearchMobile && (
                <button
                  type="button"
                  onClick={() => setProductSearchMobile('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botão + Novo Produto */}
            <button
              onClick={() => setIsAddingProductMobile(!isAddingProductMobile)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #6c5ce7 0%, #4834d4 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(108, 92, 231, 0.35)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {isAddingProductMobile ? <X size={15} /> : <Plus size={15} />}
              <span>{isAddingProductMobile ? 'Fechar' : 'Novo'}</span>
            </button>
          </div>

          {/* Formulário de Adicionar Novo Produto (Mobile) */}
          {isAddingProductMobile && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProdMobile.sku.trim()) {
                  alert('Preencha o SKU do produto.');
                  return;
                }
                if (onAddProduct) {
                  onAddProduct({
                    id: 'prod_' + Date.now(),
                    sku: newProdMobile.sku.toUpperCase().trim(),
                    title: newProdMobile.title.trim() || newProdMobile.sku.toUpperCase().trim(),
                    cost: parseFloat(newProdMobile.cost) || 0,
                    width: parseFloat(newProdMobile.width) || 0,
                    length: parseFloat(newProdMobile.length) || 0,
                    height: parseFloat(newProdMobile.height) || 0,
                    weight: parseFloat(newProdMobile.weight) || 0
                  });
                }
                setNewProdMobile({ sku: '', title: '', cost: '', width: '', length: '', height: '', weight: '' });
                setIsAddingProductMobile(false);
              }}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#5925dc' }}>+ Cadastrar Produto</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Preencha os dados</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>SKU *</label>
                  <input
                    type="text"
                    placeholder="Ex: FOG-02-BOC"
                    value={newProdMobile.sku}
                    onChange={(e) => setNewProdMobile({ ...newProdMobile, sku: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newProdMobile.cost}
                    onChange={(e) => setNewProdMobile({ ...newProdMobile, cost: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Nome / Descrição do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Fogão 2 Bocas Alta Pressão Inox"
                  value={newProdMobile.title}
                  onChange={(e) => setNewProdMobile({ ...newProdMobile, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: '500',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Larg (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={newProdMobile.width}
                    onChange={(e) => setNewProdMobile({ ...newProdMobile, width: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Comp (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={newProdMobile.length}
                    onChange={(e) => setNewProdMobile({ ...newProdMobile, length: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Alt (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={newProdMobile.height}
                    onChange={(e) => setNewProdMobile({ ...newProdMobile, height: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newProdMobile.weight}
                    onChange={(e) => setNewProdMobile({ ...newProdMobile, weight: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingProductMobile(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          )}

          {/* Contador de produtos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
              Catálogo de Produtos ({products ? products.length : 0})
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Role para o lado para ver dimensões ➡️
            </span>
          </div>

          {/* TABELA / LISTA RESPONSIVA EM LINHA ÚNICA (SEM QUEBRA DE LINHA, SEM ÍCONES DE PLATAFORMAS) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <table style={{
              width: '100%',
              minWidth: '680px',
              borderCollapse: 'collapse',
              fontSize: '12px',
              textAlign: 'left',
              whiteSpace: 'nowrap'
            }}>
              <thead>
                <tr style={{
                  background: '#f8fafc',
                  borderBottom: '1.5px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: '800',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '10px 12px', width: '130px' }}>SKU</th>
                  <th style={{ padding: '10px 12px', minWidth: '180px' }}>Produto</th>
                  <th style={{ padding: '10px 12px', width: '90px', textAlign: 'right' }}>Custo</th>
                  <th style={{ padding: '10px 12px', width: '70px', textAlign: 'center' }}>Larg</th>
                  <th style={{ padding: '10px 12px', width: '70px', textAlign: 'center' }}>Comp</th>
                  <th style={{ padding: '10px 12px', width: '70px', textAlign: 'center' }}>Alt</th>
                  <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>Peso</th>
                  <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(!products || products.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      Nenhum produto cadastrado no sistema.
                    </td>
                  </tr>
                ) : (
                  products
                    .filter(p => {
                      if (!productSearchMobile) return true;
                      const q = productSearchMobile.toLowerCase();
                      return (p.sku && p.sku.toLowerCase().includes(q)) || (p.title && p.title.toLowerCase().includes(q));
                    })
                    .map((prod) => {
                      const isEditing = editingProductIdMobile === prod.id;

                      if (isEditing) {
                        return (
                          <tr key={prod.id} style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="text"
                                value={editingProdFormMobile.sku || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, sku: e.target.value })}
                                style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px', fontWeight: '700' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="text"
                                value={editingProdFormMobile.title || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, title: e.target.value })}
                                style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={editingProdFormMobile.cost || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, cost: e.target.value })}
                                style={{ width: '70px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px', textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                step="0.1"
                                value={editingProdFormMobile.width || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, width: e.target.value })}
                                style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                step="0.1"
                                value={editingProdFormMobile.length || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, length: e.target.value })}
                                style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                step="0.1"
                                value={editingProdFormMobile.height || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, height: e.target.value })}
                                style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={editingProdFormMobile.weight || ''}
                                onChange={(e) => setEditingProdFormMobile({ ...editingProdFormMobile, weight: e.target.value })}
                                style={{ width: '60px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #7c3aed', fontSize: '11px', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateProduct) {
                                      onUpdateProduct(prod.id, {
                                        sku: (editingProdFormMobile.sku || prod.sku).toUpperCase().trim(),
                                        title: (editingProdFormMobile.title || prod.title).trim(),
                                        cost: parseFloat(editingProdFormMobile.cost) || 0,
                                        width: parseFloat(editingProdFormMobile.width) || 0,
                                        length: parseFloat(editingProdFormMobile.length) || 0,
                                        height: parseFloat(editingProdFormMobile.height) || 0,
                                        weight: parseFloat(editingProdFormMobile.weight) || 0
                                      });
                                    }
                                    setEditingProductIdMobile(null);
                                  }}
                                  title="Salvar"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductIdMobile(null)}
                                  title="Cancelar"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={prod.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* SKU */}
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: '700',
                              color: '#6b21a8',
                              background: '#f3e8ff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              display: 'inline-block'
                            }}>
                              {prod.sku}
                            </span>
                          </td>

                          {/* Produto / Título */}
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>
                            {prod.title}
                          </td>

                          {/* Custo */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                            R$ {Number(prod.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Largura */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                            {prod.width || 0} cm
                          </td>

                          {/* Comprimento */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                            {prod.length || 0} cm
                          </td>

                          {/* Altura */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                            {prod.height || 0} cm
                          </td>

                          {/* Peso */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                            {prod.weight || 0} kg
                          </td>

                          {/* Ações (Editar / Excluir) */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProductIdMobile(prod.id);
                                  setEditingProdFormMobile({ ...prod });
                                }}
                                title="Editar Produto"
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Excluir o produto "${prod.sku}"?`)) {
                                    if (onDeleteProduct) onDeleteProduct(prod.id);
                                  }
                                }}
                                title="Excluir Produto"
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  border: '1px solid #fecaca',
                                  background: '#fef2f2',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={12} />
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
      )}

      {/* ABA PRECIFICAÇÃO */}
      {activeMainTab === 'precificadora' && (
        <div style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>
            🏷️
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            Calculadora de Preço
          </h3>
          <p style={{ fontSize: '13px', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto 16px auto' }}>
            Acesse a calculadora completa de margem e markup no computador.
          </p>
          {onSwitchToDesktop && (
            <button
              onClick={onSwitchToDesktop}
              style={{
                padding: '10px 20px',
                borderRadius: '9999px',
                background: '#5925dc',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Abrir no Desktop
            </button>
          )}
        </div>
      )}

      {/* ABA TAREFAS */}
      {activeMainTab === 'tarefas' && (
        <div style={{
          padding: '0 12px 60px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          {/* 2. SUB-ABAS: [ Atuais (X) | Concluídas ] + Botão [ + Nova Tarefa ] */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '2px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Cápsula de Atuais / Concluídas */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                onClick={() => setTaskSubTab('atuais')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: taskSubTab === 'atuais' ? '#ffffff' : 'transparent',
                  color: taskSubTab === 'atuais' ? '#6b21a8' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxShadow: taskSubTab === 'atuais' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <span>Atuais</span>
                <span style={{
                  background: taskSubTab === 'atuais' ? '#6b21a8' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '800',
                  borderRadius: '9999px',
                  padding: '1px 6px',
                  lineHeight: '1.2'
                }}>
                  {tasks.length}
                </span>
              </button>

              <button
                onClick={() => setTaskSubTab('concluidas')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: taskSubTab === 'concluidas' ? '#ffffff' : 'transparent',
                  color: taskSubTab === 'concluidas' ? '#6b21a8' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxShadow: taskSubTab === 'concluidas' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Concluídas
              </button>
            </div>

            {/* Botão Roxo: + Nova Tarefa */}
            <button
              onClick={onOpenNewTaskModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #6c5ce7 0%, #4834d4 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(108, 92, 231, 0.35)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Plus size={15} />
              <span>Nova Tarefa</span>
            </button>
          </div>

          {/* Seletor de Perfil / Filtro Rápido */}
          {users && users.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                onClick={() => setSelectedUserFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: selectedUserFilter === 'all' ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                  background: selectedUserFilter === 'all' ? '#ede9fe' : '#ffffff',
                  color: selectedUserFilter === 'all' ? '#6d28d9' : '#64748b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Todos
              </button>
              {users.map(u => {
                const isSelected = selectedUserFilter === u.id || (selectedUserFilter === 'all' && currentUser?.id === u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserFilter(u.id);
                      if (onChangeCurrentUser) {
                        onChangeCurrentUser(u);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      border: isSelected ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                      background: isSelected ? '#ede9fe' : '#ffffff',
                      color: isSelected ? '#6d28d9' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{u.avatar || '👤'}</span>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* LISTA DE CARDS MOBILE 100% RESPONSIVOS CONFORME O DESIGN */}
          {filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 16px',
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1.5px dashed #cbd5e1',
              marginTop: '8px'
            }}>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                Nenhuma tarefa encontrada em {taskSubTab === 'atuais' ? 'Atuais' : 'Concluídas'}.
              </p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const assignee = getAssignee(task.assignedTo);
              const progressPercent = calculateTaskProgress(task);
              const isSpecial = task.type === 'special';
              const isRecurrent = task.type === 'recurrent';
              const isSimple = task.type === 'simple';
              const taskPlats = getTaskPlatforms(task);

              const matchedProduct = products?.find(p =>
                (task.productId && (p.sku === task.productId || p.id === task.productId)) ||
                (task.title && (p.sku === task.title || p.title === task.title))
              );
              const displayTitle = (isSpecial || isRecurrent || isSimple)
                ? (task.title || (isRecurrent ? 'Tarefa Recorrente' : (isSimple ? 'Tarefa Simples' : 'Tarefa Especial')))
                : (task.title && task.title !== 'Produto' ? task.title : (matchedProduct?.sku || task.productId || 'Produto'));

              const totalChecks = task.checklist?.length || 0;
              const doneChecks = task.checklist?.filter(c => c.completed).length || 0;
              const percentChecks = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;


              // Se for Tarefa Simples: Formato exatamente igual ao print da direita
              if (isSimple) {
                const firstCheckItem = task.checklist?.[0] || { id: `chk_${task.id}`, label: displayTitle, completed: false };

                const isItemDone = Boolean(firstCheckItem.completed);

                return (
                  <div
                    key={task.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px 14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: isItemDone ? '1.5px solid #a7f3d0' : '1.5px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Linha Superior: Data (25/10) à esquerda + Ações (Duplicar, Editar, Excluir) à direita */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}>
                      <div style={{
                        fontSize: '17px',
                        fontWeight: '900',
                        color: '#0f172a',
                        lineHeight: '1.2'
                      }}>
                        {formatDueDateDisplay(task.dueDate)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {onDuplicateTask && (
                          <button
                            onClick={() => onDuplicateTask(task)}
                            title="Duplicar Tarefa"
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              background: '#f0fdf4',
                              color: '#16a34a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Copy size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setEditTitle(task.title || '');
                            setEditDueDate(formatDueDateDisplay(task.dueDate));
                          }}
                          title="Editar Tarefa"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir a tarefa "${displayTitle}"?`)) {
                              onDeleteTask(task);
                            }
                          }}
                          title="Excluir Tarefa"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Lista de Itens de Checklist (Foto 2: Item Principal + Subtarefas com recuo/indentação) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                      {/* Se houver subtarefas no checklist, renderiza o título da tarefa no topo e as subtarefas indentadas */}
                      {task.checklist && task.checklist.length > 1 ? (
                        <>
                          {/* Item Principal (Título da Tarefa) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%'
                            }}
                          >
                            <div
                              onClick={() => {
                                // Se clicar no checkbox do principal, pode alternar todas ou marcar/desmarcar
                                const allDone = task.checklist.every(c => c.completed);
                                task.checklist.forEach(c => {
                                  if (allDone && c.completed) onToggleChecklistItem(task.id, c.id);
                                  else if (!allDone && !c.completed) onToggleChecklistItem(task.id, c.id);
                                });
                              }}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: task.checklist.every(c => c.completed) ? '2px solid #10b981' : '2px solid #94a3b8',
                                background: task.checklist.every(c => c.completed) ? '#10b981' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {task.checklist.every(c => c.completed) && <CheckCircle2 size={16} color="#ffffff" />}
                            </div>

                            <span style={{
                              fontSize: '15px',
                              fontWeight: '800',
                              color: task.checklist.every(c => c.completed) ? '#64748b' : '#0f172a',
                              textDecoration: task.checklist.every(c => c.completed) ? 'line-through' : 'none',
                              wordBreak: 'break-word',
                              flex: 1
                            }}>
                              {displayTitle}
                            </span>
                          </div>

                          {/* Subtarefas indentadas logo abaixo (exatamente como na Foto 2) */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            paddingLeft: '24px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}>
                            {task.checklist.map((item) => {
                              const isDone = Boolean(item.completed);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => onToggleChecklistItem(task.id, item.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    width: '100%'
                                  }}
                                >
                                  <div style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    border: isDone ? '2px solid #10b981' : '2px solid #94a3b8',
                                    background: isDone ? '#10b981' : '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease'
                                  }}>
                                    {isDone && <CheckCircle2 size={15} color="#ffffff" />}
                                  </div>

                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: isDone ? '#64748b' : '#0f172a',
                                    textDecoration: isDone ? 'line-through' : 'none',
                                    wordBreak: 'break-word',
                                    flex: 1
                                  }}>
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        /* Tarefa Simples com item único (como no print 1 da direita) */
                        <div
                          onClick={() => onToggleChecklistItem(task.id, firstCheckItem.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            width: '100%',
                            paddingTop: '2px'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: isItemDone ? '2px solid #10b981' : '2px solid #94a3b8',
                            background: isItemDone ? '#10b981' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}>
                            {isItemDone && <CheckCircle2 size={16} color="#ffffff" />}
                          </div>

                          <span style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: isItemDone ? '#64748b' : '#0f172a',
                            textDecoration: isItemDone ? 'line-through' : 'none',
                            wordBreak: 'break-word',
                            flex: 1
                          }}>
                            {firstCheckItem.label || displayTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }


              return (
                <div
                  key={task.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: progressPercent === 100 ? '1.5px solid #a7f3d0' : '1.5px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Badge Superior: Responsável + Botão Finalizar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#475569'
                    }}>
                      <User size={12} color="#64748b" />
                      <span>{assignee.name || (task.assignedByName && !task.assignedByName.startsWith('user_') ? task.assignedByName : 'Colaborador')}</span>
                      {isRecurrent && <span style={{ color: '#7c3aed', marginLeft: '4px' }}>🔄</span>}
                      {isSpecial && <span style={{ color: '#d97706', marginLeft: '4px' }}>⭐</span>}
                    </div>

                    {(progressPercent === 100 || (isSpecial && totalChecks === 0)) && taskSubTab === 'atuais' && (
                      <button
                        onClick={() => onFinishTask(task)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        🎉 Concluir
                      </button>
                    )}
                  </div>

                  {/* LINHA SUPERIOR: [ Bloco Cinza Produto ] e [ % Concluída, Prazo, Ações ] */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Bloco Cinza: flexível para caber na tela sem quebrar */}
                    <div style={{
                      background: '#e2e8f0',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: '1 1 auto',
                      minWidth: 0,
                      maxWidth: '60%',
                      minHeight: '62px',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        width: '100%'
                      }}>
                        <span
                          title={displayTitle}
                          style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                          }}
                        >
                          {displayTitle}
                        </span>

                        <button
                          onClick={() => onOpenChecklistModal(task)}
                          title="Ver fotos / checklist de cadastro"
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#334155',
                            borderRadius: '50%',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <Eye size={13} />
                        </button>
                      </div>

                      {/* Barra de progresso verde interna */}
                      <div style={{
                        width: '100%',
                        height: '9px',
                        backgroundColor: '#94a3b8',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        marginTop: '4px'
                      }}>
                        <div
                          style={{
                            width: `${totalChecks > 0 ? percentChecks : (progressPercent > 0 ? 100 : 0)}%`,
                            height: '100%',
                            backgroundColor: '#10b981',
                            borderRadius: '5px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* LADO DIREITO: % Concluída, Prazo e Ícones (Duplicar, Editar, Excluir) */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      flexShrink: 0,
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        color: progressPercent === 100 ? '#059669' : (progressPercent > 0 ? '#10b981' : '#64748b'),
                        lineHeight: '1.2'
                      }}>
                        {progressPercent}% Concluída
                      </div>

                      <div style={{
                        fontSize: '15px',
                        fontWeight: '900',
                        color: '#0f172a',
                        lineHeight: '1.2',
                        marginTop: '2px'
                      }}>
                        {formatDueDateDisplay(task.dueDate)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        {onDuplicateTask && (
                          <button
                            onClick={() => onDuplicateTask(task)}
                            title="Duplicar Tarefa"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              background: '#f0fdf4',
                              color: '#16a34a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Copy size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setEditTitle(task.title || '');
                            setEditDueDate(formatDueDateDisplay(task.dueDate));
                          }}
                          title="Editar Tarefa"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={12} />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir a tarefa "${displayTitle}"?`)) {
                              onDeleteTask(task);
                            }
                          }}
                          title="Excluir Tarefa"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>


                  {/* GRADE DE CANAIS DE MARKETPLACES (Apenas para tarefas que não sejam simples) */}
                  {!isSimple && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                      gap: '6px',
                      marginTop: '2px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {taskPlats.map(plat => {
                        const channelKey = plat.id || plat.name;
                        const channelState =
                          task.marketplaces?.[plat.id] ||
                          task.marketplaces?.[plat.name] ||
                          task.marketplaces?.[plat.name.toLowerCase()] ||
                          task.marketplaces?.[plat.name.replace(/\s+/g, '')] ||
                          (plat.name.toLowerCase().includes('shopee') ? task.marketplaces?.shopee : null) ||
                          (plat.name.toLowerCase().includes('mercado') ? task.marketplaces?.mercadoLivre : null) ||
                          (plat.name.toLowerCase().includes('amazon') ? task.marketplaces?.amazon : null) ||
                          (plat.name.toLowerCase().includes('magalu') ? task.marketplaces?.magalu : null) ||
                          {};

                        let defaultColor = plat.color;
                        if (!defaultColor || defaultColor === '#5925dc') {
                          const lower = plat.name.toLowerCase();
                          if (lower.includes('shopee')) defaultColor = '#f97316';
                          else if (lower.includes('mercado') || lower.includes('ml')) defaultColor = '#eab308';
                          else if (lower.includes('amazon')) defaultColor = '#334155';
                          else if (lower.includes('magalu')) defaultColor = '#38bdf8';
                          else if (lower.includes('shein')) defaultColor = '#0f172a';
                          else defaultColor = '#6366f1';
                        }

                        const isUActive = Boolean(channelState.u);
                        const isOActive = Boolean(channelState.o);
                        const isBothActive = isUActive && isOActive;

                        const cardBg = isBothActive ? '#22c55e' : defaultColor;
                        const isYellow = defaultColor === '#eab308' || plat.name.toLowerCase().includes('mercado');
                        const textColor = (!isBothActive && isYellow) ? '#1e293b' : '#ffffff';

                        return (
                          <div
                            key={plat.id || plat.name}
                            style={{
                              background: cardBg,
                              borderRadius: '8px',
                              padding: '5px 3px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              minHeight: '56px',
                              boxShadow: isBothActive ? '0 2px 6px rgba(34, 197, 94, 0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                              userSelect: 'none',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              color: textColor,
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '72px',
                              marginBottom: '3px'
                            }}>
                              {plat.name}
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                              {/* Botão U */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleMarketplace(task.id, channelKey, 'u');
                                }}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: isUActive ? '#22c55e' : 'transparent',
                                  color: isUActive ? '#ffffff' : 'rgba(255,255,255,0.85)',
                                  fontSize: '10px',
                                  fontWeight: '900',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: isUActive ? 'none' : '1.5px solid rgba(255,255,255,0.6)',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                U
                              </button>

                              {/* Botão O */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleMarketplace(task.id, channelKey, 'o');
                                }}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: isOActive ? '#22c55e' : 'transparent',
                                  color: isOActive ? '#ffffff' : 'rgba(255,255,255,0.85)',
                                  fontSize: '10px',
                                  fontWeight: '900',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: isOActive ? 'none' : '1.5px solid rgba(255,255,255,0.6)',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                O
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}


                  {/* CHECKLIST DE TAREFAS / SUBTAREFAS LOGO ABAIXO */}
                  {task.checklist && task.checklist.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '4px',
                      paddingTop: '6px',
                      borderTop: '1px dashed #e2e8f0',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {task.checklist.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onToggleChecklistItem(task.id, item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            width: '100%'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            border: item.completed ? '2px solid #10b981' : '2px solid #94a3b8',
                            background: item.completed ? '#10b981' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {item.completed && <CheckCircle2 size={14} color="#ffffff" />}
                          </div>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: item.completed ? '#64748b' : '#0f172a',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            wordBreak: 'break-word',
                            flex: 1
                          }}>
                            {item.label}
                          </span>
                        </div>
                      ))}

                      {task.checklist.length > 5 && (
                        <button
                          onClick={() => onOpenChecklistModal(task)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#5925dc',
                            fontSize: '11px',
                            fontWeight: '700',
                            textAlign: 'left',
                            cursor: 'pointer',
                            padding: '2px 0'
                          }}
                        >
                          + ver mais {task.checklist.length - 5} subtarefas...
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Edição de Tarefa no Mobile */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px',
            width: '100%',
            maxWidth: '340px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
              Editar Tarefa
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Título / Nome
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Prazo (ex: 25/10)
                </label>
                <input
                  type="text"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTask(editingTask.id, {
                      title: editTitle,
                      dueDate: editDueDate
                    });
                    setEditingTask(null);
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
