import React, { useState } from 'react';
import { Users, BarChart3, CheckCircle, Clock, AlertTriangle, TrendingUp, Award } from 'lucide-react';

export default function GeneralReportView({
  tasks,
  users,
  onOpenChecklistModal,
  onReassignTask,
  setActiveTab
}) {
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  // Métricas gerais
  const totalTasks = tasks.length;
  
  function getTaskCompletionPercent(task) {
    if (task.type === 'special') {
      if (!task.checklist || task.checklist.length === 0) return 0;
      const c = task.checklist.filter(item => item.completed).length;
      return Math.round((c / task.checklist.length) * 100);
    }

    // 40% Fotos / Checklist
    const totalChecks = task.checklist?.length || 0;
    const doneChecks = task.checklist?.filter(c => c.completed).length || 0;
    const photoProgress = totalChecks > 0 ? (doneChecks / totalChecks) * 40 : 0;

    // 60% Marketplaces (8 botões: U e O para os 4 canais)
    const mp = task.marketplaces || {};
    let mpButtonsCount = 0;
    ['shopee', 'mercadoLivre', 'amazon', 'magalu'].forEach(ch => {
      const channel = mp[ch];
      if (channel) {
        if (channel.u) mpButtonsCount++;
        if (channel.o) mpButtonsCount++;
        if (channel.active && !channel.u && !channel.o) mpButtonsCount += 2;
      }
    });

    const mpProgress = (mpButtonsCount / 8) * 60;
    return Math.round(photoProgress + mpProgress);
  }

  const completedTasks = tasks.filter(t => getTaskCompletionPercent(t) === 100).length;
  const inProgressTasks = totalTasks - completedTasks;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Estatísticas por usuário
  const userStats = users.map(user => {
    const userTasks = tasks.filter(t => t.assignedTo === user.id);
    const userCompleted = userTasks.filter(t => getTaskCompletionPercent(t) === 100).length;
    const userPending = userTasks.length - userCompleted;
    const rate = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;

    return {
      user,
      total: userTasks.length,
      completed: userCompleted,
      pending: userPending,
      rate,
      tasks: userTasks
    };
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    onAddUser({
      id: 'user_' + Date.now(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password.trim() || '123',
      role: newUser.role,
      avatar: newUser.role === 'premium_admin' ? '⚡' : '👤',
      badge: newUser.role === 'premium_admin' ? 'Admin' : 'Operador'
    });

    setNewUser({ name: '', email: '', password: '', role: 'operator' });
    setIsAddingUser(false);
  };

  const handleSaveEditUser = (e) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name.trim() || !editingUser.email.trim()) return;

    onUpdateUser(editingUser.id, {
      name: editingUser.name.trim(),
      email: editingUser.email.trim(),
      password: editingUser.password.trim() || '123',
      role: editingUser.role,
      badge: editingUser.role === 'premium_admin' ? 'Admin' : 'Operador',
      platforms: editingUser.platforms || []
    });

    setEditingUser(null);
  };

  const filteredTasks = selectedUserFilter === 'all'
    ? tasks
    : tasks.filter(t => t.assignedTo === selectedUserFilter);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* Cabeçalho do Relatório Premium */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
              Relatório Geral de Usuários & Produtividade
            </h2>
            <span style={{
              background: '#ede9fe',
              color: '#5b21b6',
              fontSize: '11px',
              fontWeight: '800',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              👑 PAINEL DO GESTOR
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Acompanhe em tempo real o fluxo de tarefas atribuídas, produtividade e taxas de entrega dos colaboradores.
          </p>
        </div>
      </div>
      {/* Cards de Métricas Principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Total de Tarefas</span>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
            {totalTasks}
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Fluxo geral da equipe</span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Concluídas (100%)</span>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
            {completedTasks}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{overallRate}% de taxa de entrega</span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Em Andamento</span>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>
            {inProgressTasks}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Tarefas ativas</span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Colaboradores Ativos</span>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#5925dc', marginTop: '4px' }}>
            {users.length}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Equipe JBC Eletro</span>
        </div>
      </div>

      {/* Grid de Desempenho por Colaborador */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
          Produtividade por Membro da Equipe
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {userStats.map(({ user, total, completed, pending, rate }) => (
            <div
              key={user.id}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                border: selectedUserFilter === user.id ? '2px solid #5925dc' : '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setSelectedUserFilter(selectedUserFilter === user.id ? 'all' : user.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{user.avatar}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: user.role === 'premium_admin' ? '#ede9fe' : '#f1f5f9',
                    color: user.role === 'premium_admin' ? '#5b21b6' : '#475569'
                  }}>
                    {user.badge}
                  </span>

                  {setActiveTab && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('cadastro');
                      }}
                      title="Gerenciar usuário em Cadastro > Usuários"
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#ede9fe',
                        border: '1px solid #ddd6fe',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#5b21b6',
                        cursor: 'pointer'
                      }}
                    >
                      Gerenciar ↗
                    </button>
                  )}
                </div>
              </div>

              {/* Plataformas Atribuídas ao Colaborador */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                {(user.platforms || []).map((p, idx) => (
                  <span
                    key={p.id || idx}
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: p.color || '#f1f5f9',
                      color: p.color === '#facc15' ? '#1e293b' : '#ffffff'
                    }}
                  >
                    {p.name}
                  </span>
                ))}
                {(!user.platforms || user.platforms.length === 0) && (
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Nenhuma plataforma configurada
                  </span>
                )}
              </div>

              {/* Barra de Progresso do Usuário */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Taxa de Conclusão</span>
                  <span style={{ fontWeight: '800', color: '#10b981' }}>{rate}%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rate}%`, background: '#10b981' }} />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                textAlign: 'center',
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{total}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total</div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>{completed}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Prontas</div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b' }}>{pending}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Pendentes</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela Detalhada com Todas as Tarefas e Reatribuição Rápida */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Todas as Tarefas no Sistema {selectedUserFilter !== 'all' && `(Filtrado por colaborador)`}
          </h3>
          {selectedUserFilter !== 'all' && (
            <button
              onClick={() => setSelectedUserFilter('all')}
              style={{ fontSize: '12px', color: '#5925dc', fontWeight: '700', cursor: 'pointer' }}
            >
              Limpar filtro de colaborador
            </button>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#475569' }}>Tarefa</th>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#475569' }}>Tipo</th>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#475569' }}>Responsável</th>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#475569' }}>Prazo</th>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#475569' }}>Progresso</th>
              <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const p = getTaskCompletionPercent(t);
              const assignee = users.find(u => u.id === t.assignedTo) || { name: 'Desconhecido', avatar: '👤' };

              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{t.title}</div>
                    {t.notes && <div style={{ fontSize: '12px', color: '#64748b' }}>{t.notes}</div>}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: t.type === 'special' ? '#f1f5f9' : '#f0fdf4',
                      color: t.type === 'special' ? '#475569' : '#15803d'
                    }}>
                      {t.type === 'special' ? 'Especial' : 'Marketplaces'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {/* Reatribuir Responsável direto pelo painel de admin */}
                    <select
                      value={t.assignedTo}
                      onChange={(e) => onReassignTask(t.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: '#fff'
                      }}
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.avatar} {u.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    {t.dueDate}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${p}%`, height: '100%', background: p === 100 ? '#10b981' : '#5925dc' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: p === 100 ? '#10b981' : '#334155' }}>
                        {p}%
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => onOpenChecklistModal(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#ecebfa',
                        color: '#5925dc',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      Ver Checklist
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
