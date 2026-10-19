import React, { useState } from 'react';
import { X, CheckSquare, Plus, Trash2, Sparkles, Layers } from 'lucide-react';

export default function ChecklistModal({
  isOpen,
  onClose,
  task,
  onToggleChecklistItem,
  onAddChecklistItem
}) {
  const [newItemText, setNewItemText] = useState('');

  if (!isOpen || !task) return null;

  const checklist = task.checklist || [];
  const completedCount = checklist.filter(c => c.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddNew = (e) => {
    e.preventDefault();
    if (newItemText.trim()) {
      onAddChecklistItem(task.id, newItemText.trim());
      setNewItemText('');
    }
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
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '32px'
      }}>
        {/* Cabeçalho do Checklist conforme solicitado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '15px',
              color: '#64748b',
              fontWeight: '700'
            }}>
              Checklist da Tarefa
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
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Título do produto */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
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

        {/* Lista com o Checklist Exato da Página 6 do PDF */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleChecklistItem(task.id, item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: item.completed ? '#f0fdf4' : '#ffffff',
                border: item.completed ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!item.completed) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!item.completed) e.currentTarget.style.background = '#ffffff';
              }}
            >
              {/* Checkbox estilizado com ícone exato da página 6 */}
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

              <span style={{
                fontSize: '16px',
                fontWeight: item.completed ? '600' : '700',
                color: item.completed ? '#166534' : '#1e293b',
                textDecoration: item.completed ? 'line-through' : 'none'
              }}>
                {item.label}
              </span>
            </div>
          ))}
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
              fontSize: '14px'
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
              fontSize: '14px'
            }}
          >
            + Item
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
