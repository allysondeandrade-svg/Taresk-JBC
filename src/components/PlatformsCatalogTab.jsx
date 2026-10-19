import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Globe, Palette, X } from 'lucide-react';

const PRESET_COLORS = [
  '#f97316', // Laranja (Shopee)
  '#facc15', // Amarelo (Mercado Livre)
  '#334155', // Slate/Preto (Amazon)
  '#38bdf8', // Azul Celeste (Magalu)
  '#000000', // Preto (Shein)
  '#ff004f', // Rosa/Vermelho (TikTok)
  '#10b981', // Verde
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4'  // Ciano
];

export default function PlatformsCatalogTab({
  platforms = [],
  users = [],
  currentUser = {},
  onAddPlatform,
  onUpdatePlatform,
  onDeletePlatform
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    name: '',
    color: '#f97316',
    description: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    color: '#f97316',
    description: ''
  });

  const handleSaveNew = (e) => {
    e.preventDefault();
    if (!newPlatform.name.trim()) {
      alert('Informe o nome da plataforma.');
      return;
    }

    onAddPlatform({
      id: 'plat_' + Date.now(),
      name: newPlatform.name.trim(),
      color: newPlatform.color || '#f97316',
      description: newPlatform.description.trim()
    });

    setNewPlatform({
      name: '',
      color: '#f97316',
      description: ''
    });
    setIsAdding(false);
  };

  const startEdit = (plat) => {
    setEditingId(plat.id);
    setEditForm({
      name: plat.name,
      color: plat.color || '#f97316',
      description: plat.description || ''
    });
  };

  const handleSaveEdit = (id) => {
    if (!editForm.name.trim()) return;
    onUpdatePlatform(id, {
      name: editForm.name.trim(),
      color: editForm.color,
      description: editForm.description.trim()
    });
    setEditingId(null);
  };

  // Contar quantos usuários utilizam cada plataforma
  const getUserCountForPlatform = (plat) => {
    return users.filter(u =>
      (u.platforms || []).some(p =>
        (p.id && p.id === plat.id) ||
        (p.name && p.name.toLowerCase().includes(plat.name.toLowerCase()))
      )
    ).length;
  };

  return (
    <div>
      {/* Topo da sub-aba de Plataformas */}
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
            Plataformas & Marketplaces
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Cadastre os canais de venda da sua empresa para relacioná-los aos colaboradores
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
            gap: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Nova Plataforma
        </button>
      </div>

      {/* Formulário Novo Canal/Plataforma */}
      {isAdding && (
        <form
          onSubmit={handleSaveNew}
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
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
              Cadastrar Nova Plataforma
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Nome da Plataforma *
              </label>
              <input
                type="text"
                placeholder="Ex: Shopee, Mercado Livre, Loja Integrada..."
                value={newPlatform.name}
                onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Descrição / Notas
              </label>
              <input
                type="text"
                placeholder="Ex: Conta Principal, Filial 1, etc."
                value={newPlatform.description}
                onChange={(e) => setNewPlatform({ ...newPlatform, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Cor de Identificação
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewPlatform({ ...newPlatform, color: c })}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: newPlatform.color === c ? '3px solid #1e293b' : '1px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transform: newPlatform.color === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={newPlatform.color}
                  onChange={(e) => setNewPlatform({ ...newPlatform, color: e.target.value })}
                  style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer', padding: 0 }}
                  title="Cor personalizada"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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
                color: '#ffffff',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Salvar Plataforma
            </button>
          </div>
        </form>
      )}

      {/* Grid de Plataformas Cadastradas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {platforms.map((plat) => {
          const isEditing = editingId === plat.id;
          const assignedCount = getUserCountForPlatform(plat);

          return (
            <div
              key={plat.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Barra lateral colorida da plataforma */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '6px',
                backgroundColor: plat.color || '#5925dc'
              }} />

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}
                    placeholder="Nome da plataforma"
                  />
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                    placeholder="Descrição"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, color: c })}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: editForm.color === c ? '2px solid #1e293b' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#e2e8f0',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(plat.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: plat.color || '#5925dc',
                            display: 'inline-block'
                          }}
                        />
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                          {plat.name}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => startEdit(plat)}
                          title="Editar plataforma"
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
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir a plataforma "${plat.name}"?`)) {
                              onDeletePlatform(plat.id);
                            }
                          }}
                          title="Excluir plataforma"
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
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', minHeight: '18px' }}>
                      {plat.description || 'Canal de vendas ativo'}
                    </p>
                  </div>

                  <div style={{
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Colaboradores vinculados:
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: assignedCount > 0 ? '#ede9fe' : '#f1f5f9',
                      color: assignedCount > 0 ? '#5b21b6' : '#94a3b8'
                    }}>
                      {assignedCount} {assignedCount === 1 ? 'usuário' : 'usuários'}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {platforms.length === 0 && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          color: '#64748b',
          border: '1px dashed #cbd5e1'
        }}>
          Nenhuma plataforma cadastrada ainda. Clique em "+ Nova Plataforma" para cadastrar canais como Shopee, Mercado Livre, Amazon, etc.
        </div>
      )}
    </div>
  );
}
