import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Trash2, Edit2, Eye, Calendar, User, Search, Check, Plus } from 'lucide-react';

export default function CompletedTasksView({
  completedTasks,
  users,
  currentUser,
  onUnfinishTask,
  onDeleteCompletedTask,
  onUpdateCompletedTask,
  onOpenChecklistModal,
  onOpenNewTaskModal,
  setActiveTab
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Filtro de permissão: admin vê todas, colaboradores veem as suas
  const visibleTasks = completedTasks.filter((task) => {
    if (currentUser.role !== 'premium_admin') {
      if (task.assignedTo !== currentUser.id && task.createdById !== currentUser.id) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchNotes = (task.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      title: t.title,
      dueDate: t.dueDate,
      notes: t.notes || '',
      assignedTo: t.assignedTo
    });
  };

  const handleSaveEdit = (id) => {
    onUpdateCompletedTask(id, {
      ...editForm,
      assignedByName: users.find(u => u.id === editForm.assignedTo)?.name || 'Colaborador'
    });
    setEditingId(null);
  };

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
            <span>Atuais</span>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('tarefas_concluidas')}
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
            <span>Concluídas</span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: '#5925dc',
              color: '#ffffff',
              fontWeight: '800'
            }}>
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* No canto direito: Botão Nova Tarefa */}
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab('tarefas');
            if (onOpenNewTaskModal) onOpenNewTaskModal();
          }}
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
      {/* Topo com Título e Barra de Busca */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>
              Tarefas Concluídas & Finalizadas
            </h2>
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              ✅ {visibleTasks.length} {visibleTasks.length === 1 ? 'Finalizada' : 'Finalizadas'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Histórico das tarefas entregues sincronizado com a aba <strong>Tarefas_Finalizadas</strong> da planilha. É possível editar e excluir registros diretamente aqui.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar nas concluídas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px 10px 38px',
              borderRadius: '9999px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              width: '260px',
              background: '#f8fafc'
            }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Lista de Tarefas Concluídas com Edição e Exclusão Inline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {visibleTasks.map((task) => {
          const isEditing = editingId === task.id;
          const assignee = users.find(u => u.id === task.assignedTo) || { name: 'Colaborador', avatar: '👤' };

          return (
            <div
              key={task.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px 24px',
                border: '1.5px solid #bbf7d0',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Esquerda: Identificação e Título */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '900'
                  }}>
                    ✓
                  </span>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        fontWeight: '800',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      {(() => {
                        if (task.type === 'special') return task.title || 'Tarefa Especial';
                        if (task.title && task.title !== 'Produto' && task.title !== 'Produto Novo') return task.title;
                        const p = products?.find(prod => (task.productId && (prod.sku === task.productId || prod.id === task.productId)) || (task.title && prod.sku === task.title));
                        return p?.sku || task.productId || p?.title || task.title || 'Produto';
                      })()}
                    </span>
                  )}

                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: task.type === 'special' ? '#f1f5f9' : '#f0fdf4',
                    color: task.type === 'special' ? '#475569' : '#15803d'
                  }}>
                    {task.type === 'special' ? 'Especial' : 'Marketplaces'}
                  </span>
                </div>

                {isEditing ? (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Observações..."
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="dd/mm"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                      style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{assignee.avatar}</span>
                      <strong>{assignee.name}</strong>
                    </span>
                    <span>Prazo: <strong>{task.dueDate}</strong></span>
                    {task.notes && <span>• <em>"{task.notes}"</em></span>}
                  </div>
                )}
              </div>

              {/* Direita: Ações Rápidas (Checklist, Reativar, Editar, Excluir) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onOpenChecklistModal(task)}
                  title="Ver fotos e mídias"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#ede9fe',
                    color: '#5b21b6',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={15} /> Ver Mídias
                </button>

                {isEditing ? (
                  <button
                    onClick={() => handleSaveEdit(task.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={15} /> Salvar
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(task)}
                    title="Editar informações da tarefa concluída"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                )}

                {/* Reativar / Voltar para Tarefas Ativas */}
                <button
                  onClick={() => {
                    if (confirm(`Deseja reativar a tarefa "${task.title}" e movê-la de volta para a lista principal?`)) {
                      onUnfinishTask(task);
                    }
                  }}
                  title="Mover de volta para Tarefas Ativas"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    color: '#b45309',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={14} /> Reativar
                </button>

                {/* Excluir Definitivamente */}
                <button
                  onClick={() => {
                    if (confirm(`Excluir permanentemente a tarefa "${task.title}" da planilha?`)) {
                      onDeleteCompletedTask(task.id);
                    }
                  }}
                  title="Excluir Tarefa"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          );
        })}

        {visibleTasks.length === 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '2px dashed #cbd5e1'
          }}>
            <p style={{ fontSize: '18px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
              Nenhuma tarefa finalizada no momento.
            </p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Quando uma tarefa atingir 100% de fotos e plataformas, clique em "Finalizar Tarefa" na tela inicial para movê-la para cá e para a planilha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
