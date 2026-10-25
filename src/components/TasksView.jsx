import React, { useState, useRef } from 'react';
import { Eye, CheckCircle2, Clock, Calendar, User, Sparkles, Filter, Plus, ArrowUpRight, Edit2, Trash2, X, Check, Copy, Package } from 'lucide-react';

// Helper para formatar qualquer string de data em dd/mm
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

// Converte prazo (ex: "21/10", "2026-10-21") em timestamp numérico para ordenação correta
function parseDueDateToTimestamp(val) {
  if (!val) return 9999999999999;
  const str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    const [d, m] = str.split('/').map(Number);
    const now = new Date();
    let year = now.getFullYear();
    // Se o mês for menor que o mês atual, pode ser do próximo ano
    if (m < now.getMonth() + 1) {
      year += 1;
    }
    return new Date(year, m - 1, d, 23, 59, 59).getTime();
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime();
  }
  return 9999999999999;
}

export default function TasksView({
  tasks,
  users,
  platforms = [],
  currentUser,
  onOpenChecklistModal,
  onToggleMarketplace,
  onOpenNewTaskModal,
  onFinishTask,
  onToggleChecklistItem,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  products,
  setActiveTab
}) {
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para Edição de Tarefas
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    dueDate: '',
    assignedTo: '',
    notes: ''
  });
  const editDateInputRef = useRef(null);

  const handleOpenEditDatePicker = () => {
    if (editDateInputRef.current) {
      if (typeof editDateInputRef.current.showPicker === 'function') {
        editDateInputRef.current.showPicker();
      } else {
        editDateInputRef.current.focus();
        editDateInputRef.current.click();
      }
    }
  };

  const handleStartEdit = (t) => {
    setEditingTask(t);
    setEditForm({
      title: t.title || '',
      dueDate: formatDueDateDisplay(t.dueDate),
      assignedTo: t.assignedTo || '',
      notes: t.notes || ''
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTask) return;
    onUpdateTask(editingTask.id, {
      ...editForm,
      dueDate: formatDueDateDisplay(editForm.dueDate),
      assignedByName: users.find(u => u.id === editForm.assignedTo)?.name || 'Colaborador'
    });
    setEditingTask(null);
  };

  const handleDelete = (task) => {
    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title || task.sku || 'selecionada'}"?`)) {
      onDeleteTask(task);
    }
  };

  function getAssignee(userId) {
    if (!userId) return { id: null, name: '', avatar: '' };
    const norm = (s) => String(s || '').toLowerCase().trim();
    const target = norm(userId);
    const parsedTargetNum = parseInt(target, 10);

    const found = users.find(u => {
      const uId = norm(u.id);
      const uName = norm(u.name);
      const uEmail = norm(u.email);
      if (uId === target || uName === target || uEmail === target) return true;
      if (!isNaN(parsedTargetNum) && parseInt(uId, 10) === parsedTargetNum) return true;
      if (uName.includes(target) || target.includes(uName)) return true;
      return false;
    });

    return found || { id: null, name: String(userId), avatar: '👤' };
  }

  function getTaskPlatforms(task) {
    const assignee = getAssignee(task.assignedTo);
    if (assignee && assignee.platforms && assignee.platforms.length > 0) {
      return assignee.platforms;
    }
    // Se a tarefa já tiver chaves de marketplaces gravadas
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
      { id: 'mercadoLivre', name: 'Mercado L', color: '#facc15' },
      { id: 'amazon', name: 'Amazon', color: '#334155' },
      { id: 'magalu', name: 'Magalu', color: '#38bdf8' }
    ];
  }

  function calculateTaskProgress(task) {
    if (task.type === 'special') {
      if (!task.checklist || task.checklist.length === 0) return 0;
      const completed = task.checklist.filter(c => c.completed).length;
      return Math.round((completed / task.checklist.length) * 100);
    }

    if (task.type === 'recurrent') {
      const hasChecks = task.checklist && task.checklist.length > 0;
      const taskPlats = getTaskPlatforms(task);
      const hasPlats = taskPlats && taskPlats.length > 0;

      if (!hasChecks && !hasPlats) return 0;

      // Se só tem checklist e nenhuma plataforma
      if (hasChecks && !hasPlats) {
        const completed = task.checklist.filter(c => c.completed).length;
        return Math.round((completed / task.checklist.length) * 100);
      }

      // Se só tem plataformas e nenhum checklist
      if (!hasChecks && hasPlats) {
        const totalButtons = Math.max(taskPlats.length * 3, 3);
        const mp = task.marketplaces || {};
        let mpButtonsCount = 0;
        taskPlats.forEach(plat => {
          const channel = mp[plat.id] || mp[plat.name] || mp[plat.name.toLowerCase()] || mp[plat.name.replace(/\s+/g, '')];
          if (channel) {
            if (channel.box || channel.u) mpButtonsCount++;
            if (channel.rocket || channel.o) mpButtonsCount++;
            if (channel.pie || channel.p) mpButtonsCount++;
            if (channel.active && !channel.box && !channel.rocket && !channel.pie && !channel.u && !channel.o && !channel.p) {
              mpButtonsCount += 3;
            }
          }
        });
        return Math.round((mpButtonsCount / totalButtons) * 100);
      }

      // Se tem ambos: Checklist = 40%, Plataformas = 60%
      const totalChecks = task.checklist.length;
      const doneChecks = task.checklist.filter(c => c.completed).length;
      const chkProgress = (doneChecks / totalChecks) * 40;

      const totalButtons = Math.max(taskPlats.length * 3, 3);
      const mp = task.marketplaces || {};
      let mpButtonsCount = 0;
      taskPlats.forEach(plat => {
        const channel = mp[plat.id] || mp[plat.name] || mp[plat.name.toLowerCase()] || mp[plat.name.replace(/\s+/g, '')];
        if (channel) {
          if (channel.box || channel.u) mpButtonsCount++;
          if (channel.rocket || channel.o) mpButtonsCount++;
          if (channel.pie || channel.p) mpButtonsCount++;
          if (channel.active && !channel.box && !channel.rocket && !channel.pie && !channel.u && !channel.o && !channel.p) {
            mpButtonsCount += 3;
          }
        }
      });
      const mpProgress = (mpButtonsCount / totalButtons) * 60;
      return Math.round(chkProgress + mpProgress);
    }

    // Para produtos:
    // 1. Fotos / Checklist dentro do produto representam 40% da conclusão total.
    const totalChecks = task.checklist?.length || 0;
    const doneChecks = task.checklist?.filter(c => c.completed).length || 0;
    const photoProgress = totalChecks > 0 ? (doneChecks / totalChecks) * 40 : 0;

    // 2. O restante (60%) é distribuído entre as plataformas do usuário
    const taskPlats = getTaskPlatforms(task);
    const totalButtons = Math.max(taskPlats.length * 3, 3);
    const mp = task.marketplaces || {};
    let mpButtonsCount = 0;

    taskPlats.forEach(plat => {
      const channel = mp[plat.id] || mp[plat.name] || mp[plat.name.toLowerCase()] || mp[plat.name.replace(/\s+/g, '')];
      if (channel) {
        if (channel.box || channel.u) mpButtonsCount++;
        if (channel.rocket || channel.o) mpButtonsCount++;
        if (channel.pie || channel.p) mpButtonsCount++;
        if (channel.active && !channel.box && !channel.rocket && !channel.pie && !channel.u && !channel.o && !channel.p) {
          mpButtonsCount += 3;
        }
      }
    });

    const mpProgress = (mpButtonsCount / totalButtons) * 60;
    return Math.round(photoProgress + mpProgress);
  }

  // Helper para verificar se a tarefa pertence ao usuário logado
  function isTaskForUser(task, user) {
    if (!task || !user) return false;
    if (user.role === 'premium_admin') return true;

    // Normaliza strings para comparação insensível a maiúsculas/espaços
    const norm = (s) => String(s || '').toLowerCase().trim();
    const taskAssignee = norm(task.assignedTo);
    const taskAssigneeName = norm(task.assignedByName);
    const taskCreator = norm(task.createdById);

    const uId = norm(user.id);
    const uName = norm(user.name);
    const uEmail = norm(user.email);

    // Compara por ID exato ou ID sem zeros à esquerda (ex: "00002" vs "2")
    if (taskAssignee && (taskAssignee === uId || parseInt(taskAssignee, 10) === parseInt(uId, 10))) return true;
    if (taskCreator && (taskCreator === uId || parseInt(taskCreator, 10) === parseInt(uId, 10))) return true;

    // Compara por Nome
    if (uName && (taskAssignee === uName || taskAssigneeName === uName || taskAssignee.includes(uName) || uName.includes(taskAssignee))) {
      return true;
    }

    // Compara por Email
    if (uEmail && (taskAssignee === uEmail || taskCreator === uEmail)) return true;

    // Se o assignee da tarefa apontar para um usuário da lista e esse usuário for o user logado
    const matchedUser = users.find(u =>
      norm(u.id) === taskAssignee ||
      norm(u.name) === taskAssignee ||
      norm(u.email) === taskAssignee ||
      (parseInt(u.id, 10) && parseInt(u.id, 10) === parseInt(taskAssignee, 10))
    );
    if (matchedUser && norm(matchedUser.id) === uId) return true;

    return false;
  }

  // Se o usuário não for admin, ele vê as tarefas atribuídas a ele ou criadas por ele
  const visibleTasks = tasks
    .filter((task) => {
      // Filtro de permissão
      if (!isTaskForUser(task, currentUser)) {
        return false;
      }

      if (currentUser.role === 'premium_admin') {
        if (filterUser !== 'all' && task.assignedTo !== filterUser) {
          const norm = (s) => String(s || '').toLowerCase().trim();
          const target = norm(filterUser);
          const fUser = users.find(u => norm(u.id) === target || norm(u.name) === target);
          const tAssigned = norm(task.assignedTo);
          if (tAssigned !== target && (!fUser || (tAssigned !== norm(fUser.id) && tAssigned !== norm(fUser.name)))) {
            return false;
          }
        }
      }

      // Filtro de status
      if (filterStatus === 'completed') {
        const percent = calculateTaskProgress(task);
        if (percent < 100) return false;
      } else if (filterStatus === 'in_progress') {
        const percent = calculateTaskProgress(task);
        if (percent === 100) return false;
      }

      // Filtro de busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchProduct = (task.productId || '').toLowerCase().includes(q);
        const matchNotes = (task.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchProduct && !matchNotes) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Ordenação: data mais urgente (mais próxima de vencer) no topo, mais distante no final
      const timeA = parseDueDateToTimestamp(a.dueDate);
      const timeB = parseDueDateToTimestamp(b.dueDate);
      if (timeA !== timeB) return timeA - timeB;
      // Se tiverem a mesma data, tarefas mais novas criadas aparecem primeiro
      return (b.id || '').localeCompare(a.id || '');
    });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* Barra de Sub-abas Superior: [ Atuais | Concluídas ] e no canto direito [ Nova Tarefa + ] */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Sub-abas Atuais | Concluídas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          padding: '6px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <button
            onClick={() => setActiveTab && setActiveTab('tarefas')}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '800',
              color: '#5925dc',
              backgroundColor: '#ecebfa',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Atuais</span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: '#5925dc',
              color: '#ffffff',
              fontWeight: '800'
            }}>
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('tarefas_concluidas')}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#5925dc';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>Concluídas</span>
          </button>
        </div>

        {/* No canto direito: Botão Nova Tarefa */}
        <button
          onClick={onOpenNewTaskModal}
          style={{
            background: 'linear-gradient(135deg, #5b21b6 0%, #4338ca 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(91, 33, 182, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Lista de Tarefas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {visibleTasks.map((task) => {
          const progressPercent = calculateTaskProgress(task);
          const isDone = progressPercent === 100;
          const assignee = getAssignee(task.assignedTo);
          const isSpecial = task.type === 'special';
          const isRecurrent = task.type === 'recurrent';

          // Label da frequência de recorrência para exibição
          let recurrenceBadge = '';
          if (isRecurrent) {
            const freq = task.recurrence?.frequency || 'semanal';
            const freqLabels = {
              diaria: 'Diária',
              seg_sex: 'Seg a Sex',
              semanal: 'Semanal',
              quinzenal: '15 dias',
              mensal: 'Mensal'
            };
            recurrenceBadge = freqLabels[freq] || 'Recorrente';
          }

          // Contagem do checklist de fotos/conteúdo
          const totalChecks = task.checklist?.length || 0;
          const doneChecks = task.checklist?.filter(c => c.completed).length || 0;

          // Resolve o SKU / Título do Produto para exibição
          const matchedProduct = products?.find(p =>
            (task.productId && (p.sku === task.productId || p.id === task.productId)) ||
            (task.title && (p.sku === task.title || p.title === task.title))
          );
          const productSkuDisplay = (isSpecial || isRecurrent)
            ? (task.title || (isRecurrent ? 'Tarefa Recorrente' : 'Tarefa Especial'))
            : (
                (task.title && task.title !== 'Produto' && task.title !== 'Produto Novo')
                  ? task.title
                  : (matchedProduct?.sku || task.productId || matchedProduct?.title || 'Produto')
              );

          const taskPlatforms = getTaskPlatforms(task);

          return (
            <div
              key={task.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px 20px 14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: isDone 
                  ? '0 2px 8px rgba(16, 185, 129, 0.08)' 
                  : '0 3px 10px rgba(0, 0, 0, 0.04)',
                border: isDone ? '1.5px solid #a7f3d0' : (isRecurrent ? '1.5px solid #ddd6fe' : '1.5px solid #e2e8f0'),
                position: 'relative',
                transition: 'all 0.2s ease',
                overflowX: 'auto'
              }}
            >
              {/* Badges superiores: Responsável + Tipo de Tarefa */}
              <div style={{
                position: 'absolute',
                top: '6px',
                left: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#475569'
                }}>
                  <User size={11} color="#475569" />
                  <span>{assignee.name || task.assignedByName || 'Colaborador'}</span>
                </div>

                {isRecurrent && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ede9fe',
                    color: '#6d28d9',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: '1px solid #c4b5fd'
                  }}>
                    🔄 {recurrenceBadge}
                  </span>
                )}

                {isSpecial && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '800'
                  }}>
                    ⭐ Especial
                  </span>
                )}
              </div>

              {/* Coluna 1: Bloco do Produto (Modelo com Foto, Nome/SKU, Barra e Olho), Tarefa Especial ou Tarefa Recorrente */}
              <div style={{
                background: (isSpecial || isRecurrent) ? (isRecurrent ? '#f3e8ff' : '#e2e8f0') : '#ffffff',
                border: (isSpecial || isRecurrent) ? 'none' : '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: (isSpecial || isRecurrent) ? '10px 14px' : '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: (isSpecial || isRecurrent) ? 'center' : 'space-between',
                alignItems: (isSpecial || isRecurrent) ? 'center' : 'center',
                width: (isSpecial || isRecurrent) ? '200px' : '160px',
                minHeight: '80px',
                boxShadow: (isSpecial || isRecurrent) ? 'inset 0 1px 2px rgba(0,0,0,0.03)' : '0 1px 3px rgba(0,0,0,0.04)',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}>
                {(isSpecial || isRecurrent) ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                  }}>
                    <div
                      title={productSkuDisplay}
                      style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: isRecurrent ? '#581c87' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        flex: 1
                      }}
                    >
                      {productSkuDisplay}
                    </div>
                  </div>
                ) : (
                  /* Modelo do Produto com Foto, SKU/Nome, Barra e Olho Roxo */
                  <>
                    {/* Foto do Produto */}
                    <div style={{
                      width: '100%',
                      height: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginBottom: '2px'
                    }}>
                      <img
                        src={task.productImage || matchedProduct?.imageUrl || './fogao_thumb.png'}
                        alt={productSkuDisplay}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = './fogao_thumb.png';
                        }}
                        style={{
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>

                    {/* Nome / SKU do Produto */}
                    <div
                      title={productSkuDisplay}
                      style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0f172a',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        marginBottom: '4px'
                      }}
                    >
                      {productSkuDisplay}
                    </div>

                    {/* Linha Inferior: Barra verde + Olho roxo */}
                    {(() => {
                      const percentFotos = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;
                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          width: '100%'
                        }}>
                          {/* Barra de progresso verde */}
                          <div
                            title={`Checklist: ${doneChecks} de ${totalChecks} itens (${percentFotos}%)`}
                            style={{
                              flex: 1,
                              height: '9px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '5px',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <div
                              style={{
                                width: `${percentFotos}%`,
                                height: '100%',
                                backgroundColor: '#10b981',
                                borderRadius: '5px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>

                          {/* Botão Olho Roxo */}
                          <button
                            type="button"
                            onClick={() => onOpenChecklistModal(task)}
                            title="Ver fotos / checklist de cadastro"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#7c3aed',
                              flexShrink: 0
                            }}
                          >
                            <Eye size={17} strokeWidth={2.2} />
                          </button>
                        </div>
                      );
                    })()}
                  </>
                )}

                {isRecurrent && totalChecks > 0 && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#6b21a8',
                    marginTop: '2px',
                    textAlign: 'center'
                  }}>
                    {doneChecks}/{totalChecks} subtarefas
                  </div>
                )}
              </div>

              {/* Seção Central: Para Tarefa Especial OU Recorrente com subtarefas & plataformas */}
              {isSpecial ? (
                <div style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: '#0f172a',
                      letterSpacing: '-0.3px'
                    }}>
                      {task.title}
                    </span>

                    {totalChecks > 0 ? (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#5b21b6',
                          background: '#ede9fe',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          display: 'inline-block'
                        }}
                      >
                        {doneChecks}/{totalChecks} Concluídas
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#059669',
                          background: '#dcfce7',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          display: 'inline-block'
                        }}
                      >
                        Pronta para finalizar
                      </span>
                    )}
                  </div>

                  <div style={{
                    maxHeight: '74px',
                    overflowY: (task.checklist?.length || 0) > 2 ? 'auto' : 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {task.checklist?.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleChecklistItem(task.id, item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: item.completed ? '#059669' : '#334155',
                          cursor: 'pointer',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onToggleChecklistItem(task.id, item.id)}
                          style={{
                            cursor: 'pointer',
                            accentColor: '#10b981',
                            width: '14px',
                            height: '14px'
                          }}
                        />
                        <span style={{ fontWeight: '500' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isRecurrent ? (
                /* Para Tarefas Recorrentes: Combinação de Subtarefas e Plataformas Atribuídas */
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  {totalChecks > 0 && (
                    <div style={{
                      maxHeight: '74px',
                      overflowY: (task.checklist?.length || 0) > 2 ? 'auto' : 'visible',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minWidth: '180px',
                      maxWidth: '260px'
                    }}>
                      {task.checklist?.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onToggleChecklistItem(task.id, item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: item.completed ? '#059669' : '#334155',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#faf5ff',
                            border: '1px solid #f3e8ff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => onToggleChecklistItem(task.id, item.id)}
                            style={{
                              cursor: 'pointer',
                              accentColor: '#8b5cf6',
                              width: '13px',
                              height: '13px'
                            }}
                          />
                          <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Plataformas atribuídas à tarefa recorrente */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                    {taskPlatforms.map((plat) => {
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
                      const lower = (plat.name || '').toLowerCase();
                      if (lower.includes('shopee')) defaultColor = '#ff5722';
                      else if (lower.includes('mercado') || lower.includes('ml')) defaultColor = '#ffbe0b';
                      else if (lower.includes('amazon')) defaultColor = '#2c3e50';
                      else if (lower.includes('magalu')) defaultColor = '#0ea5e9';
                      else if (lower.includes('shein')) defaultColor = '#0f172a';
                      else if (!defaultColor || defaultColor === '#5925dc') defaultColor = '#6366f1';

                      const isYellow = defaultColor === '#ffbe0b' || defaultColor === '#facc15' || lower.includes('mercado');
                      const textColor = isYellow ? '#1e293b' : '#ffffff';

                      return (
                        <div key={plat.id || plat.name} style={{ width: '136px', flexShrink: 0 }}>
                          <MarketplaceCard
                            name={plat.name}
                            defaultColor={defaultColor}
                            activeColor="#22c55e"
                            textColor={textColor}
                            channelState={channelState}
                            onToggleBox={() => onToggleMarketplace(task.id, channelKey, 'box')}
                            onToggleRocket={() => onToggleMarketplace(task.id, channelKey, 'rocket')}
                            onTogglePie={() => onToggleMarketplace(task.id, channelKey, 'pie')}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Para Produtos: Canais de marketplace do colaborador atribuído */
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'nowrap' }}>
                  {taskPlatforms.map((plat) => {
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

                    // Determina a cor padrão baseada no nome ou cor cadastrada exatamente como na foto de referência
                    let defaultColor = plat.color;
                    const lower = (plat.name || '').toLowerCase();
                    if (lower.includes('shopee')) defaultColor = '#ff5722';
                    else if (lower.includes('mercado') || lower.includes('ml')) defaultColor = '#ffbe0b';
                    else if (lower.includes('amazon')) defaultColor = '#2c3e50';
                    else if (lower.includes('magalu')) defaultColor = '#0ea5e9';
                    else if (lower.includes('shein')) defaultColor = '#0f172a';
                    else if (!defaultColor || defaultColor === '#5925dc') defaultColor = '#6366f1';

                    const isYellow = defaultColor === '#ffbe0b' || defaultColor === '#facc15' || lower.includes('mercado');
                    const textColor = isYellow ? '#1e293b' : '#ffffff';

                    return (
                      <div key={plat.id || plat.name} style={{ width: '136px', flexShrink: 0 }}>
                        <MarketplaceCard
                          name={plat.name}
                          defaultColor={defaultColor}
                          activeColor="#22c55e"
                          textColor={textColor}
                          channelState={channelState}
                          onToggleBox={() => onToggleMarketplace(task.id, channelKey, 'box')}
                          onToggleRocket={() => onToggleMarketplace(task.id, channelKey, 'rocket')}
                          onTogglePie={() => onToggleMarketplace(task.id, channelKey, 'pie')}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coluna Final: Data e Porcentagem no canto à direita (marginLeft: auto) */}
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'center',
                textAlign: 'right',
                minWidth: '130px'
              }}>
                <div style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: progressPercent === 100 ? '#059669' : (progressPercent > 0 ? '#10b981' : '#64748b'),
                  lineHeight: '1.2'
                }}>
                  {progressPercent}% Concluída
                </div>

                <div style={{
                  fontSize: '17px',
                  fontWeight: '900',
                  color: '#0f172a',
                  lineHeight: '1.2',
                  marginTop: '2px'
                }}>
                  {formatDueDateDisplay(task.dueDate)}
                </div>

                {/* Se 100% ou se for Tarefa Especial sem subtarefas, botão Finalizar Tarefa */}
                {(progressPercent === 100 || (isSpecial && totalChecks === 0)) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFinishTask(task);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    🎉 Finalizar
                  </button>
                )}

                {/* Botões discretos de Duplicar, Editar e Excluir */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '6px'
                }}>
                  {onDuplicateTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateTask(task);
                      }}
                      title="Duplicar Tarefa"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '7px',
                        border: '1px solid #a7f3d0',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.background = '#d1fae5';
                        e.currentTarget.style.color = '#047857';
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#a7f3d0';
                        e.currentTarget.style.background = '#ecfdf5';
                        e.currentTarget.style.color = '#059669';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(task);
                    }}
                    title="Editar Tarefa"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5925dc';
                      e.currentTarget.style.color = '#5925dc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.color = '#64748b';
                    }}
                  >
                    <Edit2 size={11} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(task);
                    }}
                    title="Excluir Tarefa"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      background: '#ffffff',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Modal de Edição de Tarefas Ativas */}
        {editingTask && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
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
                    background: '#ede9fe',
                    color: '#5925dc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Editar Tarefa
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Altere o título, prazo, responsável e notas da tarefa
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{
                    padding: '6px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Título da Tarefa / Produto:
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                      Data de Conclusão (dd/mm):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="dd/mm"
                        maxLength={5}
                        value={editForm.dueDate}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length > 2) {
                            v = v.slice(0, 2) + '/' + v.slice(2, 4);
                          }
                          setEditForm({ ...editForm, dueDate: v });
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: '700',
                          outline: 'none',
                          color: '#0f172a'
                        }}
                      />
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          ref={editDateInputRef}
                          id="edit-task-date-picker"
                          type="date"
                          value={(() => {
                            if (editForm.dueDate && editForm.dueDate.includes('/')) {
                              const parts = editForm.dueDate.split('/');
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
                              setEditForm({ ...editForm, dueDate: `${day}/${month}` });
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
                          onClick={handleOpenEditDatePicker}
                          title="Escolher data no calendário"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 12px',
                            borderRadius: '10px',
                            background: '#ede9fe',
                            border: '1.5px solid #c4b5fd',
                            fontSize: '18px',
                            height: '38px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#ddd6fe'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#ede9fe'; }}
                        >
                          📅
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                      Responsável:
                    </label>
                    <select
                      value={editForm.assignedTo}
                      onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '600',
                        outline: 'none',
                        color: '#0f172a',
                        background: '#ffffff'
                      }}
                    >
                      <option value="">Não atribuído</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Observações / Notas:
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Instruções adicionais..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0f172a',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  {onDuplicateTask && editingTask ? (
                    <button
                      type="button"
                      onClick={() => {
                        const taskToDup = editingTask;
                        setEditingTask(null);
                        onDuplicateTask(taskToDup);
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid #a7f3d0',
                        background: '#ecfdf5',
                        color: '#059669',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#d1fae5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
                    >
                      <Copy size={15} /> Duplicar Tarefa
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
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
                        padding: '10px 22px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#5925dc',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} /> Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {visibleTasks.length === 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '2px dashed #cbd5e1'
          }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              Nenhuma tarefa encontrada com esses filtros.
            </p>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>
              Crie uma nova tarefa de marketplace ou tarefa especial agora mesmo.
            </p>
            <button
              onClick={onOpenNewTaskModal}
              style={{
                padding: '12px 24px',
                borderRadius: '9999px',
                background: '#5925dc',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} /> Criar Nova Tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponente de Marketplace Card reproduzindo os 3 quadrados brancos de checklist (Caixa, Foguete e Pizza)
function MarketplaceCard({
  name,
  defaultColor,
  activeColor = '#22c55e',
  textColor = '#ffffff',
  channelState = {},
  onToggleBox,
  onToggleRocket,
  onTogglePie
}) {
  const isBoxDone = Boolean(channelState.box || channelState.u);
  const isRocketDone = Boolean(channelState.rocket || channelState.o);
  const isPieDone = Boolean(channelState.pie || channelState.p);
  const isFullyActive = isBoxDone && isRocketDone && isPieDone;

  // Cor do card: se os 3 estiverem ativos, fica verde; se não, usa a cor padrão
  const currentCardBg = isFullyActive ? activeColor : defaultColor;
  // Cor do texto: quando fica verde (isFullyActive), a letra fica branca assim como as outras
  const finalTextColor = isFullyActive ? '#ffffff' : textColor;

  return (
    <div
      style={{
        background: currentCardBg,
        borderRadius: '16px',
        padding: '10px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '74px',
        boxShadow: isFullyActive ? '0 4px 14px rgba(34, 197, 94, 0.4)' : '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'background 0.2s ease, transform 0.15s ease',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: '800',
        color: finalTextColor,
        textAlign: 'center',
        marginBottom: '6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '120px',
        letterSpacing: '-0.2px'
      }}>
        {name}
      </div>

      {/* 3 Quadrados brancos de checklist: Caixa, Foguete e Pizza */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%'
      }}>
        {/* 1º Quadrado: Caixa */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBox();
          }}
          title={`Checklist 1: Caixa (${name})`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: isBoxDone ? '#d9f2e3' : '#ffffff',
            border: isBoxDone ? '3px solid #1b6e36' : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isBoxDone
              ? 'inset 0 1px 2px rgba(27, 110, 54, 0.15), 0 2px 5px rgba(0,0,0,0.12)'
              : '0 1px 3px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Package
            size={18}
            color={isBoxDone ? '#1b6e36' : '#1e293b'}
            strokeWidth={isBoxDone ? 2.4 : 1.75}
          />
        </button>

        {/* 2º Quadrado: Foguete (Foto 2) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleRocket();
          }}
          title={`Checklist 2: Foguete (${name})`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: isBoxDone && isRocketDone ? '#d9f2e3' : (isRocketDone ? '#d9f2e3' : '#ffffff'),
            border: isRocketDone ? '3px solid #1b6e36' : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isRocketDone
              ? 'inset 0 1px 2px rgba(27, 110, 54, 0.15), 0 2px 5px rgba(0,0,0,0.12)'
              : '0 1px 3px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <img
            src="./marketplace_rocket.png"
            alt="Rocket"
            style={{
              width: '20px',
              height: '20px',
              objectFit: 'contain',
              filter: isRocketDone
                ? 'brightness(0) saturate(100%) invert(32%) sepia(55%) saturate(830%) hue-rotate(95deg) brightness(92%) contrast(93%)'
                : 'none'
            }}
          />
        </button>

        {/* 3º Quadrado: Pizza (Foto 3) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePie();
          }}
          title={`Checklist 3: Pizza (${name})`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: isPieDone ? '#d9f2e3' : '#ffffff',
            border: isPieDone ? '3px solid #1b6e36' : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isPieDone
              ? 'inset 0 1px 2px rgba(27, 110, 54, 0.15), 0 2px 5px rgba(0,0,0,0.12)'
              : '0 1px 3px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <img
            src="./marketplace_pie.png"
            alt="Pie"
            style={{
              width: '20px',
              height: '20px',
              objectFit: 'contain',
              filter: isPieDone
                ? 'brightness(0) saturate(100%) invert(32%) sepia(55%) saturate(830%) hue-rotate(95deg) brightness(92%) contrast(93%)'
                : 'none'
            }}
          />
        </button>
      </div>
    </div>
  );
}
