import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Calendar, User, FileText, CheckSquare, Plus, AlertCircle, GripVertical, Edit2, Copy, Trash2, ArrowUp, ArrowDown, Check } from 'lucide-react';
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
  const [taskType, setTaskType] = useState('simple'); // 'simple', 'product_catalog', 'special' ou 'recurrent'
  const [simpleTitle, setSimpleTitle] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [specialTitle, setSpecialTitle] = useState('');
  const [recurrentTitle, setRecurrentTitle] = useState('');
  const [recurrenceFreq, setRecurrenceFreq] = useState('semanal'); // 'diaria', 'seg_sex', 'semanal', 'quinzenal', 'mensal'
  const [selectedWeekdays, setSelectedWeekdays] = useState(['seg']); // ['seg', 'qua', 'sex'] etc
  const [selectedPlatformIds, setSelectedPlatformIds] = useState([]); // IDs de plataformas escolhidas para a tarefa recorrente

  // Encontra o usuário Allyson ou admin
  const allysonUser = users.find(u => {
    const n = (u.name || '').toLowerCase();
    const e = (u.email || '').toLowerCase();
    return n.includes('allyson') || e.includes('allyson') || e.includes('eletrojbc');
  }) || users[0] || currentUser;

  const [assignedTo, setAssignedTo] = useState(() => {
    return allysonUser?.id || currentUser?.id || 'user_master';
  });

  // Atualiza assignedTo quando mudar para simple
  useEffect(() => {
    if (taskType === 'simple' && allysonUser) {
      setAssignedTo(allysonUser.id);
    }
  }, [taskType, allysonUser]);

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const dateInputRef = useRef(null);

  // Inicializa plataformas selecionadas quando abrir ou quando as plataformas carregarem
  useEffect(() => {
    if (platforms && platforms.length > 0 && selectedPlatformIds.length === 0) {
      setSelectedPlatformIds(platforms.map(p => p.id || p.name));
    }
  }, [platforms, isOpen]);

  // Inicializa e atualiza selectedProductId quando a lista de produtos carrega ou o modal abre
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

  // Subtarefas para Tarefa Simples, Especial ou Recorrente
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [draggedSubtaskIndex, setDraggedSubtaskIndex] = useState(null);

  if (!isOpen) return null;

  // Adicionar subtarefa e liberar automaticamente nova linha
  const handleAddSubtask = () => {
    if (newSubtaskInput && newSubtaskInput.trim()) {
      setSubtasks(prev => [...prev, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleAddSubtaskFromText = (text) => {
    if (text && text.trim()) {
      setSubtasks(prev => [...prev, text.trim()]);
    }
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateSubtask = (index) => {
    setSubtasks(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, prev[index]);
      return copy;
    });
  };

  const handleStartEditSubtask = (index) => {
    setEditingSubtaskIndex(index);
    setEditingSubtaskText(subtasks[index]);
  };

  const handleSaveEditSubtask = (index) => {
    if (editingSubtaskText.trim()) {
      setSubtasks(prev => prev.map((s, i) => i === index ? editingSubtaskText.trim() : s));
    }
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
  };

  const handleMoveSubtask = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= subtasks.length) return;
    setSubtasks(prev => {
      const copy = [...prev];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };


  const toggleWeekday = (dayKey) => {
    if (selectedWeekdays.includes(dayKey)) {
      if (selectedWeekdays.length === 1) return; // manter ao menos 1
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== dayKey));
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayKey]);
    }
  };

  const togglePlatform = (platKey) => {
    if (selectedPlatformIds.includes(platKey)) {
      setSelectedPlatformIds(selectedPlatformIds.filter(id => id !== platKey));
    } else {
      setSelectedPlatformIds([...selectedPlatformIds, platKey]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeChecklistDefaults = defaultChecklistItems && defaultChecklistItems.length > 0
      ? defaultChecklistItems
      : DEFAULT_CHECKLIST_ITEMS;

    const assignedUser = users.find(u => u.id === assignedTo) || currentUser;

    if (taskType === 'simple') {
      if (!simpleTitle.trim()) {
        alert('Por favor, informe o nome da Tarefa Simples.');
        return;
      }

      // Garante data no formato dd/mm
      let formattedDue = dueDate.trim() || '25/10';
      if (!/^\d{1,2}\/\d{1,2}$/.test(formattedDue)) {
        const d = new Date(formattedDue);
        if (!isNaN(d.getTime())) {
          formattedDue = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      const assignedTargetUser = allysonUser || assignedUser || currentUser;

      // Se houver subtarefas, monta o checklist com as subtarefas
      // Caso contrário, usa o próprio título da tarefa simples como único item
      const taskChecklist = subtasks && subtasks.length > 0
        ? subtasks.map((st, i) => ({
            id: `chk_${Date.now()}_${i}`,
            label: st,
            completed: false
          }))
        : [
            {
              id: `chk_${Date.now()}_0`,
              label: simpleTitle.trim(),
              completed: false
            }
          ];

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'simple',
        productId: null,
        title: simpleTitle.trim(),
        assignedTo: assignedTargetUser.id,
        assignedByName: assignedTargetUser.name,
        createdById: currentUser.id,
        dueDate: formattedDue,
        status: 'in_progress',
        checklist: taskChecklist,
        notes
      });
    } else if (taskType === 'recurrent') {

      if (!recurrentTitle.trim()) {
        alert('Por favor, informe o título ou descrição da Tarefa Recorrente.');
        return;
      }


      // Constrói os marketplaces selecionados
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

      // Garante data no formato dd/mm
      let formattedDue = dueDate.trim() || '25/10';
      if (!/^\d{1,2}\/\d{1,2}$/.test(formattedDue)) {
        const d = new Date(formattedDue);
        if (!isNaN(d.getTime())) {
          formattedDue = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      onCreateTask({
        id: 'task_' + Date.now(),
        type: 'recurrent',
        productId: null,
        sku: recurrentTitle.trim(),
        title: recurrentTitle.trim(),
        assignedTo,
        assignedByName: assignedUser?.name || currentUser.name,
        createdById: currentUser.id,
        dueDate: formattedDue,
        status: 'in_progress',
        recurrence: {
          frequency: recurrenceFreq, // 'diaria', 'seg_sex', 'semanal', 'quinzenal', 'mensal'
          weekdays: selectedWeekdays,
          platforms: selectedPlatformIds
        },
        marketplaces: initialMarketplaces,
        checklist: subtasks.map((st, i) => ({
          id: `rec_${Date.now()}_${i}`,
          label: st,
          completed: false
        })),
        notes
      });
    } else if (taskType === 'special') {
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
      const title = finalSku;
      const finalProductId = finalSku;

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

      // Garante data no formato dd/mm
      let formattedDue = dueDate.trim() || '25/10';
      if (!/^\d{1,2}\/\d{1,2}$/.test(formattedDue)) {
        const d = new Date(formattedDue);
        if (!isNaN(d.getTime())) {
          formattedDue = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      }

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
        checklist: activeChecklistDefaults.map((item, idx) => ({
          id: `chk_${Date.now()}_${idx}`,
          label: item,
          completed: false
        })),
        notes
      });
    }

    setSpecialTitle('');
    setRecurrentTitle('');
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
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '12px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '20px 16px',
        boxSizing: 'border-box'
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

        {/* Seleção do Tipo de Tarefa: Grid 2x2 com nomes curtos idênticos ao mockup da direita */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setTaskType('simple')}
            style={{
              padding: '9px 14px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '700',
              color: taskType === 'simple' ? '#5925dc' : '#475569',
              background: taskType === 'simple' ? '#ecebfa' : '#ffffff',
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
            <span>⚡</span>
            <span>Simples</span>
          </button>

          <button
            type="button"
            onClick={() => setTaskType('product_catalog')}
            style={{
              padding: '9px 14px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '700',
              color: taskType === 'product_catalog' ? '#5925dc' : '#475569',
              background: taskType === 'product_catalog' ? '#ecebfa' : '#ffffff',
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
            <span>📦</span>
            <span>Produto</span>
          </button>

          <button
            type="button"
            onClick={() => setTaskType('special')}
            style={{
              padding: '9px 14px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '700',
              color: taskType === 'special' ? '#5925dc' : '#475569',
              background: taskType === 'special' ? '#ecebfa' : '#ffffff',
              border: taskType === 'special' ? '2px solid #5925dc' : '1.5px solid #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: taskType === 'special' ? '0 2px 8px rgba(89, 37, 220, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⭐</span>
            <span>Especial</span>
          </button>

          <button
            type="button"
            onClick={() => setTaskType('recurrent')}
            style={{
              padding: '9px 14px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '700',
              color: taskType === 'recurrent' ? '#5925dc' : '#475569',
              background: taskType === 'recurrent' ? '#ecebfa' : '#ffffff',
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
            <span>🔄</span>
            <span>Recorrente</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Se for Tarefa Simples: Formato limpo e compacto exatamente igual à imagem da direita */}
          {taskType === 'simple' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  placeholder="Nome da tarefa..."
                  value={simpleTitle}
                  onChange={(e) => setSimpleTitle(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b',
                    boxSizing: 'border-box',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>

              {/* Data de Conclusão com o botão de calendário ao lado no estilo da imagem da direita */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  Data de Conclusão
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="25/10"
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
                      width: '90px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#0f172a',
                      textAlign: 'center',
                      background: '#ffffff'
                    }}
                  />

                  {/* Botão de Calendário Roxo Claro igual ao print da direita */}
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
                        border: '1.5px solid #c4b5fd',
                        fontSize: '16px',
                        height: '40px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      📅
                    </button>
                  </div>
                </div>
              </div>

              {/* Bloco de Subtarefas com criação dinâmica, arrastar, editar, duplicar e excluir */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#5925dc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckSquare size={16} />
                    <span>Subtarefas</span>
                  </div>
                  {subtasks.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                      {subtasks.length} {subtasks.length === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>

                {/* Lista de subtarefas existentes com ações */}
                {subtasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {subtasks.map((st, idx) => {
                      const isEditing = editingSubtaskIndex === idx;

                      return (
                        <div
                          key={idx}
                          draggable={!isEditing}
                          onDragStart={(e) => {
                            setDraggedSubtaskIndex(idx);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedSubtaskIndex !== null && draggedSubtaskIndex !== idx) {
                              handleMoveSubtask(draggedSubtaskIndex, idx);
                              setDraggedSubtaskIndex(null);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            gap: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            opacity: draggedSubtaskIndex === idx ? 0.4 : 1,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Ícone de arrastar para reordenar */}
                          <div
                            title="Segure e arraste para mudar a ordem"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              color: '#94a3b8',
                              cursor: 'grab',
                              touchAction: 'none'
                            }}
                          >
                            <GripVertical size={16} />
                          </div>

                          {/* Conteúdo ou Input de edição inline */}
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                              <input
                                type="text"
                                value={editingSubtaskText}
                                onChange={(e) => setEditingSubtaskText(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditSubtask(idx);
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #5925dc',
                                  fontSize: '13px',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditSubtask(idx)}
                                style={{
                                  background: '#10b981',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '700'
                                }}
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1e293b',
                              flex: 1,
                              wordBreak: 'break-word'
                            }}>
                              {st}
                            </span>
                          )}

                          {/* Botões de Ação: Subir, Descer, Editar, Duplicar, Excluir */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* Mover para cima */}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveSubtask(idx, idx - 1)}
                                title="Mover para cima"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <ArrowUp size={12} />
                              </button>
                            )}

                            {/* Mover para baixo */}
                            {idx < subtasks.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveSubtask(idx, idx + 1)}
                                title="Mover para baixo"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <ArrowDown size={12} />
                              </button>
                            )}

                            {/* Duplicar Subtarefa */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateSubtask(idx)}
                              title="Duplicar subtarefa"
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Copy size={12} />
                            </button>

                            {/* Editar Subtarefa */}
                            <button
                              type="button"
                              onClick={() => handleStartEditSubtask(idx)}
                              title="Editar subtarefa"
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={12} />
                            </button>

                            {/* Excluir Subtarefa */}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtask(idx)}
                              title="Excluir subtarefa"
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Campo de Input com auto-adição de nova linha: ao digitar e pressionar Enter ou clicar em + Adicionar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <input
                    type="text"
                    placeholder="Digitar subtarefa..."
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
                      minWidth: 0,
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#1e293b',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
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
                      background: '#5925dc',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(89, 37, 220, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

            </div>
          ) : taskType === 'recurrent' ? (


            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  Descreva a Tarefa Recorrente *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Atualizar Promoções e Estoque nos Marketplaces"
                  value={recurrentTitle}
                  onChange={(e) => setRecurrentTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '9999px',
                    border: '2px solid #5925dc',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}
                />
              </div>

              {/* Seletor de Frequência de Recorrência */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#5925dc', display: 'block', marginBottom: '10px' }}>
                  Frequência de Recorrência:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {[
                    { key: 'diaria', label: 'Diária' },
                    { key: 'seg_sex', label: 'Segunda a Sexta' },
                    { key: 'semanal', label: 'Semanal' },
                    { key: 'quinzenal', label: 'A cada 15 dias' },
                    { key: 'mensal', label: 'Mensal' }
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setRecurrenceFreq(f.key)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '700',
                        border: recurrenceFreq === f.key ? '1.5px solid #5925dc' : '1px solid #cbd5e1',
                        background: recurrenceFreq === f.key ? '#ede9fe' : '#ffffff',
                        color: recurrenceFreq === f.key ? '#5925dc' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Se a frequência for semanal, permite selecionar os dias da semana */}
                {recurrenceFreq === 'semanal' && (
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                      Escolha os dias da semana em que esta tarefa se repete:
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'seg', label: 'Seg' },
                        { key: 'ter', label: 'Ter' },
                        { key: 'qua', label: 'Qua' },
                        { key: 'qui', label: 'Qui' },
                        { key: 'sex', label: 'Sex' },
                        { key: 'sab', label: 'Sáb' },
                        { key: 'dom', label: 'Dom' }
                      ].map(d => {
                        const isSelected = selectedWeekdays.includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleWeekday(d.key)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: isSelected ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                              background: isSelected ? '#7c3aed' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Atribuição de Plataformas / Marketplaces */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                    Plataformas / Marketplaces Participantes:
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Selecione quais canais fazem parte desta rotina
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(platforms && platforms.length > 0 ? platforms : [
                    { id: 'shopee', name: 'Shopee', color: '#f97316' },
                    { id: 'mercadoLivre', name: 'Mercado L', color: '#facc15' },
                    { id: 'amazon', name: 'Amazon', color: '#334155' },
                    { id: 'magalu', name: 'Magalu', color: '#38bdf8' }
                  ]).map(p => {
                    const key = p.id || p.name;
                    const isSelected = selectedPlatformIds.includes(key) || selectedPlatformIds.includes(p.name);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePlatform(key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: isSelected ? `2px solid ${p.color || '#5925dc'}` : '1px solid #cbd5e1',
                          background: isSelected ? '#ffffff' : '#f1f5f9',
                          color: isSelected ? '#0f172a' : '#94a3b8',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isSelected ? (p.color || '#5925dc') : '#cbd5e1'
                        }} />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtarefas / Checklist para Tarefa Recorrente */}
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
                  <CheckSquare size={16} /> Subtarefas da Rotina (Opcional)
                </div>

                {subtasks.length > 0 && (
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
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Adicionar subtarefa (ex: Conferir preços, Pausar esgotados)..."
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
          ) : taskType === 'product_catalog' ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                Selecione o Produto para Cadastrar nos Marketplaces *
              </label>
              
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Digite o SKU do produto para buscar..."
                  value={productSearch}
                  onChange={(e) => {
                    const query = e.target.value;
                    setProductSearch(query);
                    if (query.trim()) {
                      const matched = products.find(p =>
                        (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())) ||
                        (p.title && p.title.toLowerCase().includes(query.toLowerCase()))
                      );
                      if (matched) {
                        setSelectedProductId(matched.sku || matched.id);
                      }
                    }
                  }}
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

                {subtasks.length > 0 && (
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
                )}

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
          <div style={{
            display: 'grid',
            gridTemplateColumns: taskType === 'simple' ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            {taskType !== 'simple' && (
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
                    color: '#1e293b',
                    boxSizing: 'border-box'
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
            )}


            {taskType !== 'simple' && (
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
          )}
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
