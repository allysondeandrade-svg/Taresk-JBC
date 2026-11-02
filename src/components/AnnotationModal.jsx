import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

// Tipos de anotações com seus ícones SVG fiéis aos modelos do usuário
const ANNOTATION_TYPES = [
  {
    id: 'entrega_local',
    label: 'Entrega Local',
    // Caminhão de entrega estilizado
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    )
  },
  {
    id: 'envio_proprio',
    label: 'Envio Próprio',
    // Caixa de encomenda em movimento
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
        <path d="m7 17-4 2" />
        <path d="m5 13-2 1" />
      </svg>
    )
  },
  {
    id: 'retirada_fabrica',
    label: 'Retirada Fábrica',
    // Loja / fábrica com caixas na frente
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <rect x="3" y="16" width="4" height="4" rx="1" />
        <rect x="17" y="16" width="4" height="4" rx="1" />
      </svg>
    )
  },
  {
    id: 'gasto_manual',
    label: 'Gasto Manual',
    // Cifrão estilizado $
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    id: 'prejuizo',
    label: 'Prejuízo',
    // Engrenagem quebrada / faíscas de alerta
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="m16.24 16.24 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="m4.93 19.07 2.83-2.83" />
        <path d="m16.24 7.76 2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  },
  {
    id: 'anotacao',
    label: 'Anotação',
    // Prancheta com lápis
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
        <path d="m18 14-6 6" />
      </svg>
    )
  }
];

export default function AnnotationModal({
  isOpen,
  onClose,
  currentUser,
  onSave
}) {
  const [selectedType, setSelectedType] = useState('anotacao');
  const [valor, setValor] = useState('');
  const [pedido, setPedido] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleSelectType = (id) => {
    setSelectedType(id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const chosenType = ANNOTATION_TYPES.find(t => t.id === selectedType);
    const tipoLabel = chosenType ? chosenType.label : 'Anotação';

    const payload = {
      tipo: tipoLabel,
      valor: valor.trim(),
      pedido: pedido.trim(),
      observacao: observacao.trim(),
      usuario: currentUser?.name || 'Administrador',
      createdAt: new Date().toISOString()
    };

    try {
      if (onSave) {
        await onSave(payload);
      }
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        // Limpa formulário e fecha
        setValor('');
        setPedido('');
        setObservacao('');
        setSelectedType('anotacao');
        onClose();
      }, 900);
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao salvar a anotação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '430px',
          borderRadius: '28px',
          boxShadow: '0 25px 50px -12px rgba(91, 33, 182, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '24px 22px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo com Botão Fechar (X) no Canto Superior Direito */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            title="Fechar"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Grade de Ícones: 2 Linhas com 3 Ícones cada, todos 100% contidos dentro do card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            columnGap: '12px',
            rowGap: '16px',
            marginBottom: '32px',
            justifyItems: 'center',
            alignItems: 'start',
            width: '100%'
          }}
        >
          {ANNOTATION_TYPES.map((t) => {
            const isSelected = selectedType === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectType(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  width: '100%',
                  maxWidth: '96px'
                }}
              >
                {/* Círculo do Ícone: Roxo (#6d28d9) ou Verde se selecionado (#22c55e) */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isSelected ? '#22c55e' : '#6d28d9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected
                      ? '0 6px 14px rgba(34, 197, 94, 0.4)'
                      : '0 4px 10px rgba(109, 40, 217, 0.25)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.svg}
                </div>

                {/* Nome do tipo abaixo do ícone com quebra harmoniosa */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isSelected ? '800' : '700',
                    color: isSelected ? '#15803d' : '#6d28d9',
                    textAlign: 'center',
                    marginTop: '6px',
                    lineHeight: '1.2',
                    wordBreak: 'break-word',
                    width: '100%'
                  }}
                >
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Campos do Formulário com retângulos de pontas moderadamente arredondadas (10px) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Campo: Valor */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <label
              style={{
                fontSize: '17px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.3px',
                flexShrink: 0
              }}
            >
              Valor
            </label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder=""
              style={{
                width: '60%',
                height: '44px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                padding: '0 14px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
                background: '#ffffff'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6d28d9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
            />
          </div>

          {/* Campo: Número do pedido */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <label
              style={{
                fontSize: '17px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.3px',
                lineHeight: '1.15',
                flexShrink: 0
              }}
            >
              Número do pedido
            </label>
            <input
              type="text"
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              placeholder=""
              style={{
                width: '60%',
                height: '44px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                padding: '0 14px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
                background: '#ffffff'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6d28d9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
            />
          </div>

          {/* Campo: Observação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <label
              style={{
                fontSize: '17px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.3px',
                flexShrink: 0
              }}
            >
              Observação
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder=""
              style={{
                width: '60%',
                height: '44px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                padding: '0 14px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
                background: '#ffffff'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6d28d9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
            />
          </div>
        </div>

        {/* Botão Salvar no Canto Inferior Direito */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              background: successToast ? '#22c55e' : '#6d28d9',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '900',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: successToast
                ? '0 6px 16px rgba(34, 197, 94, 0.4)'
                : '0 6px 16px rgba(109, 40, 217, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              minWidth: '120px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isSaving && !successToast) e.currentTarget.style.background = '#5b21b6';
            }}
            onMouseLeave={(e) => {
              if (!isSaving && !successToast) e.currentTarget.style.background = '#6d28d9';
            }}
          >
            {successToast ? (
              <>
                <Check size={20} strokeWidth={3} /> Salvo!
              </>
            ) : isSaving ? (
              'Salvando...'
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
