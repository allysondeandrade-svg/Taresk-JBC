import React from 'react';
import { LogOut, Crown, User, BarChart2, CheckSquare, Layers, DollarSign, Settings, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenNewTaskModal,
  onOpenSettings,
  onSync,
  isSyncing,
  lastSyncTime
}) {
  const tabs = [
    { id: 'tarefas', label: 'Tarefas' },
    { id: 'cadastro', label: 'Cadastro' },
    { id: 'precificadora', label: 'Precificadora' },
    { id: 'disputas', label: 'Disputa' },
    ...(currentUser.role === 'premium_admin' ? [{ id: 'relatorio', label: 'Relatório Geral' }] : [])
  ];

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Esquerda: Logo Taresk + Abas principais como na imagem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6c5ce7 0%, #4834d4 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
              boxShadow: '0 4px 10px rgba(108, 92, 231, 0.35)'
            }}>
              T
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>
                Taresk
              </span>
              <span style={{ fontSize: '10px', display: 'block', color: '#64748b', fontWeight: '600', marginTop: '-2px' }}>
                JBC ELETRO
              </span>
            </div>
          </div>

          {/* Abas com a pílula lilás */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#5925dc' : '#475569',
                    backgroundColor: isActive ? '#ecebfa' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(108, 92, 231, 0.2)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {tab.id === 'relatorio' && <BarChart2 size={16} />}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Direita: Sincronização, Modo Mobile, Configurações e Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Botão de Alternar para Versão Mobile */}
          <button
            onClick={() => window.location.hash = '#mobile'}
            title="Alternar para o modo Aplicativo Mobile"
            style={{
              padding: '7px 12px',
              borderRadius: '9999px',
              border: '1.5px solid #d8b4fe',
              background: '#f3e8ff',
              color: '#6b21a8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(108, 92, 231, 0.1)'
            }}
          >
            <span>📱</span>
            <span>Versão Mobile</span>
          </button>

          {/* Botão de Sincronizar com Planilha */}
          <button
            onClick={() => onSync && onSync(true)}
            disabled={isSyncing}
            title={lastSyncTime ? `Sincronizado às ${lastSyncTime.toLocaleTimeString('pt-BR')}. Clique para atualizar da planilha agora.` : 'Sincronizar com Google Sheets'}
            style={{
              padding: '7px 14px',
              borderRadius: '9999px',
              border: '1.5px solid #cbd5e1',
              background: isSyncing ? '#f1f5f9' : '#ffffff',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isSyncing ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => {
              if (!isSyncing) {
                e.currentTarget.style.borderColor = '#059669';
                e.currentTarget.style.color = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSyncing) {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#334155';
              }
            }}
          >
            <RefreshCw size={15} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isSyncing ? 'Sincronizando...' : 'Planilha'}</span>
          </button>

          {currentUser.role === 'premium_admin' && (
            <button
              onClick={onOpenSettings}
              title="Configurações (Conectar Planilha, Cores e Checklist)"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5925dc';
                e.currentTarget.style.color = '#5925dc';
                e.currentTarget.style.transform = 'rotate(30deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              <Settings size={20} />
            </button>
          )}

          <button
            onClick={onLogout}
            title="Sair do Sistema"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
