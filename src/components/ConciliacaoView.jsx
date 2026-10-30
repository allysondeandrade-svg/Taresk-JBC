import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, RotateCcw, Save, ShieldCheck } from 'lucide-react';

export default function ConciliacaoView({
  users = [],
  platforms = []
}) {
  // Estado local para o checklist da conciliação: { [userPlatformKey]: [boolean, boolean, boolean, boolean] }
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_conciliacao_state');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Salva no localStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem('taresk_conciliacao_state', JSON.stringify(checklistState));
  }, [checklistState]);

  // Alterna o estado de uma etapa de checklist (0, 1, 2, 3)
  const handleToggle = (userKey, platKey, stepIndex) => {
    const key = `${userKey}__${platKey}`;
    setChecklistState(prev => {
      const current = prev[key] || [false, false, false, false];
      const updated = [...current];
      // Garante tamanho 4
      while (updated.length < 4) updated.push(false);
      updated[stepIndex] = !updated[stepIndex];
      return {
        ...prev,
        [key]: updated
      };
    });
  };

  // Helper para logo da plataforma
  const getPlatformIcon = (platName = '') => {
    const lower = String(platName || '').toLowerCase();
    if (lower.includes('shopee')) return { src: './icon_shopee.png', alt: 'Shopee' };
    if (lower.includes('mercado') || lower.includes('ml')) return { src: './icon_mercadolivre.png', alt: 'Mercado Livre' };
    if (lower.includes('amazon')) return { src: './icon_amazon.png', alt: 'Amazon' };
    if (lower.includes('magalu') || lower.includes('magazine')) return { src: './icon_magalu.png', alt: 'Magalu' };
    return null;
  };

  // Obter plataformas de um usuário (garante que ele tenha ao menos as plataformas cadastradas no sistema ou as dele)
  const getUserPlatforms = (user) => {
    if (user.platforms && user.platforms.length > 0) {
      return user.platforms;
    }
    // Fallback para lista de plataformas globais
    return platforms.slice(0, 4);
  };

  // Limpar checklist de um usuário específico
  const handleResetUser = (userId, userPlats) => {
    if (!window.confirm('Deseja desmarcar todos os itens deste usuário?')) return;
    setChecklistState(prev => {
      const next = { ...prev };
      userPlats.forEach(p => {
        delete next[`${userId}__${p.id || p.name}`];
      });
      return next;
    });
  };

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Título com estilo roxo/violeta idêntico à imagem de referência */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#6325ea',
            letterSpacing: '-0.5px',
            margin: 0
          }}>
            Conciliação
          </h1>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#7c3aed',
            background: '#f3e8ff',
            padding: '4px 10px',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <ShieldCheck size={14} />
            Privilégio Allyson
          </span>
        </div>

        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Sincronizado automaticamente localmente
        </div>
      </div>

      {/* Grid de Cards dos Usuários (Allyson, Jeremias, etc.) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 320px))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {users.map(user => {
          const userPlats = getUserPlatforms(user);
          const userId = user.id || user.name;

          return (
            <div
              key={userId}
              style={{
                background: '#ffffff',
                border: '1.5px solid #a855f7',
                borderRadius: '20px',
                padding: '16px 18px 20px 18px',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* Cabeçalho do Card: Nome do Usuário */}
              <div style={{
                textAlign: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#000000',
                  letterSpacing: '-0.5px',
                  margin: 0
                }}>
                  {user.name}
                </h2>

                <button
                  onClick={() => handleResetUser(userId, userPlats)}
                  title="Limpar checklist deste usuário"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Cabeçalho das 4 Colunas com os Ícones Oficiais */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px repeat(4, 42px)',
                columnGap: '12px',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 0 10px 0'
              }}>
                {/* Espaço vazio correspondente à coluna do ícone da plataforma */}
                <div />

                {/* Ícone 1: Prancheta / Relatório */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Conferência / Lista">
                  <img
                    src="./concil_step_1.png"
                    alt="Lista"
                    style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                  />
                </div>

                {/* Ícone 2: Lupa / Análise */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Auditoria / Busca">
                  <img
                    src="./concil_step_2.png"
                    alt="Auditoria"
                    style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                  />
                </div>

                {/* Ícone 3: Mão com saco de dinheiro / Financeiro */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Financeiro / Repasse">
                  <img
                    src="./concil_step_3.png"
                    alt="Financeiro"
                    style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                  />
                </div>

                {/* Ícone 4: Caminhão / Logística e Frete */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Logística / Fretes">
                  <img
                    src="./concil_step_4.png"
                    alt="Logística"
                    style={{ width: '28px', height: '26px', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* Linhas das Plataformas com os 4 Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {userPlats.map((plat) => {
                  const platKey = plat.id || plat.name;
                  const itemKey = `${userId}__${platKey}`;
                  const stepsState = checklistState[itemKey] || [false, false, false, false];
                  const logoInfo = getPlatformIcon(plat.name);

                  return (
                    <div
                      key={platKey}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px repeat(4, 42px)',
                        columnGap: '12px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3px 0'
                      }}
                    >
                      {/* Ícone da Plataforma */}
                      <div
                        title={plat.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {logoInfo ? (
                          <img
                            src={logoInfo.src}
                            alt={logoInfo.alt}
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: plat.color || '#6366f1',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px'
                          }}>
                            {plat.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* 4 Quadrados de Checklist */}
                      {[0, 1, 2, 3].map((stepIdx) => {
                        const isChecked = Boolean(stepsState[stepIdx]);

                        return (
                          <div
                            key={stepIdx}
                            onClick={() => handleToggle(userId, platKey, stepIdx)}
                            style={{
                              width: '40px',
                              height: '40px',
                              border: isChecked ? '2.5px solid #65a30d' : '2px solid #52525b',
                              borderRadius: '4px',
                              backgroundColor: isChecked ? '#bbf7d0' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.15s ease',
                              boxSizing: 'border-box'
                            }}
                          >
                            {isChecked && (
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#16a34a"
                                strokeWidth="3.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

