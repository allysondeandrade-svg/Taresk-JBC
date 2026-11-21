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
  const containerRef = useRef(null);

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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Abre a lista se houver produtos correspondentes
  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return false;
    const q = searchTerm.toLowerCase().trim();
    const sku = String(p.sku || '').toLowerCase();
    const title = String(p.title || p.product || p.name || '').toLowerCase();
    return sku.includes(q) || title.includes(q);
  });

  const handleSelectProduct = (product) => {
    if (autoClearOnSelect) {
      setSearchTerm('');
      if (onChange) onChange('');
    } else {
      const displayLabel = product.sku || product.title || product.product || '';
      setSearchTerm(displayLabel);
      if (onChange) onChange(displayLabel);
    }
    setIsOpen(false);
    if (onSelect) {
      onSelect(product);
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
        <div style={{
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
        }}>
          {filteredProducts.map((p) => {
            const sku = p.sku || p.id || 'PROD';
            const title = p.title || p.product || p.name || '';
            const rawCost = typeof p.cost === 'number' && !isNaN(p.cost) ? p.cost : parseFloat(String(p.cost || 0).replace(',', '.')) || 0;
            const costFormatted = rawCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return (
              <div
                key={p.id || p.sku}
                onClick={() => handleSelectProduct(p)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'background-color 0.1s ease',
                  backgroundColor: '#ffffff'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {sku}
                  </span>
                  {title && (
                    <span style={{
                      fontSize: '11px',
                      color: '#64748b',
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
