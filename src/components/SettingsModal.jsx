import React, { useState } from 'react';
import { X, Settings, Database, Palette, CheckSquare, Plus, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';

export const APP_THEMES = [
  { id: 'default', name: 'Roxo Taresk (Padrão)', primary: '#5925dc', light: '#ecebfa', gradient: 'linear-gradient(135deg, #6c5ce7 0%, #4834d4 100%)' },
  { id: 'emerald', name: 'Esmeralda / Verde', primary: '#059669', light: '#ecfdf5', gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
  { id: 'ocean', name: 'Azul Oceano', primary: '#0284c7', light: '#f0f9ff', gradient: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)' },
  { id: 'sunset', name: 'Laranja Solar', primary: '#ea580c', light: '#fff7ed', gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' },
  { id: 'midnight', name: 'Preto & Grafite', primary: '#0f172a', light: '#f1f5f9', gradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' },
  { id: 'rose', name: 'Rosa Magenta', primary: '#db2777', light: '#fdf2f8', gradient: 'linear-gradient(135deg, #f43f5e 0%, #be185d 100%)' }
];

export default function SettingsModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  defaultChecklistItems = [],
  onUpdateDefaultChecklist
}) {
  const [sheetsUrl, setSheetsUrl] = useState(() => localStorage.getItem('taresk_sheets_api_url') || '');
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'planilha' ou 'cores'
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [checklistItems, setChecklistItems] = useState(defaultChecklistItems);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');

  if (!isOpen) return null;

  const handleSaveSheets = (e) => {
    e.preventDefault();
    localStorage.setItem('taresk_sheets_api_url', sheetsUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (newChecklistLabel.trim()) {
      const updated = [...checklistItems, newChecklistLabel.trim()];
      setChecklistItems(updated);
      onUpdateDefaultChecklist(updated);
      setNewChecklistLabel('');
    }
  };

  const handleRemoveChecklistItem = (idx) => {
    const updated = checklistItems.filter((_, i) => i !== idx);
    setChecklistItems(updated);
    onUpdateDefaultChecklist(updated);
  };

  const handleMoveItem = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= checklistItems.length) return;
    const updated = [...checklistItems];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setChecklistItems(updated);
    onUpdateDefaultChecklist(updated);
  };

  const handleEditItemLabel = (idx, newText) => {
    const updated = [...checklistItems];
    updated[idx] = newText;
    setChecklistItems(updated);
    onUpdateDefaultChecklist(updated);
  };

  return (
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
        maxWidth: '580px',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Top Header */}
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#ede9fe',
              color: '#5925dc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Configurações do Aplicativo
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Personalize o checklist padrão, conexão e cores
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Abas Internas da Engrenagem */}
        <div style={{
          display: 'flex',
          padding: '10px 24px 0',
          borderBottom: '1px solid #e2e8f0',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('checklist')}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom: activeTab === 'checklist' ? '2.5px solid #5925dc' : '2.5px solid transparent',
              background: 'transparent',
              color: activeTab === 'checklist' ? '#5925dc' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <CheckSquare size={16} />
            Checklist Padrão
          </button>

          <button
            onClick={() => setActiveTab('planilha')}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom: activeTab === 'planilha' ? '2.5px solid #5925dc' : '2.5px solid transparent',
              background: 'transparent',
              color: activeTab === 'planilha' ? '#5925dc' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Database size={16} />
            Conectar Planilha
          </button>

          <button
            onClick={() => setActiveTab('cores')}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom: activeTab === 'cores' ? '2.5px solid #5925dc' : '2.5px solid transparent',
              background: 'transparent',
              color: activeTab === 'cores' ? '#5925dc' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Palette size={16} />
            Alterar Cores
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block' }}>
                  Itens Padrões do Checklist de Produtos (Foto 2)
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Edite os nomes, reordene ou adicione novos itens. As novas tarefas criadas usarão esta lista como base.
                </span>
              </div>

              {/* Lista dos Itens com Edição Inline, Mover e Excluir */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '320px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0'
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleEditItemLabel(idx, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, -1)}
                        disabled={idx === 0}
                        title="Mover para cima"
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.4 : 1,
                          color: '#475569'
                        }}
                      >
                        <ArrowUp size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 1)}
                        disabled={idx === checklistItems.length - 1}
                        title="Mover para baixo"
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: idx === checklistItems.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === checklistItems.length - 1 ? 0.4 : 1,
                          color: '#475569'
                        }}
                      >
                        <ArrowDown size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(idx)}
                        title="Excluir este item"
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulário para adicionar novo item */}
              <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Nome do novo item do checklist..."
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> Adicionar
                </button>
              </form>
            </div>
          )}

          {activeTab === 'planilha' && (
            <form onSubmit={handleSaveSheets} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  URL do Google Apps Script (Web App /exec):
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '6px' }}>
                  Cole o link gerado na implantação do script do Google Sheets para sincronizar usuários, tarefas ativas e finalizadas.
                </span>
              </div>

              {saveSuccess && (
                <div style={{
                  background: '#ecfdf5',
                  color: '#065f46',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Check size={16} /> Planilha conectada e salva com sucesso!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
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
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Salvar Conexão
                </button>
              </div>
            </form>
          )}

          {activeTab === 'cores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Selecione o esquema de cores principal do aplicativo:
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {APP_THEMES.map(th => {
                  const isSelected = currentTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onSelectTheme(th.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: isSelected ? `2.5px solid ${th.primary}` : '1.5px solid #e2e8f0',
                        background: isSelected ? th.light : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: th.gradient,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                        }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                          {th.name}
                        </span>
                      </div>
                      {isSelected && <Check size={16} color={th.primary} />}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#5925dc',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
