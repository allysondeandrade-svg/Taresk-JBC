import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, User, Check, X, Tag } from 'lucide-react';

export default function UsersCatalogTab({
  users = [],
  platforms = [],
  currentUser = {},
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    selectedPlatformIds: []
  });

  const [editingUser, setEditingUser] = useState(null);
  const [customPlatformInput, setCustomPlatformInput] = useState('');

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    // Relaciona as plataformas selecionadas
    const userPlatforms = platforms
      .filter(p => (newUser.selectedPlatformIds || []).includes(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        color: p.color
      }));

    onAddUser({
      id: 'user_' + Date.now(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password.trim() || '123',
      role: newUser.role,
      avatar: newUser.role === 'premium_admin' ? '⚡' : '👤',
      badge: newUser.role === 'premium_admin' ? 'Admin' : 'Operador',
      platforms: userPlatforms
    });

    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'operator',
      selectedPlatformIds: []
    });
    setIsAdding(false);
  };

  const handleStartEdit = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password || '123',
      role: user.role,
      platforms: user.platforms ? [...user.platforms] : []
    });
  };

  const handleSaveEdit = (e) => {
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

  const togglePlatformInEdit = (plat) => {
    if (!editingUser) return;
    const currentPlatforms = editingUser.platforms || [];
    const exists = currentPlatforms.some(p => p.id === plat.id || p.name === plat.name);

    if (exists) {
      setEditingUser({
        ...editingUser,
        platforms: currentPlatforms.filter(p => p.id !== plat.id && p.name !== plat.name)
      });
    } else {
      setEditingUser({
        ...editingUser,
        platforms: [...currentPlatforms, { id: plat.id, name: plat.name, color: plat.color }]
      });
    }
  };

  const togglePlatformInNew = (platId) => {
    const list = newUser.selectedPlatformIds || [];
    if (list.includes(platId)) {
      setNewUser({ ...newUser, selectedPlatformIds: list.filter(id => id !== platId) });
    } else {
      setNewUser({ ...newUser, selectedPlatformIds: [...list, platId] });
    }
  };

  const handleAddCustomPlatformToEdit = () => {
    if (!customPlatformInput.trim() || !editingUser) return;
    const name = customPlatformInput.trim();
    const color = name.toLowerCase().includes('shopee') ? '#f97316'
      : (name.toLowerCase().includes('mercado') ? '#facc15'
      : (name.toLowerCase().includes('amazon') ? '#334155'
      : (name.toLowerCase().includes('magalu') ? '#38bdf8' : '#8b5cf6')));

    const newPlat = {
      id: 'plat_' + Date.now(),
      name,
      color
    };

    setEditingUser({
      ...editingUser,
      platforms: [...(editingUser.platforms || []), newPlat]
    });
    setCustomPlatformInput('');
  };

  return (
    <div>
      {/* Topo da sub-aba de Usuários */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
            Gestão de Usuários & Contas de Colaboradores
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Cadastre os membros da equipe e relacione a quais plataformas cadastradas cada usuário tem acesso
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            padding: '10px 22px',
            borderRadius: '9999px',
            backgroundColor: '#5925dc',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(89, 37, 220, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <UserPlus size={16} /> Cadastrar Novo Usuário
        </button>
      </div>

      {/* Formulário de Cadastro de Novo Usuário */}
      {isAdding && (
        <form
          onSubmit={handleCreateUser}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #ddd6fe',
            boxShadow: '0 10px 25px -5px rgba(108, 92, 231, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
              Novo Usuário
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Nome do Colaborador *
              </label>
              <input
                type="text"
                placeholder="Ex: Lucas Ferreira"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                E-mail (Login) *
              </label>
              <input
                type="email"
                placeholder="lucas@jbceletro.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Senha de Acesso *
              </label>
              <input
                type="text"
                placeholder="Digite a senha"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Nível de Permissão
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="operator">Operador / Equipe</option>
                <option value="premium_admin">Admin Premium</option>
              </select>
            </div>
          </div>

          {/* Relacionamento com as Plataformas Cadastradas */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            marginTop: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>
                Relacionar Plataformas a este Usuário:
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Clique nas plataformas cadastradas para vincular a este usuário
              </span>
            </div>

            {platforms.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {platforms.map(plat => {
                  const isSelected = (newUser.selectedPlatformIds || []).includes(plat.id);
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => togglePlatformInNew(plat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        border: isSelected ? `2px solid ${plat.color || '#5925dc'}` : '1.5px solid #cbd5e1',
                        background: isSelected ? plat.color || '#5925dc' : '#ffffff',
                        color: isSelected ? (plat.color === '#facc15' ? '#1e293b' : '#ffffff') : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#ffffff' : plat.color
                        }}
                      />
                      {plat.name}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Nenhuma plataforma cadastrada ainda na aba <strong>Plataformas</strong>.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#e2e8f0',
                color: '#475569',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cadastrar Usuário
            </button>
          </div>
        </form>
      )}

      {/* Formulário de Edição de Usuário */}
      {editingUser && (
        <form
          onSubmit={handleSaveEdit}
          style={{
            background: '#fffbeb',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #fde68a',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#92400e' }}>
              Editar Usuário: {editingUser.name}
            </span>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', display: 'block', marginBottom: '6px' }}>
                Nome *
              </label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', display: 'block', marginBottom: '6px' }}>
                E-mail *
              </label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', display: 'block', marginBottom: '6px' }}>
                Senha de Acesso *
              </label>
              <input
                type="text"
                value={editingUser.password}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', display: 'block', marginBottom: '6px' }}>
                Permissão
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '14px' }}
              >
                <option value="operator">Operador / Equipe</option>
                <option value="premium_admin">Admin Premium</option>
              </select>
            </div>
          </div>

          {/* Gerenciamento das Plataformas Vinculadas na Edição */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #fcd34d'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#92400e' }}>
                Plataformas Vinculadas a {editingUser.name}:
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Marque/desmarque das cadastradas ou adicione uma customizada
              </span>
            </div>

            {/* Plataformas disponíveis no sistema */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {platforms.map(plat => {
                const isLinked = (editingUser.platforms || []).some(
                  p => (p.id && p.id === plat.id) || (p.name && p.name.toLowerCase() === plat.name.toLowerCase())
                );
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => togglePlatformInEdit(plat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      border: isLinked ? `2px solid ${plat.color || '#5925dc'}` : '1.5px solid #cbd5e1',
                      background: isLinked ? (plat.color || '#5925dc') : '#ffffff',
                      color: isLinked ? (plat.color === '#facc15' ? '#1e293b' : '#ffffff') : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isLinked ? '#ffffff' : plat.color
                      }}
                    />
                    {plat.name}
                    {isLinked && <Check size={14} />}
                  </button>
                );
              })}
            </div>

            {/* Plataformas ativas deste usuário (com edição de nome ou remoção individual) */}
            <div style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '6px' }}>
                Ativas no perfil:
              </span>
              {(editingUser.platforms || []).map((p, idx) => (
                <div
                  key={p.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: p.color || '#f1f5f9',
                    color: p.color === '#facc15' ? '#1e293b' : '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}
                >
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const updated = [...(editingUser.platforms || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setEditingUser({ ...editingUser, platforms: updated });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      fontWeight: '800',
                      fontSize: '12px',
                      width: `${Math.max(p.name.length * 8 + 10, 60)}px`,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (editingUser.platforms || []).filter((_, i) => i !== idx);
                      setEditingUser({ ...editingUser, platforms: updated });
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Input para adicionar conta/loja específica diretamente */}
              <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                <input
                  type="text"
                  placeholder="Loja específica (Ex: Shopee 2)..."
                  value={customPlatformInput}
                  onChange={(e) => setCustomPlatformInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomPlatformToEdit();
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomPlatformToEdit}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#e2e8f0',
                color: '#475569',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#ffffff',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* Grid de Usuários Cadastrados */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px'
      }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: user.role === 'premium_admin' ? '#f5f3ff' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px'
                  }}>
                    {user.avatar || '👤'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                      {user.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                      {user.email}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleStartEdit(user)}
                    title="Editar usuário e plataformas"
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={13} />
                  </button>

                  {user.id !== 'user_master' && (
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      title="Excluir usuário"
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Cargo e Senha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: user.role === 'premium_admin' ? '#ede9fe' : '#f1f5f9',
                  color: user.role === 'premium_admin' ? '#5b21b6' : '#475569'
                }}>
                  {user.badge || (user.role === 'premium_admin' ? 'Admin' : 'Operador')}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Senha: ••••••••
                </span>
              </div>

              {/* Plataformas Relacionadas a este Usuário */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                  Plataformas Relacionadas
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(user.platforms || []).map((p, idx) => (
                    <span
                      key={p.id || idx}
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 9px',
                        borderRadius: '12px',
                        background: p.color || '#f1f5f9',
                        color: p.color === '#facc15' ? '#1e293b' : '#ffffff'
                      }}
                    >
                      {p.name}
                    </span>
                  ))}
                  {(!user.platforms || user.platforms.length === 0) && (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Nenhuma plataforma vinculada ainda
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
