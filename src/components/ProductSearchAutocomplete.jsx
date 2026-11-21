import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

/**
 * Componente unificado e reutilizável de busca e autocomplete de produtos (estilo Excel).
 * 
 * Props:
 * - products: lista de produtos [{ id, sku, title, product, cost, ... }]
 * - value: valor do produto selecionado ou texto atual
 * - onSelect: callback acionado ao selecionar um produto: (product) => void
 * - placeholder: texto do placeholder (default: 'Buscar por SKU ou Nome...')
 * - showCost: boolean indicando se deve mostrar o valor em R$ verde à direita (default: true)
 * - autoClearOnSelect: boolean se limpa a busca ou mantém o texto selecionado (default: false)
 * - style: estilos adicionais para o container externo
 * - inputStyle: estilos adicionais para o input
 */
export default function ProductSearchAutocomplete({
  products = [],
  value = '',
  onChange,
  onSelect,
  placeholder = 'Buscar por SKU ou Nome...',
  showCost = true,
  autoClearOnSelect = false,
  style = {},
  inputStyle = {}
}) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Sincroniza quando o valor externo mudar
  useEffect(() => {
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value);
    }
  }, [value]);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Abre a lista com os produtos filtrados se houver busca, ou todos os produtos se o campo estiver vazio ao focar/clicar
  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const sku = String(p.sku || '').toLowerCase();
    const title = String(p.title || p.product || p.name || '').toLowerCase();
    return sku.includes(q) || title.includes(q);
  });

  // Reseta o índice destacado se a busca mudar ou se fechar
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, isOpen]);

  // Rolagem suave até o item selecionado ao navegar com setas
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleSelectProduct = (product) => {
    if (!product) return;
    if (autoClearOnSelect) {
      setSearchTerm('');
      if (onChange) onChange('');
    } else {
      const displayLabel = product.sku || product.title || product.product || '';
      setSearchTerm(displayLabel);
      if (onChange) onChange(displayLabel);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(product);
    }
  };

  // Navegação por teclado: Seta para Cima, Seta para Baixo, Enter e Escape
  const handleKeyDown = (e) => {
    if (!isOpen || filteredProducts.length === 0) {
      if (e.key === 'ArrowDown' && filteredProducts.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        e.preventDefault();
        handleSelectProduct(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        ...style
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onKeyDown={handleKeyDown}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            if (onChange) onChange(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 14px 10px 38px',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            fontSize: '13px',
            background: '#ffffff',
            color: '#1e293b',
            outline: 'none',
            transition: 'border-color 0.15s ease',
            ...inputStyle
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
        />
        <Search
          size={16}
          color="#64748b"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Dropdown com opções estilo Excel idêntico à imagem de referência */}
      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 9999
          }}
        >
          {filteredProducts.map((p, idx) => {
            const sku = p.sku || p.id || 'PROD';
            const title = p.title || p.product || p.name || '';
            const rawCost = typeof p.cost === 'number' && !isNaN(p.cost) ? p.cost : parseFloat(String(p.cost || 0).replace(',', '.')) || 0;
            const costFormatted = rawCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={p.id || p.sku || idx}
                onClick={() => handleSelectProduct(p)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'background-color 0.1s ease',
                  backgroundColor: isHighlighted ? '#ede9fe' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '800',
                    color: isHighlighted ? '#5925dc' : '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {sku}
                  </span>
                  {title && (
                    <span style={{
                      fontSize: '11px',
                      color: isHighlighted ? '#475569' : '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {title}
                    </span>
                  )}
                </div>

                {showCost && (
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#059669',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    R$ {costFormatted}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
