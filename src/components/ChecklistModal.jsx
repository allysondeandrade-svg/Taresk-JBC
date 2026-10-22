import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Check, 
  Bookmark, FolderOpen, Save, RefreshCw, AlertCircle
} from 'lucide-react';

const TEMPLATES_STORAGE_KEY = 'taresk_checklist_templates';

export default function ChecklistModal({
  isOpen,
  onClose,
  task,
  onToggleChecklistItem,
  onAddChecklistItem,
  onUpdateTaskChecklist,
  templates: propTemplates = [],
  onSaveTemplate,
  onDeleteTemplate
}) {
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState('');
  
  // Modelos / Templates
  const [localTemplates, setLocalTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Carrega modelos locais ou mescla com os da planilha
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        setLocalTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar modelos de checklist:', e);
    }
  }, [isOpen]);

  // Se vierem templates da planilha (propTemplates), damos preferência a eles ou mesclamos
  const templates = propTemplates && propTemplates.length > 0 
    ? propTemplates 
    : localTemplates;

  if (!isOpen || !task) return null;

  const checklist = task.checklist || [];
  const completedCount = checklist.filter(c => c.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    if (newItemText.trim()) {
      if (onAddChecklistItem) {
        onAddChecklistItem(task.id, newItemText.trim());
      } else if (onUpdateTaskChecklist) {
        const newItem = {
          id: `item_${Date.now()}`,
          label: newItemText.trim(),
          completed: false
        };
        onUpdateTaskChecklist(task.id, [...checklist, newItem]);
      }
      setNewItemText('');
    }
  };

  // Mover item para cima
  const handleMoveUp = (e, index) => {
    e.stopPropagation();
    if (index === 0) return;
    const newChecklist = [...checklist];
    const temp = newChecklist[index - 1];
    newChecklist[index - 1] = newChecklist[index];
    newChecklist[index] = temp;
    if (onUpdateTaskChecklist) {
      onUpdateTaskChecklist(task.id, newChecklist);
    }
  };

  // Mover item para baixo
  const handleMoveDown = (e, index) => {
    e.stopPropagation();
    if (index === checklist.length - 1) return;
    const newChecklist = [...checklist];
    const temp = newChecklist[index + 1];
    newChecklist[index + 1] = newChecklist[index];
    newChecklist[index] = temp;
    if (onUpdateTaskChecklist) {
      onUpdateTaskChecklist(task.id, newChecklist);
    }
  };

  // Iniciar edição
  const handleStartEdit = (e, item) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditingText(item.label);
  };

  // Salvar edição
  const handleSaveEdit = (e, itemId) => {
    e.stopPropagation();
    if (!editingText.trim()) return;
    const newChecklist = checklist.map(c => 
      c.id === itemId ? { ...c, label: editingText.trim() } : c
    );
    if (onUpdateTaskChecklist) {
      onUpdateTaskChecklist(task.id, newChecklist);
    }
    setEditingItemId(null);
    setEditingText('');
  };

  // Cancelar edição
  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingItemId(null);
    setEditingText('');
  };

  // Excluir item
  const handleDeleteItem = (e, itemId) => {
    e.stopPropagation();
    const newChecklist = checklist.filter(c => c.id !== itemId);
    if (onUpdateTaskChecklist) {
      onUpdateTaskChecklist(task.id, newChecklist);
    }
  };

  // Salvar checklist atual como Modelo
  const handleSaveAsTemplate = (e) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    if (checklist.length === 0) {
      alert('O checklist atual está vazio!');
      return;
    }

    const newTemplate = {
      id: `tmpl_${Date.now()}`,
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
      items: checklist.map(c => c.label) // guarda apenas o texto das etapas
    };

    const updatedTemplates = [...localTemplates.filter(t => t.name.toLowerCase() !== newTemplate.name.toLowerCase()), newTemplate];
    setLocalTemplates(updatedTemplates);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));

    // Salva na planilha via callback
    if (onSaveTemplate) {
      onSaveTemplate(newTemplate);
    }

    setShowSaveTemplateModal(false);
    setTemplateName('');
    showFeedback(`Modelo "${newTemplate.name}" salvo e sincronizado na planilha!`);
  };

  // Excluir um modelo salvo
  const handleDeleteTemplate = (templateId) => {
    const updated = localTemplates.filter(t => t.id !== templateId);
    setLocalTemplates(updated);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));

    // Exclui da planilha via callback
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
    }
  };

  // Requisitar / Aplicar Modelo à Tarefa Atual (APENAS a ela!)
  const handleApplyTemplate = (template) => {
    if (!template || !Array.isArray(template.items)) return;

    // Converte os itens do modelo em itens de checklist para a tarefa atual
    const newItems = template.items.map((label, idx) => ({
      id: `chk_${Date.now()}_${idx}`,
      label,
      completed: false
    }));

    if (onUpdateTaskChecklist) {
      onUpdateTaskChecklist(task.id, newItems);
    }

    setShowLoadTemplateModal(false);
    showFeedback(`Modelo "${template.name}" aplicado a esta tarefa!`);
  };

  return (
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
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '15px',
              color: '#64748b',
              fontWeight: '700'
            }}>
              Checklist da Tarefa
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: '600'
            }}>
              Personalizado nesta tarefa
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Título do produto */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', lineHeight: '1.3' }}>
            {task.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Progresso do checklist: <strong>{completedCount} de {totalCount}</strong> concluídos ({progressPercent}%)
            </span>
          </div>
          {/* Barra de progresso */}
          <div style={{
            height: '6px',
            background: '#e2e8f0',
            borderRadius: '9999px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Barra de Ações de Modelo (Salvar Modelo / Requisitar Modelo) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={15} color="#5925dc" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
              Modelos de Checklist:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setShowSaveTemplateModal(true);
                setShowLoadTemplateModal(false);
                setTemplateName(task.title ? `Modelo ${task.title.slice(0, 25)}` : 'Meu Modelo');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#ede9fe',
                color: '#5925dc',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid #ddd6fe',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Salvar o checklist atual desta tarefa como um modelo reutilizável"
            >
              <Save size={13} />
              Salvar modelo
            </button>

            <button
              onClick={() => {
                setShowLoadTemplateModal(true);
                setShowSaveTemplateModal(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#f1f5f9',
                color: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Requisitar e carregar um modelo já salvo nesta tarefa"
            >
              <FolderOpen size={13} />
              Requisitar modelo ({templates.length})
            </button>
          </div>
        </div>

        {/* Feedback visual temporário */}
        {feedbackMsg && (
          <div style={{
            padding: '8px 12px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            {feedbackMsg}
          </div>
        )}

        {/* Modal/Seção Inline: Salvar Modelo */}
        {showSaveTemplateModal && (
          <form 
            onSubmit={handleSaveAsTemplate}
            style={{
              padding: '14px',
              background: '#f5f3ff',
              border: '1.5px solid #c4b5fd',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#5b21b6' }}>
                Salvar Checklist como Novo Modelo
              </span>
              <button 
                type="button" 
                onClick={() => setShowSaveTemplateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6d28d9' }}
              >
                <X size={15} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6d28d9', margin: 0 }}>
              Este modelo salvará a lista de <strong>{checklist.length} etapas</strong> para ser usada em qualquer outra tarefa com 1 clique.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nome do modelo (ex: Padrão Fogões, Fotos Ambientadas...)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #a78bfa',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#5925dc',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Salvar
              </button>
            </div>
          </form>
        )}

        {/* Modal/Seção Inline: Requisitar Modelo */}
        {showLoadTemplateModal && (
          <div style={{
            padding: '14px',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                Requisitar Modelo Salvo
              </span>
              <button 
                type="button" 
                onClick={() => setShowLoadTemplateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={15} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
              Escolha um modelo abaixo para substituir o checklist desta tarefa atual (não afeta outras tarefas):
            </p>

            {templates.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Nenhum modelo salvo ainda. Monte o checklist desta tarefa e clique em "Salvar modelo".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {templates.map(tmpl => (
                  <div 
                    key={tmpl.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        {tmpl.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {tmpl.items?.length || 0} itens • {tmpl.items?.slice(0, 3).join(', ')}...
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleApplyTemplate(tmpl)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: '#5925dc',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Aplicar nesta tarefa
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '6px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="Excluir este modelo salvo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista com o Checklist com Edição, Reordenação (Mover) e Exclusão */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {checklist.length === 0 ? (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center', 
              color: '#94a3b8', 
              background: '#f8fafc', 
              borderRadius: '12px',
              border: '1px dashed #cbd5e1'
            }}>
              Nenhum item no checklist desta tarefa. Adicione itens abaixo ou carregue um modelo.
            </div>
          ) : (
            checklist.map((item, index) => {
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: item.completed ? '#f0fdf4' : '#ffffff',
                    border: item.completed ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Lado Esquerdo: Checkbox + Label ou Input de Edição */}
                  <div 
                    onClick={() => !isEditing && onToggleChecklistItem(task.id, item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1,
                      cursor: isEditing ? 'default' : 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {/* Checkbox estilizado */}
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: item.completed ? '2px solid #16a34a' : '2px solid #64748b',
                      background: item.completed ? '#16a34a' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '900',
                      flexShrink: 0
                    }}>
                      {item.completed ? '✓' : ''}
                    </div>

                    {isEditing ? (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
                      >
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(e, item.id);
                            if (e.key === 'Escape') handleCancelEdit(e);
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            border: '1.5px solid #5925dc',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(e, item.id)}
                          style={{
                            padding: '6px 10px',
                            background: '#16a34a',
                            color: '#ffffff',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Confirmar alteração"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{
                            padding: '6px 10px',
                            background: '#e2e8f0',
                            color: '#475569',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '15px',
                        fontWeight: item.completed ? '600' : '700',
                        color: item.completed ? '#166534' : '#1e293b',
                        textDecoration: item.completed ? 'line-through' : 'none',
                        wordBreak: 'break-word'
                      }}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Lado Direito: Ações de Mover (Reordenar), Editar e Excluir */}
                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {/* Mover para cima */}
                      <button
                        type="button"
                        onClick={(e) => handleMoveUp(e, index)}
                        disabled={index === 0}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: index === 0 ? 'transparent' : '#f1f5f9',
                          color: index === 0 ? '#cbd5e1' : '#475569',
                          border: 'none',
                          cursor: index === 0 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Mover para cima"
                      >
                        <ArrowUp size={14} />
                      </button>

                      {/* Mover para baixo */}
                      <button
                        type="button"
                        onClick={(e) => handleMoveDown(e, index)}
                        disabled={index === checklist.length - 1}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: index === checklist.length - 1 ? 'transparent' : '#f1f5f9',
                          color: index === checklist.length - 1 ? '#cbd5e1' : '#475569',
                          border: 'none',
                          cursor: index === checklist.length - 1 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Mover para baixo"
                      >
                        <ArrowDown size={14} />
                      </button>

                      {/* Editar texto do item */}
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(e, item)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Editar nome deste item"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Excluir item */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Excluir este item da tarefa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Adicionar novo item ao checklist */}
        <form onSubmit={handleAddNew} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Adicionar novo item de mídia/descrição..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#5925dc',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Item
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
