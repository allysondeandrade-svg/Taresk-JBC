import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Package, Sparkles, Users, Globe, Layers } from 'lucide-react';
import UsersCatalogTab from './UsersCatalogTab';
import PlatformsCatalogTab from './PlatformsCatalogTab';

export default function ProductsCatalogView({
  products,
  tasks = [],
  currentUser = {},
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  // Usuários e Plataformas
  users = [],
  platforms = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddPlatform,
  onUpdatePlatform,
  onDeletePlatform
}) {
  // 3 Sub-abas: 'produtos', 'usuarios', 'plataformas'
  const [activeSubTab, setActiveSubTab] = useState('produtos');

  const [isAdding, setIsAdding] = useState(false);
  const [filterCatalogStatus, setFilterCatalogStatus] = useState('all'); // 'all', 'cataloged', 'pending'
  const [newProduct, setNewProduct] = useState({
    sku: '',
    title: '',
    cost: '',
    width: '',
    length: '',
    height: '',
    weight: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleSaveNew = (e) => {
    e.preventDefault();
    if (!newProduct.sku.trim()) {
      alert('Preencha o SKU do produto.');
      return;
    }

    onAddProduct({
      id: 'prod_' + Date.now(),
      sku: newProduct.sku.toUpperCase(),
      title: newProduct.title || newProduct.sku,
      cost: parseFloat(newProduct.cost) || 0,
      width: parseFloat(newProduct.width) || 0,
      length: parseFloat(newProduct.length) || 0,
      height: parseFloat(newProduct.height) || 0,
      weight: parseFloat(newProduct.weight) || 0
    });

    setNewProduct({
      sku: '',
      title: '',
      cost: '',
      width: '',
      length: '',
      height: '',
      weight: ''
    });
    setIsAdding(false);
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setEditForm({ ...prod });
  };

  const handleSaveEdit = (id) => {
    onUpdateProduct(id, {
      ...editForm,
      cost: parseFloat(editForm.cost) || 0,
      width: parseFloat(editForm.width) || 0,
      length: parseFloat(editForm.length) || 0,
      height: parseFloat(editForm.height) || 0,
      weight: parseFloat(editForm.weight) || 0
    });
    setEditingId(null);
  };

  // Alterna o status de cadastro do produto em uma determinada plataforma
  const handleToggleProductPlatform = (prod, platformId) => {
    // Lista de plataformas ativas atuais do produto
    let currentPlatforms = Array.isArray(prod.platforms) ? [...prod.platforms] : null;

    // Se ainda não tem array explícito, deduz das tarefas relacionadas
    if (!currentPlatforms) {
      currentPlatforms = [];
      const relatedTasks = tasks.filter(t => t.productId === prod.id || (prod.sku && t.title?.toLowerCase().includes(prod.sku.toLowerCase())));
      const hasTaskActive = (key) => relatedTasks.some(t => t.marketplaces?.[key]?.active);
      if (hasTaskActive('shopee')) currentPlatforms.push('plat_shopee');
      if (hasTaskActive('mercadoLivre')) currentPlatforms.push('plat_ml');
      if (hasTaskActive('amazon')) currentPlatforms.push('plat_amazon');
      if (hasTaskActive('magalu')) currentPlatforms.push('plat_magalu');
    }

    const isCurrentlyActive = currentPlatforms.includes(platformId);
    const updatedPlatforms = isCurrentlyActive
      ? currentPlatforms.filter(id => id !== platformId)
      : [...currentPlatforms, platformId];

    onUpdateProduct(prod.id, {
      ...prod,
      platforms: updatedPlatforms
    });
  };

  // Helper para verificar se um produto está cadastrado em uma plataforma
  const isProductPlatformActive = (prod, plat) => {
    if (Array.isArray(prod.platforms)) {
      return prod.platforms.includes(plat.id);
    }
    // Fallback para tarefas existentes caso prod.platforms ainda não tenha sido definido
    const relatedTasks = tasks.filter(t => t.productId === prod.id || (prod.sku && t.title?.toLowerCase().includes(prod.sku.toLowerCase())));
    const platName = plat.name?.toLowerCase() || '';
    if (platName.includes('shopee')) {
      return relatedTasks.some(t => t.marketplaces?.shopee?.active);
    }
    if (platName.includes('mercado') || platName.includes('ml')) {
      return relatedTasks.some(t => t.marketplaces?.mercadoLivre?.active);
    }
    if (platName.includes('amazon')) {
      return relatedTasks.some(t => t.marketplaces?.amazon?.active);
    }
    if (platName.includes('magalu')) {
      return relatedTasks.some(t => t.marketplaces?.magalu?.active);
    }
    return false;
  };

  // Helper para verificar se produto tem pelo menos uma plataforma cadastrada
  const hasAnyPlatformActive = (prod) => {
    if (Array.isArray(prod.platforms)) {
      return prod.platforms.length > 0;
    }
    const relatedTasks = tasks.filter(t => t.productId === prod.id || (prod.sku && t.title?.toLowerCase().includes(prod.sku.toLowerCase())));
    return relatedTasks.some(t => {
      const mp = t.marketplaces || {};
      return mp.shopee?.active || mp.mercadoLivre?.active || mp.amazon?.active || mp.magalu?.active;
    });
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* Navegação das 3 Sub-abas: Produtos | Usuários | Plataformas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#ffffff',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        width: 'fit-content',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <button
          onClick={() => setActiveSubTab('produtos')}
          style={{
            padding: '8px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'produtos' ? '800' : '600',
            color: activeSubTab === 'produtos' ? '#5925dc' : '#64748b',
            backgroundColor: activeSubTab === 'produtos' ? '#ecebfa' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Package size={17} />
          <span>Produtos</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '10px',
            background: activeSubTab === 'produtos' ? '#5925dc' : '#f1f5f9',
            color: activeSubTab === 'produtos' ? '#ffffff' : '#64748b',
            fontWeight: '800'
          }}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('usuarios')}
          style={{
            padding: '8px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'usuarios' ? '800' : '600',
            color: activeSubTab === 'usuarios' ? '#5925dc' : '#64748b',
            backgroundColor: activeSubTab === 'usuarios' ? '#ecebfa' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={17} />
          <span>Usuários</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '10px',
            background: activeSubTab === 'usuarios' ? '#5925dc' : '#f1f5f9',
            color: activeSubTab === 'usuarios' ? '#ffffff' : '#64748b',
            fontWeight: '800'
          }}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('plataformas')}
          style={{
            padding: '8px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'plataformas' ? '800' : '600',
            color: activeSubTab === 'plataformas' ? '#5925dc' : '#64748b',
            backgroundColor: activeSubTab === 'plataformas' ? '#ecebfa' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Globe size={17} />
          <span>Plataformas</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '10px',
            background: activeSubTab === 'plataformas' ? '#5925dc' : '#f1f5f9',
            color: activeSubTab === 'plataformas' ? '#ffffff' : '#64748b',
            fontWeight: '800'
          }}>
            {platforms.length}
          </span>
        </button>
      </div>

      {/* Sub-Aba 2: Usuários */}
      {activeSubTab === 'usuarios' && (
        <UsersCatalogTab
          users={users}
          platforms={platforms}
          currentUser={currentUser}
          onAddUser={onAddUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
        />
      )}

      {/* Sub-Aba 3: Plataformas */}
      {activeSubTab === 'plataformas' && (
        <PlatformsCatalogTab
          platforms={platforms}
          users={users}
          currentUser={currentUser}
          onAddPlatform={onAddPlatform}
          onUpdatePlatform={onUpdatePlatform}
          onDeletePlatform={onDeletePlatform}
        />
      )}

      {/* Sub-Aba 1: Produtos (Catálogo Geral) */}
      {activeSubTab === 'produtos' && (
        <>
          {/* Topo com Botão Nova Cadastro + e Filtros de Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>
                Catálogo de Produtos & Status de Cadastro
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Acompanhe os produtos que você já cadastrou nos marketplaces ou que ainda estão pendentes
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Filtro: Todos, Já Cadastrados, Pendentes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Filtro:</span>
                <select
                  value={filterCatalogStatus}
                  onChange={(e) => setFilterCatalogStatus(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#1e293b'
                  }}
                >
                  <option value="all">Todos os Produtos ({products.length})</option>
                  <option value="cataloged">✅ Já Cadastrados</option>
                  <option value="pending">⏳ Pendentes de Cadastro</option>
                </select>
              </div>

              <button
                onClick={() => setIsAdding(!isAdding)}
                style={{
                  padding: '10px 24px',
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
                Nova Cadastro +
              </button>
            </div>
          </div>

      {/* Formulário Colapsável de Novo Produto */}
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end'
          }}
        >
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              SKU *
            </label>
            <input
              type="text"
              placeholder="Ex: FOG-02-BOC"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
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
              Nome / Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Fogão 2 Bocas Inox"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
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
              Custo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newProduct.cost}
              onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
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
              Largura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 30"
              value={newProduct.width}
              onChange={(e) => setNewProduct({ ...newProduct, width: e.target.value })}
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
              Comp (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 50"
              value={newProduct.length}
              onChange={(e) => setNewProduct({ ...newProduct, length: e.target.value })}
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
              Altura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 20"
              value={newProduct.height}
              onChange={(e) => setNewProduct({ ...newProduct, height: e.target.value })}
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
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 3.5"
              value={newProduct.weight}
              onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                padding: '11px 16px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontWeight: '700',
                fontSize: '13px',
                flex: 1
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{
                padding: '11px 12px',
                borderRadius: '8px',
                background: '#e2e8f0',
                color: '#475569',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabela Idêntica à Página 3 do PDF: SKU | Custo | Largura | Comp | Altura | Peso */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '18px 24px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                SKU
              </th>
              <th style={{ padding: '18px 20px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Custo
              </th>
              <th style={{ padding: '18px 20px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Largura
              </th>
              <th style={{ padding: '18px 20px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Comp
              </th>
              <th style={{ padding: '18px 20px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Altura
              </th>
              <th style={{ padding: '18px 20px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Peso
              </th>
              <th style={{ padding: '18px 20px', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Status nos Marketplaces
              </th>
              <th style={{ padding: '18px 20px', fontSize: '14px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {products
              .filter(prod => {
                const isCataloged = hasAnyPlatformActive(prod);
                if (filterCatalogStatus === 'cataloged') return isCataloged;
                if (filterCatalogStatus === 'pending') return !isCataloged;
                return true;
              })
              .map((prod) => {
                const isEditing = editingId === prod.id;
                const relatedTasks = tasks.filter(t => t.productId === prod.id || (prod.sku && t.title?.toLowerCase().includes(prod.sku.toLowerCase())));
                const latestTask = relatedTasks[0];
                const isCataloged = hasAnyPlatformActive(prod);

              return (
                <tr
                  key={prod.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Coluna SKU */}
                  <td style={{ padding: '16px 24px' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.sku}
                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                      />
                    ) : (
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                          {prod.sku}
                        </div>
                        {prod.title && prod.title !== prod.sku && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {prod.title}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Coluna Custo */}
                  <td style={{ padding: '16px 20px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.cost}
                        onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                        style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                        R$ {(typeof prod.cost === 'number' && !isNaN(prod.cost) ? prod.cost : parseFloat(String(prod.cost || 0).replace(',', '.')) || 0).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </td>

                  {/* Coluna Largura */}
                  <td style={{ padding: '16px 20px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.width}
                        onChange={(e) => setEditForm({ ...editForm, width: e.target.value })}
                        style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', color: '#334155' }}>
                        {prod.width} cm
                      </span>
                    )}
                  </td>

                  {/* Coluna Comp */}
                  <td style={{ padding: '16px 20px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.length}
                        onChange={(e) => setEditForm({ ...editForm, length: e.target.value })}
                        style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', color: '#334155' }}>
                        {prod.length} cm
                      </span>
                    )}
                  </td>

                  {/* Coluna Altura */}
                  <td style={{ padding: '16px 20px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.height}
                        onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', color: '#334155' }}>
                        {prod.height} cm
                      </span>
                    )}
                  </td>

                  {/* Coluna Peso */}
                  <td style={{ padding: '16px 20px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.weight}
                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                        {prod.weight} kg
                      </span>
                    )}
                  </td>

                  {/* Coluna Status nos Marketplaces: Ícones das plataformas em cinza, se clicado fica na cor da plataforma */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        {platforms.map((plat) => {
                          const isActive = isProductPlatformActive(prod, plat);
                          const platColor = plat.color || '#5925dc';

                          // Abreviatura/Iniciais ou nome curto
                          const shortName = plat.name?.length <= 8 ? plat.name : (
                            plat.name.includes(' ')
                              ? plat.name.split(' ').map(w => w[0]).join('').slice(0, 3)
                              : plat.name.slice(0, 4)
                          );

                          return (
                            <button
                              key={plat.id}
                              type="button"
                              onClick={() => handleToggleProductPlatform(prod, plat.id)}
                              title={isActive ? `${plat.name}: Já cadastrado (Clique para desmarcar)` : `${plat.name}: Não cadastrado (Clique para marcar)`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                border: isActive ? `1.5px solid ${platColor}` : '1.5px solid #cbd5e1',
                                background: isActive ? platColor : '#f1f5f9',
                                color: isActive ? '#ffffff' : '#64748b',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                outline: 'none',
                                boxShadow: isActive ? `0 2px 6px ${platColor}40` : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.borderColor = '#94a3b8';
                                  e.currentTarget.style.color = '#334155';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                  e.currentTarget.style.color = '#64748b';
                                }
                              }}
                            >
                              <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: isActive ? '#ffffff' : '#94a3b8',
                                display: 'inline-block'
                              }} />
                              <span>{shortName}</span>
                            </button>
                          );
                        })}
                      </div>

                      {latestTask?.dueDate && (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Prazo: {latestTask.dueDate}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ações */}
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveEdit(prod.id)}
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={14} /> Salvar
                      </button>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => startEdit(prod)}
                          title="Editar"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#475569'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir ${prod.sku}?`)) onDeleteProduct(prod.id);
                          }}
                          title="Excluir"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: '#fef2f2',
                            color: '#ef4444'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Linhas vazias para manter a grade visual limpa como no mock se houver poucos itens */}
            {products.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum produto cadastrado na tabela ainda. Clique em "Nova Cadastro +" acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
