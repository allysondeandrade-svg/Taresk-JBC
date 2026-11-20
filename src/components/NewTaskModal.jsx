import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Calendar, User, CheckSquare, Plus, Edit2, Copy, Trash2, ArrowUp, ArrowDown, Package, CheckCircle2 } from 'lucide-react';
import ProductSearchAutocomplete from './ProductSearchAutocomplete';
import { DEFAULT_CHECKLIST_ITEMS } from '../data/initialData';

export default function NewTaskModal({
  isOpen,
  onClose,
  products = [],
  users = [],
  platforms = [],
  currentUser: rawCurrentUser,
  onCreateTask,
  defaultChecklistItems
}) {
  const currentUser = rawCurrentUser || users[0] || { id: 'user_master', name: 'Administrador', role: 'premium_admin' };
  
  // 3 Tipos de Tarefas solicitadas: 'simple', 'product_catalog', 'recurrent'
  const [taskType, setTaskType] = useState('simple');
  const [description, setDescription] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [recurrenceFreq, setRecurrenceFreq] = useState('semanal');
  const [selectedWeekdays, setSelectedWeekdays] = useState(['seg']);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState([]);

  // Encontra o usuário Allyson ou admin
  const allysonUser = users.find(u => {
    const n = (u.name || '').toLowerCase();
    const e = (u.email || '').toLowerCase();
    return n.includes('allyson') || e.includes('allyson') || e.includes('eletrojbc');
  }) || users[0] || currentUser;

  const [assignedTo, setAssignedTo] = useState(() => {
    return currentUser?.id || allysonUser?.id || 'user_master';
  });

  useEffect(() => {
    if (!assignedTo && currentUser?.id) {
      setAssignedTo(currentUser.id);
    }
  }, [taskType, currentUser]);

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [notes, setNotes] = useState('');
  const dateInputRef = useRef(null);

  // Subtarefas
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [draggedSubtaskIndex, setDraggedSubtaskIndex] = useState(null);

  // Limpa campos ao abrir
  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setNotes('');
      setProductSearch('');
      setSubtasks([]);
      setNewSubtaskInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (platforms && platforms.length > 0 && selectedPlatformIds.length === 0) {
      setSelectedPlatformIds(platforms.map(p => p.id || p.name));
    }
  }, [platforms, isOpen]);

  useEffect(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0]?.sku || products[0]?.id || '');
    }
  }, [products, selectedProductId, isOpen]);

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

  const handleAddSubtaskFromText = (text) => {
    if (!text.trim()) return;
    setSubtasks([...subtasks, text.trim()]);
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleMoveSubtask = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= subtasks.length) return;
    const updated = [...subtasks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setSubtasks(updated);
  };

  const handleDuplicateSubtask = (index) => {
    const item = subtasks[index];
    const updated = [...subtasks];
    updated.splice(index + 1, 0, `${item} (Cópia)`);
    setSubtasks(updated);
  };

  const handleStartEditSubtask = (index) => {
    setEditingSubtaskIndex(index);
    setEditingSubtaskText(subtasks[index]);
  };

  const handleSaveEditSubtask = (index) => {
    if (!editingSubtaskText.trim()) return;
    const updated = [...subtasks];
    updated[index] = editingSubtaskText.trim();
    setSubtasks(updated);
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeChecklistDefaults = defaultChecklistItems && defaultChecklistItems.length > 0
      ? defaultChecklistItems
      : DEFAULT_CHECKLIST_ITEMS;

    const assignedUser = users.find(u => u.id === assignedTo) || currentUser;

    // Garante data no formato dd/mm
    let formattedDue = dueDate.trim() || '25/10';
    if (!/^\d{1,2}\/\d{1,2}$/.test(formattedDue)) {
      const d = new Date(formattedDue);
      if (!isNaN(d.getTime())) {
        formattedDue = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    if (taskType === 'simple') {
      if (!description.trim()) {
        alert('Por favor, informe a descrição da Tarefa Simples.');
        return;
      }

      const assignedTargetUser = assignedUser || currentUser || allysonUser;

      const taskChecklist = subtasks && subtasks.length > 0
        ? subtasks.map((st, i) => ({
            id: `chk_${Date.now()}_${i}`,
            label: st,
            completed: false
          }))
        : [
            {
              id: `chk_${Date.now()}_0`,
              label: description.trim(),
              completed: false
            }
          ];

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'simple',
        productId: null,
        title: description.trim(),
        assignedTo: assignedTargetUser.id,
        assignedByName: assignedTargetUser.name,
        createdById: currentUser.id,
        dueDate: formattedDue,
        status: 'in_progress',
        checklist: taskChecklist,
        notes
      });
    } else if (taskType === 'recurrent') {
      if (!description.trim()) {
        alert('Por favor, informe a descrição da Tarefa Recorrente.');
        return;
      }

      const initialMarketplaces = {};
      const allAvailPlats = (platforms && platforms.length > 0) ? platforms : [
        { id: 'shopee', name: 'Shopee', color: '#f97316' },
        { id: 'mercadoLivre', name: 'Mercado L', color: '#facc15' },
        { id: 'amazon', name: 'Amazon', color: '#334155' },
        { id: 'magalu', name: 'Magalu', color: '#38bdf8' }
      ];

      allAvailPlats.forEach(p => {
        const key = p.id || p.name;
        if (selectedPlatformIds.includes(key) || selectedPlatformIds.includes(p.name)) {
          initialMarketplaces[key] = {
            status: 'pending',
            active: false,
            u: false,
            o: false,
            name: p.name,
            color: p.color
          };
        }
      });

      const taskChecklist = subtasks && subtasks.length > 0
        ? subtasks.map((st, i) => ({
            id: `rec_${Date.now()}_${i}`,
            label: st,
            completed: false
          }))
        : [
            {
              id: `rec_${Date.now()}_0`,
              label: description.trim(),
              completed: false
            }
          ];

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'recurrent',
        productId: null,
        sku: description.trim(),
        title: description.trim(),
        assignedTo,
        assignedByName: assignedUser?.name || currentUser.name,
        createdById: currentUser.id,
        dueDate: formattedDue,
        status: 'in_progress',
        recurrence: {
          frequency: recurrenceFreq,
          weekdays: selectedWeekdays,
          platforms: selectedPlatformIds
        },
        marketplaces: initialMarketplaces,
        checklist: taskChecklist,
        notes
      });
    } else {
      // Produto
      let prod = products.find(p => p.sku === selectedProductId || p.id === selectedProductId);
      if (!prod && productSearch.trim()) {
        prod = products.find(p =>
          (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
          (p.title && p.title.toLowerCase().includes(productSearch.toLowerCase()))
        );
      }
      if (!prod && products.length > 0) {
        prod = products[0];
      }

      const finalSku = prod?.sku || selectedProductId || 'PROD';
      const title = description.trim() || finalSku;
      const finalProductId = finalSku;

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

      const taskChecklist = subtasks && subtasks.length > 0
        ? subtasks.map((st, i) => ({
            id: `chk_${Date.now()}_${i}`,
            label: st,
            completed: false
          }))
        : activeChecklistDefaults.map((item, idx) => ({
            id: `chk_${Date.now()}_${idx}`,
            label: item,
            completed: false
          }));

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'product_catalog',
        productId: finalProductId,
        sku: finalSku,
        title: title,
        assignedTo,
        assignedByName: assignedUser?.name || currentUser.name,
        createdById: currentUser.id,
        dueDate: formattedDue,
        status: 'in_progress',
        marketplaces: initialMarketplaces,
        checklist: taskChecklist,
        notes
      });
    }

    setDescription('');
    setNotes('');
    setSubtasks([]);
    setNewSubtaskInput('');
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
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '24px 28px',
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>

        {/* 1: Cabeçalho com "Nova Tarefa" em preto e mesma fonte das abas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            Nova Tarefa
          </h2>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 2: Três tipos de tarefas: Simples (ícone checklist), Produto (ícone pacote) e Recorrente (ícone calendário) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {/* Simples */}
          <button
            type="button"
            onClick={() => setTaskType('simple')}
            style={{
              padding: '9px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
              color: taskType === 'simple' ? '#5925dc' : '#334155',
              background: taskType === 'simple' ? '#ede9fe' : '#ffffff',
              border: taskType === 'simple' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: taskType === 'simple' ? '0 2px 8px rgba(89, 37, 220, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckCircle2 size={15} color={taskType === 'simple' ? '#5925dc' : '#f97316'} />
            <span>Simples</span>
          </button>

          {/* Produto */}
          <button
            type="button"
            onClick={() => setTaskType('product_catalog')}
            style={{
              padding: '9px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
              color: taskType === 'product_catalog' ? '#5925dc' : '#334155',
              background: taskType === 'product_catalog' ? '#ede9fe' : '#ffffff',
              border: taskType === 'product_catalog' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: taskType === 'product_catalog' ? '0 2px 8px rgba(89, 37, 220, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Package size={15} color={taskType === 'product_catalog' ? '#5925dc' : '#b45309'} />
            <span>Produto</span>
          </button>

          {/* Recorrente */}
          <button
            type="button"
            onClick={() => setTaskType('recurrent')}
            style={{
              padding: '9px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
              color: taskType === 'recurrent' ? '#5925dc' : '#334155',
              background: taskType === 'recurrent' ? '#ede9fe' : '#ffffff',
              border: taskType === 'recurrent' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: taskType === 'recurrent' ? '0 2px 8px rgba(89, 37, 220, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={15} color={taskType === 'recurrent' ? '#5925dc' : '#2563eb'} />
            <span>Recorrente</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Se for Produto: Busca e Autocomplete de Produto estilo Excel */}
          {taskType === 'product_catalog' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#334155',
                display: 'block'
              }}>
                Produto / SKU
              </label>
              <ProductSearchAutocomplete
                products={products}
                value={description}
                onSelect={(p) => {
                  setSelectedProductId(p.sku || p.id);
                  setDescription(p.title || p.sku || '');
                }}
                onChange={(val) => {
                  setDescription(val);
                }}
                placeholder="Buscar por SKU ou Nome do produto..."
                showCost={true}
              />
            </div>
          )}

          {/* 3 & 4: Campo "Descrição" com a mesma fonte e cor de "Atribuir Para", e balão de uma linha */}
          <div>
            <label style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#334155',
              display: 'block',
              marginBottom: '6px'
            }}>
              Descrição
            </label>
            <input
              type="text"
              placeholder=""
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: '100%',
                height: '42px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                color: '#1e293b',
                boxSizing: 'border-box',
                outline: 'none',
                background: '#ffffff',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
            />
          </div>

          {/* Bloco de Subtarefas igual ao print */}
          <div style={{
            background: '#ffffff',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={16} color="#5925dc" />
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#5925dc' }}>
                Subtarefas
              </span>
            </div>

            {/* Lista de Subtarefas adicionadas */}
            {subtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#1e293b', flex: 1, wordBreak: 'break-word' }}>
                      {st}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input para adicionar subtarefa + botão roxo "+ Adicionar" */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Adicionar subtarefa..."
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSubtaskInput.trim()) {
                      handleAddSubtaskFromText(newSubtaskInput);
                      setNewSubtaskInput('');
                    }
                  }
                }}
                style={{
                  flex: 1,
                  height: '38px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#1e293b',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newSubtaskInput.trim()) {
                    handleAddSubtaskFromText(newSubtaskInput);
                    setNewSubtaskInput('');
                  }
                }}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  background: '#5925dc',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(89, 37, 220, 0.25)'
                }}
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* 5: Linha com "Atribuir Para" e "Data de Conclusão" (sem dd/mm) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '14px',
            alignItems: 'flex-start'
          }}>
            {/* Atribuir Para */}
            <div>
              <label style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#334155',
                display: 'block',
                marginBottom: '6px'
              }}>
                Atribuir Para
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1e293b',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} {u.role === 'premium_admin' ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data de Conclusão */}
            <div>
              <label style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#334155',
                display: 'block',
                marginBottom: '6px'
              }}>
                Data de Conclusão
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="24/11"
                  maxLength={5}
                  value={dueDate}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 2) {
                      v = v.slice(0, 2) + '/' + v.slice(2, 4);
                    }
                    setDueDate(v);
                  }}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />

                {/* Botão de Calendário estilo roxo claro com ícone */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={dateInputRef}
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
                      padding: '0 12px',
                      borderRadius: '10px',
                      background: '#ede9fe',
                      border: '1.5px solid #ddd6fe',
                      height: '42px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ddd6fe'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ede9fe'; }}
                  >
                    <span style={{ fontSize: '18px' }}>🗓️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Observações / Instruções Especiais */}
          <div>
            <label style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#334155',
              display: 'block',
              marginBottom: '6px'
            }}>
              Observações / Instruções Especiais
            </label>
            <textarea
              rows={3}
              placeholder="Instruções para a equipe de catálogo ou mídia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                color: '#1e293b',
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Botões Cancelar e Criar Tarefa */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 22px',
                borderRadius: '9999px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 28px',
                borderRadius: '9999px',
                background: '#5925dc',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(89, 37, 220, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
