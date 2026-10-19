import React, { useState, useRef } from 'react';
import { X, Search, Calendar, User, FileText, CheckSquare, Plus, AlertCircle } from 'lucide-react';
import { DEFAULT_CHECKLIST_ITEMS } from '../data/initialData';

export default function NewTaskModal({
  isOpen,
  onClose,
  products = [],
  users = [],
  platforms = [],
  currentUser,
  onCreateTask,
  defaultChecklistItems
}) {
  const [taskType, setTaskType] = useState('product_catalog'); // 'product_catalog' ou 'special'
  const [selectedProductId, setSelectedProductId] = useState(() => products[0]?.sku || products[0]?.id || '');
  const [productSearch, setProductSearch] = useState('');
  const [specialTitle, setSpecialTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState(
    currentUser.role === 'premium_admin' ? (users[1]?.id || currentUser.id) : currentUser.id
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const dateInputRef = useRef(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  // Subtarefas para tarefa especial
  const [subtasks, setSubtasks] = useState([
    'Roteiro e preparação',
    'Gravação / Produção',
    'Edição e pós-produção',
    'Publicação nos canais'
  ]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      setSubtasks([...subtasks, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeChecklistDefaults = defaultChecklistItems && defaultChecklistItems.length > 0
      ? defaultChecklistItems
      : DEFAULT_CHECKLIST_ITEMS;

    const assignedUser = users.find(u => u.id === assignedTo) || currentUser;

    if (taskType === 'special') {
      if (!specialTitle.trim()) {
        alert('Por favor, descreva a tarefa especial.');
        return;
      }

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'special',
        productId: null,
        title: specialTitle.trim(),
        assignedTo,
        assignedByName: assignedUser?.name || currentUser.name,
        createdById: currentUser.id,
        dueDate: dueDate.trim() || '25/10',
        status: 'in_progress',
        checklist: subtasks.map((st, i) => ({
          id: `sp_${Date.now()}_${i}`,
          label: st,
          completed: false
        })),
        notes
      });
    } else {
      const prod = products.find(p => p.sku === selectedProductId || p.id === selectedProductId) || products[0];
      const title = prod ? (prod.sku || prod.title || 'Produto') : (selectedProductId || 'Produto Novo');
      const finalProductId = prod?.sku || prod?.id || selectedProductId;

      // Monta os marketplaces com base nas plataformas do usuário atribuído (ou gerais)
      const userPlats = (assignedUser?.platforms && assignedUser.platforms.length > 0)
        ? assignedUser.platforms
        : (platforms && platforms.length > 0 ? platforms : [
            { id: 'shopee', name: 'Shopee' },
            { id: 'mercadoLivre', name: 'Mercado L' },
            { id: 'amazon', name: 'Amazon' },
            { id: 'magalu', name: 'Magalu' }
          ]);

      const initialMarketplaces = {};
      userPlats.forEach(p => {
        const key = p.id || p.name;
        initialMarketplaces[key] = { status: 'pending', active: false, u: false, o: false, name: p.name, color: p.color };
      });

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'product_catalog',
        productId: finalProductId,
        title: title,
        assignedTo,
        assignedByName: assignedUser?.name || currentUser.name,
        createdById: currentUser.id,
        dueDate: dueDate.trim() || '25/10',
        status: 'in_progress',
        marketplaces: initialMarketplaces,
        checklist: activeChecklistDefaults.map((item, idx) => ({
          id: `chk_${Date.now()}_${idx}`,
          label: item,
          completed: false
        })),
        notes
      });
    }

    onClose();
  };

  const filteredProducts = products.filter(p =>
    !productSearch ||
    (p.title && p.title.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '32px'
      }}>
        {/* Cabeçalho do Modal estilo Página 5 do PDF */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: '#5925dc',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '15px',
              fontWeight: '800'
            }}>
              Nova Tarefa +
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
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

        {/* Seleção do Tipo de Tarefa: Cadastro de Produto vs Tarefa Especial (Página 5 do PDF) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <button
            type="button"
            onClick={() => setTaskType('product_catalog')}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              fontSize: '17px',
              fontWeight: '800',
              color: taskType === 'product_catalog' ? '#5925dc' : '#475569',
              background: taskType === 'product_catalog' ? '#ecebfa' : 'transparent',
              border: taskType === 'product_catalog' ? '1.5px solid #a78bfa' : '1.5px solid #cbd5e1'
            }}
          >
            Cadastro de Produto
          </button>

          <button
            type="button"
            onClick={() => setTaskType('special')}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              fontSize: '17px',
              fontWeight: '800',
              color: taskType === 'special' ? '#5925dc' : '#475569',
              background: taskType === 'special' ? '#ecebfa' : 'transparent',
              border: taskType === 'special' ? '1.5px solid #a78bfa' : '1.5px solid #cbd5e1'
            }}
          >
            Tarefa Especial
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Se for Cadastro de Produto: Campo com ícone de lupa "Digite o Produto" (Página 5) */}
          {taskType === 'product_catalog' ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                Selecione o Produto para Cadastrar nos Marketplaces *
              </label>
              
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Digite o Produto para buscar..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 20px 14px 44px',
                    borderRadius: '9999px',
                    border: '2px solid #0f172a',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#1e293b',
                    background: '#ffffff'
                  }}
                />
                <Search size={18} color="#0f172a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b',
                  background: '#f8fafc'
                }}
              >
                {filteredProducts.map(p => (
                  <option key={p.id || p.sku} value={p.sku || p.id}>
                    {p.sku} {p.title ? `- ${p.title}` : ''} {p.cost ? `(Custo: R$ ${Number(p.cost).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Ao criar, esta tarefa gerará o checklist de fotos e os canais de marketplace do colaborador atribuído.
              </span>
            </div>
          ) : (
            /* Se for Tarefa Especial: Campo "Descreva a Tarefa" e Subtarefas (Página 5) */
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                Descreva a Tarefa Especial *
              </label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Ex: Fazer Vídeo do Fogão 2 Bocas"
                  value={specialTitle}
                  onChange={(e) => setSpecialTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '9999px',
                    border: '2px solid #0f172a',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}
                />
              </div>

              {/* Subtarefas como destacado no Mockup da Página 5 */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#5925dc',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckSquare size={16} /> Subtarefas da Ação
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {subtasks.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#1e293b' }}>
                        {idx + 1}. {st}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Adicionar subtarefa..."
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    style={{
                      background: '#5925dc',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Atribuição de Usuário & Prazo (Data de Conclusão dd/mm) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Atribuir para o Usuário
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={currentUser.role !== 'premium_admin'}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: currentUser.role !== 'premium_admin' ? '#f1f5f9' : '#fff',
                  color: '#1e293b'
                }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.name} {u.role === 'premium_admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
              {currentUser.role !== 'premium_admin' && (
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Usuários criam tarefas diretamente para si.
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Data de Conclusão (dd/mm)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ex: 28/10"
                  maxLength={5}
                  value={dueDate}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, ''); // só dígitos
                    if (v.length > 2) {
                      v = v.slice(0, 2) + '/' + v.slice(2, 4);
                    }
                    setDueDate(v);
                  }}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0f172a'
                  }}
                />

                {/* Seletor de data via Calendário que formata automaticamente em dd/mm */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={dateInputRef}
                    id="new-task-date-picker"
                    type="date"
                    value={(() => {
                      if (dueDate && dueDate.includes('/')) {
                        const parts = dueDate.split('/');
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
                        setDueDate(`${day}/${month}`);
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
                    onClick={handleOpenDatePicker}
                    title="Escolher data no calendário"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 14px',
                      borderRadius: '10px',
                      background: '#ede9fe',
                      border: '1.5px solid #c4b5fd',
                      fontSize: '18px',
                      height: '42px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Observações / Instruções Especiais
            </label>
            <textarea
              rows={2}
              placeholder="Instruções para a equipe de catálogo ou mídia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                borderRadius: '9999px',
                border: '1.5px solid #cbd5e1',
                color: '#475569',
                fontWeight: '700',
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 32px',
                borderRadius: '9999px',
                background: '#5925dc',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                boxShadow: '0 4px 15px rgba(89, 37, 220, 0.4)'
              }}
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
